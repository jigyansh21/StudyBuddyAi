import { Users, BookOpen, Clock, Star } from "lucide-react";

export default function Stats() {
  return (
    <section className="stats-section">
      <div className="stats-container">
        
        {/* Stat 1 */}
        <div className="stat-item">
          <div className="stat-icon-wrapper">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <h3 className="stat-number">10,000+</h3>
            <p className="stat-label">Students</p>
          </div>
        </div>

        {/* Stat 2 */}
        <div className="stat-item">
          <div className="stat-icon-wrapper">
            <BookOpen size={24} />
          </div>
          <div className="stat-content">
            <h3 className="stat-number">120+</h3>
            <p className="stat-label">Expert Courses</p>
          </div>
        </div>

        {/* Stat 3 */}
        <div className="stat-item">
          <div className="stat-icon-wrapper">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <h3 className="stat-number">50,000+</h3>
            <p className="stat-label">Hours Learned</p>
          </div>
        </div>

        {/* Stat 4 */}
        <div className="stat-item">
          <div className="stat-icon-wrapper rating-icon">
            <Star size={24} />
          </div>
          <div className="stat-content">
            <h3 className="stat-number">4.8</h3>
            <p className="stat-label">Rating</p>
          </div>
        </div>

      </div>
    </section>
  );
}