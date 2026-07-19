"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Plus, BookOpen, LayoutGrid } from "lucide-react";

// Layout Components
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import CourseCard from "@/components/CourseCard";

// CSS
import "@/styles/dashboard.css";
import "@/styles/courses.css";

type Course = {
  id: number;
  title: string;
  description: string;
  created_at?: string;
  enrollment_count: number;
  avg_progress: number;
};

export default function CourseManagement() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const getCourses = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch("http://localhost:8000/admin-api/courses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) setCourses(data);
    } catch (error) {
      console.error("Failed to load courses", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    getCourses();
  }, []);

  const filteredCourses = courses.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="admin-main">
        <Header />
        <main className="dashboard-content courses-page">

          {/* Page Header */}
          <div className="courses-page-header">
            <div className="courses-page-header-left">
              <span className="courses-eyebrow">
                <BookOpen size={10} /> Admin Portal
              </span>
              <h1 className="courses-main-title">Course Management</h1>
              <p className="courses-description">
                Create, organise and manage every course in your LMS.
              </p>
            </div>
            <Link href="/admin" className="btn-create-course">
              <Plus size={16} /> Create Course
            </Link>
          </div>

          {/* Toolbar */}
          <div className="courses-toolbar">
            <div className="courses-toolbar-left">
              <div className="courses-search-wrapper">
                <Search size={16} className="courses-search-icon" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="courses-search-input"
                />
              </div>
              {!loading && (
                <span className="courses-count-badge">
                  <LayoutGrid size={12} style={{ display: "inline", marginRight: 4 }} />
                  {filteredCourses.length} course{filteredCourses.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="courses-loading">
              <p>Loading courses…</p>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="courses-empty">
              <span className="courses-empty-icon">📚</span>
              <h3 style={{ margin: "0 0 8px", color: "#0f172a", fontSize: "18px", fontWeight: 800 }}>
                No Courses Found
              </h3>
              <p style={{ color: "#64748b", fontSize: "14px", margin: 0 }}>
                Create your first course to start building your LMS.
              </p>
            </div>
          ) : (
            <div className="courses-grid">
              {filteredCourses.map((course, idx) => (
                <CourseCard
                  key={course.id}
                  id={course.id}
                  title={course.title}
                  description={course.description}
                  created_at={course.created_at}
                  enrollment_count={course.enrollment_count}
                  avg_progress={course.avg_progress}
                  index={idx}
                />
              ))}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}