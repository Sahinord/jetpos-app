"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus, Minus, Search, Sparkles, Wallet, Rocket,
    Cable, ShieldCheck, LayoutGrid
} from "lucide-react";

type Category = "genel" | "paketler" | "kurulum" | "entegrasyon" | "guvenlik";

const CATEGORIES: { id: Category | "all"; label: string; Icon: React.ElementType }[] = [
    { id: "all", label: "Tümü", Icon: LayoutGrid },
    { id: "genel", label: "Genel", Icon: Sparkles },
    { id: "paketler", label: "Paketler & Ödeme", Icon: Wallet },
    { id: "kurulum", label: "Kurulum & Geçiş", Icon: Rocket },
    { id: "entegrasyon", label: "Donanım & Entegrasyon", Icon: Cable },
    { id: "guvenlik", label: "Veri & Güvenlik", Icon: ShieldCheck },
];

const faqs: { question: string; answer: string; category: Category }[] = [
    /* ── GENEL ─────────────────────────────────────── */
    {
        category: "genel",
        question: "JetPOS nedir, hangi cihazlarda çalışır?",
        answer: "JetPOS; satış (POS), stok, muhasebe, personel ve raporlamayı tek panelde toplayan bulut tabanlı bir işletme yönetim platformudur. Windows bilgisayarlarda masaüstü uygulama olarak, Android ve iOS cihazlarda ise tarayıcı üzerinden çalışır. Ayrıca telefonunuzu barkod okuyucuya dönüştüren mobil arayüzü sayesinde ek donanım olmadan da kullanmaya başlayabilirsiniz."
    },
    {
        category: "genel",
        question: "JetPOS'u kullanmak için internet bağlantısı şart mı?",
        answer: "Hayır. JetPOS'un offline satış özelliği sayesinde internet kesilse bile satış yapmaya devam edersiniz; kesinti sırasında yapılan satışlar cihazınızda güvenle saklanır ve bağlantı geri geldiğinde otomatik olarak buluta aktarılır. Raporlama, çoklu şube senkronizasyonu ve e-fatura gibi bulut özellikleri için internet bağlantısı gereklidir."
    },
    {
        category: "genel",
        question: "JetPOS hangi sektörlerde kullanılabilir?",
        answer: "Market, bakkal, kasap, manav, kırtasiye, oyuncak, elektronik, kozmetik, giyim, ayakkabı ve tekstil gibi perakende işletmelerin tamamında kullanılabilir. Restoran, kafe ve fast-food işletmeleri için masa yönetimi (adisyon), mutfak ekranı (KDS) ve JetQR dijital menü gibi sektöre özel modüller sunuyoruz. Fiyatlandırma sayfamızdaki sektör seçici ile işletme tipinize özel paketleri görebilirsiniz."
    },
    {
        category: "genel",
        question: "14 gün ücretsiz deneme nasıl çalışıyor?",
        answer: "Kredi kartı bilgisi gerekmeden 14 gün boyunca JetPOS'u tüm temel özellikleriyle deneyebilirsiniz. Deneme süresi sonunda dilediğiniz pakete geçebilir veya hiçbir ücret ödemeden bırakabilirsiniz. Deneme süresince eklediğiniz ürünler ve satış verileri, pakete geçtiğinizde aynen korunur."
    },
    /* ── PAKETLER & ÖDEME ──────────────────────────── */
    {
        category: "paketler",
        question: "JetStart ile JetPro arasındaki temel fark ne?",
        answer: "JetStart; 1 kullanıcılı, aylık taahhütsüz başlangıç paketidir. Hızlı satış, offline mod, barkodlu satış, stok uyarıları ve temel raporları içerir. JetPro ise yıllık ödemeyle %30 tasarruf sağlar ve 3 kullanıcıya kadar destekler; ek olarak depo yönetimi, cari hesap takibi, kasa & banka işlemleri, fatura & irsaliye, yapay zeka analizleri (Kâr Pilotu, Akıllı Sepet), müşteri sadakat sistemi ve personel vardiya takibi içerir."
    },
    {
        category: "paketler",
        question: "JetMax'ın \"2 yıl öde, 3 yıl kullan\" modeli nasıl çalışır?",
        answer: "JetMax'ta 2 yıllık ödeme yaparsınız, 1 yıl ek kullanım hediye edilir; toplamda 3 yıl kesintisiz kullanırsınız. Pakete sınırsız kullanıcı, 3 şubeye kadar çoklu şube desteği, masa yönetimi, mutfak ekranı (KDS), tüm pazaryeri entegrasyonları ve JetQR dijital menü dahildir. Ayrıca barkod okuyucu hediyeli olarak gönderilir ve vade farksız 3 taksit imkânı vardır."
    },
    {
        category: "paketler",
        question: "Kaç ürün tanımlayabilirim?",
        answer: "JetStart pakette 500 ürün limiti bulunur; küçük işletmelerin büyük çoğunluğu için fazlasıyla yeterlidir. JetPro ve üzeri paketlerde ürün sayısı sınırsızdır. Tüm paketlerde kategori, varyant (renk, beden vb.) ve barkod tanımlamaları sınırsız şekilde yapılabilir."
    },
    {
        category: "paketler",
        question: "Paketimi sonradan yükseltebilir miyim?",
        answer: "Evet, dilediğiniz zaman üst pakete geçebilirsiniz. Yükseltme anında mevcut verileriniz (ürünler, satış geçmişi, cari hesaplar) aynen korunur ve yeni özellikler hesabınıza tanımlanır. Kalan süreniz yeni paket fiyatına oranlanarak mahsup edilir; destek ekibimiz geçişi sizin için ücretsiz gerçekleştirir."
    },
    {
        category: "paketler",
        question: "Aboneliği iptal edersem verilerim ne olur?",
        answer: "İptal talebinizden sonra 30 gün boyunca verilerinize erişmeye ve Excel/CSV olarak dışa aktarmaya devam edebilirsiniz. 30 günün sonunda tüm verileriniz sistemlerimizden güvenli biçimde ve kalıcı olarak silinir. Verilerinizi hiçbir zaman rehin tutmayız — istediğiniz an alıp gidebilirsiniz."
    },
    /* ── KURULUM & GEÇİŞ ───────────────────────────── */
    {
        category: "kurulum",
        question: "Mevcut sistemimden JetPOS'a geçiş nasıl olur?",
        answer: "Ekibimiz ücretsiz geçiş desteği sağlar. Ürün listelerinizi, müşteri/cari verilerinizi ve stok bilgilerinizi Excel veya CSV dosyalarıyla içe aktarıyoruz; eski sisteminizden veri çekme konusunda da yardımcı oluyoruz. Geçiş ortalama 1–3 iş günü sürer ve bu süreçte mevcut sisteminizi kullanmaya devam edebilirsiniz — kesinti yaşamazsınız."
    },
    {
        category: "kurulum",
        question: "Kurulum için teknik bilgi gerekir mi?",
        answer: "Hayır. JetPOS kurulum sihirbazı sizi adım adım yönlendirir: işletme bilgilerinizi girer, ürünlerinizi ekler (veya içe aktarır) ve satışa başlarsınız. Ortalama kurulum 15–30 dakika sürer. Takıldığınız her noktada 7/24 destek ekibimiz uzaktan bağlantıyla ücretsiz kurulum desteği verir; JetPro ve üzeri paketlerde birebir eğitim de sunuyoruz."
    },
    {
        category: "kurulum",
        question: "E-Fatura geçiş süreci ne kadar sürer?",
        answer: "JetPOS'un QNB eFinans entegrasyonu sayesinde süreç oldukça hızlıdır. Mali mühür veya e-imza başvurunuz tamamsa, gerekli belgeler iletildikten sonra genellikle 24–48 saat içinde e-fatura ve e-arşiv fatura kesmeye başlayabilirsiniz. Başvuru evraklarının hazırlanmasından ilk faturanın kesilmesine kadar tüm süreçte ekibimiz ücretsiz destek verir."
    },
    /* ── DONANIM & ENTEGRASYON ─────────────────────── */
    {
        category: "entegrasyon",
        question: "El terminali veya barkod okuyucu satın almam gerekiyor mu?",
        answer: "Hayır! JetPOS, herhangi bir Android veya iOS telefonu barkod okuyucuya ve el terminaline dönüştürür — mevcut telefonlarınızla anında kullanmaya başlayabilirsiniz. Dilerseniz USB/Bluetooth barkod okuyucularla da sorunsuz çalışır; JetMax paketinde profesyonel barkod okuyucu hediye olarak gönderilir."
    },
    {
        category: "entegrasyon",
        question: "Hangi donanımlarla uyumlu?",
        answer: "JetPOS; termal fiş yazıcıları, barkod etiket yazıcıları, nakit çekmeceleri ve müşteri ekranları (CFD) ile uyumludur. Fiş şablonunuzu logo ve vergi bilgilerinizle özelleştirebilir, ürün etiketlerinizi ve barkodlarınızı doğrudan sistem üzerinden yazdırabilirsiniz. Mevcut donanımınızın uyumluluğunu öğrenmek için destek ekibimize model bilgisini iletmeniz yeterli."
    },
    {
        category: "entegrasyon",
        question: "Hangi pazaryeri ve yemek platformlarıyla entegre?",
        answer: "JetMax ve üzeri paketlerde Trendyol Pazaryeri, Trendyol GO & Yemek, Yemeksepeti, Getir ve Hepsiburada & HepsiJet entegrasyonları bulunur. Siparişler otomatik olarak panelinize düşer, stoklarınız tüm kanallarda eşzamanlı güncellenir. Kurumsal pakette özel API erişimi ile kendi sistemlerinizi veya ERP yazılımınızı da bağlayabilirsiniz."
    },
    {
        category: "entegrasyon",
        question: "Farklı şubelerimi tek bir yerden yönetebilir miyim?",
        answer: "Evet! JetMax'ta 3 şubeye kadar, Kurumsal pakette ise sınırsız şube desteği bulunur. Tüm şubelerinizin stoklarını, satışlarını, kasa hareketlerini ve personel performansını tek yönetici panelinden gerçek zamanlı takip edebilirsiniz. Şubeler arası stok transferi ve şube bazlı fiyatlandırma da desteklenir."
    },
    /* ── VERİ & GÜVENLİK ───────────────────────────── */
    {
        category: "guvenlik",
        question: "Verilerim ne kadar güvende?",
        answer: "Verileriniz banka düzeyinde şifreleme ile korunan, dünyanın önde gelen bulut altyapılarından birinde barındırılır. Tüm veri trafiği SSL/TLS ile şifrelenir, düzenli yedeklemeler otomatik alınır. Cihazınız bozulsa, çalınsa veya değişse bile verileriniz bulutta güvende kalır — yeni cihazınızdan giriş yaparak kaldığınız yerden devam edersiniz."
    },
    {
        category: "guvenlik",
        question: "Personelim hangi verilere erişebilir?",
        answer: "Rol bazlı yetki sistemi ile her personelin neyi görüp neyi yapabileceğini siz belirlersiniz: kasiyer yalnızca satış ekranını görürken, yöneticiler rapor ve maliyetlere erişebilir. Personeller kendilerine özel PIN ile giriş yapar; JetMax ve üzeri paketlerde sistem kayıtları (Audit Log) ile kimin ne zaman hangi işlemi yaptığını da izleyebilirsiniz."
    },
    {
        category: "guvenlik",
        question: "Verilerimi dışa aktarabilir miyim?",
        answer: "Evet. Ürün listeleri, satış raporları, cari hesap ekstreleri ve stok verilerinizi dilediğiniz zaman Excel veya PDF olarak dışa aktarabilirsiniz. Verileriniz size aittir — hem günlük operasyonda hem de sistemden ayrılmak isterseniz tüm verilerinizi kolayca alabilirsiniz."
    },
];

export default function FAQ() {
    const [openKey, setOpenKey] = useState<string | null>(null);
    const [category, setCategory] = useState<Category | "all">("all");
    const [search, setSearch] = useState("");

    const normalizedSearch = search.trim().toLocaleLowerCase("tr");
    // Arama varken kategori filtresi devre dışı: kullanıcı aradığını hangi kategoride olursa olsun bulmalı
    const visibleFaqs = faqs.filter(f => {
        if (normalizedSearch) {
            return (
                f.question.toLocaleLowerCase("tr").includes(normalizedSearch) ||
                f.answer.toLocaleLowerCase("tr").includes(normalizedSearch)
            );
        }
        return category === "all" || f.category === category;
    });

    return (
        <div>
            {/* Search */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                style={{ maxWidth: "560px", margin: "0 auto 1.75rem", position: "relative" }}
            >
                <Search style={{
                    position: "absolute", left: "1.1rem", top: "50%", transform: "translateY(-50%)",
                    width: "1.1rem", height: "1.1rem", color: "#9AA7DF", pointerEvents: "none",
                }} />
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Sorunuzu yazın… (ör. e-fatura, şube, barkod)"
                    style={{
                        width: "100%",
                        padding: "1rem 1.25rem 1rem 3rem",
                        background: "white",
                        border: "1.5px solid rgba(120,134,199,0.2)",
                        borderRadius: "1rem",
                        color: "#111827",
                        fontSize: "0.95rem",
                        outline: "none",
                        fontFamily: "inherit",
                        boxSizing: "border-box",
                        boxShadow: "0 2px 12px rgba(90,101,159,0.06)",
                        transition: "border-color 0.2s",
                    }}
                    onFocus={e => { e.target.style.borderColor = "#7886C7"; }}
                    onBlur={e => { e.target.style.borderColor = "rgba(120,134,199,0.2)"; }}
                />
            </motion.div>

            {/* Category pills */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.05 }}
                style={{
                    display: "flex", flexWrap: "wrap", justifyContent: "center",
                    gap: "0.5rem", marginBottom: "2.5rem",
                }}
            >
                {CATEGORIES.map(c => {
                    const active = category === c.id;
                    return (
                        <button
                            key={c.id}
                            onClick={() => setCategory(c.id)}
                            style={{
                                display: "inline-flex", alignItems: "center", gap: "0.4rem",
                                padding: "0.5rem 1rem",
                                borderRadius: "9999px",
                                border: `1px solid ${active ? "#7886C7" : "rgba(120,134,199,0.2)"}`,
                                background: active ? "#7886C7" : "white",
                                color: active ? "white" : "#4B5563",
                                fontWeight: 600, fontSize: "0.82rem",
                                cursor: "pointer", fontFamily: "inherit",
                                transition: "all 0.2s ease",
                            }}
                        >
                            <c.Icon style={{ width: "0.85rem", height: "0.85rem" }} />
                            {c.label}
                        </button>
                    );
                })}
            </motion.div>

            {/* Accordion */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                {visibleFaqs.length === 0 && (
                    <div style={{
                        textAlign: "center", padding: "3rem 1rem",
                        background: "white", border: "1px dashed rgba(120,134,199,0.3)",
                        borderRadius: "1.25rem", color: "#6B7280",
                    }}>
                        <p style={{ fontWeight: 600, color: "#374151", marginBottom: "0.4rem" }}>Sonuç bulunamadı</p>
                        <p style={{ fontSize: "0.9rem" }}>
                            Farklı bir kelimeyle aramayı deneyin veya{" "}
                            <a href="/iletisim" style={{ color: "#7886C7", fontWeight: 600, textDecoration: "none" }}>bize ulaşın</a>.
                        </p>
                    </div>
                )}
                {visibleFaqs.map((faq) => {
                    const key = faq.question;
                    const isOpen = openKey === key;
                    return (
                        <motion.div
                            key={key}
                            layout
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25 }}
                            style={{
                                background: "white",
                                border: `1px solid ${isOpen ? "rgba(120,134,199,0.45)" : "rgba(120,134,199,0.15)"}`,
                                borderRadius: "1.1rem",
                                overflow: "hidden",
                                boxShadow: isOpen ? "0 8px 28px rgba(90,101,159,0.12)" : "0 1px 2px rgba(17,24,39,0.04)",
                                transition: "border-color 0.25s ease, box-shadow 0.25s ease",
                            }}
                        >
                            <button
                                onClick={() => setOpenKey(isOpen ? null : key)}
                                style={{
                                    width: "100%",
                                    padding: "1.25rem 1.5rem",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    textAlign: "left",
                                    gap: "1rem",
                                    fontFamily: "inherit",
                                }}
                            >
                                <span style={{
                                    color: isOpen ? "#5A659F" : "#111827",
                                    fontWeight: 700,
                                    fontSize: "1rem",
                                    transition: "color 0.25s",
                                    lineHeight: 1.45,
                                }}>
                                    {faq.question}
                                </span>
                                <div style={{
                                    width: "2rem", height: "2rem", flexShrink: 0,
                                    borderRadius: "50%",
                                    background: isOpen ? "#7886C7" : "rgba(120,134,199,0.08)",
                                    border: `1px solid ${isOpen ? "#7886C7" : "rgba(120,134,199,0.2)"}`,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    transition: "all 0.25s",
                                }}>
                                    {isOpen ? (
                                        <Minus style={{ width: "1rem", height: "1rem", color: "white" }} />
                                    ) : (
                                        <Plus style={{ width: "1rem", height: "1rem", color: "#7886C7" }} />
                                    )}
                                </div>
                            </button>

                            <AnimatePresence>
                                {isOpen && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.28 }}
                                    >
                                        <div style={{
                                            padding: "0 1.5rem 1.5rem",
                                            color: "#4B5563",
                                            lineHeight: 1.75,
                                            fontSize: "0.95rem",
                                        }}>
                                            {faq.answer}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>

            <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                style={{ textAlign: "center", marginTop: "3rem" }}
            >
                <p style={{ color: "#6B7280", fontSize: "0.95rem" }}>
                    Başka bir sorunuz mu var?{" "}
                    <a href="/iletisim" style={{ color: "#7886C7", fontWeight: 700, textDecoration: "none" }}>
                        Bize ulaşın
                    </a>
                </p>
            </motion.div>
        </div>
    );
}
