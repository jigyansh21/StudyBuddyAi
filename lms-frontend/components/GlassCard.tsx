import React from "react";

type GlassCardProps = {
  id?: string;
  header?: React.ReactNode;
  padding?: "sm" | "md" | "lg" | "none";
  hover?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * Glassmorphism Card Wrapper
 *
 * Responsibilities:
 * - Provides a consistent frosted-glass visual container used across the dashboard.
 * - Normalizes padding, hover effects, and keyboard-accessible click handlers.
 *
 * @component
 * @param {GlassCardProps} props - The configuration for the wrapper.
 */
export default function GlassCard({
  id,
  header,
  padding = "md",
  hover = false,
  onClick,
  children,
  className = "",
  style,
}: GlassCardProps) {
  
  const paddingClass = `glass-pad-${padding}`;
  const hoverClass = hover || onClick ? "glass-hover-effect" : "";
  const pointerClass = onClick ? "pointer" : "";

  return (
    <div 
      id={id} 
      onClick={onClick}
      style={style}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (!onClick) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={[
        "glass-card",
        paddingClass,
        hoverClass,
        pointerClass,
        className,
      ].filter(Boolean).join(" ")}
    >
      {header && (
        <div className="glass-header">
          {header}
        </div>
      )}
      
      {children}
    </div>
  );
}