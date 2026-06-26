"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setMessage("Email and password are required");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("http://127.0.0.1:8000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      const data = await response.json();

      console.log("Login response:", data);

      if (!response.ok) {
        setMessage(data.detail || "Invalid email or password");
        setLoading(false);
        return;
      }

      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("user_email", email);

      if (data.role === "admin") {
        router.push("/admin");
      } else {
        setMessage("Login successful, but this account is not admin.");
      }
    } catch (error) {
      setMessage("Backend connection failed");
    }

    setLoading(false);
  };

  return (
    <div className="page-container">
      <div className="card">
        <h1>Login</h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={handleLogin} disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        {message && <p className="form-message">{message}</p>}
      </div>
    </div>
  );
}