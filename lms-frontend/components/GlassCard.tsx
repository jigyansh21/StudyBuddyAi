import React from "react";

type GlassCardProps = {
  id?: string;
  header?: React.ReactNode;
  padding?: "sm" | "md" | "lg";
  hover?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
};

export default function GlassCard({
  id,
  header,
  padding = "md",
  hover = false,
  onClick,
  children,
  className = "",
}: GlassCardProps) {
  
  const paddingClass = `glass-pad-${padding}`;
  const hoverClass = hover || onClick ? "glass-hover-effect" : "";
  const pointerClass = onClick ? "pointer" : "";

  return (
    <div 
      id={id} 
      onClick={onClick}
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