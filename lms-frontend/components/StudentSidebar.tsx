"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Bot,
  FileText,
  TrendingUp,
  Bookmark,
  Calendar,
  Settings,
  LogOut,
  Sparkles,
  GraduationCap
} from "lucide-react";

/**
 * Student Sidebar Navigation
 *
 * Responsibilities:
 * - Renders the primary navigation menu for the student portal.
 * - Resolves and displays the student's identity (name/email) from localStorage
 *   and syncs with the `/auth/me` endpoint to ensure data freshness.
 * - Handles student session termination (logout).
 * - Highlights the active route using Next.js `usePathname`.
 *
 * @component
 */
export default function StudentSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  // Student identity state, hydrated from local storage then synced with the API
  const [studentName, setStudentName] = useState<string>("Student");
  const [studentEmail, setStudentEmail] = useState<string>("student@studybuddy.ai");

  /**
   * Initializes the sidebar by immediately rendering cached identity data from
   * localStorage (preventing UI flashes), then silently verifying the token
   * against the backend to ensure the session is still valid and the name/email
   * are up to date.
   */
  useEffect(() => {
    const storedName = localStorage.getItem("user_name");
    const storedEmail = localStorage.getItem("user_email");
    if (storedName) setStudentName(storedName);
    if (storedEmail) setStudentEmail(storedEmail);

    const token = localStorage.getItem("access_token");
    if (token) {
      fetch("http://localhost:8000/auth/me", {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error("Unauthorized");
        })
        .then((data) => {
          if (data.name) {
            setStudentName(data.name);
            localStorage.setItem("user_name", data.name);
          }
          if (data.email) {
            setStudentEmail(data.email);
            localStorage.setItem("user_email", data.email);
          }
        })
        .catch((err) => {
          console.error("Auth sync error:", err);
        });
    }
  }, []);

  /**
   * Terminates the active student session by clearing all locally cached
   * auth variables and redirecting to the login page.
   */
  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_id");
    localStorage.removeItem("role");
    router.replace("/login");
  };

  const navLinks = [
    { label: "Dashboard", href: "/student", icon: <LayoutDashboard size={18} /> },
    { label: "My Courses", href: "/student/courses", icon: <BookOpen size={18} /> },
    { label: "AI Tutor", href: "/student/chat", icon: <Bot size={18} />, badge: "New" },
    { label: "Assignments", href: "/student/assignments", icon: <FileText size={18} /> },
    { label: "Progress", href: "/student/progress", icon: <TrendingUp size={18} /> },
    { label: "Notes", href: "/student/notes", icon: <FileText size={18} /> },
    { label: "Bookmarks", href: "/student/bookmarks", icon: <Bookmark size={18} /> },
    { label: "Calendar", href: "/student/calendar", icon: <Calendar size={18} /> },
    { label: "Settings", href: "/student/settings", icon: <Settings size={18} /> },
  ];

  /**
   * Derives a 1-2 letter initial string from the student's full name
   * to display inside the profile avatar circle.
   *
   * @param name - The student's full display name.
   * @returns A capitalized initials string (e.g., "John Doe" -> "JD").
   */
  const getInitials = (name: string) => {
    if (!name) return "S";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <aside className="student-sidebar">
      {/* Brand */}
      <Link href="/student" className="student-sidebar-brand">
        <div className="student-sidebar-logo-icon">
          <GraduationCap size={22} />
        </div>
        <div>
          <h2>StudyBuddy AI</h2>
        </div>
      </Link>

      {/* Navigation Links */}
      <nav className="student-sidebar-menu">
        {navLinks.map((link) => {
          const isActive = pathname === link.href || (link.href !== "/student" && pathname.startsWith(link.href));
          return (
            <Link key={link.label} href={link.href} className={`student-menu-item ${isActive ? "active" : ""}`}>
              {link.icon}
              <span>{link.label}</span>
              {link.badge && <span className="student-menu-badge">{link.badge}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Upgrade to Pro Card (matches reference mockup exactly) */}
      <div className="student-pro-card">
        <h4>
          <Sparkles size={16} /> Upgrade to Pro
        </h4>
        <p>Unlock unlimited AI chats, advanced analytics & more.</p>
        <button type="button" className="student-pro-btn" onClick={() => alert("Pro plan activation coming soon!")}>
          Upgrade Now
        </button>
      </div>

      {/* Student Profile Footer & Logout */}
      <div className="student-sidebar-footer">
        <div className="student-profile-chip">
          <div className="student-profile-avatar">
            {getInitials(studentName)}
          </div>
          <div className="student-profile-meta">
            <h5 title={studentName}>{studentName.length > 14 ? studentName.substring(0, 14) + "..." : studentName}</h5>
            <p>Student</p>
          </div>
        </div>
        <button type="button" className="transparent-btn icon-btn" title="Logout" onClick={handleLogout} style={{ color: "#64748b" }}>
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}
