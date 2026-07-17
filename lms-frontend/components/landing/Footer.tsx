import { GraduationCap } from "lucide-react";

export default function Footer() {
  return (
    <footer className="landing-footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="footer-brand-name">
              <GraduationCap size={22} color="var(--brand-blue)" />
              StudyBuddy AI
            </div>
            <p className="footer-brand-desc">
              AI-powered learning platform helping students learn smarter with
              personalized paths, quizzes, and real progress tracking.
            </p>
          </div>

          <div className="footer-links">
            <div className="footer-col">
              <p className="footer-col-title">Platform</p>
              <ul>
                <li><a href="#courses">Courses</a></li>
                <li><a href="#features">Features</a></li>
                <li><a href="#home">Home</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <p className="footer-col-title">Account</p>
              <ul>
                <li><a href="/login">Login</a></li>
                <li><a href="/register">Get Started</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <p className="footer-col-title">Company</p>
              <ul>
                <li><a href="#about">About</a></li>
                <li><a href="#contact">Contact</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} StudyBuddy AI. All rights reserved.</p>
          <p>Built with ❤️ for learners everywhere.</p>
        </div>
      </div>
    </footer>
  );
}
