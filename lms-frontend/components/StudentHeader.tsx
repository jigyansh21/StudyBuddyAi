"use client";

import React, { useEffect, useState } from "react";
import { Search, Bell } from "lucide-react";

/**
 * Student Top Navigation Header
 *
 * Responsibilities:
 * - Renders the global search bar, notification bell, and compact profile avatar.
 * - Extracts the student's name from localStorage for instant display on mount.
 *
 * @component
 */
export default function StudentHeader() {
  // Read-only state for the student's display name, used for the avatar fallback
  const [studentName, setStudentName] = useState<string>("Student");

  /**
   * Hydrates the studentName state from local storage on component mount
   * to ensure the header profile stays in sync with the sidebar.
   */
  useEffect(() => {
    const stored = localStorage.getItem("user_name");
    if (stored) setStudentName(stored);
  }, []);

  /**
   * Computes a short initials string for the visual avatar.
   *
   * @param name - The student's full name.
   * @returns Capitalized initials (max 2 characters).
   */
  const getInitials = (name: string) => {
    if (!name) return "S";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="student-header">
      {/* Search Bar matching reference */}
      <div className="student-search-bar">
        <Search size={18} color="#94a3b8" />
        <input type="text" placeholder="Search for courses, topics, assignments..." />
      </div>

      {/* Right side: Bell notification & Profile avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
        <button type="button" className="icon-btn" style={{ position: "relative", border: "1px solid #e2e8f0", background: "white", borderRadius: "10px", width: "40px", height: "40px" }} title="Notifications">
          <Bell size={19} color="#475569" />
          <span style={{ position: "absolute", top: "6px", right: "6px", width: "16px", height: "16px", borderRadius: "50%", background: "#ef4444", color: "white", fontSize: "10px", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center" }}>
            3
          </span>
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "4px 8px", borderRadius: "20px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
          <div className="student-profile-avatar" style={{ width: "32px", height: "32px", fontSize: "13px" }}>
            {getInitials(studentName)}
          </div>
          <span style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a", paddingRight: "6px" }}>
            {studentName}
          </span>
        </div>
      </div>
    </header>
  );
}
