import Link from "next/link";
import { GraduationCap, Menu } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="landing-navbar">
      <div className="navbar-container">
        
        {/* Left Side: Logo & Brand */}
        <Link href="/" className="navbar-logo">
          <div className="logo-icon">
            <GraduationCap size={26} strokeWidth={2.5} />
          </div>
          <div>
            <span className="brand-name">StudyBuddy AI</span>
            <span className="brand-tagline">AI Learning Platform</span>
          </div>
        </Link>

        {/* Center: Navigation Links */}
        <div className="navbar-links">
          <a href="#home">Home</a>
          <a href="#courses">Courses</a>
          <a href="#features">Features</a>
          <a href="#about">About</a>
          <a href="#contact">Contact Us</a>
        </div>

        {/* Right Side: Actions & Mobile Menu */}
        <div className="navbar-actions">
          <Link href="/login" className="navbar-btn">
            Login
          </Link>
          <Link href="/register" className="navbar-primary-btn">
            Get Started
          </Link>

          {/* Mobile Menu Button */}
          <button className="mobile-menu-btn" aria-label="Menu">
            <Menu size={24} />
          </button>
        </div>

      </div>
    </nav>
  );
}