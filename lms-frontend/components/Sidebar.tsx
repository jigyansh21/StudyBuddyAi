"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  BarChart3,
  FileQuestion,
  Settings,
  LogOut,
  GraduationCap,
  ChevronRight,
} from "lucide-react";
import "../styles/sidebar.css";

/**
 * Admin Sidebar Navigation
 *
 * Responsibilities:
 * - Renders the primary navigation menu for the admin dashboard.
 * - Highlights the currently active route using `usePathname`.
 * - Provides categorized links (MAIN, ANALYTICS, SYSTEM) for course and student management.
 * - Handles admin session termination (logout).
 *
 * @component
 */
export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    {
      title: "MAIN",
      items: [
        { icon: <LayoutDashboard size={17} />, label: "Dashboard", href: "/admin" },
        { icon: <BookOpen size={17} />, label: "Course Management", href: "/admin/courses" },
        { icon: <Users size={17} />, label: "Student Management", href: "/admin/students" },
      ],
    },
    {
      title: "ANALYTICS",
      items: [
        { icon: <BarChart3 size={17} />, label: "Progress Analytics", href: "/admin/progress" },
        { icon: <FileQuestion size={17} />, label: "Generate Quiz", href: "/admin/quiz" },
      ],
    },
    {
      title: "SYSTEM",
      items: [
        { icon: <Settings size={17} />, label: "Settings", href: "/admin/settings" },
      ],
    },
  ];

  /**
   * Terminates the active admin session by clearing the JWT token
   * and redirecting the user back to the public login page.
   */
  const handleLogout = () => {
    localStorage.removeItem("access_token");
    router.replace("/login");
  };

  return (
    <aside className="admin-sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <GraduationCap size={20} />
        </div>
        <div className="sidebar-brand-text">
          <h2>StudyBuddy AI</h2>
          <p>Admin Portal</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-menu">
        {menuItems.map((section) => (
          <div key={section.title} className="sidebar-section">
            <p className="sidebar-section-title">{section.title}</p>
            {section.items.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/admin" && pathname?.startsWith(item.href + "/"));

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`menu-item ${active ? "active-menu" : ""}`}
                >
                  <div className="menu-icon">{item.icon}</div>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-divider" />

      {/* Footer */}
      <div className="sidebar-footer">
        <button type="button" className="logout-button" onClick={handleLogout}>
          <div className="menu-icon">
            <LogOut size={17} />
          </div>
          <span>Logout</span>
          <span className="sidebar-online-dot" />
        </button>
      </div>
    </aside>
  );
}