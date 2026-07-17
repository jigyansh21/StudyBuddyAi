import { Brain, BarChart3, Target, BookOpen, Zap, Users } from "lucide-react";

const features = [
  {
    icon: <Brain size={26} />,
    title: "AI-Powered Tutoring",
    desc: "Get instant, context-aware answers to your questions from our AI tutor trained on your course content.",
    color: "rgba(99,102,241,0.12)",
    iconColor: "#6366f1",
  },
  {
    icon: <BarChart3 size={26} />,
    title: "Progress Tracking",
    desc: "Monitor your learning journey with detailed analytics, completion rates, and performance insights.",
    color: "rgba(59,130,246,0.12)",
    iconColor: "var(--brand-blue)",
  },
  {
    icon: <Target size={26} />,
    title: "Personalized Paths",
    desc: "Adaptive learning paths that adjust to your pace, strengths, and areas that need improvement.",
    color: "rgba(16,185,129,0.12)",
    iconColor: "#10b981",
  },
  {
    icon: <BookOpen size={26} />,
    title: "Expert-Curated Content",
    desc: "High quality courses designed and reviewed by industry professionals and academic experts.",
    color: "rgba(245,158,11,0.12)",
    iconColor: "#f59e0b",
  },
  {
    icon: <Zap size={26} />,
    title: "Interactive Quizzes",
    desc: "Reinforce your knowledge with smart quizzes that adapt to your learning level and progress.",
    color: "rgba(249,115,22,0.12)",
    iconColor: "#f97316",
  },
  {
    icon: <Users size={26} />,
    title: "Community Learning",
    desc: "Join thousands of learners, collaborate on projects, and get support from peers and mentors.",
    color: "rgba(139,92,246,0.12)",
    iconColor: "#8b5cf6",
  },
];

export default function Features() {
  return (
    <section id="features" className="features-section">
      <div className="features-inner">
        <div className="section-header">
          <div>
            <p className="section-label">Why StudyBuddy AI</p>
            <h2 className="section-title">Everything you need to succeed</h2>
            <p className="section-subtitle">
              Powerful tools designed to make learning faster, smarter, and more effective.
            </p>
          </div>
        </div>

        <div className="features-grid">
          {features.map((f, i) => (
            <div key={i} className="feature-card">
              <div
                className="feature-icon"
                style={{ background: f.color, color: f.iconColor }}
              >
                {f.icon}
              </div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
