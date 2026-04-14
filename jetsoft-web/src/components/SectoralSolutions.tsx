import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Utensils, BookOpen, Shirt, ShoppingCart } from 'lucide-react';

const SectoralSolutions = () => {
  const sectors = [
    { name: "Market & Şarküteri", icon: <ShoppingBag size={24} />, desc: "Hızlı barkod, terazi ve stok takibi." },
    { name: "Restoran & Kafe", icon: <Utensils size={24} />, desc: "Adisyon, QR menü ve mutfak yönetimi." },
    { name: "Kırtasiye & Kitap", icon: <BookOpen size={24} />, desc: "Kitap veritabanı ve yayıncı takibi." },
    { name: "Giyim & Mağaza", icon: <Shirt size={24} />, desc: "Renk-beden takibi ve varyant yönetimi." },
    { name: "Hızlı Satış Noktaları", icon: <ShoppingCart size={24} />, desc: "Büfe ve kuruyemişçiler için pratik çözüm." }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.3 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring", stiffness: 120, damping: 20 }
    }
  };

  return (
    <section className="py-24 relative bg-black/40 border-y border-white/5 overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20 max-w-3xl mx-auto"
        >
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight">
            Her Sektöre <span className="text-primary underline decoration-primary/30 underline-offset-8">Özel</span> Çözüm.
          </h2>
          <p className="text-gray-400 text-sm md:text-lg">
            İşletmenizin türü ne olursa olsun, JetSoft sizin için en uygun iş akışını hazırlar.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6 items-stretch"
        >
          {sectors.map((sector) => (
            <motion.div
              key={sector.name}
              variants={itemVariants}
              whileHover={{
                y: -8,
                scale: 1.02,
                boxShadow: "0 10px 40px -10px rgba(59, 130, 246, 0.3)"
              }}
              className="glass p-8 rounded-[2rem] border-white/5 hover:border-primary/40 transition-colors text-center flex flex-col items-center h-full cursor-default group"
            >
              <motion.div
                whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.2 }}
                transition={{ duration: 0.5 }}
                className="mb-6 w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors cursor-pointer shadow-inner"
              >
                {sector.icon}
              </motion.div>
              <h3 className="text-base font-bold text-white mb-3 group-hover:text-primary transition-colors">{sector.name}</h3>
              <p className="text-gray-500 text-[11px] leading-relaxed group-hover:text-gray-400 transition-colors">
                {sector.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default SectoralSolutions;
