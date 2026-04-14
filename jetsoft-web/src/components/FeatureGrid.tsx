import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Shield, BarChart, Smartphone, Cloud, Headphones } from 'lucide-react';

const FeatureGrid = () => {
  const features = [
    {
      title: "Hızlı Satış & Kasa",
      text: "Terazi ve barkod okuyucu entegrasyonuyla saniyeler içinde takılmadan işlem yapın.",
      icon: <Zap size={28} className="text-secondary" />
    },
    {
      title: "Akıllı Stok Yönetimi",
      text: "Otomatik kritik stok uyarıları, varyant takibi ve detaylı sayım raporları.",
      icon: <BarChart size={28} className="text-primary" />
    },
    {
      title: "e-Dönüşüm Rehberi",
      text: "Tek tıkla e-Fatura, e-Arşiv ve e-İrsaliye gönderimi. Kesintisiz EDM Bilişim entegrasyonu.",
      icon: <Shield size={28} className="text-secondary" />
    },
    {
      title: "Mobil Raporlama",
      text: "Cep telefonundan anlık ciro, şube karşılaştırma, kar-zarar ve personel takibi.",
      icon: <Smartphone size={28} className="text-primary" />
    },
    {
      title: "Bulut Yedekleme",
      text: "Verileriniz bulut sunucularda anlık olarak güvenle yedeklenir, asla veri kaybetmezsiniz.",
      icon: <Cloud size={28} className="text-primary" />
    },
    {
      title: "7/24 Teknik Destek",
      text: "WhatsApp, telefon veya uzak masaüstü bağlantısı ile beklemeden anında çözüm.",
      icon: <Headphones size={28} className="text-secondary" />
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 30 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 100, damping: 15 }
    }
  };

  return (
    <section className="py-32 relative overflow-hidden">
      {/* Background Decor */}
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
        className="absolute right-[-10%] top-1/4 w-[600px] h-[600px] bg-primary/10 blur-[150px] rounded-full -z-10" 
      />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row items-end justify-between mb-20 gap-12 border-b border-white/5 pb-10">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-3xl"
          >
            <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
              İşletmenizi <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Uçtan Uca</span> Dijitalleştiriyoruz.
            </h2>
            <p className="text-gray-400 text-lg md:text-xl font-medium">
              Sadece bir yazılım değil, işletmenizi geleceğe taşıyacak ve rekabet gücünüzü artıracak kapsamlı bir dijital dönüşüm ortağıyız.
            </p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 50, delay: 0.3 }}
            className="hidden lg:flex w-24 h-24 bg-gradient-to-tr from-primary to-secondary rounded-[2rem] rotate-12 blur-2xl opacity-30 items-center justify-center"
          >
            <Zap size={48} className="text-white opacity-50" />
          </motion.div>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              whileHover={{ 
                y: -10,
                boxShadow: "0 20px 40px -15px rgba(59, 130, 246, 0.4)" 
              }}
              className="glass p-10 rounded-[2rem] hover:border-primary/30 hover:bg-white/5 transition-colors duration-300 group relative overflow-hidden cursor-default"
            >
              {/* Card Highlight */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <motion.div 
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.6 }}
                className="mb-8 w-16 h-16 flex items-center justify-center bg-black/40 rounded-2xl group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all duration-300 border border-white/10"
              >
                {feature.icon}
              </motion.div>
              <h3 className="text-2xl font-bold text-white mb-4 tracking-tight group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="text-gray-400 leading-relaxed text-sm md:text-base group-hover:text-gray-300 transition-colors">
                {feature.text}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeatureGrid;
