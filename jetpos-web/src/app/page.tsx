import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import ConnectionAnimation from "@/components/ConnectionAnimation";
import Integrations from "@/components/Integrations";
import Pricing from "@/components/Pricing";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <div className="site-bg" />
      <main style={{ position: "relative", zIndex: 1, minHeight: "100vh", overflowX: "hidden" }}>
        <Navbar />
        <Hero />
        <Features />
        <ConnectionAnimation />
        <Integrations />
        <Pricing />
        <Contact />
        <Footer />
      </main>
    </>
  );
}
