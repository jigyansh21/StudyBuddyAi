"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Clock,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  ArrowRight,
  PlayCircle,
  PlusCircle
} from "lucide-react";
import StudentSidebar from "@/components/StudentSidebar";
import StudentHeader from "@/components/StudentHeader";

const API_URL = "http://localhost:8000";

type EnrolledCourse = {
  enrollment_id: number;
  course_id: number;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  language: string;
  thumbnail: string;
  progress_percent: number;
  chapter_count: number;
};

type Course = {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  language: string;
  thumbnail?: string;
};

/**
 * Student Dashboard
 *
 * Responsibilities:
 * - Render the primary student landing page after login.
 * - Display a high-level overview of enrolled courses and overall progress.
 * - Provide shortcuts to resume learning or start an AI tutoring session.
 * - Display a catalog of available courses that the student hasn't joined yet.
 *
 * @component
 */
export default function StudentDashboardPage() {
  // Authenticated student's display name, retrieved from localStorage or API.
  const [studentName, setStudentName] = useState<string>("Student");
  
  // List of courses the student has joined, enriched with progress metrics.
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  
  // Full catalog of published courses fetched from the backend.
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  
  // Controls the loading state of the dashboard while resolving network requests.
  const [loading, setLoading] = useState<boolean>(true);

  /**
   * Initializes the dashboard by resolving the user's identity from local storage
   * for immediate display, followed by a network sync to retrieve fresh stats.
   * Runs exactly once when the component mounts.
   */
  useEffect(() => {
    const storedName = localStorage.getItem("user_name");
    if (storedName) setStudentName(storedName);

    fetchDashboardData();
  }, []);

  /**
   * Fetches and aggregates all data required to render the student dashboard.
   *
   * API Calls:
   * - GET /auth/me: Syncs the latest student profile to ensure data consistency.
   * - GET /enrollments/my-courses: Retrieves courses the student is actively enrolled in.
   * - GET /courses/: Fetches the complete catalog to display un-enrolled courses.
   *
   * Error Handling:
   * Catch blocks suppress errors to the console, allowing partial data renders
   * rather than failing the entire page. Loading state is cleared unconditionally.
   */
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");

      // 1. Fetch student info if name missing or for sync
      if (token) {
        const meRes = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.name) {
            setStudentName(meData.name);
            localStorage.setItem("user_name", meData.name);
          }
        }

        // 2. Fetch enrolled courses
        const enrRes = await fetch(`${API_URL}/enrollments/my-courses`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (enrRes.ok) {
          const enrData = await enrRes.json();
          setEnrolledCourses(enrData);
        }
      }

      // 3. Fetch all courses from admin
      const coursesRes = await fetch(`${API_URL}/courses/`);
      if (coursesRes.ok) {
        const coursesData = await coursesRes.json();
        setAllCourses(coursesData);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Registers the student for a new course.
   *
   * API:
   * POST /enrollments/:courseId
   *
   * Expected Response:
   * 200 OK — The enrollment was successful, triggering a dashboard data refresh.
   *
   * Error Handling:
   * Alerts the user if the server rejects the enrollment or if the network fails.
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
        alert("Enrolled successfully! You can now start learning.");
        fetchDashboardData();
      } else {
        const err = await res.json();
        alert(err.detail || "Enrollment failed.");
      }
    } catch (error) {
      console.error(error);
      alert("Error enrolling in course.");
    }
  };

  // Calculate overall stats
  const avgProgress = enrolledCourses.length > 0
    ? Math.round(enrolledCourses.reduce((acc, curr) => acc + curr.progress_percent, 0) / enrolledCourses.length)
    : 0;

  const completedCount = enrolledCourses.filter(c => c.progress_percent >= 100).length;

  return (
    <div className="student-layout">
      <StudentSidebar />
      <div className="student-main">
        <StudentHeader />
        <main className="student-content">
          
          {/* Greeting Banner (exact match to reference Screen 1) */}
          <div className="student-greeting-banner">
            <h1>Welcome back, {studentName}! 👋</h1>
            <p>Let&apos;s make today a productive learning day.</p>
          </div>

          {/* 4 Stats Cards */}
          <div className="student-stats-grid">
            <div className="student-stat-card">
              <div className="student-stat-info">
                <span className="student-stat-label">Enrolled Courses</span>
                <span className="student-stat-value">{enrolledCourses.length}</span>
                <span className="student-stat-sub">+1 this week</span>
              </div>
              <div className="student-stat-icon-box stat-icon-blue">
                <BookOpen size={24} />
              </div>
            </div>

            <div className="student-stat-card">
              <div className="student-stat-info">
                <span className="student-stat-label">Learning Hours</span>
                <span className="student-stat-value">{enrolledCourses.length * 5.4 || 12.5}</span>
                <span className="student-stat-sub">+4.2 this week</span>
              </div>
              <div className="student-stat-icon-box stat-icon-purple">
                <Clock size={24} />
              </div>
            </div>

            <div className="student-stat-card">
              <div className="student-stat-info">
                <span className="student-stat-label">Completed Courses</span>
                <span className="student-stat-value">{completedCount}</span>
                <span className="student-stat-sub">Keep going!</span>
              </div>
              <div className="student-stat-icon-box stat-icon-green">
                <CheckCircle2 size={24} />
              </div>
            </div>

            <div className="student-stat-card">
              <div className="student-stat-info">
                <span className="student-stat-label">Overall Progress</span>
                <span className="student-stat-value">{avgProgress}%</span>
                <span className="student-stat-sub">Excellent momentum 🚀</span>
              </div>
              <div className="student-stat-icon-box stat-icon-orange">
                <TrendingUp size={24} />
              </div>
            </div>
          </div>

          {/* Continue Learning + Recent Activity Row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "28px", alignItems: "start" }}>
            
            {/* Left: Continue Learning (Enrolled Courses) */}
            <div>
              <div className="student-section-header">
                <h3 className="student-section-title">Continue Learning</h3>
                <Link href="/student/courses" className="student-view-all">
                  View All Enrolled ({enrolledCourses.length}) →
                </Link>
              </div>

              {loading ? (
                <p className="text-muted">Loading your courses...</p>
              ) : enrolledCourses.length === 0 ? (
                <div style={{ background: "rgba(255,255,255,0.65)", backdropFilter: "blur(20px)", padding: "32px", borderRadius: "18px", border: "1px solid rgba(255,255,255,0.7)", textAlign: "center", boxShadow: "0 4px 24px rgba(99,102,241,0.07), inset 0 1.5px 0 rgba(255,255,255,0.95)" }}>
                  <BookOpen size={40} color="#3b82f6" style={{ margin: "0 auto 12px" }} />
                  <h4 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "6px" }}>No courses enrolled yet</h4>
                  <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "16px" }}>Enroll from the catalog below to start watching video lectures and chatting with the AI Tutor.</p>
                  <Link href="/student/courses" className="student-btn-continue">
                    Explore Available Courses
                  </Link>
                </div>
              ) : (
                <div className="student-horizontal-courses">
                  {enrolledCourses.map((ec) => (
                    <div key={ec.enrollment_id} className="student-h-course-card">
                      <div className="student-h-thumb">
                        {ec.thumbnail ? (
                          <img src={ec.thumbnail.startsWith("http") ? ec.thumbnail : `${API_URL}${ec.thumbnail}`} alt={ec.title} />
                        ) : (
                          <PlayCircle size={36} color="white" />
                        )}
                      </div>
                      <div className="student-h-info">
                        <h4 className="student-h-title" title={ec.title}>{ec.title}</h4>
                        <p className="student-h-sub">
                          {ec.chapter_count} {ec.chapter_count === 1 ? "Lesson" : "Lessons"} • {ec.difficulty}
                        </p>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "4px" }}>
                          <span style={{ fontSize: "11.5px", fontWeight: "700", color: "#3b82f6" }}>{Math.round(ec.progress_percent)}% Complete</span>
                        </div>
                        <div className="student-progress-bar-wrap">
                          <div className="student-progress-bar-fill" style={{ width: `${ec.progress_percent}%` }} />
                        </div>
                      </div>
                      <div>
                        <Link href={`/student/course/${ec.course_id}`} className="student-btn-continue">
                          Continue
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* All Available Courses Section */}
              <div className="student-section-header" style={{ marginTop: "36px" }}>
                <h3 className="student-section-title">Explore Available Courses</h3>
                <Link href="/student/courses" className="student-view-all">
                  Browse Catalog →
                </Link>
              </div>

              <div className="student-courses-grid">
                {allCourses.map((course) => {
                  const isEnrolled = enrolledCourses.some(e => e.course_id === course.id);
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
                        <p className="student-card-instructor">Instructor: Admin Team • {course.difficulty}</p>
                        <p style={{ fontSize: "12.5px", color: "#475569", margin: 0, lineHeight: "1.4", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                          {course.description || "Comprehensive course with video lectures and RAG study notes."}
                        </p>
                        <div className="student-card-footer">
                          <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b" }}>{course.language}</span>
                          {isEnrolled ? (
                            <Link href={`/student/course/${course.id}`} className="student-btn-continue" style={{ background: "#10b981" }}>
                              Enter Classroom →
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
            </div>

            {/* Right: Recent Activity Sidebar matching Screen 1 */}
            <div style={{ background: "linear-gradient(145deg, rgba(255,255,255,0.72) 0%, rgba(240,245,255,0.52) 50%, rgba(230,238,255,0.42) 100%)", backdropFilter: "blur(28px) saturate(200%)", border: "1px solid rgba(255,255,255,0.65)", borderRadius: "20px", padding: "20px", boxShadow: "0 4px 24px rgba(99,102,241,0.07), inset 0 1.5px 0 rgba(255,255,255,0.95)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <h4 style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a", margin: 0 }}>Recent Activity</h4>
                <span style={{ fontSize: "12px", color: "#2563eb", fontWeight: "700", cursor: "pointer" }}>View All</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#ecfdf5", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <p style={{ fontSize: "12.5px", fontWeight: "600", color: "#0f172a", margin: 0, lineHeight: "1.3" }}>
                      Enrolled in <span style={{ color: "#2563eb" }}>Data Structures &amp; Algorithms</span>
                    </p>
                    <span style={{ fontSize: "11px", color: "#94a3b8" }}>2 hours ago</span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#eff6ff", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <p style={{ fontSize: "12.5px", fontWeight: "600", color: "#0f172a", margin: 0, lineHeight: "1.3" }}>
                      AI Tutor answered your query on <span style={{ color: "#2563eb" }}>B-Trees vs AVL Trees</span>
                    </p>
                    <span style={{ fontSize: "11px", color: "#94a3b8" }}>5 hours ago</span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#f5f3ff", color: "#8b5cf6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <BookOpen size={16} />
                  </div>
                  <div>
                    <p style={{ fontSize: "12.5px", fontWeight: "600", color: "#0f172a", margin: 0, lineHeight: "1.3" }}>
                      Downloaded notes from <span style={{ color: "#2563eb" }}>Python Functions</span>
                    </p>
                    <span style={{ fontSize: "11px", color: "#94a3b8" }}>Yesterday</span>
                  </div>
                </div>
              </div>

              {/* Quick AI Tutor Help Box inside dashboard */}
              <div style={{ marginTop: "24px", padding: "16px", borderRadius: "14px", background: "linear-gradient(135deg, #eff6ff, #f0fdf4)", border: "1px solid #bfdbfe" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <Sparkles size={18} color="#2563eb" />
                  <strong style={{ fontSize: "13.5px", color: "#1e3a8a" }}>AI Tutor Ready</strong>
                </div>
                <p style={{ fontSize: "12px", color: "#334155", margin: "0 0 12px", lineHeight: "1.4" }}>
                  Open any course classroom to ask 24/7 doubts about your lecture notes and PDFs.
                </p>
                <Link href="/student/courses" style={{ display: "block", textAlign: "center", padding: "8px", background: "#2563eb", color: "white", borderRadius: "8px", fontSize: "12.5px", fontWeight: "700", textDecoration: "none" }}>
                  Go to Classroom →
                </Link>
              </div>
            </div>

          </div>

        </main>
      </div>
    </div>
  );
}
