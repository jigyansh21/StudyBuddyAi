"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap, Mail, Lock, User, ArrowRight,
  Eye, EyeOff, Sparkles, AlertCircle, CheckCircle2
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [message, setMessage]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [showPwd, setShowPwd]   = useState(false);
  const [showCfm, setShowCfm]   = useState(false);
  const [isError, setIsError]   = useState(false);
  const [success, setSuccess]   = useState(false);

  /* Password strength helper */
  const strength = (() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 8)          s++;
    if (/[A-Z]/.test(password))        s++;
    if (/[0-9]/.test(password))        s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];
  const strengthColor = ["", "#ef4444", "#f59e0b", "#3b82f6", "#10b981"][strength];

  const handleRegister = async () => {
    setIsError(false);
    setMessage("");

    if (!name || !email || !password || !confirm) {
      setIsError(true);
      setMessage("Please fill in all fields.");
      return;
    }
    if (password !== confirm) {
      setIsError(true);
      setMessage("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setIsError(true);
      setMessage("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const res  = await fetch("http://127.0.0.1:8000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setIsError(true);
        setMessage(data.detail || "Registration failed. Please try again.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setMessage("Account created successfully! Redirecting to login…");
      setTimeout(() => router.push("/login"), 1800);
    } catch {
      setIsError(true);
      setMessage("Cannot reach the server. Is the backend running?");
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleRegister();
  };

  return (
    <div className="auth-root">

      {/* ── LEFT PANEL ── */}
      <div className="auth-left auth-left-register">
        <div className="auth-left-inner">

          <Link href="/" className="auth-logo">
            <div className="auth-logo-icon">
              <GraduationCap size={22} color="white" strokeWidth={2.2} />
            </div>
            <span className="auth-logo-text">StudyBuddy AI</span>
          </Link>

          <div className="auth-headline">
            <h1 className="auth-headline-title">
              Start your<br />journey! 🚀
            </h1>
            <p className="auth-headline-sub">
              Create a free account and get access to AI-powered tutoring,
              personalised paths, and 120+ expert courses.
            </p>
          </div>

          {/* Stats strip */}
          <div className="auth-stats">
            {[
              { value: "10,000+", label: "Active learners" },
              { value: "120+",    label: "Expert courses" },
              { value: "4.8★",    label: "Student rating" },
            ].map((s) => (
              <div key={s.label} className="auth-stat">
                <span className="auth-stat-value">{s.value}</span>
                <span className="auth-stat-label">{s.label}</span>
              </div>
            ))}
          </div>

          <div className="auth-features">
            {[
              "Free to get started — no credit card",
              "AI tutor trained on your course content",
              "Progress saved across all your devices",
            ].map((f) => (
              <div key={f} className="auth-feature-item">
                <div className="auth-feature-dot">
                  <Sparkles size={12} color="white" />
                </div>
                <span>{f}</span>
              </div>
            ))}
          </div>

          <div className="auth-blob auth-blob-1" />
          <div className="auth-blob auth-blob-2" />
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="auth-right">
        <div className="auth-form-card">

          <div className="auth-form-header">
            <h2 className="auth-form-title">Create account</h2>
            <p className="auth-form-sub">
              Already have an account?{" "}
              <Link href="/login" className="auth-link">Sign in →</Link>
            </p>
          </div>

          {message && (
            <div className={`auth-alert ${isError ? "auth-alert-error" : "auth-alert-success"}`}>
              {success ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
              <span>{message}</span>
            </div>
          )}

          <div className="auth-fields">

            {/* Full Name */}
            <div className="auth-field">
              <label className="auth-label">Full name</label>
              <div className="auth-input-wrapper">
                <User size={16} className="auth-input-icon" />
                <input
                  id="reg-name"
                  type="text"
                  className="auth-input"
                  placeholder="Jigyansh Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoComplete="name"
                />
              </div>
            </div>

            {/* Email */}
            <div className="auth-field">
              <label className="auth-label">Email address</label>
              <div className="auth-input-wrapper">
                <Mail size={16} className="auth-input-icon" />
                <input
                  id="reg-email"
                  type="email"
                  className="auth-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="auth-field">
              <label className="auth-label">Password</label>
              <div className="auth-input-wrapper">
                <Lock size={16} className="auth-input-icon" />
                <input
                  id="reg-password"
                  type={showPwd ? "text" : "password"}
                  className="auth-input auth-input-has-action"
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShowPwd((p) => !p)}
                  aria-label="Toggle password visibility"
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Strength bar */}
              {password && (
                <div className="auth-strength">
                  <div className="auth-strength-bars">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="auth-strength-bar"
                        style={{ background: i <= strength ? strengthColor : "#e2e8f0" }}
                      />
                    ))}
                  </div>
                  <span className="auth-strength-label" style={{ color: strengthColor }}>
                    {strengthLabel}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="auth-field">
              <label className="auth-label">Confirm password</label>
              <div className="auth-input-wrapper">
                <Lock size={16} className="auth-input-icon" />
                <input
                  id="reg-confirm"
                  type={showCfm ? "text" : "password"}
                  className={`auth-input auth-input-has-action ${
                    confirm && confirm !== password ? "auth-input-error" : ""
                  } ${
                    confirm && confirm === password ? "auth-input-valid" : ""
                  }`}
                  placeholder="Re-enter password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShowCfm((p) => !p)}
                  aria-label="Toggle confirm password visibility"
                >
                  {showCfm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

          </div>

          {/* Terms */}
          <p className="auth-terms">
            By creating an account you agree to our{" "}
            <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
          </p>

          {/* Submit */}
          <button
            id="reg-submit"
            className="auth-submit-btn"
            onClick={handleRegister}
            disabled={loading || success}
          >
            {loading ? (
              <span className="auth-spinner" />
            ) : success ? (
              <><CheckCircle2 size={17} /> Account Created!</>
            ) : (
              <>Create account <ArrowRight size={17} /></>
            )}
          </button>

          {/* Divider */}
          <div className="auth-divider"><span>or continue with</span></div>

          <div className="auth-social-row">
            <button className="auth-social-btn">
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.2l6.8-6.8C35.8 2.3 30.3 0 24 0 14.7 0 6.7 5.5 2.9 13.5l7.9 6.1C12.7 13.2 17.9 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.2-.4-4.7H24v9h12.7c-.5 2.8-2.1 5.1-4.5 6.7l7.1 5.5c4.2-3.8 6.7-9.5 6.7-16.5z"/>
                <path fill="#FBBC05" d="M10.8 28.4A14.5 14.5 0 0 1 9.5 24c0-1.5.2-3 .7-4.4L2.3 13.5A23.9 23.9 0 0 0 0 24c0 3.8.9 7.4 2.5 10.6l8.3-6.2z"/>
                <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.2-8.4 2.2-6.1 0-11.3-3.7-13.2-9.1l-8.2 6.3C6.7 42.5 14.7 48 24 48z"/>
              </svg>
              Google
            </button>
            <button className="auth-social-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.38.6.1.82-.26.82-.58v-2.03c-3.34.72-4.04-1.61-4.04-1.61-.55-1.38-1.34-1.75-1.34-1.75-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.23 1.84 1.23 1.07 1.83 2.8 1.3 3.49 1 .1-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.3-1.23 3.3-1.23.66 1.66.25 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.8 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.82.58A12 12 0 0 0 24 12C24 5.37 18.63 0 12 0z"/>
              </svg>
              GitHub
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}