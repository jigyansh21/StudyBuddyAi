import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";

/**
 * Static mock data for the Featured Courses section.
 * In a production environment, this should be fetched from the public
 * GET /courses/ endpoint to dynamically highlight popular content.
 */
const courses = [
  {
    id: 1,
    icon: "🐍",
    title: "Python Basics",
    desc: "Begin your coding journey",
    badge: "Beginner",
    badgeColor: "rgba(59,130,246,0.12)",
    badgeText: "#3b82f6",
    rating: "4.8",
    reviews: "1.2k",
    iconBg: "rgba(59,130,246,0.13)",
    iconBorder: "rgba(59,130,246,0.18)",
  },
  {
    id: 2,
    icon: "🌲",
    title: "Data Structures",
    desc: "Master DSA with practice",
    badge: "Intermediate",
    badgeColor: "rgba(16,185,129,0.12)",
    badgeText: "#059669",
    rating: "4.9",
    reviews: "804",
    iconBg: "rgba(16,185,129,0.13)",
    iconBorder: "rgba(16,185,129,0.2)",
  },
  {
    id: 3,
    icon: "🗄️",
    title: "DBMS Essentials",
    desc: "Database concepts made easy",
    badge: "Intermediate",
    badgeColor: "rgba(99,102,241,0.12)",
    badgeText: "#6366f1",
    rating: "4.7",
    reviews: "643",
    iconBg: "rgba(99,102,241,0.13)",
    iconBorder: "rgba(99,102,241,0.2)",
  },
  {
    id: 4,
    icon: "🤖",
    title: "AI & ML Introduction",
    desc: "Step into the world of AI",
    badge: "Beginner",
    badgeColor: "rgba(249,115,22,0.12)",
    badgeText: "#ea580c",
    rating: "4.9",
    reviews: "723",
    iconBg: "rgba(249,115,22,0.13)",
    iconBorder: "rgba(249,115,22,0.2)",
  },
];

/**
 * Featured Courses Section
 *
 * Responsibilities:
 * - Renders a visually appealing grid of popular courses on the landing page.
 * - Drives conversion by directing unauthenticated users to the login/registration flow.
 *
 * @component
 */
export default function FeaturedCourses() {
  return (
    <section id="courses" className="featured-section">
      <div className="featured-inner">

        <div className="section-header">
          <div>
            <p className="section-label">Popular Courses</p>
            <h2 className="section-title">Explore Top Courses</h2>
            <p className="section-subtitle">
              Learn from the best resources curated by experts.
            </p>
          </div>
          <Link href="/login" className="view-all-link">
            View All Courses <ArrowRight size={15} />
          </Link>
        </div>

        <div className="courses-grid">
          {courses.map((c) => (
            <div key={c.id} className="course-landing-card">

              <div
                className="course-card-icon-box"
                style={{
                  background: c.iconBg,
                  border: `1px solid ${c.iconBorder}`,
                }}
              >
                <span className="course-card-emoji">{c.icon}</span>
              </div>

              <h3 className="course-card-title">{c.title}</h3>
              <p className="course-card-desc">{c.desc}</p>

              <div className="course-card-footer">
                <span
                  className="course-card-badge"
                  style={{ background: c.badgeColor, color: c.badgeText }}
                >
                  {c.badge}
                </span>
                <span className="course-card-rating">
                  <Star size={13} fill="#f59e0b" color="#f59e0b" />
                  <strong>{c.rating}</strong>
                  <span style={{ fontWeight: 400, color: "var(--text-muted)", fontSize: "12px" }}>
                    ({c.reviews})
                  </span>
                </span>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
