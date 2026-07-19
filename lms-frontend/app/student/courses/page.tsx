"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Search,
  Filter,
  PlusCircle,
  PlayCircle,
  CheckCircle2,
  Sparkles
} from "lucide-react";
import StudentSidebar from "@/components/StudentSidebar";
import StudentHeader from "@/components/StudentHeader";

const API_URL = "http://localhost:8000";

type Course = {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  language: string;
  thumbnail?: string;
};

type EnrolledCourse = {
  enrollment_id: number;
  course_id: number;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  language: string;
  thumbnail?: string;
  progress_percent: number;
  chapter_count: number;
};

/**
 * Student Courses Catalog
 *
 * Responsibilities:
 * - Render the full catalog of available and enrolled courses.
 * - Provide filtering capabilities (All, Enrolled, In Progress, Completed).
 * - Allow students to enroll in new courses directly from the catalog.
 * - Act as a secondary dashboard for course discovery.
 *
 * @component
 */
export default function StudentCoursesCatalogPage() {
  // Full catalog of published courses fetched from the backend.
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  
  // List of courses the student has joined, enriched with progress metrics.
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  
  // Tracks the currently selected filter tab (e.g., 'all', 'enrolled', 'completed').
  const [activeTab, setActiveTab] = useState<string>("all");
  
  // Stores the current user input for filtering courses by title or description.
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // Controls the loading state while resolving network requests.
  const [loading, setLoading] = useState<boolean>(true);

  /**
   * Fetches the initial course catalog and user enrollment data on component mount.
   * Runs exactly once.
   */
  useEffect(() => {
    fetchCoursesAndEnrollments();
  }, []);

  /**
   * Retrieves both the global course catalog and the student's specific enrollments.
   *
   * API Calls:
   * - GET /enrollments/my-courses: Retrieves the student's active enrollments.
   * - GET /courses/: Fetches the complete catalog.
   *
   * Both datasets are required simultaneously to correctly render the 'Enrolled'
   * vs 'Explore Catalog' states for each course card.
   */
  const fetchCoursesAndEnrollments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");

      // Fetch enrollments
      if (token) {
        const enrRes = await fetch(`${API_URL}/enrollments/my-courses`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (enrRes.ok) {
          const enrData = await enrRes.json();
          setEnrolledCourses(enrData);
        }
      }

      // Fetch all courses
      const coursesRes = await fetch(`${API_URL}/courses/`);
      if (coursesRes.ok) {
        const coursesData = await coursesRes.json();
        setAllCourses(coursesData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Registers the student for a new course from the catalog.
   *
   * API:
   * POST /enrollments/:courseId
   *
   * Expected Response:
   * 200 OK — The enrollment was successful, triggering a data refresh
   * to update the UI from 'Enroll' to 'Resume Learning'.
   */
  const handleEnroll = async (courseId: number) => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) return alert("Please login first to enroll in courses.");

      const res = await fetch(`${API_URL}/enrollments/${courseId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      if (res.ok) {
        alert("Enrolled successfully!");
        fetchCoursesAndEnrollments();
      } else {
        const err = await res.json();
        alert(err.detail || "Enrollment failed.");
      }
    } catch (error) {
      console.error(error);
      alert("Error enrolling in course.");
    }
  };

  // Filter courses based on tab and search query
  const filteredCourses = allCourses.filter((course) => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          course.category.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    const enr = enrolledCourses.find((e) => e.course_id === course.id);

    if (activeTab === "enrolled") return !!enr;
    if (activeTab === "in_progress") return !!enr && enr.progress_percent < 100;
    if (activeTab === "completed") return !!enr && enr.progress_percent >= 100;
    if (activeTab === "available") return !enr;
    return true; // "all"
  });

  return (
    <div className="student-layout">
      <StudentSidebar />
      <div className="student-main">
        <StudentHeader />
        <main className="student-content">
          
          {/* Header Bar matching Screen 2 */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <h1 style={{ fontSize: "26px", fontWeight: "800", color: "#0f172a", margin: "0 0 6px", letterSpacing: "-0.5px" }}>
                My Courses &amp; Catalog
              </h1>
              <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
                Explore and manage all your enrolled courses and AI tutoring sessions.
              </p>
            </div>

            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "white", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "0 14px", height: "40px", width: "260px" }}>
                <Search size={16} color="#94a3b8" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ border: "none", outline: "none", width: "100%", fontSize: "13px" }}
                />
              </div>
              <button type="button" className="student-tab-btn" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Filter size={15} /> Filter
              </button>
            </div>
          </div>

          {/* Tabs matching Screen 2 */}
          <div className="student-courses-tabs">
            <button
              type="button"
              className={`student-tab-btn ${activeTab === "all" ? "active" : ""}`}
              onClick={() => setActiveTab("all")}
            >
              All Courses ({allCourses.length})
            </button>
            <button
              type="button"
              className={`student-tab-btn ${activeTab === "enrolled" ? "active" : ""}`}
              onClick={() => setActiveTab("enrolled")}
            >
              Enrolled ({enrolledCourses.length})
            </button>
            <button
              type="button"
              className={`student-tab-btn ${activeTab === "in_progress" ? "active" : ""}`}
              onClick={() => setActiveTab("in_progress")}
            >
              In Progress ({enrolledCourses.filter(e => e.progress_percent < 100).length})
            </button>
            <button
              type="button"
              className={`student-tab-btn ${activeTab === "completed" ? "active" : ""}`}
              onClick={() => setActiveTab("completed")}
            >
              Completed ({enrolledCourses.filter(e => e.progress_percent >= 100).length})
            </button>
            <button
              type="button"
              className={`student-tab-btn ${activeTab === "available" ? "active" : ""}`}
              onClick={() => setActiveTab("available")}
            >
              Explore Catalog ({allCourses.length - enrolledCourses.length})
            </button>
          </div>

          {/* Course Grid */}
          {loading ? (
            <p className="text-muted">Loading courses from server...</p>
          ) : filteredCourses.length === 0 ? (
            <div style={{ background: "white", padding: "48px", borderRadius: "18px", border: "1px dashed #cbd5e1", textAlign: "center" }}>
              <BookOpen size={48} color="#94a3b8" style={{ margin: "0 auto 16px" }} />
              <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "8px" }}>No Courses Found</h3>
              <p style={{ fontSize: "13.5px", color: "#64748b" }}>
                We couldn&apos;t find any courses matching your filters. Try selecting another tab or searching for another keyword.
              </p>
            </div>
          ) : (
            <div className="student-courses-grid">
              {filteredCourses.map((course) => {
                const enrollment = enrolledCourses.find((e) => e.course_id === course.id);
                const progress = enrollment ? Math.round(enrollment.progress_percent) : 0;

                return (
                  <div key={course.id} className="student-course-card">
                    <div className="student-card-banner">
                      <span className="student-card-badge">{course.category}</span>
                      {course.thumbnail ? (
                        <img src={course.thumbnail.startsWith("http") ? course.thumbnail : `${API_URL}${course.thumbnail}`} alt={course.title} />
                      ) : (
                        <BookOpen size={44} color="rgba(255,255,255,0.4)" />
                      )}
                    </div>

                    <div className="student-card-body">
                      <h4 className="student-card-title">{course.title}</h4>
                      <p className="student-card-instructor">Prof. Admin Faculty • {course.difficulty}</p>
                      
                      {enrollment ? (
                        <div style={{ marginTop: "4px" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                            <span style={{ fontSize: "11.5px", fontWeight: "700", color: "#3b82f6" }}>Progress</span>
                            <span style={{ fontSize: "11.5px", fontWeight: "700", color: "#0f172a" }}>{progress}%</span>
                          </div>
                          <div className="student-progress-bar-wrap">
                            <div className="student-progress-bar-fill" style={{ width: `${progress}%` }} />
                          </div>
                        </div>
                      ) : (
                        <p style={{ fontSize: "12.5px", color: "#64748b", margin: 0, lineHeight: "1.4", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                          {course.description || "Interactive course with AI tutor support."}
                        </p>
                      )}

                      <div className="student-card-footer">
                        <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b" }}>{course.language}</span>
                        {enrollment ? (
                          <Link href={`/student/course/${course.id}`} className="student-btn-continue" style={{ background: progress >= 100 ? "#10b981" : "#2563eb" }}>
                            {progress >= 100 ? "Review Classroom" : "Resume Learning →"}
                          </Link>
                        ) : (
                          <button
                            type="button"
                            className="student-btn-continue"
                            onClick={() => handleEnroll(course.id)}
                          >
                            <PlusCircle size={14} style={{ marginRight: "6px" }} /> Enroll Now
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
