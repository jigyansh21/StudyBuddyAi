"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  BookOpen,
  CheckCircle2,
  PlayCircle,
  FileText,
  Bot,
  Send,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Award,
  Clock,
  UserCheck,
  ArrowLeft,
  ExternalLink
} from "lucide-react";
import StudentSidebar from "@/components/StudentSidebar";
import StudentHeader from "@/components/StudentHeader";

const API_URL = "http://localhost:8000";

type Chapter = {
  id: number;
  title: string;
  description: string;
  video_url: string;
  pdf_url: string;
  chapter_order: number;
};

type Resource = {
  id: number;
  chapter_id: number;
  title: string;
  resource_type: string;
  file_url: string;
  description: string;
};

type Course = {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  language: string;
  thumbnail?: string;
  learning_outcomes?: string;
};

type ChatMessage = {
  sender: "user" | "bot";
  text: string;
  sources?: { title: string; chunk_snippet: string }[];
};

export default function StudentCourseInsidePage() {
  const params = useParams();
  const courseId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [course, setCourse] = useState<Course | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("curriculum"); // overview | curriculum | materials | ai_tutor

  // Study player selection
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [viewMode, setViewMode] = useState<"video" | "pdf">("video");
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string>("");

  // Progress tracking
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [completedChapterIds, setCompletedChapterIds] = useState<number[]>([]);

  // AI Tutor state
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      sender: "bot",
      text: "Hello! I am your 24/7 AI Tutor trained specifically on the notes & PDFs uploaded for this course. Ask me any doubt about these lessons!"
    }
  ]);
  const [chatInput, setChatInput] = useState<string>("");
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (courseId) {
      fetchCourseDetails();
    }
  }, [courseId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, aiLoading]);

  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");

      // 1. Fetch Course
      const cRes = await fetch(`${API_URL}/courses/${courseId}`);
      if (cRes.ok) {
        const cData = await cRes.json();
        setCourse(cData);
      }

      // 2. Fetch Chapters
      const chRes = await fetch(`${API_URL}/chapters/course/${courseId}`);
      if (chRes.ok) {
        const chData: Chapter[] = await chRes.json();
        const sorted = chData.sort((a, b) => a.chapter_order - b.chapter_order);
        setChapters(sorted);
        if (sorted.length > 0) {
          setSelectedChapter(sorted[0]);
          if (sorted[0].video_url) setViewMode("video");
        }

        // 3. Fetch Resources for all chapters
        const allRes: Resource[] = [];
        for (const ch of sorted) {
          const rRes = await fetch(`${API_URL}/resources/chapter/${ch.id}`);
          if (rRes.ok) {
            const rData = await rRes.json();
            allRes.push(...rData);
          }
        }
        setResources(allRes);
      }

      // 4. Check & Fetch Enrollment progress
      if (token) {
        const enrRes = await fetch(`${API_URL}/enrollments/check/${courseId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (enrRes.ok) {
          const enrData = await enrRes.json();
          if (enrData.enrolled) {
            setProgressPercent(enrData.progress_percent || 0);
          } else {
            // Auto enroll if student entered directly
            await fetch(`${API_URL}/enrollments/${courseId}`, {
              method: "POST",
              headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
            });
          }
        }
      }
    } catch (err) {
      console.error("Course inside error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async (ch: Chapter) => {
    if (completedChapterIds.includes(ch.id)) return;
    const newCompleted = [...completedChapterIds, ch.id];
    setCompletedChapterIds(newCompleted);

    const newProgress = Math.min(100, Math.round((newCompleted.length / (chapters.length || 1)) * 100));
    setProgressPercent(newProgress);

    const token = localStorage.getItem("access_token");
    if (token) {
      await fetch(`${API_URL}/enrollments/progress/${courseId}?progress=${newProgress}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
    }
  };

  const handleSendQuery = async (queryText?: string) => {
    const questionToSend = queryText || chatInput;
    if (!questionToSend || !questionToSend.trim()) return;

    // Add user message
    const userMsg: ChatMessage = { sender: "user", text: questionToSend };
    setChatHistory((prev) => [...prev, userMsg]);
    if (!queryText) setChatInput("");
    setAiLoading(true);

    try {
      const response = await fetch(`${API_URL}/chat/course/${courseId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: questionToSend,
          top_k: 4
        })
      });

      if (response.ok) {
        const data = await response.json();
        const botMsg: ChatMessage = {
          sender: "bot",
          text: data.answer || "I could not generate an answer at the moment.",
          sources: data.sources
        };
        setChatHistory((prev) => [...prev, botMsg]);
      } else {
        const errData = await response.json();
        setChatHistory((prev) => [
          ...prev,
          { sender: "bot", text: `AI Tutor Notice: ${errData.detail || "Error connecting to AI service."}` }
        ]);
      }
    } catch (err) {
      console.error(err);
      setChatHistory((prev) => [
        ...prev,
        { sender: "bot", text: "Error connecting to local RAG AI server. Please verify Ollama is running." }
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  const formatEmbedVideo = (url: string) => {
    if (!url) return null;
    if (url.includes("youtube.com/watch?v=")) {
      const vidId = url.split("v=")[1]?.split("&")[0];
      return `https://www.youtube.com/embed/${vidId}`;
    }
    if (url.includes("youtu.be/")) {
      const vidId = url.split("youtu.be/")[1]?.split("?")[0];
      return `https://www.youtube.com/embed/${vidId}`;
    }
    return url;
  };

  if (loading || !course) {
    return (
      <div className="student-layout">
        <StudentSidebar />
        <div className="student-main">
          <StudentHeader />
          <main className="student-content"><p className="text-muted">Loading Classroom & AI Tutor...</p></main>
        </div>
      </div>
    );
  }

  return (
    <div className="student-layout">
      <StudentSidebar />
      <div className="student-main">
        <StudentHeader />
        <main className="student-content" style={{ padding: "24px 32px" }}>
          
          {/* Top Breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#64748b", marginBottom: "4px" }}>
            <Link href="/student/courses" style={{ color: "#2563eb", textDecoration: "none", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}>
              <ArrowLeft size={14} /> My Courses
            </Link>
            <span>/</span>
            <span style={{ color: "#0f172a", fontWeight: "700" }}>{course.title}</span>
          </div>

          {/* Hero Banner matching Screen 3 */}
          <div className="course-inside-hero">
            <div className="course-hero-meta">
              <h1>{course.title}</h1>
              <p style={{ fontSize: "14px", color: "#cbd5e1", margin: 0 }}>Prof. Admin Faculty • Department of Computer Science</p>
              
              <div className="course-hero-tags">
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Award size={16} color="#818cf8" /> {course.difficulty} Level
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <BookOpen size={16} color="#818cf8" /> {chapters.length} {chapters.length === 1 ? "Lesson" : "Lessons"}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <UserCheck size={16} color="#34d399" /> Certificate Available
                </span>
              </div>

              {/* Progress bar inside hero */}
              <div style={{ width: "320px", marginTop: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                  <span style={{ color: "#cbd5e1" }}>Course Completion</span>
                  <span style={{ fontWeight: "700", color: "#818cf8" }}>{progressPercent}% Complete</span>
                </div>
                <div style={{ height: "6px", background: "rgba(255,255,255,0.15)", borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${progressPercent}%`, background: "#818cf8", transition: "width 0.3s" }} />
                </div>
              </div>
            </div>

            <div className="course-hero-actions">
              <button
                type="button"
                className="btn-resume-glow"
                onClick={() => {
                  setActiveTab("curriculum");
                  if (chapters.length > 0 && chapters[0].video_url) setViewMode("video");
                }}
              >
                <PlayCircle size={18} style={{ verticalAlign: "middle", marginRight: "6px" }} /> Resume Learning
              </button>
              <button
                type="button"
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "white", padding: "10px", borderRadius: "12px", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}
                onClick={() => setActiveTab("materials")}
              >
                <FileText size={16} style={{ verticalAlign: "middle", marginRight: "6px" }} /> View Notes &amp; PDFs
              </button>
            </div>
          </div>

          {/* Tabs row matching Screen 3 */}
          <div style={{ display: "flex", gap: "10px", borderBottom: "2px solid #e2e8f0", paddingBottom: "12px", marginTop: "12px", overflowX: "auto" }}>
            <button
              type="button"
              className={`student-tab-btn ${activeTab === "overview" ? "active" : ""}`}
              onClick={() => setActiveTab("overview")}
            >
              Overview
            </button>
            <button
              type="button"
              className={`student-tab-btn ${activeTab === "curriculum" ? "active" : ""}`}
              onClick={() => setActiveTab("curriculum")}
            >
              Curriculum ({chapters.length})
            </button>
            <button
              type="button"
              className={`student-tab-btn ${activeTab === "materials" ? "active" : ""}`}
              onClick={() => setActiveTab("materials")}
            >
              Materials &amp; PDFs ({resources.length})
            </button>
            <button
              type="button"
              className={`student-tab-btn ${activeTab === "ai_tutor" ? "active" : ""}`}
              onClick={() => setActiveTab("ai_tutor")}
              style={{ background: activeTab === "ai_tutor" ? "#6366f1" : "white", color: activeTab === "ai_tutor" ? "white" : "#6366f1", borderColor: "#6366f1", fontWeight: "800", display: "flex", alignItems: "center", gap: "6px" }}
            >
              <Bot size={16} /> AI Tutor Chat
            </button>
          </div>

          {/* Main Content Area */}
          {activeTab === "overview" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "28px", marginTop: "16px" }}>
              <div style={{ background: "white", padding: "24px", borderRadius: "18px", border: "1px solid #e2e8f0" }}>
                <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", marginBottom: "12px" }}>About This Course</h3>
                <p style={{ fontSize: "14px", color: "#475569", lineHeight: "1.6" }}>
                  {course.description || "Comprehensive course curriculum designed to master core concepts with theoretical depth and real-world problem solving."}
                </p>

                <h4 style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a", marginTop: "24px", marginBottom: "12px" }}>What You&apos;ll Learn</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  {(course.learning_outcomes || "Core problem-solving techniques\nTime and space complexity optimization\nLinear and non-linear data structures\nAdvanced algorithmic thinking")
                    .split("\n")
                    .map((item, idx) => (
                      <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13.5px", color: "#334155" }}>
                        <CheckCircle2 size={16} color="#6366f1" style={{ flexShrink: 0 }} />
                        <span>{item}</span>
                      </div>
                    ))}
                </div>
              </div>

              <div style={{ background: "white", padding: "24px", borderRadius: "18px", border: "1px solid #e2e8f0", height: "fit-content" }}>
                <h4 style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a", marginBottom: "16px" }}>Instructor</h4>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                  <div className="student-profile-avatar" style={{ width: "44px", height: "44px", fontSize: "16px", background: "#4f46e5" }}>AF</div>
                  <div>
                    <h5 style={{ fontSize: "14.5px", fontWeight: "700", margin: 0, color: "#0f172a" }}>Prof. Admin Faculty</h5>
                    <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>Senior Course Coordinator</p>
                  </div>
                </div>
                <p style={{ fontSize: "12.5px", color: "#475569", lineHeight: "1.5", margin: 0 }}>
                  Expert educator specializing in curriculum development, interactive video teaching, and AI-augmented study facilitation.
                </p>
              </div>
            </div>
          )}

          {activeTab === "materials" && (
            <div style={{ background: "white", padding: "24px", borderRadius: "18px", border: "1px solid #e2e8f0", marginTop: "16px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", marginBottom: "6px" }}>Course Resources &amp; Lecture Notes</h3>
              <p style={{ fontSize: "13.5px", color: "#64748b", marginBottom: "20px" }}>
                These PDFs are also indexed into our local RAG vector store for instant AI Tutor Q&amp;A.
              </p>

              {resources.length === 0 ? (
                <div style={{ padding: "32px", textAlign: "center", background: "#f8fafc", borderRadius: "14px" }}>
                  <FileText size={36} color="#94a3b8" style={{ margin: "0 auto 8px" }} />
                  <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>No extra PDF materials attached to this course yet.</p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
                  {resources.map((res) => (
                    <div key={res.id} style={{ border: "1px solid #e2e8f0", borderRadius: "14px", padding: "16px", display: "flex", alignItems: "center", justifyItems: "space-between", gap: "14px", background: "#f8fafc" }}>
                      <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "#fee2e2", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <FileText size={20} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h5 style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{res.title}</h5>
                        <span style={{ fontSize: "11px", fontWeight: "600", color: "#64748b", background: "white", padding: "2px 8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}>{res.resource_type}</span>
                      </div>
                      <div>
                        <button
                          type="button"
                          className="btn-primary"
                          style={{ padding: "6px 12px", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}
                          onClick={() => {
                            setSelectedPdfUrl(`${API_URL}${res.file_url}`);
                            setViewMode("pdf");
                            setActiveTab("curriculum");
                          }}
                        >
                          View <ExternalLink size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CURRICULUM + AI TUTOR SPLIT ROOM */}
          {(activeTab === "curriculum" || activeTab === "ai_tutor") && (
            <div className="course-study-split" style={{ marginTop: "16px" }}>
              
              {/* Left Column: Curriculum Accordion */}
              <div className="curriculum-box">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <h4 style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a", margin: 0 }}>Course Curriculum</h4>
                  <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>{chapters.length} Lessons</span>
                </div>

                {chapters.length === 0 ? (
                  <p className="text-muted" style={{ fontSize: "13px" }}>No chapters uploaded yet.</p>
                ) : (
                  chapters.map((ch) => {
                    const isCompleted = completedChapterIds.includes(ch.id);
                    const isSelected = selectedChapter?.id === ch.id;
                    const chResources = resources.filter(r => r.chapter_id === ch.id);

                    return (
                      <div key={ch.id} className="curriculum-chapter-item">
                        <div
                          className="curriculum-chapter-header"
                          style={{ background: isSelected ? "#eff6ff" : "#f8fafc", color: isSelected ? "#2563eb" : "#0f172a" }}
                          onClick={() => {
                            setSelectedChapter(ch);
                            if (ch.video_url) setViewMode("video");
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontWeight: "800" }}>{ch.chapter_order}.</span>
                            <span>{ch.title}</span>
                          </div>
                          <div>
                            {isCompleted ? (
                              <CheckCircle2 size={16} color="#10b981" />
                            ) : (
                              <span style={{ fontSize: "11px", color: "#94a3b8" }}>Lesson •</span>
                            )}
                          </div>
                        </div>

                        <div className="curriculum-chapter-body">
                          {ch.video_url && (
                            <div
                              className={`curriculum-lesson-link ${isSelected && viewMode === "video" ? "active" : ""}`}
                              onClick={() => {
                                setSelectedChapter(ch);
                                setViewMode("video");
                              }}
                            >
                              <PlayCircle size={15} />
                              <span>Lecture Video</span>
                            </div>
                          )}

                          {chResources.map((res) => (
                            <div
                              key={res.id}
                              className={`curriculum-lesson-link ${selectedPdfUrl === `${API_URL}${res.file_url}` && viewMode === "pdf" ? "active" : ""}`}
                              onClick={() => {
                                setSelectedChapter(ch);
                                setSelectedPdfUrl(`${API_URL}${res.file_url}`);
                                setViewMode("pdf");
                              }}
                            >
                              <FileText size={15} />
                              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{res.title} (.pdf)</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Center Column: Video / PDF Player Stage */}
              <div className="study-center-stage">
                <div className="study-player-container">
                  {viewMode === "video" && selectedChapter?.video_url ? (
                    <iframe
                      src={formatEmbedVideo(selectedChapter.video_url) || selectedChapter.video_url}
                      title={selectedChapter.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : viewMode === "pdf" && selectedPdfUrl ? (
                    <iframe
                      src={selectedPdfUrl}
                      title="PDF Document Viewer"
                    />
                  ) : (
                    <div style={{ color: "white", textAlign: "center", padding: "40px" }}>
                      <PlayCircle size={48} style={{ opacity: 0.4, margin: "0 auto 12px" }} />
                      <p style={{ fontSize: "14px", margin: 0 }}>Select a lecture video or PDF note from the curriculum sidebar to begin watching.</p>
                    </div>
                  )}
                </div>

                <div className="study-info-footer">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                    <div>
                      <span style={{ fontSize: "12px", fontWeight: "700", color: "#6366f1", textTransform: "uppercase" }}>
                        {viewMode === "video" ? "Video Lecture" : "Study Document"}
                      </span>
                      <h3 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", margin: "4px 0 0" }}>
                        {selectedChapter ? `Chapter ${selectedChapter.chapter_order}: ${selectedChapter.title}` : "Select Lesson"}
                      </h3>
                    </div>

                    {selectedChapter && (
                      <button
                        type="button"
                        className="btn-primary"
                        style={{
                          background: completedChapterIds.includes(selectedChapter.id) ? "#10b981" : "#2563eb",
                          padding: "10px 18px",
                          borderRadius: "12px",
                          fontWeight: "700",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px"
                        }}
                        onClick={() => selectedChapter && handleMarkComplete(selectedChapter)}
                      >
                        <CheckCircle2 size={16} />
                        {completedChapterIds.includes(selectedChapter.id) ? "Completed ✓" : "Mark as Completed"}
                      </button>
                    )}
                  </div>

                  <p style={{ fontSize: "13.5px", color: "#475569", lineHeight: "1.6", margin: "8px 0 0" }}>
                    {selectedChapter?.description || "Watch the video explanation above and review the attached PDF notes. If you have any doubts about this specific topic, ask your AI Tutor right in the chat panel!"}
                  </p>
                </div>
              </div>

              {/* Right Column: RAG AI Tutor Chatbot Panel */}
              <div className="ai-tutor-panel">
                <div className="ai-tutor-header">
                  <div className="ai-tutor-title-row">
                    <div className="ai-tutor-bot-icon">
                      <Bot size={18} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: "14.5px", fontWeight: "800", margin: 0 }}>StudyBuddy AI Tutor</h4>
                      <span style={{ fontSize: "11px", color: "#c7d2fe" }}>Scoped strictly to {course.title}</span>
                    </div>
                  </div>
                  <div className="ai-tutor-status">
                    <span className="status-green-dot" />
                    <span>Online (`llama3.2:3b`)</span>
                  </div>
                </div>

                {/* Prompt Chips */}
                <div className="ai-prompt-chips">
                  <button type="button" className="prompt-chip" onClick={() => handleSendQuery(`Summarize Chapter ${selectedChapter?.chapter_order || 1} in 4 bullet points`)}>
                    💡 Summarize this chapter
                  </button>
                  <button type="button" className="prompt-chip" onClick={() => handleSendQuery("Give me 3 practice quiz questions based on the uploaded notes")}>
                    📝 Quiz me
                  </button>
                  <button type="button" className="prompt-chip" onClick={() => handleSendQuery("Explain the most important definitions from the course PDFs")}>
                    🔍 Key definitions
                  </button>
                </div>

                {/* Chat Messages */}
                <div className="ai-chat-messages">
                  {chatHistory.map((msg, idx) => (
                    <div key={idx} className={`chat-bubble ${msg.sender === "bot" ? "chat-bubble-bot" : "chat-bubble-user"}`}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px", fontSize: "11px", fontWeight: "700", opacity: 0.8 }}>
                        {msg.sender === "bot" ? <Bot size={13} /> : null}
                        <span>{msg.sender === "bot" ? "StudyBuddy AI" : "You"}</span>
                      </div>
                      <div>{msg.text}</div>
                      
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="chat-source-citation">
                          <strong>📚 Source Citation:</strong>
                          <div style={{ marginTop: "2px" }}>
                            {msg.sources.map((src, sIdx) => (
                              <div key={sIdx} style={{ fontSize: "10.5px" }}>
                                • {src.title}: &quot;{src.chunk_snippet.substring(0, 110)}...&quot;
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {aiLoading && (
                    <div className="chat-bubble chat-bubble-bot" style={{ fontStyle: "italic", color: "#64748b" }}>
                      🤖 AI Tutor is reading your course notes and thinking...
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Chat Input Bar */}
                <div className="ai-chat-input-bar">
                  <input
                    type="text"
                    className="ai-chat-input"
                    placeholder={`Ask a doubt about ${course.title}...`}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !aiLoading && handleSendQuery()}
                    disabled={aiLoading}
                  />
                  <button
                    type="button"
                    className="ai-send-btn"
                    onClick={() => handleSendQuery()}
                    disabled={aiLoading || !chatInput.trim()}
                    title="Send to AI Tutor"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>

            </div>
          )}

        </main>
      </div>
    </div>
  );
}
