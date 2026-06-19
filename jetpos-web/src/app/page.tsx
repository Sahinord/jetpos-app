import React from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import TrustBar from "@/components/TrustBar";
import ShowcaseCards from "@/components/ShowcaseCards";
import Features from "@/components/Features";
import ConnectionAnimation from "@/components/ConnectionAnimation";
import PremiumFeatures from "@/components/PremiumFeatures";
import SetupSteps from "@/components/SetupSteps";
import AnalyticsCenter from "@/components/AnalyticsCenter";
import IndustryCarousel from "@/components/IndustryCarousel";
import JetKDSSection from "@/components/JetKDSSection";
import JetQRSection from "@/components/JetQRSection";
import Integrations from "@/components/Integrations";
import Testimonials from "@/components/Testimonials";
import CallToAction from "@/components/CallToAction";
import SupportFormSection from "@/components/SupportFormSection";
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
      <main className="main-canvas" style={{ position: "relative", zIndex: 1, minHeight: "100vh", overflowX: "hidden" }}>
        <Navbar />
        <Hero />
        <TrustBar />
        <ShowcaseCards />
        <ConnectionAnimation />
        <PremiumFeatures />
        <SetupSteps />
        <AnalyticsCenter />
        <JetKDSSection />
        <JetQRSection />
        <IndustryCarousel />
        <Testimonials />
        <CallToAction />
        <SupportFormSection />
        <Footer />
      </main>
      <WhatsAppButton />
      <CookieBanner />
      <LeadPopup />
    </>
  );
}

