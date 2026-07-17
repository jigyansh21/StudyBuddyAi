import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Stats from "@/components/landing/Stats";
import FeaturedCourses from "@/components/landing/FeaturedCourses";
import Features from "@/components/landing/Features";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";

export default function HomePage() {
  return (
    <div className="landing-page">
      <Navbar />
      <Hero />
      <Stats />
      <FeaturedCourses />
      <Features />
      <CTA />
      <Footer />
    </div>
  );
}