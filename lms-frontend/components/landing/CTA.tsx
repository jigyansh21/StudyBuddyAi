import Link from "next/link";
import { ArrowRight, PlayCircle } from "lucide-react";

export default function CTA() {
  return (
    <section className="cta-section">
      <div className="cta-inner">
        <h2 className="cta-title">Ready to Learn Smarter?</h2>
        <p className="cta-subtitle">
          Join 10,000+ students who are already using StudyBuddy AI to master
          new skills and achieve their goals faster.
        </p>
        <div className="cta-buttons">
          <Link href="/register" className="btn-cta-primary">
            Get Started Free <ArrowRight size={18} />
          </Link>
          <Link href="#courses" className="btn-cta-secondary">
            <PlayCircle size={18} /> Explore Courses
          </Link>
        </div>
      </div>
    </section>
  );
}
