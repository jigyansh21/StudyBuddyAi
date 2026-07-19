"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, MoreVertical, Users, TrendingUp } from "lucide-react";

interface CourseCardProps {
  id: number;
  title: string;
  description: string;
  created_at?: string;
  enrollment_count?: number;
  avg_progress?: number;
  index?: number;
}

/**
 * A rotating palette of gradients used to visually distinguish courses
 * when no custom thumbnail is provided by the admin.
 */
const CARD_GRADIENTS = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
  "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
  "linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)",
];

/**
 * Course Card Component
 *
 * Responsibilities:
 * - Renders a visually engaging summary of a course for the admin catalog.
 * - Displays dynamically generated initials and a gradient background if no thumbnail exists.
 * - Shows high-level stats (enrollments, average completion progress).
 *
 * @component
 * @param {CourseCardProps} props - The properties defining the course summary.
 */
export default function CourseCard({
  id,
  title,
  description,
  enrollment_count = 0,
  avg_progress = 0,
  index = 0,
}: CourseCardProps) {
  const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length];
  const initials = title
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  const progress = Math.min(100, Math.max(0, avg_progress));

  return (
    <div className="course-card-wrap">
      {/* Banner */}
      <div className="course-card-banner" style={{ background: gradient }}>
        <div className="course-card-icon-circle">
          {initials}
        </div>

        {/* Options button */}
        <button
          type="button"
          className="course-menu-btn-overlay"
          aria-label="Course Options"
        >
          <MoreVertical size={15} />
        </button>

        {/* Bottom stats strip */}
        <div className="course-card-banner-stats">
          <span className="course-banner-chip">
            <Users size={10} />
            {enrollment_count} student{enrollment_count !== 1 ? "s" : ""}
          </span>
          <span className="course-banner-chip">
            <TrendingUp size={10} />
            {progress}% done
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="course-card-body">
        <h3 className="course-card-title" title={title}>
          {title}
        </h3>
        <p className="course-card-desc">{description}</p>

        {/* Progress */}
        <div className="course-card-progress-container">
          <div className="course-card-progress-header">
            <span className="course-card-progress-label">Avg. Completion</span>
            <span className="course-card-progress-value">{progress}%</span>
          </div>
          <div className="course-card-progress-bar-bg">
            <div
              className="course-card-progress-bar-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Action */}
        <div className="course-card-actions">
          <Link href={`/admin/course/${id}`} className="btn-manage-course">
            Manage Course <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}