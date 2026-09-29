from __future__ import annotations

from typing import Any

from supabase import Client

from backend.deps import supabase_client, supabase_client_with_session


def get_db(
    access_token: str | None = None,
    refresh_token: str | None = None,
) -> Client:
    """
    Return a Supabase client.

    When both session tokens are supplied, the client is configured with
    the authenticated user's session so Supabase RLS policies apply.
    """
    if access_token and refresh_token:
        return supabase_client_with_session(
            access_token,
            refresh_token,
        )

    return supabase_client()


def get_table_rows(
    table_name: str,
    *,
    access_token: str | None = None,
    refresh_token: str | None = None,
    limit: int = 100,
) -> list[dict[str, Any]]:
    """Fetch rows from a Supabase table."""
    client = get_db(access_token, refresh_token)

    response = (
        client.table(table_name)
        .select("*")
        .limit(limit)
        .execute()
    )

    return response.data or []


def get_table_row(
    table_name: str,
    row_id: str,
    *,
    access_token: str | None = None,
    refresh_token: str | None = None,
) -> dict[str, Any] | None:
    """Fetch one row by UUID."""
    client = get_db(access_token, refresh_token)

    response = (
        client.table(table_name)
        .select("*")
        .eq("id", row_id)
        .maybe_single()
        .execute()
    )

    return response.data


def insert_row(
    table_name: str,
    data: dict[str, Any],
    *,
    access_token: str | None = None,
    refresh_token: str | None = None,
) -> dict[str, Any]:
    """Insert one row and return the inserted record."""
    client = get_db(access_token, refresh_token)

    response = (
        client.table(table_name)
        .insert(data)
        .select("*")
        .single()
        .execute()
    )

    return response.data


def update_row(
    table_name: str,
    row_id: str,
    data: dict[str, Any],
    *,
    access_token: str | None = None,
    refresh_token: str | None = None,
) -> dict[str, Any]:
    """Update one row by UUID and return the updated record."""
    client = get_db(access_token, refresh_token)

    response = (
        client.table(table_name)
        .update(data)
        .eq("id", row_id)
        .select("*")
        .single()
        .execute()
    )

    return response.data


def delete_row(
    table_name: str,
    row_id: str,
    *,
    access_token: str | None = None,
    refresh_token: str | None = None,
) -> None:
    """Delete one row by UUID."""
    client = get_db(access_token, refresh_token)

    (
        client.table(table_name)
        .delete()
        .eq("id", row_id)
        .execute()
    )
