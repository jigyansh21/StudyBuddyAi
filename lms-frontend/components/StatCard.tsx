"use client";

import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import GlassCard from "./GlassCard";
import "../styles/cards.css";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: number | string;
  trendDirection?: "up" | "down" | "none";
  loading?: boolean;
}

/**
 * Statistics Card Component
 *
 * Responsibilities:
 * - Renders a high-level metric (e.g. Total Students, Average Progress).
 * - Displays a visual trend indicator (up/down) compared to a previous period.
 * - Handles loading states gracefully with a dash placeholder.
 *
 * @component
 * @param {StatCardProps} props - The configuration for the stat card.
 */
export default function StatCard({ 
  title, 
  value, 
  icon, 
  trend, 
  trendDirection = "none",
  loading = false
}: StatCardProps) {
  
  const formattedValue = typeof value === "number" ? value.toLocaleString() : value;
  const hasTrend = trend !== undefined && trend !== null && trendDirection !== "none" && !loading;

  return (
    <GlassCard padding="lg" hover className="stat-card">
      <div className="stat-card-header">
        <span className="stat-card-title">{title}</span>
        <div className="stat-icon-wrapper">
          {icon}
        </div>
      </div>
      
      <div>
        <h3 className="stat-card-value">
          {loading ? "—" : formattedValue}
        </h3>
        {hasTrend && (
          <p className="stat-card-trend">
            <span className={`trend-content ${trendDirection === "up" ? "trend-up" : "trend-down"}`}>
              {trendDirection === "up" ? <TrendingUp size={14} aria-hidden="true" /> : <TrendingDown size={14} aria-hidden="true" />} {trend}
            </span>
            <span className="trend-muted">vs last month</span>
          </p>
        )}
      </div>
    </GlassCard>
  );
}