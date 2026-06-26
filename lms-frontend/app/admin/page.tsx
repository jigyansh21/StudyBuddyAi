"use client";

import { useEffect, useState } from "react";

const menuItems = [
  { icon: "⌂", label: "Dashboard" },
  { icon: "♧", label: "Manage Students" },
  { icon: "✎", label: "Update Course" },
  { icon: "▱", label: "Chapter Management" },
  { icon: "▤", label: "PDF Notes Upload" },
  { icon: "▥", label: "View Students Progress" },
  { icon: "◉", label: "Generate Course Quiz" },
  { icon: "⚙", label: "Settings" },
];

type Course = {
  id: number;
  title: string;
  description: string;
  created_at?: string;
};

export default function AdminDashboard() {
  const [activeMenu, setActiveMenu] = useState("Dashboard");

  const [courses, setCourses] = useState<Course[]>([]);
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDescription, setCourseDescription] = useState("");

  const [courseMessage, setCourseMessage] = useState("");
  const [creatingCourse, setCreatingCourse] = useState(false);

  const getCourses = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/courses/");
      const data = await response.json();

      if (response.ok) {
        setCourses(data);
      } else {
        console.log("Could not load courses");
      }
    } catch (error) {
      console.log("Backend connection failed while loading courses");
    }
  };

  useEffect(() => {
    getCourses();
  }, []);

  const handleCreateCourse = async () => {
    if (!courseTitle.trim() || !courseDescription.trim()) {
      setCourseMessage("Please enter both course title and description");
      return;
    }

    const token = localStorage.getItem("access_token");

    if (!token) {
      setCourseMessage("Login token missing. Please login again.");
      return;
    }

    setCreatingCourse(true);
    setCourseMessage("");

    try {
      const response = await fetch("http://127.0.0.1:8000/courses/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: courseTitle,
          description: courseDescription,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setCourseMessage(data.detail || "Course creation failed");
        setCreatingCourse(false);
        return;
      }

      setCourseMessage("Course created successfully");
      setCourseTitle("");
      setCourseDescription("");

      await getCourses();
    } catch (error) {
      setCourseMessage("Backend connection failed");
    }

    setCreatingCourse(false);
  };

  return (
    <main className="admin-dashboard">
      <aside className="admin-sidebar">
        <div className="brand">
          <div className="brand-logo">S</div>
          <span>StudyBuddy AI</span>
        </div>

        <nav className="sidebar-menu">
          {menuItems.map((item) => (
            <button
              key={item.label}
              className={`menu-item ${
                activeMenu === item.label ? "active-menu" : ""
              }`}
              onClick={() => setActiveMenu(item.label)}
            >
              <span className="menu-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <button className="logout-button">
          <span>⇥</span>
          Logout
        </button>
      </aside>

      <section className="admin-content">
        <header className="dashboard-header">
          <p className="small-title">ADMIN PORTAL</p>
          <h1>StudyBuddy AI</h1>
          <h2>Welcome, Admin</h2>
          <p className="header-description">
            Manage courses, students, chapters, and learning content from one
            place.
          </p>
        </header>

        <section className="dashboard-grid second-layout-top">
          <article className="dashboard-card lms-status-card">
            <div className="card-heading">
              <div>
                <h3>Overall LMS Status</h3>
                <p>Quick overview of your learning platform</p>
              </div>
            </div>

            <div className="compact-stats">
              <div className="compact-stat">
                <p>Total Students</p>
                <h2>0</h2>
              </div>

              <div className="compact-stat">
                <p>Total Courses</p>
                <h2>{courses.length}</h2>
              </div>

              <div className="compact-stat">
                <p>Total Chapters</p>
                <h2>0</h2>
              </div>
            </div>

            <div className="activity-heading">
              <div>
                <h3>Student Activity</h3>
                <p>Activity overview for the last 30 days</p>
              </div>
              <span className="tag">Last 30 Days</span>
            </div>

            <div className="chart-area compact-chart">
              <div className="chart-y-axis">
                <span>300</span>
                <span>200</span>
                <span>100</span>
                <span>0</span>
              </div>

              <div className="chart-content">
                <div className="chart-lines">
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>

                <svg
                  className="activity-line"
                  viewBox="0 0 700 220"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0,180 C35,130 70,150 105,115 C140,85 170,155 210,120 C250,85 285,75 320,120 C355,160 390,45 430,70 C470,95 495,140 535,110 C575,75 600,120 640,90 C665,70 680,80 700,50"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                </svg>

                <div className="chart-months">
                  <span>Jan</span>
                  <span>Feb</span>
                  <span>Mar</span>
                  <span>Apr</span>
                  <span>May</span>
                  <span>Jun</span>
                  <span>Jul</span>
                  <span>Aug</span>
                  <span>Sep</span>
                </div>
              </div>
            </div>
          </article>

          <article className="dashboard-card top-courses-empty-card">
            <div className="card-heading">
              <div>
                <h3>Top Performing Courses</h3>
                <p>Based on learner completion</p>
              </div>
            </div>

            <div className="empty-course-state">
              <div className="empty-course-icon">▣</div>

              {courses.length === 0 ? (
                <>
                  <h4>No courses available yet</h4>
                  <p>
                    Create your first course to view student enrollment and
                    course completion performance here.
                  </p>
                </>
              ) : (
                <>
                  <h4>{courses.length} course(s) available</h4>
                  <p>
                    Student enrollment and completion performance will appear
                    here once students start learning.
                  </p>
                </>
              )}
            </div>
          </article>
        </section>

        <section className="dashboard-grid second-layout-bottom">
          <article className="dashboard-card create-course-card">
            <div className="card-heading">
              <div>
                <h3>New Course Creation Quick-Access</h3>
                <p>Create and publish a new course</p>
              </div>
            </div>

            <label>Course Title</label>
            <input
              type="text"
              placeholder="Enter course title"
              value={courseTitle}
              onChange={(e) => setCourseTitle(e.target.value)}
            />

            <label>Course Description</label>
            <textarea
              placeholder="Write a short course description"
              value={courseDescription}
              onChange={(e) => setCourseDescription(e.target.value)}
            ></textarea>

            <div className="course-form-actions">
              <button
                className="primary-button"
                onClick={handleCreateCourse}
                disabled={creatingCourse}
              >
                {creatingCourse ? "Creating..." : "Create Course"}
              </button>

              <button className="secondary-button">View All Courses</button>
            </div>

            {courseMessage && (
              <p className="course-message">{courseMessage}</p>
            )}
          </article>

          <article className="dashboard-card upload-card">
            <div className="card-heading">
              <div>
                <h3>PDF Notes Upload</h3>
                <p>Upload learning material for a course</p>
              </div>
            </div>

            <div className="upload-box">
              <div className="upload-icon">⇧</div>
              <strong>Drag and drop PDF Notes</strong>
              <p>or choose a file from your device</p>
              <button className="browse-button">Browse Files</button>
            </div>

            <label>Target Course</label>
            <select defaultValue="">
              <option value="" disabled>
                Select a course
              </option>

              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>

            <div className="upload-status">
              <span className="status-dot"></span>
              <span>No files uploaded yet</span>
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}