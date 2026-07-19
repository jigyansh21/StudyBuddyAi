"use client";

import { useEffect, useState } from "react";
import { Users, Search, Mail, BookOpen, TrendingUp, Award, Activity } from "lucide-react";

// Layout
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

// CSS
import "@/styles/dashboard.css";
import "@/styles/students.css";

const API_URL = "http://localhost:8000";

type EnrolledCourse = {
  course_id: number;
  title: string;
  progress_percent: number;
};

type Student = {
  student_id: number;
  name: string;
  email: string;
  created_at: string;
  enrolled_count: number;
  enrolled_courses: EnrolledCourse[];
  avg_progress: number;
};

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, #667eea, #764ba2)",
  "linear-gradient(135deg, #f093fb, #f5576c)",
  "linear-gradient(135deg, #4facfe, #00f2fe)",
  "linear-gradient(135deg, #43e97b, #38f9d7)",
  "linear-gradient(135deg, #fa709a, #fee140)",
  "linear-gradient(135deg, #a18cd1, #fbc2eb)",
];

export default function StudentManagement() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API_URL}/admin-api/students`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
      }
    } catch (err) {
      console.error("Failed to load students", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalStudents = students.length;
  const avgProgressAll =
    students.length > 0
      ? Math.round(students.reduce((a, s) => a + s.avg_progress, 0) / students.length)
      : 0;
  const totalEnrollments = students.reduce((a, s) => a + s.enrolled_count, 0);
  const activeStudents = students.filter((s) => s.enrolled_count > 0).length;

  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="admin-main">
        <Header />
        <main className="dashboard-content students-page">

          {/* Page Header */}
          <div className="students-page-header">
            <div className="students-header-left">
              <span className="students-eyebrow">
                <Users size={10} /> Admin Portal
              </span>
              <h1 className="students-main-title">Student Management</h1>
              <p className="students-description">
                Monitor enrolments, progress, and learner activity across all courses.
              </p>
            </div>
          </div>

          {/* KPI Strip */}
          <div className="students-kpi-strip">
            <div className="students-kpi-item">
              <div className="students-kpi-icon students-kpi-blue">
                <Users size={18} />
              </div>
              <div className="students-kpi-text">
                <span className="students-kpi-number">{totalStudents}</span>
                <span className="students-kpi-label">Total Students</span>
              </div>
            </div>
            <div className="students-kpi-divider" />
            <div className="students-kpi-item">
              <div className="students-kpi-icon students-kpi-emerald">
                <Activity size={18} />
              </div>
              <div className="students-kpi-text">
                <span className="students-kpi-number">{activeStudents}</span>
                <span className="students-kpi-label">Active Learners</span>
              </div>
            </div>
            <div className="students-kpi-divider" />
            <div className="students-kpi-item">
              <div className="students-kpi-icon students-kpi-purple">
                <BookOpen size={18} />
              </div>
              <div className="students-kpi-text">
                <span className="students-kpi-number">{totalEnrollments}</span>
                <span className="students-kpi-label">Total Enrolments</span>
              </div>
            </div>
            <div className="students-kpi-divider" />
            <div className="students-kpi-item">
              <div className="students-kpi-icon students-kpi-amber">
                <TrendingUp size={18} />
              </div>
              <div className="students-kpi-text">
                <span className="students-kpi-number">{avgProgressAll}%</span>
                <span className="students-kpi-label">Avg. Progress</span>
              </div>
            </div>
          </div>

          {/* Search Toolbar */}
          <div className="students-toolbar">
            <div className="students-search-wrapper">
              <Search size={16} className="students-search-icon" />
              <input
                type="text"
                placeholder="Search by name or email…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="students-search-input"
              />
            </div>
            {!loading && (
              <span className="students-count-badge">
                {filteredStudents.length} student{filteredStudents.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Content */}
          {loading ? (
            <div className="students-loading">
              <p>Loading student data…</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="students-empty">
              <span className="students-empty-icon">👥</span>
              <h3>No Students Found</h3>
              <p>No students match your search query.</p>
            </div>
          ) : (
            <div className="students-table-wrap">
              <table className="students-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Enrolled Courses</th>
                    <th>Avg. Progress</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student, idx) => {
                    const grad = AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length];
                    const prog = Math.min(100, Math.max(0, student.avg_progress));
                    const isActive = student.enrolled_count > 0;

                    return (
                      <tr key={student.student_id} className="students-table-row">
                        {/* Student Info */}
                        <td className="student-info-cell">
                          <div className="student-avatar" style={{ background: grad }}>
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="student-info-text">
                            <span className="student-name">{student.name}</span>
                            <span className="student-email">
                              <Mail size={11} />
                              {student.email}
                            </span>
                          </div>
                        </td>

                        {/* Enrolled Courses */}
                        <td className="student-courses-cell">
                          {student.enrolled_courses.length > 0 ? (
                            <div className="student-course-badges">
                              {student.enrolled_courses.slice(0, 3).map((c) => (
                                <span key={c.course_id} className="student-course-badge">
                                  <BookOpen size={10} />
                                  {c.title}
                                  <span className="student-course-progress">{c.progress_percent}%</span>
                                </span>
                              ))}
                              {student.enrolled_courses.length > 3 && (
                                <span className="student-course-more">
                                  +{student.enrolled_courses.length - 3} more
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="student-no-courses">Not enrolled</span>
                          )}
                        </td>

                        {/* Progress */}
                        <td className="student-progress-cell">
                          <div className="student-progress-wrap">
                            <div className="student-progress-header">
                              <span className="student-progress-text">Completion</span>
                              <span className="student-progress-pct">{prog}%</span>
                            </div>
                            <div className="student-progress-track">
                              <div
                                className="student-progress-fill"
                                style={{ width: `${prog}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="student-status-cell">
                          <span className={`student-status-pill ${isActive ? "status-active" : "status-inactive"}`}>
                            <span className="status-dot" />
                            {isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
