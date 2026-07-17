import Link from "next/link";
import { ArrowRight, Sparkles, PlayCircle, LayoutDashboard, Users, BarChart3, GraduationCap, Play, BookOpen } from "lucide-react";

export default function Hero() {
  return (
    <section id="home" className="hero-section">
      <div className="hero-container">
        
        {/* Left Side: Text Content & CTA */}
        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={16} className="badge-icon" />
            <span>AI-Powered Learning Platform</span>
          </div>
          
          <h1 className="hero-title">
            Learn Smarter. <br />
            <span className="text-gradient">Achieve More.</span>
          </h1>
          
          <p className="hero-subtitle">
            StudyBuddy AI helps you master concepts faster with personalized learning paths, interactive quizzes, and AI-driven progress tracking.
          </p>
          
          <div className="hero-buttons">
            <Link href="/register" className="btn-primary-lg">
              Get Started <ArrowRight size={18} />
            </Link>
            <a href="#courses" className="btn-secondary-lg">
              <PlayCircle size={18} /> Explore Courses
            </a>
          </div>
          
          {/* Social Proof / Trust Badges */}
          <div className="hero-social-proof">
            <div className="avatar-group">
              <div className="avatar">👦</div>
              <div className="avatar">👧</div>
              <div className="avatar">👨‍🎓</div>
            </div>
            <span>Trusted by <strong>10,000+</strong> students</span>
          </div>
        </div>

        {/* Right Side: Glassmorphism Visual Mockup */}
        <div className="hero-visual">
          <div className="mockup-window">
            
            {/* Window Browser Controls */}
            <div className="mockup-window-header">
              <span className="dot red"></span>
              <span className="dot yellow"></span>
              <span className="dot green"></span>
            </div>
            
            {/* 🚀 Dashboard Inner Dummy Layout */}
            <div className="mockup-body">
              
              {/* 1. Dummy Sidebar */}
              <div className="mockup-sidebar">
                <div className="mockup-logo"><GraduationCap size={22} color="var(--brand-blue)" /></div>
                <div className="mockup-nav-item active"><LayoutDashboard size={16} /></div>
                <div className="mockup-nav-item"><BookOpen size={16} /></div>
                <div className="mockup-nav-item"><Users size={16} /></div>
                <div className="mockup-nav-item"><BarChart3 size={16} /></div>
              </div>

              {/* Main Dashboard Area */}
              <div className="mockup-main">
                
                {/* 2. Dummy Header */}
                <div className="mockup-header">
                  <div className="mockup-greeting">
                    <div className="line title w-60"></div>
                    <div className="line sub w-40"></div>
                  </div>
                  <div className="mockup-avatar"></div>
                </div>

                {/* 3. Stats / Feature Cards */}
                <div className="mockup-cards-row">
                  <div className="progress-card">
                    <div className="progress-icon"><BarChart3 size={16} /></div>
                    <div className="progress-details">
                      <div className="line title w-50"></div>
                      <div className="stat-bar"><div className="stat-fill w-75"></div></div>
                    </div>
                  </div>
                  
                  <div className="ai-card">
                    <div className="ai-icon"><Sparkles size={16} color="var(--brand-purple)" /></div>
                    <div className="ai-details">
                      <div className="line title w-60"></div>
                      <div className="line sub w-40"></div>
                    </div>
                  </div>
                </div>

                {/* 4. Dummy Course Rows */}
                <div className="mockup-courses">
                  <div className="line title w-30 mb-sm"></div>
                  
                  <div className="course-row">
                    <div className="course-icon"><Play size={12} fill="currentColor" /></div>
                    <div className="course-info">
                      <div className="line title w-40"></div>
                    </div>
                    <div className="course-tag"></div>
                  </div>
                  
                  <div className="course-row">
                    <div className="course-icon"><Play size={12} fill="currentColor" /></div>
                    <div className="course-info">
                      <div className="line title w-50"></div>
                    </div>
                    <div className="course-tag alt"></div>
                  </div>

                </div>

              </div>
            </div>

          </div>
          
          {/* Floating 3D Badge */}
          <div className="floating-badge">
            <Sparkles size={20} color="#8b5cf6" />
            <span>AI Tutor Active</span>
          </div>
        </div>

      </div>
    </section>
  );
}