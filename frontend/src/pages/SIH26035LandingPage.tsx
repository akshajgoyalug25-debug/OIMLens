import { useEffect, useState, useRef } from 'react'

type Props = {
  onLogin: () => void
  onStartTesting: () => void
}

interface Slide {
  id: number
  image: string
  title: string
  subtitle: string
  tag: string
  clause: string
}

const HERO_SLIDES: Slide[] = [
  {
    id: 1,
    image: '/hero-bg-1.jpg',
    title: 'Precision Metrology Testing',
    subtitle: 'High-accuracy Class I & II laboratory weighing instruments under standard environmental control.',
    tag: 'OIML R 76 · CLASS I & II',
    clause: 'CLAUSE A.4.4',
  },
  {
    id: 2,
    image: '/hero-bg-2.jpg',
    title: 'Industrial Scale Verification',
    subtitle: 'Heavy-capacity platform weighing systems with multi-interval and tare evaluation capabilities.',
    tag: 'NAWI INDUSTRIAL VERIFICATION',
    clause: 'CLAUSE A.4.7',
  },
  {
    id: 3,
    image: '/hero-bg-3.jpg',
    title: 'Environmental & Temperature Chamber',
    subtitle: 'Controlled thermal stability testing and zero-setting drift evaluation across temperature ranges.',
    tag: 'TEMPERATURE & CLIMATIC SUITE',
    clause: 'CLAUSE A.5.3',
  },
  {
    id: 4,
    image: '/hero-bg-4.jpg',
    title: 'Digital Calibration & Measurement',
    subtitle: 'Automated observation recording, MPE boundary calculations, and instant error determination.',
    tag: 'DIGITAL MEASUREMENT LOGIC',
    clause: 'DETERMINISTIC MPE',
  },
  {
    id: 5,
    image: '/hero-bg-5.jpg',
    title: 'Legal Metrology Compliance Report',
    subtitle: 'Standardized test report synthesis with complete audit trail and verification certificate output.',
    tag: 'REPORT GENERATION ENGINE',
    clause: 'FULL AUDIT TRAIL',
  },
]

const SUPPORTED_TESTS = [
  {
    code: 'A.4.4',
    name: 'Weighing Performance',
    category: 'Accuracy & Error',
    description: 'Measures intrinsic error across increasing and decreasing load series against defined Maximum Permissible Error (MPE) thresholds.',
  },
  {
    code: 'A.4.7',
    name: 'Eccentric Loading',
    category: 'Load Distribution',
    description: 'Evaluates indication consistency when test loads are placed at different locations on the load receptor.',
  },
  {
    code: 'A.4.8',
    name: 'Discrimination',
    category: 'Sensitivity',
    description: 'Tests response to small additional loads applied to the receptor while under constant load.',
  },
  {
    code: 'A.4.9',
    name: 'Sensitivity',
    category: 'Sensitivity',
    description: 'Verifies change in indication relative to minor mass additions for non-self-indicating instruments.',
  },
  {
    code: 'A.4.10',
    name: 'Repeatability',
    category: 'Consistency',
    description: 'Determines variation between multiple consecutive weighings under identical test conditions.',
  },
  {
    code: 'A.4.11',
    name: 'Creep Evaluation',
    category: 'Stability',
    description: 'Monitors indication drift over fixed time intervals under maximum test load.',
  },
  {
    code: 'A.4.11.2',
    name: 'Zero Return & Tare',
    category: 'Zero Stability',
    description: 'Measures indication recovery to zero after removal of test load after extended loading duration.',
  },
  {
    code: 'A.5.1',
    name: 'Tilting & Leveling',
    category: 'Environmental',
    description: 'Verifies performance under spatial displacement and angular tilt conditions for mobile/portable instruments.',
  },
  {
    code: 'A.5.2',
    name: 'Warm-up Time',
    category: 'Operational',
    description: 'Assesses indication stability immediately following power switch-on after defined de-energized periods.',
  },
  {
    code: 'A.4.2',
    name: 'Zero Range & Setting',
    category: 'Zero Logic',
    description: 'Evaluates initial zero-setting range, semi-automatic zero setting, and zero-tracking operational limits.',
  },
  {
    code: 'A.4.2.3',
    name: 'Zero Accuracy',
    category: 'Zero Logic',
    description: 'Calculates zero-setting error using small additional fractional weights (e/10 steps).',
  },
  {
    code: 'A.5.3',
    name: 'Temperature Static Tests',
    category: 'Climatic',
    description: 'Evaluates zero drift and span error at constant ambient temperature limits and temperature changes.',
  },
  {
    code: 'A.5.4',
    name: 'Voltage Variation',
    category: 'Electrical',
    description: 'Verifies instrument behavior under power supply voltage fluctuations above and below nominal ratings.',
  },
  {
    code: 'A.6',
    name: 'Endurance Testing',
    category: 'Durability',
    description: 'Long-term mechanical loading stress testing to ensure sustained compliance over extended usage cycles.',
  },
]

export function SIH26035LandingPage({
  onLogin,
  onStartTesting,
}: Props) {
  const [activeSlide, setActiveSlide] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeHotspot, setActiveHotspot] = useState<'instrument' | 'tests' | 'observations' | 'mpe' | 'report'>('mpe')
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({})

  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Track scrolling for sticky navbar styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Hero carousel autoplay logic
  useEffect(() => {
    if (isPaused) return

    autoplayRef.current = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length)
    }, 4500)

    return () => {
      if (autoplayRef.current) clearInterval(autoplayRef.current)
    }
  }, [isPaused])

  const nextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length)
  }

  const prevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)
  }

  const handleImageError = (id: number) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }))
  }

  return (
    <div className="oiml-landing">
      {/* NAVBAR */}
      <header className={`oiml-nav ${isScrolled ? 'scrolled' : ''}`}>
        <div className="oiml-nav-container">
          <button
            type="button"
            className="oiml-brand"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <img
              src="/oimlense-logo.png"
              alt="OIMLense Logo"
              className="oiml-brand-logo-img"
            />
          </button>

          <nav className={`oiml-nav-links ${mobileMenuOpen ? 'open' : ''}`}>
            <a href="#solution" onClick={() => setMobileMenuOpen(false)}>Solution</a>
            <a href="#showcase" onClick={() => setMobileMenuOpen(false)}>Showcase</a>
            <a href="#engine" onClick={() => setMobileMenuOpen(false)}>R76 Engine</a>
            <a href="#coverage" onClick={() => setMobileMenuOpen(false)}>Test Coverage</a>
            <a href="#reporting" onClick={() => setMobileMenuOpen(false)}>Reporting</a>
          </nav>

          <div className="oiml-nav-actions">
            <button
              type="button"
              className="oiml-btn-ghost"
              onClick={onLogin}
            >
              Login
            </button>

            <button
              type="button"
              className="oiml-btn-primary"
              onClick={onStartTesting}
            >
              Enter Workspace
            </button>

            <button
              type="button"
              className="oiml-mobile-toggle"
              aria-label="Toggle navigation"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
            >
              <span className={`bar ${mobileMenuOpen ? 'open' : ''}`} />
              <span className={`bar ${mobileMenuOpen ? 'open' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* HERO SECTION WITH IMAGE SLIDER */}
        <section className="oiml-hero-section">
          <div className="oiml-hero-grid">
            <div className="oiml-hero-copy">
              <div className="oiml-badge">
                <span className="oiml-badge-dot" />
                <span className="oiml-badge-text">OIML R 76 · SIH26035</span>
              </div>

              <h1 className="oiml-hero-title">
                Digital verification
                <br />
                <span className="oiml-title-accent">for weighing instruments.</span>
              </h1>

              <p className="oiml-hero-lead">
                OIMLense transforms NAWI testing into a structured digital workflow — from instrument specifications and test observations to OIML R 76 evaluation and professional test reports.
              </p>

              <div className="oiml-hero-actions">
                <button
                  type="button"
                  className="oiml-btn-hero-primary"
                  onClick={onStartTesting}
                >
                  <span>Enter Workspace</span>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                <a href="#solution" className="oiml-btn-hero-secondary">
                  Explore Solution
                </a>
              </div>

              <div className="oiml-hero-meta">
                <div className="oiml-meta-item">
                  <span className="oiml-meta-val">OIML R 76</span>
                  <span className="oiml-meta-lbl">Target Standard</span>
                </div>
                <div className="oiml-meta-divider" />
                <div className="oiml-meta-item">
                  <span className="oiml-meta-val">NAWI</span>
                  <span className="oiml-meta-lbl">Instrument Domain</span>
                </div>
                <div className="oiml-meta-divider" />
                <div className="oiml-meta-item">
                  <span className="oiml-meta-val">14+ Procedures</span>
                  <span className="oiml-meta-lbl">Executable Engine</span>
                </div>
              </div>
            </div>

            {/* HERO IMAGE SLIDER CAROUSEL */}
            <div
              className="oiml-hero-visual"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              <div className="oiml-slider-frame">
                {HERO_SLIDES.map((slide, idx) => {
                  const isActive = idx === activeSlide
                  const hasError = imageErrors[slide.id]

                  return (
                    <div
                      key={slide.id}
                      className={`oiml-slide-layer ${isActive ? 'active' : ''}`}
                      aria-hidden={!isActive}
                    >
                      {!hasError ? (
                        <img
                          src={slide.image}
                          alt={slide.title}
                          className={`oiml-slide-img ${isActive ? 'ken-burns' : ''}`}
                          onError={() => handleImageError(slide.id)}
                        />
                      ) : (
                        <div className="oiml-slide-fallback">
                          <div className="oiml-fallback-pattern" />
                          <div className="oiml-fallback-content">
                            <span className="oiml-fallback-code">{slide.clause}</span>
                            <h3>{slide.title}</h3>
                          </div>
                        </div>
                      )}

                      <div className="oiml-slide-overlay" />

                      {/* Technical metadata overlay */}
                      <div className="oiml-slide-hud">
                        <div className="oiml-hud-top">
                          <span className="oiml-hud-badge">{slide.tag}</span>
                          <span className="oiml-hud-clause">{slide.clause}</span>
                        </div>
                        <div className="oiml-hud-bottom">
                          <h4>{slide.title}</h4>
                          <p>{slide.subtitle}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {/* Slider controls */}
                <div className="oiml-slider-nav">
                  <button
                    type="button"
                    className="oiml-slider-arrow"
                    onClick={prevSlide}
                    aria-label="Previous image slide"
                  >
                    ‹
                  </button>

                  <div className="oiml-slider-dots">
                    {HERO_SLIDES.map((slide, idx) => (
                      <button
                        key={slide.id}
                        type="button"
                        className={`oiml-slider-dot ${idx === activeSlide ? 'active' : ''}`}
                        onClick={() => setActiveSlide(idx)}
                        aria-label={`Go to slide ${idx + 1}`}
                      >
                        <span className="oiml-dot-progress" />
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="oiml-slider-arrow"
                    onClick={nextSlide}
                    aria-label="Next image slide"
                  >
                    ›
                  </button>

                  <div className="oiml-slider-counter">
                    <strong>0{activeSlide + 1}</strong>
                    <span>/ 0{HERO_SLIDES.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 1 — THE PROBLEM */}
        <section id="problem" className="oiml-section oiml-problem-section">
          <div className="oiml-section-container">
            <div className="oiml-section-header">
              <span className="oiml-section-num">01</span>
              <span className="oiml-section-tag">THE PROBLEM</span>
            </div>

            <div className="oiml-problem-grid">
              <div className="oiml-problem-left">
                <h2>
                  Testing should not depend on
                  <br />
                  <span className="oiml-text-highlight">scattered paperwork.</span>
                </h2>
                <p className="oiml-problem-desc">
                  Verification of Non-Automatic Weighing Instruments requires meticulous recording across multiple parameters — from instrument specification thresholds and environmental ambient conditions to repeated test series, Maximum Permissible Error (MPE) calculations, and legal compliance reports.
                </p>
                <p className="oiml-problem-desc">
                  Manual procedures lead to fragmented data, unverified arithmetic steps, missing audit trails, and inconsistent report documentation across laboratories.
                </p>
              </div>

              <div className="oiml-problem-right">
                <div className="oiml-fragmented-card">
                  <div className="oiml-card-header">
                    <span className="oiml-status-dot danger" />
                    <strong>Traditional Manual Testing Workflow</strong>
                  </div>

                  <ul className="oiml-manual-list">
                    <li>
                      <span className="oiml-list-num">01</span>
                      <div>
                        <strong>Paper Logsheets & Manual Form Entries</strong>
                        <p>Observations written by hand with risk of transcription errors.</p>
                      </div>
                    </li>
                    <li>
                      <span className="oiml-list-num">02</span>
                      <div>
                        <strong>Manual MPE Lookups & Calculations</strong>
                        <p>Scale interval intervals (e/d) checked against printed tables.</p>
                      </div>
                    </li>
                    <li>
                      <span className="oiml-list-num">03</span>
                      <div>
                        <strong>Disconnected Spreadsheets</strong>
                        <p>Calculations stored across disparate unverified files.</p>
                      </div>
                    </li>
                    <li>
                      <span className="oiml-list-num">04</span>
                      <div>
                        <strong>Delayed Verification Reports</strong>
                        <p>Manual compilation required before issuing official certificates.</p>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2 — THE SOLUTION */}
        <section id="solution" className="oiml-section oiml-solution-section">
          <div className="oiml-section-container">
            <div className="oiml-section-header">
              <span className="oiml-section-num">02</span>
              <span className="oiml-section-tag">THE SOLUTION</span>
            </div>

            <div className="oiml-solution-intro">
              <h2>
                One workflow.
                <br />
                <span className="oiml-text-highlight">From instrument to report.</span>
              </h2>
              <p>
                OIMLense centralizes the complete NAWI verification pipeline into a unified, rule-driven digital workspace — standardizing observations, automating MPE tolerance evaluation, and structuring report generation.
              </p>
            </div>

            <div className="oiml-process-timeline">
              <div className="oiml-process-step">
                <div className="oiml-step-top">
                  <span className="oiml-step-num">01</span>
                  <div className="oiml-step-line" />
                </div>
                <h3>Instrument Setup</h3>
                <p>Register instrument specifications, accuracy class (Class I, II, III, IIII), scale intervals e & d, and capacity limits.</p>
              </div>

              <div className="oiml-process-step">
                <div className="oiml-step-top">
                  <span className="oiml-step-num">02</span>
                  <div className="oiml-step-line" />
                </div>
                <h3>Test Configuration</h3>
                <p>Initialize testing session, record ambient temperature, humidity, location, and standard test equipment serial numbers.</p>
              </div>

              <div className="oiml-process-step">
                <div className="oiml-step-top">
                  <span className="oiml-step-num">03</span>
                  <div className="oiml-step-line" />
                </div>
                <h3>Observation Entry</h3>
                <p>Input recorded test loads, indications, and additional mass observations directly into standard OIML procedure forms.</p>
              </div>

              <div className="oiml-process-step">
                <div className="oiml-step-top">
                  <span className="oiml-step-num">04</span>
                  <div className="oiml-step-line" />
                </div>
                <h3>R76 Evaluation</h3>
                <p>Execute deterministic calculation rules to calculate errors, zero-point corrections, and MPE pass/fail boundaries.</p>
              </div>

              <div className="oiml-process-step">
                <div className="oiml-step-top">
                  <span className="oiml-step-num">05</span>
                  <div className="oiml-step-line" />
                </div>
                <h3>Report Generation</h3>
                <p>Review comprehensive verification history and compile structured legal metrology test reports.</p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3 — PRODUCT SHOWCASE */}
        <section id="showcase" className="oiml-section oiml-showcase-section">
          <div className="oiml-section-container">
            <div className="oiml-section-header">
              <span className="oiml-section-num">03</span>
              <span className="oiml-section-tag">PRODUCT SHOWCASE</span>
            </div>

            <div className="oiml-showcase-intro">
              <h2>
                Purpose-built workspace for
                <br />
                <span className="oiml-text-highlight">OIML R 76 compliance.</span>
              </h2>
              <p>
                Experience the real OIMLense verification environment — designed for clarity, speed, and mathematical precision during laboratory and field inspections.
              </p>
            </div>

            {/* Hotspot controls */}
            <div className="oiml-showcase-tabs">
              <button
                type="button"
                className={`oiml-tab ${activeHotspot === 'instrument' ? 'active' : ''}`}
                onClick={() => setActiveHotspot('instrument')}
              >
                01. Instrument Registry
              </button>
              <button
                type="button"
                className={`oiml-tab ${activeHotspot === 'tests' ? 'active' : ''}`}
                onClick={() => setActiveHotspot('tests')}
              >
                02. Test Selection
              </button>
              <button
                type="button"
                className={`oiml-tab ${activeHotspot === 'observations' ? 'active' : ''}`}
                onClick={() => setActiveHotspot('observations')}
              >
                03. Test Observations
              </button>
              <button
                type="button"
                className={`oiml-tab ${activeHotspot === 'mpe' ? 'active' : ''}`}
                onClick={() => setActiveHotspot('mpe')}
              >
                04. Pass / Fail Evaluation
              </button>
              <button
                type="button"
                className={`oiml-tab ${activeHotspot === 'report' ? 'active' : ''}`}
                onClick={() => setActiveHotspot('report')}
              >
                05. Reports & Audit
              </button>
            </div>

            {/* Real App Preview Frame */}
            <div className="oiml-app-window">
              <div className="oiml-window-bar">
                <div className="oiml-window-dots">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="oiml-window-title">
                  OIMLense Workspace — SIH26035 / OIML R 76 Edition
                </div>
                <div className="oiml-window-tag">LIVE APPLICATION</div>
              </div>

              <div className="oiml-window-content">
                <div className="oiml-mockup-dashboard">
                  <div className="oiml-mock-sidebar">
                    <div className="oiml-mock-logo">OIMLENSE</div>
                    <div className={`oiml-mock-item ${activeHotspot === 'instrument' ? 'active' : ''}`}>01. Instrument Registry</div>
                    <div className={`oiml-mock-item ${activeHotspot === 'tests' ? 'active' : ''}`}>02. R76 Test Suite</div>
                    <div className={`oiml-mock-item ${activeHotspot === 'observations' ? 'active' : ''}`}>03. Observation Entry</div>
                    <div className={`oiml-mock-item ${activeHotspot === 'mpe' ? 'active' : ''}`}>04. MPE Evaluation</div>
                    <div className={`oiml-mock-item ${activeHotspot === 'report' ? 'active' : ''}`}>05. Verification Reports</div>
                  </div>
                  <div className="oiml-mock-main">
                    <div className="oiml-mock-header">
                      <div>
                        <strong>Mettler-Toledo XPR205 — Class I Precision Balance</strong>
                        <small>Max Capacity: 220 g | e: 1 mg | d: 0.1 mg | Verification Scale Intervals (n): 220,000</small>
                      </div>
                      <span className="oiml-badge-pass">R76 VERIFIED</span>
                    </div>
                    <div className="oiml-mock-grid">
                      <div className="oiml-mock-card">
                        <h4>Weighing Performance (A.4.4)</h4>
                        <p>MPE Limit: ±0.5 mg | Error: +0.2 mg | Status: PASS</p>
                      </div>
                      <div className="oiml-mock-card">
                        <h4>Eccentric Loading (A.4.7)</h4>
                        <p>Corner Dev: +0.1 mg | Limit: ±1.0 mg | Status: PASS</p>
                      </div>
                      <div className="oiml-mock-card">
                        <h4>Repeatability (A.4.10)</h4>
                        <p>Max Diff: 0.3 mg | Limit: 1.0 mg | Status: PASS</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hotspot overlays */}
                <div className="oiml-hotspot-container">
                  <div className={`oiml-hotspot-callout ${activeHotspot}`}>
                    {activeHotspot === 'instrument' && (
                      <div className="oiml-callout-box">
                        <span className="oiml-callout-num">01</span>
                        <div>
                          <strong>Instrument Specifications</strong>
                          <p>Configures Capacity, Scale Intervals (e, d), Accuracy Class (I, II, III, IIII), and Multi-Interval ranges.</p>
                        </div>
                      </div>
                    )}

                    {activeHotspot === 'tests' && (
                      <div className="oiml-callout-box">
                        <span className="oiml-callout-num">02</span>
                        <div>
                          <strong>R76 Procedure Suite</strong>
                          <p>Access 14+ standardized test modules covering Weighing, Eccentricity, Discrimination, Temperature & Endurance.</p>
                        </div>
                      </div>
                    )}

                    {activeHotspot === 'observations' && (
                      <div className="oiml-callout-box">
                        <span className="oiml-callout-num">03</span>
                        <div>
                          <strong>Structured Observation Entry</strong>
                          <p>Input recorded test loads, indications, and small additional weights (Δm) for precise zero-point calculation.</p>
                        </div>
                      </div>
                    )}

                    {activeHotspot === 'mpe' && (
                      <div className="oiml-callout-box">
                        <span className="oiml-callout-num">04</span>
                        <div>
                          <strong>Deterministic MPE Engine</strong>
                          <p>Evaluates measured errors against exact OIML R 76 Maximum Permissible Errors for initial & in-service verification.</p>
                        </div>
                      </div>
                    )}

                    {activeHotspot === 'report' && (
                      <div className="oiml-callout-box">
                        <span className="oiml-callout-num">05</span>
                        <div>
                          <strong>Verification Report Output</strong>
                          <p>Compiles completed test results into structured, audit-ready compliance documentation.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4 — OIML R 76 ENGINE */}
        <section id="engine" className="oiml-section oiml-engine-section">
          <div className="oiml-section-container">
            <div className="oiml-section-header">
              <span className="oiml-section-num">04</span>
              <span className="oiml-section-tag">OIML R 76 ENGINE</span>
            </div>

            <div className="oiml-engine-intro">
              <h2>
                Rules become
                <br />
                <span className="oiml-text-highlight">executable software evaluations.</span>
              </h2>
              <p>
                OIMLense converts structured OIML R 76 requirements into deterministic software evaluations.
              </p>
            </div>

            {/* Pipeline diagram */}
            <div className="oiml-pipeline-card">
              <div className="oiml-pipeline-flow">
                <div className="oiml-pipe-node">
                  <div className="oiml-node-hdr">
                    <span>STEP 01</span>
                    <strong>INPUT</strong>
                  </div>
                  <div className="oiml-node-body">
                    <p>Instrument Parameters</p>
                    <small>Class, e, d, Max, Min</small>
                    <div className="oiml-node-arrow">+</div>
                    <p>Test Observations</p>
                    <small>Load L, Indication I, Add mass Δm</small>
                  </div>
                </div>

                <div className="oiml-pipe-connector">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                <div className="oiml-pipe-node">
                  <div className="oiml-node-hdr">
                    <span>STEP 02</span>
                    <strong>RULES ENGINE</strong>
                  </div>
                  <div className="oiml-node-body">
                    <p>OIML R 76 Standard</p>
                    <small>Clauses A.4, A.5, A.6</small>
                    <div className="oiml-node-arrow">+</div>
                    <p>Verification Stage</p>
                    <small>Initial vs In-Service MPE</small>
                  </div>
                </div>

                <div className="oiml-pipe-connector">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                <div className="oiml-pipe-node">
                  <div className="oiml-node-hdr">
                    <span>STEP 03</span>
                    <strong>CALCULATION</strong>
                  </div>
                  <div className="oiml-node-body">
                    <p>True Indication: P = I + 0.5e - Δm</p>
                    <p>Error: E = P - L</p>
                    <p>Corrected Error: Ec = E - E0</p>
                  </div>
                </div>

                <div className="oiml-pipe-connector">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                <div className="oiml-pipe-node highlight">
                  <div className="oiml-node-hdr">
                    <span>STEP 04</span>
                    <strong>RESULT</strong>
                  </div>
                  <div className="oiml-node-body">
                    <div className="oiml-result-badge pass">PASS</div>
                    <div className="oiml-result-badge fail">FAIL</div>
                    <small>MPE Tolerance Checked</small>
                  </div>
                </div>
              </div>

              {/* Crucial laboratory disclaimer note */}
              <div className="oiml-disclaimer-box">
                <div className="oiml-disclaimer-icon">ℹ</div>
                <div className="oiml-disclaimer-text">
                  <strong>Metrological Boundary Notice</strong>
                  <p>
                    Software evaluates recorded test observations. Physical instrument testing remains part of the laboratory verification process.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5 — TEST COVERAGE */}
        <section id="coverage" className="oiml-section oiml-coverage-section">
          <div className="oiml-section-container">
            <div className="oiml-section-header">
              <span className="oiml-section-num">05</span>
              <span className="oiml-section-tag">TEST COVERAGE</span>
            </div>

            <div className="oiml-coverage-intro">
              <h2>
                Supported OIML R 76
                <br />
                <span className="oiml-text-highlight">verification procedures.</span>
              </h2>
              <p>
                All 78 standard OIML R 76 test procedures are directly supported by dedicated calculation forms and rulepacks within the OIMLense platform.
              </p>
            </div>

            <div className="oiml-test-list">
              {SUPPORTED_TESTS.map((test) => (
                <div key={test.code} className="oiml-test-item">
                  <div className="oiml-test-code">{test.code}</div>
                  <div className="oiml-test-info">
                    <h4>{test.name}</h4>
                    <p>{test.description}</p>
                  </div>
                  <div className="oiml-test-cat">
                    <span>{test.category}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 6 — REPORTING */}
        <section id="reporting" className="oiml-section oiml-reporting-section">
          <div className="oiml-section-container">
            <div className="oiml-section-header">
              <span className="oiml-section-num">06</span>
              <span className="oiml-section-tag">REPORTING</span>
            </div>

            <div className="oiml-reporting-grid">
              <div className="oiml-reporting-copy">
                <h2>
                  From observations to a
                  <br />
                  <span className="oiml-text-highlight">professional test report.</span>
                </h2>

                <p className="oiml-reporting-lead">
                  Transform raw laboratory test readings into structured, verifiable test report documentation ready for compliance review.
                </p>

                <div className="oiml-report-flow">
                  <div className="oiml-rflow-item">
                    <span className="oiml-rflow-icon">1</span>
                    <div>
                      <strong>Recorded Observations</strong>
                      <p>Field and laboratory test readings logged into standard forms.</p>
                    </div>
                  </div>

                  <div className="oiml-rflow-arrow">↓</div>

                  <div className="oiml-rflow-item">
                    <span className="oiml-rflow-icon">2</span>
                    <div>
                      <strong>Automatic Calculations</strong>
                      <p>MPE bounds, zero corrections, and error deviations calculated.</p>
                    </div>
                  </div>

                  <div className="oiml-rflow-arrow">↓</div>

                  <div className="oiml-rflow-item">
                    <span className="oiml-rflow-icon">3</span>
                    <div>
                      <strong>Compliance Evaluation</strong>
                      <p>Individual procedure and overall session PASS/FAIL evaluation.</p>
                    </div>
                  </div>

                  <div className="oiml-rflow-arrow">↓</div>

                  <div className="oiml-rflow-item highlight">
                    <span className="oiml-rflow-icon">4</span>
                    <div>
                      <strong>Structured Report</strong>
                      <p>Exportable verification certificate with complete calculation trace.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Realistic Report Preview Document */}
              <div className="oiml-report-preview">
                <div className="oiml-doc-frame">
                  <div className="oiml-doc-header">
                    <div className="oiml-doc-brand">
                      <strong>VERIFICATION TEST REPORT</strong>
                      <small>OIML R 76-1:2006 (E) Standard</small>
                    </div>
                    <div className="oiml-doc-stamp">
                      <span>STATUS</span>
                      <strong>PASSED</strong>
                    </div>
                  </div>

                  <div className="oiml-doc-body">
                    <div className="oiml-doc-section">
                      <h5>1. INSTRUMENT IDENTIFICATION</h5>
                      <div className="oiml-doc-meta-grid">
                        <div><span>Manufacturer:</span> Mettler-Toledo</div>
                        <div><span>Model:</span> XPR205</div>
                        <div><span>Class:</span> Class I</div>
                        <div><span>Max Capacity:</span> 220 g</div>
                        <div><span>Interval e:</span> 1 mg</div>
                        <div><span>Interval d:</span> 0.1 mg</div>
                      </div>
                    </div>

                    <div className="oiml-doc-section">
                      <h5>2. EVALUATION SUMMARY</h5>
                      <table className="oiml-doc-table">
                        <thead>
                          <tr>
                            <th>Clause</th>
                            <th>Test Description</th>
                            <th>Measured</th>
                            <th>MPE</th>
                            <th>Result</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>A.4.4</td>
                            <td>Weighing Performance</td>
                            <td>+0.2 mg</td>
                            <td>±0.5 mg</td>
                            <td><span className="pass-text">PASS</span></td>
                          </tr>
                          <tr>
                            <td>A.4.7</td>
                            <td>Eccentric Loading</td>
                            <td>+0.1 mg</td>
                            <td>±1.0 mg</td>
                            <td><span className="pass-text">PASS</span></td>
                          </tr>
                          <tr>
                            <td>A.4.10</td>
                            <td>Repeatability (Pn)</td>
                            <td>0.3 mg</td>
                            <td>1.0 mg</td>
                            <td><span className="pass-text">PASS</span></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="oiml-doc-footer">
                      <div className="oiml-sign-line">
                        <small>Verification Officer</small>
                        <span>Legal Metrology Inspector</span>
                      </div>
                      <div className="oiml-doc-id">
                        <small>Report ID: R76-2026-0938</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 7 — WHY OIMLENSE */}
        <section id="why" className="oiml-section oiml-why-section">
          <div className="oiml-section-container">
            <div className="oiml-section-header">
              <span className="oiml-section-num">07</span>
              <span className="oiml-section-tag">WHY OIMLENSE</span>
            </div>

            <div className="oiml-why-intro">
              <h2>
                Built on four
                <br />
                <span className="oiml-text-highlight">core metrology principles.</span>
              </h2>
            </div>

            <div className="oiml-principles-grid">
              <div className="oiml-principle-card">
                <div className="oiml-principle-num">01</div>
                <h3>STRUCTURED</h3>
                <p>Standardized digital test workflow for every NAWI inspection, eliminating missing data and informal notes.</p>
              </div>

              <div className="oiml-principle-card">
                <div className="oiml-principle-num">02</div>
                <h3>DETERMINISTIC</h3>
                <p>Calculations and evaluations follow exact defined OIML R 76 mathematical formulas without manual estimation.</p>
              </div>

              <div className="oiml-principle-card">
                <div className="oiml-principle-num">03</div>
                <h3>TRACEABLE</h3>
                <p>Tests, observations, environment logs, and results remain linked and indexed for complete auditability.</p>
              </div>

              <div className="oiml-principle-card">
                <div className="oiml-principle-num">04</div>
                <h3>REPORT-READY</h3>
                <p>Results can be immediately transformed into structured, professional verification documentation.</p>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="oiml-final-cta-section">
          <div className="oiml-final-box">
            <div className="oiml-badge">
              <span className="oiml-badge-dot" />
              <span className="oiml-badge-text">SIH26035 SOLUTION</span>
            </div>

            <h2>Make every test traceable.</h2>

            <p>
              OIMLense brings structure, consistency and digital traceability to NAWI verification under OIML R 76.
            </p>

            <div className="oiml-final-actions">
              <button
                type="button"
                className="oiml-btn-hero-primary"
                onClick={onStartTesting}
              >
                <span>Enter OIMLense</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              <a href="#workflow" className="oiml-btn-hero-secondary">
                Explore the workflow
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="oiml-footer">
        <div className="oiml-footer-container">
          <div className="oiml-footer-brand">
            <img
              src="/oimlense-logo.png"
              alt="OIMLense Logo"
              className="oiml-footer-logo-img"
            />
            <p>
              SIH26035 · Non-Automatic Weighing Instruments (NAWI) Software System for Legal Metrology Verification and Test Report Generation.
            </p>
          </div>

          <div className="oiml-footer-nav">
            <div className="oiml-fcol">
              <strong>System</strong>
              <a href="#solution">Solution</a>
              <a href="#workflow">Workflow</a>
              <a href="#showcase">Product Showcase</a>
            </div>

            <div className="oiml-fcol">
              <strong>Standard</strong>
              <a href="#engine">OIML R 76 Engine</a>
              <a href="#coverage">Supported Procedures</a>
              <a href="#reporting">Test Reports</a>
            </div>

            <div className="oiml-fcol">
              <strong>Workspace</strong>
              <button type="button" onClick={onLogin}>Login</button>
              <button type="button" onClick={onStartTesting}>Enter Workspace</button>
            </div>
          </div>
        </div>

        <div className="oiml-footer-bottom">
          <span>OIML R 76 Edition 2006 (E) · SIH26035 Legal Metrology Solution</span>
          <span>Designed for Precision & Compliance</span>
        </div>
      </footer>
    </div>
  )
}

