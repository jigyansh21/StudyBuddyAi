"use client";

import { Users, BookOpen, FileText, CheckCircle } from "lucide-react";

// Layout Components
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

// UI Components
import StatCard from "@/components/StatCard";

// CSS
import "@/styles/dashboard.css";

export default function AdminDashboard() {
  return (
    <div className="admin-layout">
      <Sidebar />

      <div className="admin-main">
        <Header />

        <main className="dashboard-content">
          
          <section className="dashboard-hero">
            <h1 className="hero-title">Dashboard</h1>
            <p className="hero-subtitle">Monitor students, courses and platform activity.</p>
          </section>

          <section className="stats-grid">
            <StatCard 
              title="Total Students" 
              value={10223} 
              icon={<Users size={20} />} 
              trend="12%" 
              trendDirection="up" 
            />
            <StatCard 
              title="Total Courses" 
              value={45} 
              icon={<BookOpen size={20} />} 
              trend="3%" 
              trendDirection="up" 
            />
            <StatCard 
              title="Total Resources" 
              value={1204} 
              icon={<FileText size={20} />} 
            />
            <StatCard 
              title="Avg. Completion" 
              value="68%" 
              icon={<CheckCircle size={20} />} 
              trend="5%" 
              trendDirection="up" 
            />
          </section>

        </main>
      </div>
    </div>
  );
}