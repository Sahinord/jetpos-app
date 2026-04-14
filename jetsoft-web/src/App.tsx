import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ProductEcosystem from './components/ProductEcosystem';
import HardwareSolutions from './components/HardwareSolutions';
import InfiniteLoop from './components/InfiniteLoop';
import SectoralSolutions from './components/SectoralSolutions';
import FeatureGrid from './components/FeatureGrid';
import Footer from './components/Footer';
import ProductDetail from './components/ProductDetail';
import { AnimatePresence, motion } from 'framer-motion';

function App() {
  const [view, setView] = useState<'home' | 'product'>('home');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const navigateToProduct = (id: string) => {
    setSelectedProductId(id);
    setView('product');
    window.scrollTo(0, 0);
  };

  const navigateHome = () => {
    setView('home');
    setSelectedProductId(null);
    window.scrollTo(0, 0);
  };

  return (
    <div className="relative min-h-screen">
      <div className="site-bg" />
      <Navbar onHomeClick={navigateHome} onProductClick={navigateToProduct} />

      <main>
        <AnimatePresence mode="wait">

          {view === 'home' ? (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Hero onProductClick={navigateToProduct} />
              <InfiniteLoop />
              <SectoralSolutions />
              <ProductEcosystem onProductClick={navigateToProduct} />
              <HardwareSolutions />
              <FeatureGrid />
            </motion.div>
          ) : (
            <motion.div
              key="product"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5 }}
            >
              <ProductDetail
                productId={selectedProductId || ''}
                onBack={navigateHome}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />

      {/* Dynamic Background Noise */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.015] z-50 mix-blend-overlay">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
          <filter id="noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noise)" />
        </svg>
      </div>
    </div>
  );
}

export default App;
