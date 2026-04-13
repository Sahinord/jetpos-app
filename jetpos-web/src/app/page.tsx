import React from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import AppShowcase from "@/components/AppShowcase";
import HardwareSolutions from "@/components/HardwareSolutions";
import Features from "@/components/Features";
import ConnectionAnimation from "@/components/ConnectionAnimation";
import Integrations from "@/components/Integrations";
import Testimonials from "@/components/Testimonials";
import Pricing from "@/components/Pricing";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import StickyBanner from "@/components/StickyBanner";
import CookieBanner from "@/components/CookieBanner";
import LeadPopup from "@/components/LeadPopup";

export default function Home() {
  return (
    <>
      <div className="site-bg" />
      <StickyBanner />
      <main style={{ position: "relative", zIndex: 1, minHeight: "100vh", overflowX: "hidden" }}>
        <Navbar />
        <Hero />
        <AppShowcase />
        <HardwareSolutions />
        <Features />
        <ConnectionAnimation />
        <Integrations />
        <Testimonials />
        <Pricing />
        <Contact />
        <Footer />
      </main>
      <WhatsAppButton />
      <CookieBanner />
      <LeadPopup />
    </>
  );
}

