import React from 'react';
import { motion } from 'framer-motion';

const InfiniteLoop = () => {
  const partners = [
    "EDM Bilişim", "Hugin", "Paraşüt", "QNB Finansbank", 
    "Trendyol", "Yemeksepeti", "Getir", "Bizim Toptan",
    "Gökbil", "Ziraat Bank", "Vakıfbank"
  ];

  return (
    <div className="py-24 relative overflow-hidden bg-black/60 border-y border-white/5">
      <div className="container mx-auto px-6 mb-16 text-center">
        <p className="text-gray-500 font-bold uppercase tracking-[0.3em] text-xs">GÜVENLE KULLANILAN ENTEGRASYONLARIMIZ</p>
      </div>

      <div className="flex overflow-hidden">
        <motion.div 
          initial={{ x: 0 }}
          animate={{ x: "-50%" }}
          transition={{ 
            duration: 40, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="flex flex-nowrap items-center gap-24 whitespace-nowrap"
        >
          {/* Loop set */}
          {[...partners, ...partners].map((partner, i) => (
            <div key={i} className="flex items-center gap-5 text-white/20 hover:text-white/60 transition-colors cursor-default select-none group">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center p-2 font-black italic text-sm group-hover:bg-primary/20 transition-colors">J</div>
              <span className="text-xl font-black md:text-3xl tracking-tighter uppercase">{partner}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Fade masks */}
      <div className="absolute inset-y-0 left-0 w-60 bg-gradient-to-r from-[#020817] to-transparent z-10" />
      <div className="absolute inset-y-0 right-0 w-60 bg-gradient-to-l from-[#020817] to-transparent z-10" />
    </div>
  );
};

export default InfiniteLoop;
