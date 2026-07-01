"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Check, Zap, Star, Building2, ArrowRight } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Starter",
    icon: Zap,
    tag: null,
    price: { monthly: 985, yearly: 790 },
    period: "Aylık · Taahhütsüz",
    description: "Küçük işletmeler için esnek giriş paketi. İstediğiniz zaman iptal edin.",
    color: "#7886C7",
    popular: false,
    features: [
      "1 Kullanıcı",
      "JetKasa Satış Sistemi",
      "Barkodlu Satış",
      "Stok Takibi",
      "Kasa & Gün Sonu",
      "Temel Raporlama",
      "7/24 Teknik Destek",
    ],
    notIncluded: ["E-Fatura & E-Arşiv", "Yapay Zeka Analizleri", "Çoklu Şube"],
    cta: "Ücretsiz Dene",
  },
  {
    name: "JetScale",
    icon: Star,
    tag: "EN POPÜLER",
    price: { monthly: 1249, yearly: 985 },
    period: "Yıllık · %21 tasarruf",
    description: "Büyüyen işletmeler için tam donanımlı paket. E-Fatura dahil.",
    color: "#8b5cf6",
    popular: true,
    features: [
      "3 Kullanıcı",
      "JetKasa Satış Sistemi",
      "Barkodlu Satış",
      "Gelişmiş Stok & Depo",
      "E-Fatura & E-Arşiv",
      "Yapay Zeka Analizleri",
      "Cari Hesap Yönetimi",
      "Personel Takibi",
      "7/24 Öncelikli Destek",
    ],
    notIncluded: ["Çoklu Şube", "Özel API Erişimi"],
    cta: "Ücretsiz Dene",
  },
  {
    name: "Pro",
    icon: Building2,
    tag: "EN İYİ DEĞER",
    price: { monthly: 543, yearly: 394 },
    period: "2 Yıl + 1 Yıl Hediye",
    description: "3 yıl kullanım, barkod okuyucu hediye. Sınırsız kullanıcı.",
    color: "#7886C7",
    popular: false,
    features: [
      "Sınırsız Kullanıcı",
      "Tüm Büyüme özellikleri",
      "Çoklu Şube (3'e kadar)",
      "KDV & Mizan Raporları",
      "Trendyol Entegrasyonu",
      "İkas Entegrasyonu",
      "Ücretsiz Kurulum & Geçiş",
      "Barkod Okuyucu Hediye",
      "+1 Yıl Kullanım Hediye",
    ],
    notIncluded: [],
    cta: "Bu Planı Seç",
    badge: "3 yıl öde, ücretsiz başla",
  },
];

export default function Pricing() {
  const [yearly, setYearly] = useState(true);

  return (
    <section
      id="pricing"
      className="relative py-28 bg-[#F8FAFC] overflow-hidden"
    >
      {/* Subtle Radial Glow Spot at the top */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[300px] pointer-events-none z-0"
        style={{ background: "radial-gradient(circle at center, rgba(120, 134, 199, 0.08) 0%, transparent 70%)" }}
      />

      <div className="max-w-[1400px] mx-auto px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-[#7886C7]/10 text-[#7886C7] text-sm font-bold tracking-wide mb-6">
            Şeffaf Fiyatlandırma
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-[#111827] tracking-tight mb-6 leading-tight">
            İşletmenize Uygun <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7886C7] to-[#9AA7DF]">Planı Seçin</span>
          </h2>
          <p className="text-[#4B5563] text-lg md:text-xl max-w-2xl mx-auto mb-10 font-medium">
            İşletmeniz büyüdükçe sizinle birlikte ölçeklenen esnek fiyatlandırma. 14 gün ücretsiz deneyin, kredi kartı gerekmez.
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-2 p-1.5 bg-white border border-[#E5E7EB] rounded-full shadow-sm">
            <button
              onClick={() => setYearly(false)}
              className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all duration-300 ${!yearly ? 'bg-[#111827] text-white shadow-md' : 'text-[#4B5563] hover:text-[#111827]'}`}
            >
              Aylık Ödeme
            </button>
            <button
              onClick={() => setYearly(true)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm transition-all duration-300 ${yearly ? 'bg-[#111827] text-white shadow-md' : 'text-[#4B5563] hover:text-[#111827]'}`}
            >
              Yıllık Ödeme
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${yearly ? 'bg-[#7886C7]/20 text-[#9AA7DF]' : 'bg-[#7886C7] text-white'}`}>
                %20+ İndirim
              </span>
            </button>
          </div>
        </motion.div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative flex flex-col bg-white rounded-[24px] p-8 transition-all duration-300 hover:-translate-y-2 group
                                ${plan.popular ? 'border-2 border-[#8b5cf6] shadow-xl shadow-[#8b5cf6]/10' : 'border border-[#E5E7EB] hover:border-[#9AA7DF]/50 hover:shadow-2xl hover:shadow-[#7886C7]/10'}
                            `}
            >
              {/* Popular Badge */}
              {plan.tag && (
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-black text-white tracking-widest whitespace-nowrap shadow-md
                                    ${plan.popular ? 'bg-gradient-to-r from-[#8b5cf6] to-[#a78bfa]' : 'bg-gradient-to-r from-[#7886C7] to-[#9AA7DF]'}
                                `}>
                  {plan.tag === "EN İYİ DEĞER" ? "⚡ EN İYİ DEĞER" : `⭐ ${plan.tag}`}
                </div>
              )}

              {/* Plan Header */}
              <div className="mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#F8FAFC] border border-[#E5E7EB] group-hover:bg-[#7886C7]/5 group-hover:border-[#7886C7]/20 transition-colors">
                    <plan.icon className="w-6 h-6" style={{ color: plan.color }} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-[#111827]">{plan.name}</h3>
                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: plan.color }}>{plan.period}</p>
                  </div>
                </div>
                <p className="text-[#4B5563] text-sm leading-relaxed">{plan.description}</p>
              </div>

              {/* Price */}
              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold text-[#4B5563]">₺</span>
                  <span className="text-5xl font-black text-[#111827] tracking-tight">
                    {yearly ? plan.price.yearly : plan.price.monthly}
                  </span>
                  <span className="text-sm font-medium text-[#6B7280]">/ay</span>
                </div>
                {yearly && (
                  <p className="text-sm font-bold text-[#7886C7] mt-2">
                    Yıllık ödemede ₺{((plan.price.monthly - plan.price.yearly) * 12).toLocaleString("tr-TR")} tasarruf
                  </p>
                )}
                {plan.badge && (
                  <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-[#7886C7]/10 border border-[#7886C7]/20 rounded-full text-xs font-bold text-[#7886C7]">
                    🎁 {plan.badge}
                  </div>
                )}
              </div>

              {/* CTA Button */}
              <Link
                href="/demo"
                className={`w-full py-4 rounded-xl font-bold text-center transition-all duration-300 mb-8 flex items-center justify-center gap-2
                                    ${plan.popular
                    ? 'bg-[#8b5cf6] hover:bg-[#7c3aed] text-white shadow-lg shadow-[#8b5cf6]/25 hover:shadow-xl hover:shadow-[#8b5cf6]/40'
                    : plan.name === 'Pro'
                      ? 'bg-[#111827] hover:bg-black text-white shadow-lg shadow-black/10 hover:shadow-xl'
                      : 'bg-[#F8FAFC] hover:bg-[#E5E7EB] text-[#111827] border border-[#E5E7EB]'
                  }
                                `}
              >
                {plan.cta}
              </Link>

              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-[#E5E7EB] to-transparent mb-8" />

              {/* Features */}
              <div className="flex flex-col gap-4 flex-1">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-0.5 w-5 h-5 rounded-full bg-[#7886C7]/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-[#7886C7]" />
                    </div>
                    <span className="text-[#374151] text-sm font-medium leading-snug">{feature}</span>
                  </div>
                ))}
                {plan.notIncluded.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3 opacity-50">
                    <div className="mt-0.5 w-5 h-5 rounded-full bg-[#E5E7EB] flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-black text-[#6B7280]">✕</span>
                    </div>
                    <span className="text-[#6B7280] text-sm font-medium line-through leading-snug">{feature}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Custom Package CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="max-w-4xl mx-auto mt-20"
        >
          <div className="bg-white border border-[#E5E7EB] rounded-[24px] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl shadow-[#7886C7]/5 relative overflow-hidden group">
            {/* Decorative background element */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#7886C7]/10 to-transparent rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform duration-700" />

            <div className="relative z-10 text-center md:text-left flex-1">
              <h3 className="text-2xl md:text-3xl font-black text-[#111827] mb-3">
                Aradığınız paketi bulamadınız mı?
              </h3>
              <p className="text-[#4B5563] text-lg font-medium">
                İhtiyacın olan özellikleri kendin seç, sana özel paketi oluştur ve anında teklif al.
              </p>
            </div>
            <div className="relative z-10 shrink-0">
              <Link href="/paket-olustur"
                className="inline-flex items-center gap-3 bg-[#7886C7] hover:bg-[#5A659F] text-white px-8 py-4 rounded-xl font-bold transition-all duration-300 shadow-lg shadow-[#7886C7]/25 hover:shadow-xl hover:-translate-y-1"
              >
                <Zap className="w-5 h-5" />
                Kendi Paketini Oluştur
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Footer notes */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center mt-16 pb-8"
        >
          <Link href="/fiyatlandirma" className="inline-flex items-center gap-2 text-[#6B7280] hover:text-[#111827] font-bold text-sm transition-colors mb-6 group">
            Tüm plan karşılaştırmasını gör
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <p className="text-[#9CA3AF] text-sm font-medium">
            Tüm fiyatlara KDV dahil değildir. İstediğiniz zaman iptal edebilirsiniz.
            <br />
            <span className="opacity-80 mt-2 inline-block">
              * Yapay zeka özellikleri (stok tahmini, satış analizi vb.) kullanım bazlı token ücretlendirmesine tabidir ve plan fiyatlarına dahil değildir.
            </span>
          </p>
        </motion.div>
      </div>

      {/* Gradient transition at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-white to-transparent pointer-events-none z-10" />
    </section>
  );
}
