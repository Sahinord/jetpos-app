import React from 'react';
import { motion } from 'framer-motion';
import { Monitor, Printer, CircleCheck, ArrowRight } from 'lucide-react';

const HardwareSolutions = () => {
  const bundles = [
    {
      name: "Süpermarket Paketi",
      tag: "En Çok Tercih Edilen",
      price: "Özel Fiyat",
      icon: <Monitor className="text-primary" />,
      items: ["15.6' Dokunmatik Terminal", "Lazer Barkod Okuyucu", "80mm Termal Fiş Yazıcı", "Onaylı Terazi (Hassas)"],
      img: "https://images.unsplash.com/photo-1556742044-3c52d6e88c62?auto=format&fit=crop&q=80&w=800",
      color: "primary"
    },
    {
      name: "Restoran / Kafe Paketi",
      tag: "Profesyonel Sistem",
      price: "Özel Fiyat",
      icon: <Printer className="text-secondary" />,
      items: ["Adisyon Yazıcıları (Sıcak/Soğuk)", "Garson El Terminalleri", "Kasa Dokunmatik Monitör", "Mutfak Ekranı (KDS)"],
      img: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=800",
      color: "secondary"
    }
  ];

  return (
    <section className="py-32 relative bg-black/40 overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="flex flex-col items-center text-center mb-24 max-w-4xl mx-auto"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
            className="w-16 h-1.5 bg-gradient-to-r from-primary to-secondary mb-8 rounded-full"
          />
          <h2 className="text-5xl md:text-6xl font-black text-white mb-6 tracking-tight">
            Her Şey Dahil <span className="text-secondary">Donanım</span> Setleri.
          </h2>
          <p className="text-gray-400 text-lg md:text-xl font-medium">
            Sadece yazılım değil, ihtiyacınız olan tüm donanımları sektörün en kaliteli markalarıyla tek bir pakette sunuyoruz. Kurulumu biz yapıyoruz, size sadece kullanmak kalıyor.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-7xl mx-auto">
          {bundles.map((bundle, i) => (
            <motion.div
              key={bundle.name}
              initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50, scale: 0.95 }}
              whileInView={{ opacity: 1, x: 0, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ type: "spring", stiffness: 60, damping: 20, delay: i * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="glass rounded-[2.5rem] overflow-hidden group hover:border-white/10 transition-all shadow-xl"
            >
              <div className="flex flex-col md:flex-row h-full">
                <div className="md:w-[45%] relative overflow-hidden h-72 md:h-auto">
                  <motion.img
                    src={bundle.img}
                    alt={bundle.name}
                    whileHover={{ scale: 1.15 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="w-full h-full object-cover origin-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

                  {/* Image Overlay Content */}
                  <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between pointer-events-none">
                    <motion.div
                      whileHover={{ scale: 1.2, rotate: 10 }}
                      className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 pointer-events-auto"
                    >
                      {bundle.icon}
                    </motion.div>
                  </div>

                  <div className="absolute top-6 left-6 pointer-events-none">
                    <span className="px-3 py-1 bg-black/50 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-widest text-white border border-white/10">
                      {bundle.tag}
                    </span>
                  </div>
                </div>

                <div className="md:w-[55%] p-8 md:p-12 flex flex-col bg-black/20">
                  <h3 className="text-3xl font-black text-white mb-6 tracking-tight">{bundle.name}</h3>

                  <ul className="space-y-5 mb-10 flex-1">
                    {bundle.items.map((item, idx) => (
                      <motion.li
                        key={item}
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 + (idx * 0.1) }}
                        className="flex items-center gap-4 text-gray-300 font-medium"
                      >
                        <CircleCheck size={20} className={`text-${bundle.color} shrink-0`} />
                        <span>{item}</span>
                      </motion.li>
                    ))}
                  </ul>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn-primary w-full group py-4 text-lg mt-auto shadow-2xl flex items-center justify-center gap-2"
                  >
                    Teklif İste
                    <motion.div
                      initial={{ x: 0 }}
                      whileHover={{ x: 5 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <ArrowRight size={20} />
                    </motion.div>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HardwareSolutions;
