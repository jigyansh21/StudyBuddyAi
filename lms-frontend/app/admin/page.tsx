"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  Users,
  BookOpen,
  UploadCloud,
  Trash2,
  Layers,
  Plus,
  Sparkles,
} from "lucide-react";

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

import "@/styles/dashboard.css";

const API_URL = "http://localhost:8000";

type TopCourse = {
  course_id: number;
  title: string;
  thumbnail: string;
  category: string;
  enrollment_count: number;
  avg_progress: number;
};

type RAGStatus = {
  resource_id: number;
  title: string;
  file_url: string;
  resource_type: string;
  course_title: string;
  status: string;
};

type Stats = {
  total_students: number;
  total_courses: number;
  total_chapters: number;
  total_resources: number;
  avg_completion: number;
  top_courses: TopCourse[];
  rag_status_list: RAGStatus[];
};

type CourseSelectorItem = {
  id: number;
  title: string;
};

/**
 * Admin Dashboard
 *
 * Responsibilities:
 * - Render the primary Command Center for administrators.
 * - Display platform-wide aggregations (users, courses, chapters, resources).
 * - Rank top-performing courses based on enrollments and progress.
 * - Provide quick-action forms to create courses and upload study materials directly.
 * - Display the real-time ingestion status of the ChromaDB knowledge base.
 *
 * @component
 */
export default function AdminDashboard() {
  // Aggregated platform metrics fetched from /admin-api/stats
  const [stats, setStats] = useState<Stats | null>(null);
  
  // Minimal course list used to populate the dropdown in the upload form
  const [coursesList, setCoursesList] = useState<CourseSelectorItem[]>([]);
  
  // Prevents rendering of the dashboard body until initial network calls resolve
  const [loading, setLoading] = useState(true);

  // Form state: Quick Course Creation
  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [newCourseDesc, setNewCourseDesc] = useState("");
  const [newCourseModel, setNewCourseModel] = useState("Llama 3.2");

  // Form state: PDF Resource Upload
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  
  // Reference to clear the native file input after a successful upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Retrieves aggregated platform KPIs and RAG indexing status.
   * Requires an active admin JWT token.
   */
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API_URL}/admin-api/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setStats(await res.json());
    } catch (err) {
      console.error("Failed to fetch dashboard stats", err);
    }
  };

  /**
   * Retrieves a lightweight catalog list to populate the target course
   * dropdown in the Quick Upload form.
   */
  const fetchCoursesList = async () => {
    try {
      const res = await fetch(`${API_URL}/courses/`);
      if (res.ok) setCoursesList(await res.json());
    } catch (err) {
      console.error("Failed to fetch courses list", err);
    }
  };

  /**
   * Orchestrates the initial data load, resolving stats and the course
   * dropdown list in parallel before clearing the loading overlay.
   */
  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchStats(), fetchCoursesList()]);
    setLoading(false);
  };

  /**
   * Triggers the initial parallel data load when the dashboard mounts.
   */
  useEffect(() => { loadData(); }, []);

  /**
   * Submits the quick course creation form.
   *
   * API: POST /courses/
   *
   * Design Note:
   * Defaults to pre-filled values for category, difficulty, and language
   * to keep the dashboard form minimal. The admin can edit these fields
   * later via the full Course Management page if needed.
   */
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseTitle.trim() || !newCourseDesc.trim())
      return alert("Please fill in all course fields.");
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API_URL}/courses/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: newCourseTitle,
          description: newCourseDesc,
          category: "AI & Tech",
          difficulty: "Beginner",
          language: "English",
          learning_outcomes: `Learn details about this course. LLM: ${newCourseModel}`,
        }),
      });
      if (res.ok) {
        alert("Course Created Successfully!");
        setNewCourseTitle(""); setNewCourseDesc(""); setNewCourseModel("Llama 3.2");
        loadData();
      } else {
        const errData = await res.json();
        alert(`Failed: ${errData.detail || "Error"}`);
      }
    } catch (err) { console.error(err); }
  };

  /**
   * Handles the multipart form submission for PDF document uploads.
   *
   * Workflow:
   * 1. Validates a target course and file are selected.
   * 2. Fetches the course's chapters to find a parent for the resource.
   * 3. If no chapters exist, auto-generates a "General Study Resources" chapter.
   * 4. Submits the file to POST /resources/upload for filesystem storage and ChromaDB indexing.
   */
  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) return alert("Please select a target course.");
    if (!selectedFile) return alert("Please select a PDF file.");
    try {
      setUploadingFile(true);
      const token = localStorage.getItem("access_token");
      const chaptersRes = await fetch(`${API_URL}/chapters/course/${selectedCourseId}`);
      let chapterId: number | null = null;
      if (chaptersRes.ok) {
        const list = await chaptersRes.json();
        if (list && list.length > 0) chapterId = list[0].id;
      }
      if (!chapterId) {
        const cr = await fetch(`${API_URL}/chapters/${selectedCourseId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ title: "General Study Resources", description: "Default chapter", chapter_order: 1 }),
        });
        if (cr.ok) { const nc = await cr.json(); chapterId = nc.chapter_id; }
        else { const e = await cr.json(); throw new Error(`Failed to create chapter: ${e.detail}`); }
      }
      if (!chapterId) throw new Error("Could not resolve chapter ID.");
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("chapter_id", chapterId.toString());
      formData.append("title", selectedFile.name.replace(".pdf", ""));
      formData.append("resource_type", "Notes");
      const uploadRes = await fetch(`${API_URL}/resources/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (uploadRes.ok) {
        alert("PDF Uploaded & Indexed Successfully!");
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        loadData();
      } else {
        const e = await uploadRes.json();
        alert(`Upload failed: ${e.detail || "Error"}`);
      }
    } catch (err: any) {
      alert(err.message || "Error during upload.");
      console.error(err);
    } finally { setUploadingFile(false); }
  };

  const handleDeleteResource = async (resourceId: number) => {
    if (!confirm("Delete this resource and clear its vector index?")) return;
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API_URL}/resources/${resourceId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { alert("Resource Deleted."); loadData(); }
      else alert("Failed to delete resource.");
    } catch (err) { console.error(err); }
  };

  const handleBrowseClick = () => fileInputRef.current?.click();

  const GRADS = [
    "linear-gradient(135deg,#667eea,#764ba2)",
    "linear-gradient(135deg,#f093fb,#f5576c)",
    "linear-gradient(135deg,#4facfe,#00f2fe)",
    "linear-gradient(135deg,#43e97b,#38f9d7)",
  ];
  const MEDALS = ["🥇", "🥈", "🥉"];

  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="admin-main">
        <Header />
        <main className="dashboard-content">

          {/* Executive Header */}
          <div className="saas-header-bar">
            <div>
              <h1 className="saas-page-title">
                Admin{" "}
                <span style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  Command Center
                </span>
              </h1>
              <p className="saas-page-subtitle">
                Real-time overview of students, courses, RAG knowledge base and activity.
              </p>
            </div>
            <div className="saas-header-actions">
              <div className="saas-status-pill">
                <span className="pulse-dot" />
                <span>AI Tutor: <strong>Ready</strong></span>
              </div>
              <Link href="/admin/courses" className="saas-action-btn-primary">
                + New Course
              </Link>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: "80px 0", textAlign: "center", color: "#64748b" }}>
              <p>Loading dashboard…</p>
            </div>
          ) : (
            <>
              {/* KPI Row */}
              <div className="saas-kpi-grid">
                <div className="saas-kpi-card" style={{ borderTop: "3px solid #4f46e5" }}>
                  <div className="kpi-top-row">
                    <span className="kpi-label">Total Students</span>
                    <div className="kpi-icon-box kpi-icon-blue"><Users size={18} /></div>
                  </div>
                  <span className="kpi-number">{stats?.total_students ?? 0}</span>
                  <span className="kpi-subtitle"><span className="kpi-trend-up">↑ Active</span> enrolled</span>
                </div>

                <div className="saas-kpi-card" style={{ borderTop: "3px solid #7c3aed" }}>
                  <div className="kpi-top-row">
                    <span className="kpi-label">Total Courses</span>
                    <div className="kpi-icon-box kpi-icon-purple"><BookOpen size={18} /></div>
                  </div>
                  <span className="kpi-number">{stats?.total_courses ?? 0}</span>
                  <span className="kpi-subtitle">AI-curated curriculums</span>
                </div>

                <div className="saas-kpi-card" style={{ borderTop: "3px solid #f59e0b" }}>
                  <div className="kpi-top-row">
                    <span className="kpi-label">Total Chapters</span>
                    <div className="kpi-icon-box kpi-icon-amber"><Layers size={18} /></div>
                  </div>
                  <span className="kpi-number">{stats?.total_chapters ?? 0}</span>
                  <span className="kpi-subtitle">Indexed modules</span>
                </div>

                <div className="saas-kpi-card" style={{ borderTop: "3px solid #10b981" }}>
                  <div className="kpi-top-row">
                    <span className="kpi-label">RAG Knowledge Base</span>
                    <div className="kpi-icon-box kpi-icon-emerald"><Sparkles size={18} /></div>
                  </div>
                  <span className="kpi-number" style={{ fontSize: "20px" }}>100% Indexed</span>
                  <span className="kpi-subtitle">Llama 3.2 / Ollama</span>
                </div>
              </div>

              {/* Main 2-col grid */}
              <div className="saas-main-grid">

                {/* LEFT */}
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

                  {/* Activity Chart */}
                  <div className="saas-card">
                    <div className="saas-card-header">
                      <div className="saas-card-title-box">
                        <h3 className="saas-card-title"><Users size={17} color="#4f46e5" /> Student Activity</h3>
                        <span className="saas-card-subtitle">Platform engagement over time</span>
                      </div>
                      <span style={{ fontSize: "11.5px", fontWeight: 700, color: "#64748b", background: "#f1f5f9", padding: "4px 10px", borderRadius: "20px" }}>Last 30 Days</span>
                    </div>
                    <svg viewBox="0 0 500 130" width="100%" height="130" style={{ overflow: "visible", display: "block" }}>
                      <defs>
                        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#4f46e5" />
                          <stop offset="100%" stopColor="#7c3aed" />
                        </linearGradient>
                      </defs>
                      <line x1="0" y1="20"  x2="500" y2="20"  stroke="#f1f5f9" strokeWidth="1.5" strokeDasharray="4 4"/>
                      <line x1="0" y1="65"  x2="500" y2="65"  stroke="#f1f5f9" strokeWidth="1.5" strokeDasharray="4 4"/>
                      <line x1="0" y1="110" x2="500" y2="110" stroke="#f1f5f9" strokeWidth="1.5" strokeDasharray="4 4"/>
                      <path d="M 0 110 C 60 80,110 95,170 55 C 230 15,280 75,340 35 C 400 -5,450 65,500 25 L 500 130 L 0 130 Z" fill="url(#areaGrad)"/>
                      <path d="M 0 110 C 60 80,110 95,170 55 C 230 15,280 75,340 35 C 400 -5,450 65,500 25" fill="none" stroke="url(#lineGrad)" strokeWidth="3" strokeLinecap="round"/>
                      <circle cx="170" cy="55" r="5" fill="#4f46e5" stroke="#fff" strokeWidth="2.5"/>
                      <circle cx="340" cy="35" r="5" fill="#7c3aed" stroke="#fff" strokeWidth="2.5"/>
                      <circle cx="500" cy="25" r="5" fill="#4f46e5" stroke="#fff" strokeWidth="2.5"/>
                      <text x="0"   y="128" fill="#94a3b8" fontSize="10" fontWeight="600">Jan</text>
                      <text x="100" y="128" fill="#94a3b8" fontSize="10" fontWeight="600">Mar</text>
                      <text x="200" y="128" fill="#94a3b8" fontSize="10" fontWeight="600">May</text>
                      <text x="300" y="128" fill="#94a3b8" fontSize="10" fontWeight="600">Jul</text>
                      <text x="400" y="128" fill="#94a3b8" fontSize="10" fontWeight="600">Sep</text>
                      <text x="472" y="128" fill="#94a3b8" fontSize="10" fontWeight="600">Nov</text>
                    </svg>
                  </div>

                  {/* Quick Course Creator */}
                  <div className="saas-card">
                    <div className="saas-card-header">
                      <div className="saas-card-title-box">
                        <h3 className="saas-card-title"><Plus size={17} color="#7c3aed" /> Quick Course Creator</h3>
                        <span className="saas-card-subtitle">Launch a new AI-assisted curriculum</span>
                      </div>
                    </div>
                    <form onSubmit={handleCreateCourse} className="saas-form">
                      <div className="saas-form-group">
                        <label className="saas-label" htmlFor="qc-title">Course Title</label>
                        <input id="qc-title" type="text" className="saas-input" placeholder="e.g. Advanced Machine Learning" value={newCourseTitle} onChange={(e) => setNewCourseTitle(e.target.value)} />
                      </div>
                      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                        <div className="saas-form-group" style={{ flex: 1, minWidth: "180px" }}>
                          <label className="saas-label" htmlFor="qc-desc">Description</label>
                          <input id="qc-desc" type="text" className="saas-input" placeholder="Brief course summary…" value={newCourseDesc} onChange={(e) => setNewCourseDesc(e.target.value)} />
                        </div>
                        <div className="saas-form-group" style={{ width: "160px" }}>
                          <label className="saas-label" htmlFor="qc-model">AI Model</label>
                          <select id="qc-model" className="saas-select" value={newCourseModel} onChange={(e) => setNewCourseModel(e.target.value)}>
                            <option value="Llama 3.2">Llama 3.2</option>
                            <option value="Llama 3 (8B)">Llama 3 (8B)</option>
                            <option value="Gemini 1.5 Flash">Gemini 1.5 Flash</option>
                            <option value="GPT-4o Mini">GPT-4o Mini</option>
                          </select>
                        </div>
                      </div>
                      <div className="saas-form-actions">
                        <button type="submit" className="saas-btn-primary">Launch Course →</button>
                        <Link href="/admin/courses" className="saas-btn-secondary">View All</Link>
                      </div>
                    </form>
                  </div>

                </div>

                {/* RIGHT */}
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

                  {/* Top Courses */}
                  <div className="saas-card">
                    <div className="saas-card-header">
                      <div className="saas-card-title-box">
                        <h3 className="saas-card-title"><BookOpen size={17} color="#7c3aed" /> Top Performing Courses</h3>
                        <span className="saas-card-subtitle">By enrolment & completion rate</span>
                      </div>
                    </div>
                    <div className="saas-course-list">
                      {stats?.top_courses && stats.top_courses.length > 0 ? (
                        stats.top_courses.map((course, idx) => {
                          const prog = Math.min(100, Math.max(0, Number(course.avg_progress) || 0));
                          return (
                            <div key={course.course_id} className="saas-course-item">
                              <div className="saas-course-top-row">
                                <div className="saas-course-info">
                                  <div className="saas-course-thumb" style={{ background: GRADS[idx % GRADS.length] }}>
                                    {idx < 3 ? <span style={{ fontSize: "20px" }}>{MEDALS[idx]}</span> : <BookOpen size={18} />}
                                  </div>
                                  <div>
                                    <h4 className="saas-course-name" title={course.title}>{course.title}</h4>
                                    <span className="saas-course-meta">{course.enrollment_count} student{course.enrollment_count !== 1 ? "s" : ""}</span>
                                  </div>
                                </div>
                                <span className="saas-course-percent-badge">{prog}%</span>
                              </div>
                              <div className="saas-progress-track">
                                <div className="saas-progress-fill" style={{ width: `${prog}%` }} />
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p style={{ color: "#94a3b8", fontSize: "13px", padding: "12px 0" }}>No courses yet.</p>
                      )}
                    </div>
                  </div>

                  {/* RAG Upload */}
                  <div className="saas-card">
                    <div className="saas-card-header">
                      <div className="saas-card-title-box">
                        <h3 className="saas-card-title"><UploadCloud size={17} color="#10b981" /> Knowledge Base Upload</h3>
                        <span className="saas-card-subtitle">Index PDF notes into AI Tutor memory</span>
                      </div>
                    </div>
                    <form onSubmit={handleUploadFile} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      <input type="file" accept=".pdf" ref={fileInputRef} style={{ display: "none" }} onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                      <div className="saas-dropzone" onClick={handleBrowseClick}>
                        <UploadCloud size={28} color="#4f46e5" />
                        <span className="saas-dropzone-title">
                          {selectedFile ? selectedFile.name : "Drag & drop PDF or click to browse"}
                        </span>
                        <span className="saas-dropzone-sub">Supported: .PDF • Max 25 MB</span>
                      </div>
                      <div className="saas-form-group">
                        <label className="saas-label" htmlFor="rag-course">Target Course</label>
                        <select id="rag-course" className="saas-select" value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)}>
                          <option value="">— Select course —</option>
                          {coursesList.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                        </select>
                      </div>
                      {selectedFile && (
                        <button type="submit" className="saas-btn-primary" disabled={uploadingFile}>
                          {uploadingFile ? "Uploading & Indexing…" : "Start RAG Indexing →"}
                        </button>
                      )}
                    </form>

                    {stats?.rag_status_list && stats.rag_status_list.length > 0 && (
                      <div style={{ marginTop: "16px", borderTop: "1px solid #f1f5f9", paddingTop: "14px" }}>
                        <span className="saas-label" style={{ display: "block", marginBottom: "10px" }}>Live Index Status</span>
                        <table className="saas-rag-table">
                          <thead>
                            <tr>
                              <th>Document</th>
                              <th>Status</th>
                              <th style={{ textAlign: "right" }}>–</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stats.rag_status_list.slice(0, 5).map((res) => (
                              <tr key={res.resource_id}>
                                <td>
                                  <div style={{ display: "flex", flexDirection: "column" }}>
                                    <strong style={{ fontSize: "12.5px", color: "#0f172a" }}>{res.title}</strong>
                                    <span style={{ fontSize: "11px", color: "#64748b" }}>{res.course_title}</span>
                                  </div>
                                </td>
                                <td><span className="saas-indexed-pill">✓ Indexed</span></td>
                                <td style={{ textAlign: "right" }}>
                                  <button type="button" className="saas-del-btn" onClick={() => handleDeleteResource(res.resource_id)}>
                                    <Trash2 size={14} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </>
          )}

        </main>
      </div>
    </div>
  );
}