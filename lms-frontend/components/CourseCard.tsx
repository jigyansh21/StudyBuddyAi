"use client";

import React from "react";
import Link from "next/link";
import { BookOpen, Calendar, ArrowRight, MoreVertical } from "lucide-react";
import GlassCard from "./GlassCard";

interface CourseCardProps {
  id: number;
  title: string;
  description: string;
  created_at?: string;
}

export default function CourseCard({ id, title, description, created_at }: CourseCardProps) {
  const formattedDate = created_at 
    ? new Date(created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : "Not Available";

  return (
    <GlassCard padding="lg" hover className="course-card-content">
      
      {/* Thumbnail */}
      <div className="course-card-thumbnail">
        <BookOpen size={32} />
      </div>

      {/* Header Area */}
      <div className="course-card-header">
        <h2 className="course-card-title">{title}</h2>
        {/* FIXED: Added type="button" to prevent form submission bugs */}
        <button type="button" className="course-menu-btn" aria-label="Course Options">
          <MoreVertical size={16} />
        </button>
      </div>

      <p className="course-card-desc">{description}</p>

      <div className="course-card-meta">
        <Calendar size={14} />
        <span>Created: {formattedDate}</span>
      </div>

      {/* FIXED: Removed nested <button> inside <Link> for valid HTML */}
      <Link 
        href={`/admin/course/${id}`} 
        className="btn-primary course-card-footer"
      >
        Manage Course <ArrowRight size={16} />
      </Link>
    </GlassCard>
  );
}