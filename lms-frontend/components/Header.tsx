"use client";

import React from "react";
import { Search, Bell, CalendarDays } from "lucide-react";
import "../styles/header.css";

export default function Header() {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'short', 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });

  return (
    <header className="admin-header">
      
      {/* Left Side: Search */}
      <div className="header-left">
        <div className="header-search">
          <input 
            type="text" 
            // Fixed Change 3: Cleaned up placeholder
            placeholder="Search courses, students..." 
            aria-label="Search"
          />
          <Search size={18} className="search-icon" aria-hidden="true" />
        </div>
      </div>

      {/* Right Side: Date, Notifications, Profile */}
      <div className="header-right">
        
        {/* Dynamic Date */}
        <div className="header-date" suppressHydrationWarning>
          <CalendarDays size={16} aria-hidden="true" />
          <span suppressHydrationWarning>{currentDate}</span>
        </div>

        {/* Notification Bell */}
        <button type="button" className="icon-btn" aria-label="Notifications">
          <Bell size={20} aria-hidden="true" />
          <span className="notification-dot"></span>
        </button>

        {/* Admin Profile - Fixed Change 1 & 2: Generic 'Admin' for reusability */}
        <div className="header-profile" aria-label="Admin Profile">
          <div className="profile-info">
            <span className="profile-name">Admin</span>
            <span className="profile-role">Administrator</span>
          </div>
          <div className="profile-avatar" aria-hidden="true">A</div>
        </div>

      </div>
    </header>
  );
}