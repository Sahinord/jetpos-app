import React from 'react';
import { motion } from 'framer-motion';
import { Rocket, ShieldCheck, Zap, ArrowRight, MessageCircle } from 'lucide-react';

interface HeroProps {
  onProductClick: (id: string) => void;
}

const Hero: React.FC<HeroProps> = ({ onProductClick }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 80, damping: 20 }
    }
  };

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center pt-32 pb-16 overflow-hidden">
      {/* Background Decor */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 2, repeat: Infinity, repeatType: "mirror" }}
        className="absolute top-1/4 -left-10 w-96 h-96 bg-primary/20 blur-[150px] rounded-full -z-10" 
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 2.5, repeat: Infinity, repeatType: "mirror", delay: 0.5 }}
        className="absolute bottom-1/4 -right-10 w-96 h-96 bg-secondary/10 blur-[150px] rounded-full -z-10" 
      />
      
      <div className="container mx-auto px-6 relative z-10">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center text-center max-w-5xl mx-auto"
        >
          {/* Badge */}
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 glass rounded-full mb-10 border border-primary/20 cursor-default"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
            <span className="text-gray-300 font-bold text-[10px] uppercase tracking-widest">
              Yazılımla Şekillenen Gelecek
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1 
            variants={itemVariants}
            className="text-5xl md:text-8xl font-black text-white leading-tight mb-8 tracking-tighter"
          >
            Yazılımla <span className="holographic-text">Şekillenen</span> <br />
            Gelecek.
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            className="text-gray-400 text-base md:text-xl max-w-2xl leading-relaxed mb-12"
          >
            JetSoft Bilgi Teknolojileri olarak, işletmenizi uçtan uca dijitalleştiren yenilikçi yazılım çözümleri üretiyoruz.
          </motion.p>

          {/* Buttons */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-5 mb-24">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onProductClick('jetpos')}
              className="btn-primary px-10 py-4 text-sm uppercase tracking-widest flex items-center justify-center gap-2 group"
            >
              Sistemi İncele 
              <motion.div
                initial={{ x: 0 }}
                whileHover={{ x: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <ArrowRight size={18} />
              </motion.div>
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-outline px-10 py-4 text-sm uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <MessageCircle size={18} className="text-primary" /> WhatsApp Hattı
            </motion.button>
          </motion.div>

          {/* Mini Features */}
          <motion.div 
            variants={itemVariants}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full"
          >
            {[
              { icon: <Zap size={24} />, title: 'Hızlı Entegrasyon', text: 'Tüm donanımlarla anında bağlantı.' },
              { icon: <ShieldCheck size={24} />, title: 'Güvenli Altyapı', text: 'Çift katmanlı veri koruma.' },
              { icon: <Rocket size={24} />, title: 'Kesintisiz Destek', text: '7/24 uzman teknik ekip.' },
            ].map((f, i) => (
              <motion.div 
                key={i} 
                whileHover={{ y: -5, backgroundColor: "rgba(255, 255, 255, 0.05)" }}
                className="glass-card p-8 text-center rounded-3xl border-white/5 cursor-default transition-colors duration-300"
              >
                <motion.div 
                  initial={{ rotate: 0 }}
                  whileHover={{ rotate: 15, scale: 1.1 }}
                  className="mb-4 text-primary flex justify-center"
                >
                  {f.icon}
                </motion.div>
                <h3 className="text-white font-bold mb-2 text-sm">{f.title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{f.text}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
