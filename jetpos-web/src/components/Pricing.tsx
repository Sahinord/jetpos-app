"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Check, Zap, Star, Building2, ArrowRight, Crown } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    id: "jetstart",
    name: "JetStart",
    icon: Zap,
    tag: null,
    priceMonthly: 1149,
    priceYearly: 1149,
    period: "Aylık · Taahhütsüz",
    description: "Küçük işletmeler için esnek başlangıç paketi. İstediğiniz zaman iptal edin.",
    color: "#7886C7",
    popular: false,
    taksit: null,
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
    cta: "14 Gün Ücretsiz Dene",
    ctaHref: "/demo",
  },
  {
    id: "jetpro",
    name: "JetPro",
    icon: Star,
    tag: "EN POPÜLER",
    priceMonthly: 1149,
    priceYearly: 799,
    period: "Yıllık · %30 tasarruf",
    description: "Büyüyen işletmeler için tam donanımlı paket. E-Fatura ve AI dahil.",
    color: "#7886C7",
    popular: true,
    taksit: "Vade Farksız 3 Taksit",
    features: [
      "3 Kullanıcı",
      "Tüm JetStart özellikleri",
      "E-Fatura & E-Arşiv",
      "Yapay Zeka Analizleri",
      "Depo Yönetimi",
      "Cari Hesap Yönetimi",
      "Personel Takibi",
      "7/24 Öncelikli Destek",
    ],
    notIncluded: ["Çoklu Şube"],
    cta: "Hemen Başla",
    ctaHref: "/demo",
  },
  {
    id: "jetmax",
    name: "JetMax",
    icon: Crown,
    tag: "EN İYİ DEĞER",
    priceMonthly: 549,
    priceYearly: 549,
    period: "2 Yıl Öde · 3 Yıl Kullan",
    description: "Çoklu şube, sınırsız kullanıcı ve barkod okuyucu hediye.",
    color: "#7886C7",
    popular: false,
    taksit: "Vade Farksız 3 Taksit",
    features: [
      "Sınırsız Kullanıcı",
      "Tüm JetPro özellikleri",
      "Çoklu Şube (3'e kadar)",
      "KDV & Mizan Raporları",
      "Trendyol GO Entegrasyonu",
      "Ücretsiz Kurulum & Geçiş",
      "Barkod Okuyucu Hediye",
      "+1 Yıl Kullanım Hediye",
    ],
    notIncluded: [],
    cta: "Hemen Başla",
    ctaHref: "/demo",
  },
];

export default function Pricing() {
  const [yearly, setYearly] = useState(true);

  return (
    <section id="pricing" className="relative py-28 bg-[#F8FAFC] overflow-hidden">
      <div
        className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[300px] pointer-events-none z-0"
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
            İşletmenize Uygun{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7886C7] to-[#9AA7DF]">
              Planı Seçin
            </span>
          </h2>
          <p className="text-[#4B5563] text-lg md:text-xl max-w-2xl mx-auto mb-10 font-medium">
            14 gün ücretsiz deneyin, kredi kartı gerekmez.
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-2 p-1.5 bg-white border border-[#E5E7EB] rounded-full shadow-sm">
            <button
              onClick={() => setYearly(false)}
              className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all duration-300 ${!yearly ? "bg-[#111827] text-white shadow-md" : "text-[#4B5563] hover:text-[#111827]"}`}
            >
              Aylık Ödeme
            </button>
            <button
              onClick={() => setYearly(true)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm transition-all duration-300 ${yearly ? "bg-[#111827] text-white shadow-md" : "text-[#4B5563] hover:text-[#111827]"}`}
            >
              Yıllık Ödeme
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${yearly ? "bg-[#7886C7]/20 text-[#9AA7DF]" : "bg-[#7886C7] text-white"}`}>
                %30 İndirim
              </span>
            </button>
          </div>
        </motion.div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => {
            const displayPrice = plan.id === "jetmax"
              ? plan.priceYearly
              : yearly ? plan.priceYearly : plan.priceMonthly;

            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative flex flex-col bg-white rounded-[24px] p-8 transition-all duration-300 hover:-translate-y-2 group
                  ${plan.popular
                    ? "border-2 border-[#7886C7] shadow-xl shadow-[#7886C7]/10"
                    : "border border-[#E5E7EB] hover:border-[#9AA7DF]/50 hover:shadow-2xl hover:shadow-[#7886C7]/10"
                  }`}
              >
                {/* Tag Badge */}
                {plan.tag && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-black text-white tracking-widest whitespace-nowrap shadow-md bg-gradient-to-r from-[#7886C7] to-[#9AA7DF]">
                    {plan.tag === "EN İYİ DEĞER" ? "⚡ EN İYİ DEĞER" : `⭐ ${plan.tag}`}
                  </div>
                )}

                {/* Taksit Badge */}
                {plan.taksit && (
                  <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E] text-[11px] font-bold whitespace-nowrap">
                    {plan.taksit}
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
                      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: plan.color }}>
                        {plan.id === "jetmax"
                          ? plan.period
                          : yearly ? "Yıllık · %30 tasarruf" : "Aylık · Taahhütsüz"}
                      </p>
                    </div>
                  </div>
                  <p className="text-[#4B5563] text-sm leading-relaxed">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="mb-8">
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold text-[#4B5563]">₺</span>
                    <span className="text-5xl font-black text-[#111827] tracking-tight">
                      {displayPrice}
                    </span>
                    <span className="text-sm font-medium text-[#6B7280]">/ay</span>
                  </div>
                  {plan.id === "jetpro" && yearly && (
                    <p className="text-sm text-[#9CA3AF] line-through mt-1">₺1.149/ay</p>
                  )}
                  {plan.id === "jetpro" && yearly && (
                    <p className="text-sm font-bold text-[#7886C7] mt-1">Yıllık ödemede ₺4.200 tasarruf</p>
                  )}
                  {plan.id === "jetmax" && (
                    <p className="text-sm font-bold text-[#7886C7] mt-2">2 yıl öde, 3 yıl kullan</p>
                  )}
                </div>

                {/* CTA Button */}
                <Link
                  href={plan.ctaHref}
                  className={`w-full py-4 rounded-xl font-bold text-center transition-all duration-300 mb-8 flex items-center justify-center gap-2
                    ${plan.popular
                      ? "bg-[#7886C7] hover:bg-[#5A659F] text-white shadow-lg shadow-[#7886C7]/25 hover:shadow-xl"
                      : plan.id === "jetmax"
                        ? "bg-[#111827] hover:bg-black text-white shadow-lg shadow-black/10 hover:shadow-xl"
                        : "bg-[#F8FAFC] hover:bg-[#E5E7EB] text-[#111827] border border-[#E5E7EB]"
                    }`}
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
                    <div key={i} className="flex items-start gap-3 opacity-40">
                      <div className="mt-0.5 w-5 h-5 rounded-full bg-[#E5E7EB] flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-black text-[#6B7280]">✕</span>
                      </div>
                      <span className="text-[#6B7280] text-sm font-medium line-through leading-snug">{feature}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Enterprise Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-6xl mx-auto mt-8"
        >
          <div className="bg-white border border-[#E5E7EB] rounded-[24px] p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-[#F8FAFC] border border-[#E5E7EB] shrink-0">
                <Building2 className="w-7 h-7 text-[#7886C7]" />
              </div>
              <div>
                <h3 className="text-xl font-black text-[#111827]">Kurumsal</h3>
                <p className="text-[#4B5563] text-sm mt-1">Çok şubeli zincirler ve büyük işletmeler için özel çözüm.</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {["Sınırsız Şube & Kullanıcı", "Özel API Erişimi", "ERP Entegrasyonu", "SLA Garantisi", "7/24 Telefon Desteği"].map((f, i) => (
                    <span key={i} className="px-3 py-1 bg-[#F8FAFC] border border-[#E5E7EB] rounded-full text-xs font-medium text-[#374151]">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="shrink-0">
              <Link
                href="/iletisim"
                className="inline-flex items-center gap-3 bg-[#111827] hover:bg-black text-white px-8 py-4 rounded-xl font-bold transition-all duration-300 shadow-lg whitespace-nowrap"
              >
                Bizi Arayın
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Custom Package CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="max-w-4xl mx-auto mt-8"
        >
          <div className="bg-white border border-[#E5E7EB] rounded-[24px] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl shadow-[#7886C7]/5 relative overflow-hidden group">
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
              <Link
                href="/paket-olustur"
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
            Tüm fiyatlara KDV dahil değildir. 3 taksitte vade farkı uygulanmaz, 4–6 taksitte taksit farkı müşteriye yansıtılır.
            <br />
            <span className="opacity-80 mt-2 inline-block">
              * Yapay zeka özellikleri kullanım bazlı ücretlendirmeye tabidir ve plan fiyatlarına dahil değildir.
            </span>
          </p>
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-white to-transparent pointer-events-none z-10" />
    </section>
  );
}
