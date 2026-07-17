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
} from "lucide-react";
import "../styles/sidebar.css";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    {
      title: "MAIN",
      items: [
        { icon: <LayoutDashboard size={19} />, label: "Dashboard", href: "/admin" },
        { icon: <BookOpen size={19} />, label: "Course Management", href: "/admin/courses" },
        { icon: <Users size={19} />, label: "Student Management", href: "/admin/students" },
      ],
    },
    {
      title: "ANALYTICS",
      items: [
        { icon: <BarChart3 size={19} />, label: "Progress Analytics", href: "/admin/progress" },
        { icon: <FileQuestion size={19} />, label: "Generate Quiz", href: "/admin/quiz" },
      ],
    },
    {
      title: "SYSTEM",
      items: [
        { icon: <Settings size={19} />, label: "Settings", href: "/admin/settings" },
      ],
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    router.replace("/login"); // Updated to replace instead of push
  };

  return (
    <aside className="admin-sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <GraduationCap size={22} />
        </div>
        <div className="sidebar-brand-text">
          <h2>StudyBuddy AI</h2>
          <p>Admin Portal</p>
        </div>
      </div>

      <nav className="sidebar-menu">
        {menuItems.map((section) => (
          <div key={section.title} className="sidebar-section">
            <p className="sidebar-section-title">{section.title}</p>
            {section.items.map((item) => {
              const active = pathname === item.href || (pathname?.startsWith(item.href + "/") ?? false);
              
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

      <button type="button" className="logout-button" onClick={handleLogout}>
        <div className="menu-icon">
          <LogOut size={19} />
        </div>
        <span>Logout</span>
      </button>
    </aside>
  );
}