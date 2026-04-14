import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle, ChevronRight, Share2, Download, ExternalLink } from 'lucide-react';
import { productsData } from '../data/products';

interface ProductDetailProps {
  productId: string;
  onBack: () => void;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ productId, onBack }) => {
  const product = productsData[productId];

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Ürün bulunamadı.</h2>
          <button onClick={onBack} className="text-primary hover:underline">Ana Sayfaya Dön</button>
        </div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 relative overflow-hidden">
      {/* Dynamic Background */}
      <div
        className="fixed inset-0 pointer-events-none -z-10"
        style={{
          background: `radial-gradient(circle at 50% -20%, ${product.color}15 0%, transparent 50%)`
        }}
      />

      <div className="container mx-auto px-6 relative z-10">
        {/* Navigation */}
        <motion.button
          onClick={onBack}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="group flex items-center gap-3 text-gray-400 hover:text-white transition-colors mb-12"
        >
          <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-primary/50 transition-all">
            <ArrowLeft size={18} />
          </div>
          <span className="text-sm font-bold uppercase tracking-widest text-primary">Geri Dön</span>
        </motion.button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center mb-32">
          {/* Content Left */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "circOut" }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">JetSoft Professional Series</span>
            </div>

            <h1 className="text-6xl md:text-8xl font-black text-white mb-8 leading-tight">
              {product.name}
              <span className="block text-transparent bg-clip-text bg-linear-to-r from-primary to-secondary">
                {product.tagline}
              </span>
            </h1>

            <p className="text-xl text-gray-400 mb-12 leading-relaxed max-w-xl">
              {product.longDescription}
            </p>

            <div className="flex flex-wrap gap-6">
              <button className="px-10 py-5 rounded-2xl bg-primary text-white font-bold hover:scale-105 transition-all shadow-xl shadow-primary/20 flex items-center gap-3">
                Ücretsiz Dene <ChevronRight size={20} />
              </button>
              <button className="px-10 py-5 rounded-2xl glass text-white font-bold hover:bg-white/10 transition-all border border-white/10 flex items-center gap-3">
                Katalog İndir <Download size={20} />
              </button>
            </div>
          </motion.div>

          {/* Visual Right */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1, ease: "circOut" }}
            className="relative"
          >
            <div className="aspect-square rounded-[3rem] glass flex items-center justify-center p-20 relative overflow-hidden group">
              {/* Floating circles */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] -z-10 animate-pulse" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/10 blur-[100px] -z-10 delay-700 animate-pulse" />

              <div className="relative z-10 text-white transform group-hover:scale-110 transition-transform duration-700">
                {React.cloneElement(product.icon as React.ReactElement, { size: 240, strokeWidth: 1 })}
              </div>

              {/* Badge Overlay */}
              <div className="absolute bottom-12 right-12 glass p-6 rounded-2xl border border-white/20 backdrop-blur-3xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <CheckCircle className="text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Performans</p>
                    <p className="text-lg font-bold text-white">Ultra Hızlı</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mb-32"
        >
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black text-white mb-4">Neden {product.name}?</h2>
            <div className="w-20 h-1 bg-primary mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {product.features.map((feature, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                whileHover={{ y: -10 }}
                className="glass p-10 rounded-[2.5rem] border border-white/5 hover:border-primary/20 transition-all group"
              >
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-8 group-hover:bg-primary/10 transition-colors">
                  <div className="text-primary group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-2xl font-black text-white mb-4 group-hover:text-primary transition-colors">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed capitalize-first">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Details & Specs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass p-12 rounded-[2.5rem]"
          >
            <h4 className="text-2xl font-black text-white mb-8">Temel Avantajlar</h4>
            <ul className="space-y-6">
              {product.benefits.map((benefit, i) => (
                <li key={i} className="flex items-start gap-4">
                  <div className="mt-1">
                    <CheckCircle size={20} className="text-primary" />
                  </div>
                  <span className="text-gray-300 font-medium leading-relaxed">{benefit}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass p-12 rounded-[2.5rem] border border-white/5 bg-white/[0.02]"
          >
            <h4 className="text-2xl font-black text-white mb-8">Teknik Detaylar</h4>
            <div className="space-y-4">
              {Object.entries(product.specs).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center py-4 border-b border-white/5 last:border-0">
                  <span className="text-gray-500 font-bold uppercase text-xs tracking-widest">{key}</span>
                  <span className="text-white font-bold">{value}</span>
                </div>
              ))}
            </div>

            <div className="mt-12 flex justify-between items-center">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map(n => (
                  <div key={n} className="w-10 h-10 rounded-full border-2 border-[#0a0a0a] bg-gray-800 overflow-hidden shadow-lg">
                    <img src={`https://i.pravatar.cc/100?u=${product.id}${n}`} alt="user" className="w-full h-full object-cover opacity-80" />
                  </div>
                ))}
                <div className="w-10 h-10 rounded-full border-2 border-[#0a0a0a] bg-primary flex items-center justify-center text-[10px] font-bold text-white shadow-lg">
                  +1k
                </div>
              </div>
              <p className="text-xs text-gray-500 font-medium">Mutlu Kullanıcı</p>
            </div>
          </motion.div>
        </div>

        {/* Final CTA */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-32 p-16 rounded-[3rem] bg-linear-to-br from-primary via-primary/80 to-secondary relative overflow-hidden text-center"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />

          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-8 leading-tight">
              İşletmenizi bir üst seviyeye <br /> taşımaya hazır mısınız?
            </h2>
            <div className="flex flex-wrap justify-center gap-6">
              <button className="px-12 py-6 rounded-2xl bg-white text-primary font-black uppercase tracking-widest hover:scale-105 transition-all shadow-2xl">
                Hemen Başlayın
              </button>
              <button className="px-12 py-6 rounded-2xl bg-black/20 text-white font-black uppercase tracking-widest border border-white/20 hover:bg-black/30 transition-all backdrop-blur-sm">
                Satış Ekibiyle Görüşün
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProductDetail;
