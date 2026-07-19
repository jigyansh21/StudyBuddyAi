"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { BookOpen, Pencil, Trash2, ChevronDown, ChevronUp, Plus, FileText, UploadCloud, X, Eye, ArrowLeft, Save, LayoutTemplate, BookCopy } from "lucide-react";

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import GlassCard from "@/components/GlassCard";

import "@/styles/dashboard.css";
import "@/styles/course-details.css";

// ✨ FIX 3: Extracted API URL for easy deployment changes
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

export default function ManageCoursePage() {
  const { id } = useParams();
  
  const courseId = Array.isArray(id) ? id[0] : id;

  const [activeTab, setActiveTab] = useState("basic");
  const [loading, setLoading] = useState(false);

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [chapterLoading, setChapterLoading] = useState(false);
  const [expandedChapter, setExpandedChapter] = useState<number | null>(null);
  const [editingChapter, setEditingChapter] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [resources, setResources] = useState<Resource[]>([]);
  const [resourceLoading, setResourceLoading] = useState(false);
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadMeta, setUploadMeta] = useState({ resource_type: "Notes", chapter_id: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newChapter, setNewChapter] = useState({
    title: "",
    description: "",
    video_url: "",
    pdf_url: "",
    chapter_order: 1,
  });

  const [course, setCourse] = useState({
    title: "",
    description: "",
    category: "",
    difficulty: "",
    language: "",
    thumbnail: "",
    intro_video: "",
    learning_outcomes: "",
  });

  const getCourse = async () => {
    if (!courseId) return;
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/courses/${courseId}`);
      const data = await response.json();
      if (response.ok) setCourse(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateCourse = async () => {
    try {
      setLoading(true); 
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_URL}/courses/${courseId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(course),
      });
      const data = await response.json();
      if (response.ok) {
        alert("Course Updated Successfully");
      } else {
        alert(data.detail);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getChapters = async () => {
    if (!courseId) return;
    try {
      setChapterLoading(true);
      const response = await fetch(`${API_URL}/chapters/course/${courseId}`);
      const data = await response.json();
      if (response.ok) {
        setChapters(data);
        await getAllResources(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setChapterLoading(false);
    }
  };

  const getAllResources = async (currentChapters: Chapter[]) => {
    try {
      setResourceLoading(true);
      const allFetchedResources: Resource[] = [];
      for (const ch of currentChapters) {
        const response = await fetch(`${API_URL}/resources/chapter/${ch.id}`);
        if (response.ok) {
          const resData = await response.json();
          allFetchedResources.push(...resData);
        }
      }
      setResources(allFetchedResources);
    } catch (err) {
      console.error(err);
    } finally {
      setResourceLoading(false);
    }
  };

  const createChapter = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_URL}/chapters/${courseId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newChapter),
      });

      if (response.ok) {
        await getChapters();
        setShowCreateForm(false);
        setNewChapter({ title: "", description: "", video_url: "", pdf_url: "", chapter_order: chapters.length + 1 });
      } else {
        const data = await response.json();
        alert(data.detail);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateChapter = async (chapterId: number) => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_URL}/chapters/${chapterId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newChapter),
      });

      if (response.ok) {
        await getChapters();
        setEditingChapter(null);
        setExpandedChapter(null);
      } else {
        const data = await response.json();
        alert(data.detail);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteChapter = async (chapterId: number) => {
    const ok = confirm("Delete this chapter?");
    if (!ok) return;
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_URL}/chapters/${chapterId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) await getChapters();
    } catch (err) {
      console.error(err);
    }
  };

  const uploadResources = async () => {
    if (!uploadMeta.chapter_id) return alert("Please select a target chapter before uploading.");
    if (selectedFiles.length === 0) return alert("Please select at least one PDF file.");

    try {
      const token = localStorage.getItem("access_token");
      setResourceLoading(true);

      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("chapter_id", uploadMeta.chapter_id);
        formData.append("title", file.name.replace(".pdf", "")); 
        formData.append("description", ""); 
        formData.append("resource_type", uploadMeta.resource_type);

        const response = await fetch(`${API_URL}/resources/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          alert(`Failed to upload ${file.name}: ${data.detail}`);
        }
      }

      alert("Files Uploaded Successfully!");
      setSelectedFiles([]); 
      if (fileInputRef.current) fileInputRef.current.value = "";
      await getChapters(); 
    } catch (err) {
      console.error(err);
    } finally {
      setResourceLoading(false);
    }
  };

  const deleteResource = async (resourceId: number) => {
    const ok = confirm("Delete this PDF from server?");
    if (!ok) return;
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_URL}/resources/${resourceId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) await getChapters();
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const pdfFiles = filesArray.filter(file => file.type === "application/pdf" || file.name.endsWith('.pdf'));
      setSelectedFiles((prev) => {
        const merged = [...prev];
        pdfFiles.forEach((file) => {
          if (!merged.some((f) => f.name === file.name)) merged.push(file);
        });
        return merged;
      });
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (courseId) {
      getCourse();
      getChapters();
    }
  }, [courseId]);

  if (loading && !course.title) {
    return (
      <div className="admin-layout">
        <Sidebar/>
        <div className="admin-main">
          <Header/>
          <main className="dashboard-content"><p className="text-muted">Loading Course Data...</p></main>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <Sidebar/>

      <div className="admin-main">
        <Header/>

        <main className="dashboard-content course-detail-page">
          <div className="course-detail-hero">
            
            <div className="hero-title-container">
              <div className="hero-icon-box">
                <BookOpen size={32} />
              </div>
              <div>
                <div className="course-breadcrumb">
                  <Link className="course-breadcrumb-link" href="/admin/courses">Courses</Link> 
                  <span>/</span> {course.title || "Loading..."}
                </div>
                <h1 className="course-detail-title">{course.title || "Manage Course"}</h1>
                
                <div className="hero-stats">
                  {course.category && (
                    /* ✨ FIX 2: Using the primary CSS class instead of inline styles */
                    <div className="hero-stat-badge primary">
                      {course.category}
                    </div>
                  )}
                  {course.difficulty && (
                    <div className="hero-stat-badge">
                      {course.difficulty}
                    </div>
                  )}
                  {course.language && (
                    <div className="hero-stat-badge">
                      {course.language}
                    </div>
                  )}
                  <div className="hero-stat-badge">
                    <BookCopy className="text-muted" size={14} />
                    {chapters.length} Chapters
                  </div>
                  <div className="hero-stat-badge">
                    <FileText className="text-muted" size={14} />
                    {resources.length} PDFs
                  </div>
                </div>
              </div>
            </div>

            <div className="hero-actions">
              <Link className="btn-secondary" href="/admin/courses">
                <ArrowLeft size={16} /> Back
              </Link>
              <button type="button" className="btn-primary" onClick={updateCourse} disabled={loading}>
                <Save size={16} /> Save Changes
              </button>
            </div>
          </div>

          <GlassCard padding="lg">
            <div className="course-tabs-wrapper">
              <button type="button" className={`tab-btn ${activeTab === "basic" ? "active" : ""}`} onClick={() => setActiveTab("basic")}>
                <LayoutTemplate className="tab-icon" size={16} /> Basic Info
              </button>
              <button type="button" className={`tab-btn ${activeTab === "chapters" ? "active" : ""}`} onClick={() => setActiveTab("chapters")}>
                <BookCopy className="tab-icon" size={16} /> Chapters
              </button>
              <button type="button" className={`tab-btn ${activeTab === "resources" ? "active" : ""}`} onClick={() => setActiveTab("resources")}>
                <FileText className="tab-icon" size={16} /> Resources / PDFs
              </button>
            </div>

            <div className="tab-content-area">

              {/* 1. BASIC INFO */}
              {activeTab === "basic" && (
                <div className="manage-course-form">
                  <div className="form-group">
                    <label className="form-label">Course Title</label>
                    <input type="text" className="glass-input" value={course.title} onChange={(e) => setCourse({ ...course, title: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select className="glass-select" value={course.category} onChange={(e) => setCourse({ ...course, category: e.target.value })}>
                      <option>Programming</option><option>Database</option><option>AI / ML</option><option>Web Development</option>
                    </select>
                  </div>
                  <div className="form-group full-width">
                    <label className="form-label">Course Description</label>
                    <textarea className="glass-textarea" rows={4} value={course.description} onChange={(e) => setCourse({ ...course, description: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Difficulty</label>
                    <select className="glass-select" value={course.difficulty} onChange={(e) => setCourse({ ...course, difficulty: e.target.value })}>
                      <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Language</label>
                    <select className="glass-select" value={course.language} onChange={(e) => setCourse({ ...course, language: e.target.value })}>
                      <option>English</option><option>Hindi</option><option>English + Hindi</option>
                    </select>
                  </div>
                  <div className="form-group full-width">
                    <label className="form-label">Learning Outcomes</label>
                    <textarea className="glass-textarea" rows={3} value={course.learning_outcomes} onChange={(e) => setCourse({ ...course, learning_outcomes: e.target.value })} />
                  </div>
                  <div className="full-width flex-between mt-lg">
                    <div />
                    <button type="button" className="btn-primary" onClick={updateCourse} disabled={loading}>Save Basic Info</button>
                  </div>
                </div>
              )}

              {/* 2. CHAPTERS */}
              {activeTab === "chapters" && (
                <div>
                  <div className="flex-between mb-lg">
                    <div>
                      <h3 className="glass-title">Course Curriculum</h3>
                      <p className="glass-subtitle">Add, organize and manage chapters for this course.</p>
                    </div>
                    <button type="button" className="btn-primary" onClick={() => { setShowCreateForm(true); setEditingChapter(null); setExpandedChapter(null); setNewChapter({ title: "", description: "", video_url: "", pdf_url: "", chapter_order: chapters.length + 1 }); }}>
                      <Plus size={16} /> Add New Chapter
                    </button>
                  </div>

                  {showCreateForm && (
                    <div className="chapter-card glass-pad-md mb-lg">
                      <h4 className="mb-lg">Create New Chapter</h4>
                      <div className="manage-course-form">
                        <div className="form-group">
                          <label className="form-label">Chapter Title</label>
                          <input type="text" className="glass-input" value={newChapter.title} onChange={(e) => setNewChapter({ ...newChapter, title: e.target.value })} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Video URL</label>
                          <input type="text" className="glass-input" value={newChapter.video_url} onChange={(e) => setNewChapter({ ...newChapter, video_url: e.target.value })} />
                        </div>
                        <div className="form-group full-width">
                          <label className="form-label">Description</label>
                          <textarea className="glass-textarea" rows={3} value={newChapter.description} onChange={(e) => setNewChapter({ ...newChapter, description: e.target.value })} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Chapter Order</label>
                          <input type="number" className="glass-input" value={newChapter.chapter_order} onChange={(e) => setNewChapter({ ...newChapter, chapter_order: Number(e.target.value) })} />
                        </div>
                        <div className="full-width flex-between mt-lg">
                          <div/>
                          <div className="flex gap-md">
                            <button type="button" className="btn-secondary" onClick={() => setShowCreateForm(false)}>Cancel</button>
                            <button type="button" className="btn-primary" onClick={createChapter}>Save Chapter</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {chapterLoading ? ( <p className="text-muted">Loading Chapters...</p> ) : chapters.length === 0 && !showCreateForm ? (
                    <div className="premium-empty-state"><h3>No Chapters Found</h3><p>Click "Add New Chapter" to create your first chapter.</p></div>
                  ) : (
                    chapters.map((chapter) => (
                      <div key={chapter.id} className="chapter-card">
                        <div className="chapter-header">
                          <div className="chapter-info">
                            <div className="chapter-icon-wrapper"><FileText size={20} /></div>
                            <div className="chapter-meta"><p>Chapter {chapter.chapter_order}</p><h4>{chapter.title}</h4></div>
                          </div>
                          <div className="chapter-actions">
                            <button type="button" className="icon-btn" onClick={() => { if (expandedChapter === chapter.id && editingChapter !== chapter.id) { setExpandedChapter(null); } else { setExpandedChapter(chapter.id); setEditingChapter(null); } }}>
                              {expandedChapter === chapter.id && editingChapter !== chapter.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                            <button type="button" className="icon-btn" onClick={() => { setShowCreateForm(false); if (editingChapter === chapter.id) { setEditingChapter(null); setExpandedChapter(null); } else { setEditingChapter(chapter.id); setExpandedChapter(chapter.id); setNewChapter({ title: chapter.title, description: chapter.description, video_url: chapter.video_url, pdf_url: chapter.pdf_url, chapter_order: chapter.chapter_order }); } }}>
                              <Pencil size={16} />
                            </button>
                            <button type="button" className="icon-btn danger" onClick={() => deleteChapter(chapter.id)}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        <div className={`chapter-body ${expandedChapter === chapter.id && editingChapter !== chapter.id ? 'expanded' : ''}`}>
                          <p className="chapter-desc-text">{chapter.description || "No description provided."}</p>
                        </div>

                        <div className={`chapter-body ${expandedChapter === chapter.id && editingChapter === chapter.id ? 'expanded' : ''}`}>
                          <div className="manage-course-form">
                            <div className="form-group">
                              <label className="form-label">Chapter Title</label>
                              <input type="text" className="glass-input" value={newChapter.title} onChange={(e) => setNewChapter({ ...newChapter, title: e.target.value })} />
                            </div>
                            <div className="form-group">
                              <label className="form-label">Video URL</label>
                              <input type="text" className="glass-input" value={newChapter.video_url} onChange={(e) => setNewChapter({ ...newChapter, video_url: e.target.value })} />
                            </div>
                            <div className="form-group full-width">
                              <label className="form-label">Description</label>
                              <textarea className="glass-textarea" rows={3} value={newChapter.description} onChange={(e) => setNewChapter({ ...newChapter, description: e.target.value })} />
                            </div>
                            <div className="form-group">
                              <label className="form-label">Chapter Order</label>
                              <input type="number" className="glass-input" value={newChapter.chapter_order} onChange={(e) => setNewChapter({ ...newChapter, chapter_order: Number(e.target.value) })} />
                            </div>
                            <div className="full-width flex-between mt-lg">
                              <div/>
                              <div className="flex gap-md">
                                <button type="button" className="btn-secondary" onClick={() => { setExpandedChapter(null); setEditingChapter(null); }}>Cancel</button>
                                <button type="button" className="btn-primary" onClick={() => updateChapter(chapter.id)}>Update Chapter</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* 3. RESOURCES & PDFs */}
              {activeTab === "resources" && (
                <div>
                  <h3 className="glass-title">Course Resources & RAG Material</h3>
                  <p className="glass-subtitle">Upload and organize learning material. PDFs uploaded here will be used for the AI Chatbot.</p>

                  <div className="resource-layout">
                    {/* Upload Panel */}
                    <div className="upload-panel">
                      <UploadCloud size={40} className="upload-icon" />
                      <h4>Select PDFs to Upload</h4>
                      <p className="text-muted-xs">PDF only • Max 50MB per file</p>
                      
                      <input type="file" accept=".pdf" multiple ref={fileInputRef} className="d-none" onChange={handleFileChange} />
                      <button type="button" className="btn-secondary w-full" onClick={() => fileInputRef.current?.click()}>Browse Files</button>

                      {selectedFiles.length > 0 && (
                        <div className="pending-list">
                          <p className="pending-list-title">Pending Uploads ({selectedFiles.length})</p>
                          {selectedFiles.map((file, idx) => (
                            <div key={idx} className="pending-item">
                              <span className="text-truncate">{file.name}</span>
                              <button type="button" className="transparent-btn icon-btn danger" onClick={() => removeSelectedFile(idx)}><X size={14} /></button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="form-group upload-meta-group mt-12">
                        <label className="form-label">Target Chapter *</label>
                        <select className="glass-select" value={uploadMeta.chapter_id} onChange={(e) => setUploadMeta({ ...uploadMeta, chapter_id: e.target.value })}>
                          <option value="">Select Chapter</option>
                          {chapters.map((ch) => (<option key={ch.id} value={ch.id}>Chapter {ch.chapter_order}: {ch.title}</option>))}
                        </select>
                      </div>

                      <div className="form-group upload-meta-group mt-12">
                        <label className="form-label">Resource Type</label>
                        <select className="glass-select" value={uploadMeta.resource_type} onChange={(e) => setUploadMeta({ ...uploadMeta, resource_type: e.target.value })}>
                          <option value="Notes">Notes</option><option value="Assignments">Assignments</option><option value="General Course Materials">General Course Materials</option>
                        </select>
                      </div>

                      <button type="button" className="btn-primary w-full mt-lg" onClick={uploadResources} disabled={selectedFiles.length === 0 || resourceLoading}>
                        {resourceLoading ? "Uploading..." : "Upload Selected PDFs"}
                      </button>
                    </div>

                    {/* Resources Display (Grouped by Chapter) */}
                    <div className="resource-display-panel">
                      <h4 className="mb-20">Uploaded Course Materials</h4>
                      {resourceLoading ? ( <p className="text-muted">Syncing resources...</p> ) : chapters.length === 0 ? (
                        <p className="text-muted">Create chapters first to view or assign resources.</p>
                      ) : (
                        chapters.map((chapter) => {
                          const chapterResources = resources.filter((res) => res.chapter_id === chapter.id);
                          return (
                            <div key={chapter.id} className="chapter-resource-group">
                              <div className="chapter-resource-title"><FileText size={18} /> Chapter {chapter.chapter_order}: {chapter.title}</div>
                              {chapterResources.length === 0 ? (
                                <p className="text-muted text-xs pl-26 mb-0">No files attached to this chapter.</p>
                              ) : (
                                <table className="resource-table">
                                  <thead>
                                    <tr>
                                      <th className="text-left">File Name</th>
                                      <th className="text-left">Type</th>
                                      <th className="text-center">Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {chapterResources.map((res) => (
                                      <tr key={res.id}>
                                        <td>
                                          <div className="flex-item-center">
                                            <FileText size={16} color="var(--danger)" />
                                            <strong className="text-truncate" title={res.title}>{res.title}</strong>
                                          </div>
                                        </td>
                                        <td><span className="resource-badge">{res.resource_type}</span></td>
                                        <td className="text-center">
                                          <div className="flex-center gap-md">
                                            <button type="button" className="icon-btn" title="View PDF" onClick={() => window.open(`${API_URL}${res.file_url}`, '_blank')}><Eye size={14} /></button>
                                            <button type="button" className="icon-btn danger" title="Delete File" onClick={() => deleteResource(res.id)}><Trash2 size={14} /></button>
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </GlassCard>
        </main>
      </div>
    </div>
  );
}