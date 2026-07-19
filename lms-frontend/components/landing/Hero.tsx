import Link from "next/link";
import {
  ArrowRight, Sparkles, PlayCircle,
  LayoutDashboard, BookOpen, Users, BarChart3,
  GraduationCap, Bell, Search, Bot, Home,
  Grid2X2, Settings, ListChecks
} from "lucide-react";

/**
 * Landing Page Hero Section
 *
 * Responsibilities:
 * - Renders the first impression hero banner for unauthenticated visitors.
 * - Displays a highly polished, static mockup of the student dashboard to demonstrate value.
 * - Drives conversion via primary "Get Started" call-to-action buttons.
 *
 * @component
 */
export default function Hero() {
  return (
    <section id="home" className="hero-section">
      <div className="hero-container">

        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={15} />
            <span>AI-Powered Learning Platform</span>
          </div>

          <h1 className="hero-title">
            Learn Smarter.<br />
            <span className="text-gradient">Achieve More.</span>
          </h1>

          <p className="hero-subtitle">
            StudyBuddy AI helps you master concepts faster with personalized
            learning paths, interactive quizzes, and AI-driven progress tracking.
          </p>

          <div className="hero-buttons">
            <Link href="/register" className="btn-primary-lg">
              Get Started <ArrowRight size={17} />
            </Link>
            <a href="#courses" className="btn-secondary-lg">
              <PlayCircle size={17} /> Explore Courses
            </a>
          </div>

          <div className="hero-social-proof">
            <div className="avatar-group">
              <div className="avatar">👦</div>
              <div className="avatar">👧</div>
              <div className="avatar">👨‍🎓</div>
            </div>
            <span>Trusted by <strong>10,000+</strong> students</span>
          </div>
        </div>

        <div className="hero-visual">
          <div className="mockup-window">

            <div className="mockup-window-header">
              <span className="dot red" />
              <span className="dot yellow" />
              <span className="dot green" />
            </div>

            <div className="mockup-body">

              <div className="mockup-sidebar">
                <div className="mockup-logo-box">
                  <GraduationCap size={18} color="white" />
                </div>
                <div className="mockup-nav-item active"><Home size={15} /></div>
                <div className="mockup-nav-item"><BookOpen size={15} /></div>
                <div className="mockup-nav-item"><BarChart3 size={15} /></div>
                <div className="mockup-nav-item"><Users size={15} /></div>
                <div className="mockup-nav-item"><Grid2X2 size={15} /></div>
                <div className="mockup-nav-item"><Settings size={15} /></div>
              </div>

              <div className="mockup-main">

                <div className="mockup-topbar">
                  <span className="mockup-page-title">Dashboard</span>
                  <div className="mockup-topbar-right">
                    <div className="mockup-search">
                      <Search size={11} color="#94a3b8" />
                      <span className="mockup-search-text">Search anything…</span>
                    </div>
                    <div className="mockup-bell">
                      <Bell size={14} color="#64748b" />
                      <span className="mockup-notif-dot" />
                    </div>
                    <div className="mockup-user-avatar" />
                  </div>
                </div>

                <div className="mockup-greeting-block">
                  <p className="mockup-greeting-sub">Good Evening,</p>
                  <p className="mockup-greeting-name">Jigyansh 👋</p>
                  <p className="mockup-greeting-hint">Continue learning where you left off.</p>
                </div>

                <div className="mockup-cards-row">

                  <div className="mockup-progress-card">
                    <div className="mpc-label">Overall Progress</div>
                    <div className="mpc-percent">68%</div>
                    <div className="mpc-bar-track">
                      <div className="mpc-bar-fill" style={{ width: "68%" }} />
                    </div>
                    <div className="mpc-hint">Keep it up! You're doing great.</div>
                  </div>

                  <div className="mockup-ai-card">
                    <div className="mac-text">
                      <div className="mac-title">AI Tutor</div>
                      <div className="mac-sub">Ask doubts, get instant answers.</div>
                      <div className="mac-btn">Start Chat</div>
                    </div>
                    <div className="mac-bot">
                      <Bot size={38} color="white" strokeWidth={1.5} />
                    </div>
                  </div>
                </div>

                <div className="mockup-recent">
                  <div className="mockup-recent-title">Recently Viewed</div>
                  <div className="mockup-recent-grid">
                    {[
                      { label: "Python Basics", pct: 75, color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
                      { label: "Data Structures", pct: 48, color: "#10b981", bg: "rgba(16,185,129,0.12)" },
                      { label: "DBMS Concepts", pct: 33, color: "#8b5cf6", bg: "rgba(139,92,246,0.12)" },
                      { label: "AI/ML Intro", pct: 20, color: "#f97316", bg: "rgba(249,115,22,0.12)" },
                    ].map((c) => (
                      <div key={c.label} className="mockup-recent-card">
                        <div className="mrc-icon" style={{ background: c.bg, color: c.color }}>
                          <BookOpen size={13} />
                        </div>
                        <div className="mrc-label">{c.label}</div>
                        <div className="mrc-progress">
                          <div className="mrc-track">
                            <div className="mrc-fill" style={{ width: `${c.pct}%`, background: c.color }} />
                          </div>
                          <span className="mrc-pct">{c.pct}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </div>

          <div className="floating-badge">
            <Sparkles size={18} color="#8b5cf6" />
            <span>AI Tutor Active</span>
          </div>
        </div>

      </div>
    </section>
  );
}