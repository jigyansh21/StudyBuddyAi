"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Plus } from "lucide-react";

// Layout Components
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import CourseCard from "@/components/CourseCard";
import GlassCard from "@/components/GlassCard";

// CSS
import "@/styles/dashboard.css"; 
import "@/styles/courses.css";   

type Course = {
  id: number;
  title: string;
  description: string;
  created_at?: string;
};

export default function CourseManagement() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const getCourses = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/courses/");
      const data = await response.json();

      if (response.ok) {
        setCourses(data);
      }
    } catch (error) {
      // FIXED 3: Changed to console.error for proper debugging
      console.error("Failed to load courses", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    getCourses();
  }, []);

  const filteredCourses = courses.filter((course) =>
    course.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-layout">
      {/* Global Sidebar */}
      <Sidebar />

      <div className="admin-main">
        {/* Global Header */}
        <Header />

        <main className="dashboard-content courses-page">
          
          {/* Page Specific Hero */}
          <div className="courses-header-section">
            <span className="courses-small-title">ADMIN PORTAL</span>
            <h1 className="courses-main-title">Course Management</h1>
            <p className="courses-description">
              Create, manage and organize all your courses.
            </p>
          </div>

          {/* Toolbar */}
          <div className="courses-toolbar">
            <div className="courses-search-wrapper">
              <Search size={18} className="courses-search-icon" aria-hidden="true" />
              <input
                type="text"
                placeholder="Search courses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="glass-input courses-search-input"
                aria-label="Search courses"
              />
            </div>

            {/* FIXED 2: Temporarily route to /admin to prevent 404 until create page is built */}
            <Link href="/admin" className="btn-primary">
              <Plus size={18} /> Create Course
            </Link>
          </div>

          {/* Content Area */}
          {loading ? (
            <div className="courses-loading">
              <p className="text-muted">Loading Courses...</p>
            </div>
          ) : filteredCourses.length === 0 ? (
            <GlassCard padding="lg" className="courses-empty">
              {/* FIXED 1: Removed inline styles for the book icon */}
              <div className="courses-empty-icon">📚</div>
              <h3>No Courses Found</h3>
              <p>Create your first course to start building your LMS.</p>
            </GlassCard>
          ) : (
            <div className="courses-grid">
              {filteredCourses.map((course) => (
                <CourseCard 
                  key={course.id} 
                  id={course.id}
                  title={course.title}
                  description={course.description}
                  created_at={course.created_at}
                />
              ))}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}