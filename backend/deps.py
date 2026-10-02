import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import (
    HTTPException,
    Request,
    Response,
    Security,
    status,
)
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import Client, create_client


ENV_FILE = Path(__file__).resolve().parent / ".env"


def _load_runtime_config() -> None:
    load_dotenv(ENV_FILE, override=True)


_load_runtime_config()

ACCESS_COOKIE = "sb_access_token"
REFRESH_COOKIE = "sb_refresh_token"

bearer_scheme = HTTPBearer(auto_error=False)


def supabase_client(
    access_token: str | None = None,
    refresh_token: str | None = None,
) -> Client:
    _load_runtime_config()

    supabase_url = os.environ.get("SUPABASE_URL", "")
    supabase_key = os.environ.get("SUPABASE_KEY", "")

    if not supabase_url or not supabase_key:
        raise RuntimeError(
            "Set SUPABASE_URL and SUPABASE_KEY in backend/.env"
        )

    client = create_client(supabase_url, supabase_key)

    if access_token and refresh_token:
        client.auth.set_session(access_token, refresh_token)

    return client


def supabase_client_with_session(
    access_token: str | None,
    refresh_token: str | None,
) -> Client:
    client = supabase_client()

    if access_token:
        if refresh_token:
            try:
                client.auth.set_session(access_token, refresh_token)
            except Exception:
                pass
        client.postgrest.auth(access_token)

    return client


def _write_session_cookies(
    response: Response,
    access_token: str,
    refresh_token: str,
) -> None:
    for cookie_name, token in (
        (ACCESS_COOKIE, access_token),
        (REFRESH_COOKIE, refresh_token),
    ):
        if not token:
            continue

        response.set_cookie(
            key=cookie_name,
            value=token,
            httponly=True,
            samesite="lax",
            secure=False,
            path="/",
            max_age=60 * 60 * 24 * 7,
        )


def _user_from_access_token(access_token: str):
    result = supabase_client().auth.get_user(access_token)

    if result is not None and getattr(result, "user", None) is not None:
        return result.user

    return None


def get_current_user(
    request: Request,
    response: Response = None,
    credentials: HTTPAuthorizationCredentials | None = Security(
        bearer_scheme
    ),
):
    """
    Authentication supports both:

    1. Authorization: Bearer <access_token>
       Used by Swagger/API clients.

    2. Supabase session cookies
       Used by the normal frontend.
    """

    # ---------------------------------------------------------
    # 1. Try Swagger/API Bearer token
    # ---------------------------------------------------------
    bearer_token = None

    if credentials is not None:
        bearer_token = credentials.credentials

    if bearer_token:
        try:
            user = _user_from_access_token(bearer_token)

            if user is not None:
                return user

        except Exception:
            pass

    # ---------------------------------------------------------
    # 2. Try normal frontend access-token cookie
    # ---------------------------------------------------------
    access_token = request.cookies.get(ACCESS_COOKIE)
    refresh_token = request.cookies.get(REFRESH_COOKIE)

    if access_token:
        try:
            user = _user_from_access_token(access_token)

            if user is not None:
                return user

        except Exception:
            pass

    # ---------------------------------------------------------
    # 3. Try refresh-token cookie
    # ---------------------------------------------------------
    if refresh_token:
        try:
            refreshed = supabase_client().auth.refresh_session(
                refresh_token
            )

            session = getattr(refreshed, "session", None)

            user = getattr(refreshed, "user", None)

            if user is None and session is not None:
                user = getattr(session, "user", None)

            if (
                session is not None
                and getattr(session, "access_token", None)
                and user is not None
            ):
                _write_session_cookies(
                    response,
                    session.access_token,
                    getattr(session, "refresh_token", None)
                    or refresh_token,
                )

                return user

        except Exception:
            pass

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated. Please log in.",
    )


def current_user_or_none(request: Request):
    """
    Soft version – returns the user if logged in, otherwise None.
    """

    access_token = request.cookies.get(ACCESS_COOKIE)
    refresh_token = request.cookies.get(REFRESH_COOKIE)

    if access_token:
        try:
            user = _user_from_access_token(access_token)

            if user is not None:
                return user

        except Exception:
            pass

    if refresh_token:
        try:
            refreshed = supabase_client().auth.refresh_session(
                refresh_token
            )

            user = getattr(refreshed, "user", None)
            session = getattr(refreshed, "session", None)

            if user is None and session is not None:
                user = getattr(session, "user", None)

            if user is not None:
                return user

        except Exception:
            pass

    return None


def auth_error_message(exc: Exception) -> str:
    """Convert a Supabase exception to a human-readable string."""
    raw_str = str(exc)
    msg = raw_str.lower()
    if (
        "nodename nor servname provided" in msg
        or "connecterror" in msg
        or "name or service not known" in msg
        or "connection refused" in msg
        or "network" in msg
        or "gai_error" in msg
    ):
        return "Unable to connect to authentication server. Please check your internet connection."
    if "invalid login credentials" in msg or "invalid_credentials" in msg:
        return "Invalid Officer ID/email or password."

    message = getattr(exc, "message", None) or raw_str
    return message or "Authentication failed. Please try again."
