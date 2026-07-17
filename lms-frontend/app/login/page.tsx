"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap, Mail, Lock, ArrowRight,
  Eye, EyeOff, Sparkles, AlertCircle
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [showPwd, setShowPwd]   = useState(false);
  const [isError, setIsError]   = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setIsError(true);
      setMessage("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setMessage("");
    setIsError(false);

    try {
      const res  = await fetch("http://127.0.0.1:8000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setIsError(true);
        setMessage(data.detail || "Invalid email or password.");
        setLoading(false);
        return;
      }

      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("role",         data.role);
      localStorage.setItem("user_email",   email);

      if (data.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/student");
      }
    } catch {
      setIsError(true);
      setMessage("Cannot reach the server. Is the backend running?");
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div className="auth-root">

      {/* ── LEFT PANEL: Brand / Illustration ── */}
      <div className="auth-left">
        <div className="auth-left-inner">

          {/* Logo */}
          <Link href="/" className="auth-logo">
            <div className="auth-logo-icon">
              <GraduationCap size={22} color="white" strokeWidth={2.2} />
            </div>
            <span className="auth-logo-text">StudyBuddy AI</span>
          </Link>

          {/* Headline */}
          <div className="auth-headline">
            <h1 className="auth-headline-title">
              Welcome<br />back! 👋
            </h1>
            <p className="auth-headline-sub">
              Pick up right where you left off. Your AI tutor and all your
              courses are waiting.
            </p>
          </div>

          {/* Feature bullets */}
          <div className="auth-features">
            {[
              "Personalised AI Tutor for every course",
              "Track your progress in real time",
              "Access 120+ expert-curated courses",
            ].map((f) => (
              <div key={f} className="auth-feature-item">
                <div className="auth-feature-dot">
                  <Sparkles size={12} color="white" />
                </div>
                <span>{f}</span>
              </div>
            ))}
          </div>

          {/* Decorative blobs */}
          <div className="auth-blob auth-blob-1" />
          <div className="auth-blob auth-blob-2" />
        </div>
      </div>

      {/* ── RIGHT PANEL: Form ── */}
      <div className="auth-right">
        <div className="auth-form-card">

          {/* Header */}
          <div className="auth-form-header">
            <h2 className="auth-form-title">Sign in</h2>
            <p className="auth-form-sub">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="auth-link">Create one free →</Link>
            </p>
          </div>

          {/* Error / info message */}
          {message && (
            <div className={`auth-alert ${isError ? "auth-alert-error" : "auth-alert-success"}`}>
              <AlertCircle size={15} />
              <span>{message}</span>
            </div>
          )}

          {/* Fields */}
          <div className="auth-fields">

            {/* Email */}
            <div className="auth-field">
              <label className="auth-label">Email address</label>
              <div className="auth-input-wrapper">
                <Mail size={16} className="auth-input-icon" />
                <input
                  id="login-email"
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
              <div className="auth-label-row">
                <label className="auth-label">Password</label>
                <a href="#" className="auth-forgot">Forgot password?</a>
              </div>
              <div className="auth-input-wrapper">
                <Lock size={16} className="auth-input-icon" />
                <input
                  id="login-password"
                  type={showPwd ? "text" : "password"}
                  className="auth-input auth-input-has-action"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoComplete="current-password"
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
            </div>
          </div>

          {/* Submit */}
          <button
            id="login-submit"
            className="auth-submit-btn"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <span className="auth-spinner" />
            ) : (
              <>Sign in <ArrowRight size={17} /></>
            )}
          </button>

          {/* Divider */}
          <div className="auth-divider"><span>or continue with</span></div>

          {/* Social stubs */}
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