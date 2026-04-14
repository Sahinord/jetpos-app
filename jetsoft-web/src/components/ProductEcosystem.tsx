import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, BarChart2, Smartphone, Monitor, Tag, CircleCheck, ArrowRight, CreditCard } from 'lucide-react';

interface ProductEcosystemProps {
  onProductClick: (id: string) => void;
}

const ProductEcosystem: React.FC<ProductEcosystemProps> = ({ onProductClick }) => {
  const products = [
    {
      id: "jetpos",
      name: "JetPOS",
      description: "Masaüstü Barkodlu Satış ve Otomasyon Sistemi. İşletmenizin kalbi.",
      icon: <Monitor size={32} className="text-primary" />,
      tag: "Amiral Gemisi",
      features: ["Hızlı Satış", "Stok Yönetimi", "Cari Takip"],
      color: "primary"
    },
    {
      id: "jetreporting",
      name: "JetReporting",
      description: "Patronun cebindeki anlık ciro ve stok raporlama uygulaması.",
      icon: <BarChart2 size={32} className="text-secondary" />,
      tag: "Mobil Güç",
      features: ["Anlık Ciro", "Kritik Stok", "Personel Performans"],
      color: "secondary"
    },
    {
      id: "jetmenu",
      name: "JetMenu",
      description: "Restoranlar için QR Menü ve Dijital Sipariş Sistemi. Temassız hız.",
      icon: <Smartphone size={32} className="text-primary" />,
      tag: "Girişimci",
      features: ["QR Menü", "Sipariş Takip", "Mutfak Paneli"],
      color: "primary"
    },
    {
      id: "jetlabel",
      name: "JetLabel",
      description: "En gelişmiş etiket tasarım ve baskı modülü. Her modele uyumlu.",
      icon: <Tag size={32} className="text-secondary" />,
      tag: "İnovasyon",
      features: ["Tasarım Editörü", "Sınırsız Şablon", "Tüm Yazıcılar"],
      color: "secondary"
    },
    {
      id: "jetpay",
      name: "JetPay",
      description: "Güvenli ve hızlı tahsilat yönetimi. Banka entegreli çözüm.",
      icon: <CreditCard size={32} className="text-primary" />,
      tag: "Finans",
      features: ["Temassız Ödeme", "Banka Entegrasyonu", "Anlık Rapor"],
      color: "primary"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 40, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring", stiffness: 100, damping: 20 }
    }
  };

  return (
    <section className="py-32 relative overflow-hidden bg-white/5 border-y border-white/5">
      {/* Decorative Blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-primary/5 blur-[120px] rounded-full -z-10" />

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-24"
        >
          <p className="text-secondary font-black tracking-[0.4em] uppercase text-[10px] mb-4">
            Tam Kapsamlı Ekosistem
          </p>
          <h2 className="text-4xl md:text-5xl font-black text-white leading-tight max-w-2xl mx-auto">
            JetSoft Çözümleriyle <br />
            <span className="text-primary">Dijital Çağı Yakalayın.</span>
          </h2>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 max-w-6xl mx-auto"
        >
          {products.map((product) => (
            <motion.div
              key={product.id}
              variants={cardVariants}
              onClick={() => onProductClick(product.id)}
              whileHover={{
                y: -10,
                scale: 1.02,
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
              }}
              className="glass p-12 rounded-[2.5rem] relative overflow-hidden h-full flex flex-col group cursor-pointer"
            >
              <div className="absolute top-8 right-8 text-white/5 group-hover:text-white/10 transition-all duration-500 scale-150 rotate-12 group-hover:rotate-0">
                {product.icon}
              </div>

              <div className="mt-8 relative z-10">
                <div className="inline-flex px-3 py-1 rounded-full bg-white/5 text-[9px] uppercase font-bold text-gray-400 mb-8 w-fit border border-white/10 group-hover:border-primary/30 transition-colors">
                  {product.tag}
                </div>

                <h3 className="text-3xl font-black text-white mb-6 group-hover:text-primary transition-colors duration-300">{product.name}</h3>
                <p className="text-gray-400 text-sm md:text-base mb-10 leading-relaxed">
                  {product.description}
                </p>

                <div className="flex flex-wrap gap-x-6 gap-y-4 mb-12">
                  {product.features.map((f, idx) => (
                    <motion.div
                      key={f}
                      whileHover={{ x: 5 }}
                      className="flex items-center gap-2 text-xs font-bold text-gray-300"
                    >
                      <CircleCheck size={16} className={`text-${product.color}`} />
                      {f}
                    </motion.div>
                  ))}
                </div>

                <div className="mt-auto">
                  <button className="flex items-center gap-2 text-white text-xs font-black uppercase tracking-widest group-hover:gap-5 transition-all duration-300">
                    Detaylı İncele <ArrowRight size={18} className={`text-${product.color}`} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default ProductEcosystem;
