"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FileText, ChevronRight, ArrowUp, CheckCircle, AlertCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const sections = [
    { id: "genel", title: "1. Genel Koşullar" },
    { id: "hizmet", title: "2. Hizmet Tanımı" },
    { id: "lisans", title: "3. Kullanım Lisansı" },
    { id: "sorumluluk", title: "4. Kullanıcı Sorumlulukları" },
    { id: "odeme", title: "5. Ödeme ve Üyelik" },
    { id: "iptal", title: "6. İptal ve İade Koşulları" },
    { id: "fikri-mulkiyet", title: "7. Fikri Mülkiyet Hakları" },
    { id: "garanti", title: "8. Garanti ve Sorumluluk Reddi" },
    { id: "uyusmazlik", title: "9. Uyuşmazlıkların Çözümü" },
    { id: "iletisim", title: "10. İletişim" },
];

export default function TermsPage() {
    const [activeSection, setActiveSection] = useState("genel");
    const [showTop, setShowTop] = useState(false);

    useEffect(() => {
        const onScroll = () => {
            setShowTop(window.scrollY > 400);
            for (const s of [...sections].reverse()) {
                const el = document.getElementById(s.id);
                if (el && window.scrollY >= el.offsetTop - 120) {
                    setActiveSection(s.id);
                    break;
                }
            }
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const scrollTo = (id: string) => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const H2 = ({ id, children }: { id: string; children: React.ReactNode }) => (
        <h2 id={id} style={{
            fontSize: "1.5rem", fontWeight: 800, color: "white",
            marginBottom: "1rem", marginTop: "3rem",
            paddingTop: "1rem",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            paddingBottom: "0.75rem"
        }}>
            {children}
        </h2>
    );

    const P = ({ children }: { children: React.ReactNode }) => (
        <p style={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.85, marginBottom: "1rem", fontSize: "0.95rem" }}>
            {children}
        </p>
    );

    const Li = ({ children }: { children: React.ReactNode }) => (
        <li style={{
            color: "rgba(255,255,255,0.6)", lineHeight: 1.8, fontSize: "0.95rem",
            paddingLeft: "0.5rem", marginBottom: "0.5rem",
            listStyleType: "none", display: "flex", alignItems: "flex-start", gap: "0.6rem"
        }}>
            <ChevronRight style={{ width: "1rem", height: "1rem", color: "#3b82f6", flexShrink: 0, marginTop: "0.3rem" }} />
            <span>{children}</span>
        </li>
    );

    const InfoBox = ({ children, icon: Icon = CheckCircle, color = "#3b82f6" }: { children: React.ReactNode; icon?: any; color?: string }) => (
        <div style={{
            background: `${color}10`, border: `1px solid ${color}30`,
            borderRadius: "1rem", padding: "1.5rem", marginBottom: "2rem",
            display: "flex", gap: "1rem"
        }}>
            <Icon style={{ width: "1.5rem", height: "1.5rem", color: color, flexShrink: 0 }} />
            <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.9rem", lineHeight: 1.7, margin: 0 }}>
                {children}
            </p>
        </div>
    );

    return (
        <div style={{ minHeight: "100vh", background: "#060914", color: "white" }}>
            <Navbar />

            {/* Hero */}
            <section style={{ paddingTop: "8rem", paddingBottom: "4rem", textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.06)", position: "relative" }}>
                <div style={{
                    position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
                    width: "500px", height: "300px",
                    background: "radial-gradient(ellipse at center, rgba(37,99,235,0.12) 0%, transparent 70%)",
                    pointerEvents: "none"
                }} />
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    <div style={{
                        width: "3.5rem", height: "3.5rem", borderRadius: "1.25rem",
                        background: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.3)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        margin: "0 auto 1.5rem",
                        boxShadow: "0 0 30px rgba(37,99,235,0.2)"
                    }}>
                        <FileText style={{ width: "1.75rem", height: "1.75rem", color: "#60a5fa" }} />
                    </div>
                    <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.35)", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "1rem" }}>
                        Güncelleme: 01 Nisan 2026
                    </p>
                    <h1 style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)", fontWeight: 900, color: "white", marginBottom: "1.5rem", letterSpacing: "-0.04em" }}>
                        Kullanım <span className="holographic-text">Koşulları</span>
                    </h1>
                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "1.15rem", maxWidth: "650px", margin: "0 auto", lineHeight: 1.6 }}>
                        JetPOS yazılım platformunu kullanarak kabul etmiş sayıldığınız yasal şartlar ve sorumluluklar.
                    </p>
                </motion.div>
            </section>

            {/* Main Content */}
            <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "5rem 1.5rem", display: "grid", gridTemplateColumns: "300px 1fr", gap: "5rem", alignItems: "start" }}
                className="terms-grid">

                {/* Sidebar TOC */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    style={{ position: "sticky", top: "7rem" }}
                    className="terms-toc"
                >
                    <div style={{
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: "1.75rem", padding: "2rem"
                    }}>
                        <p style={{ fontSize: "0.8rem", fontWeight: 800, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1.5rem" }}>
                            TÜM MADDELER
                        </p>
                        <nav style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                            {sections.map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => scrollTo(s.id)}
                                    style={{
                                        textAlign: "left", padding: "0.6rem 0.875rem",
                                        borderRadius: "0.75rem", border: "none",
                                        background: activeSection === s.id ? "rgba(59,130,246,0.15)" : "transparent",
                                        color: activeSection === s.id ? "white" : "rgba(255,255,255,0.4)",
                                        fontSize: "0.875rem", cursor: "pointer", fontFamily: "inherit",
                                        fontWeight: activeSection === s.id ? 700 : 500,
                                        transition: "all 0.2s",
                                        position: "relative"
                                    }}
                                >
                                    {activeSection === s.id && (
                                        <motion.div layoutId="active-bg" style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "3px", background: "#3b82f6", borderRadius: "2px" }} />
                                    )}
                                    {s.title}
                                </button>
                            ))}
                        </nav>
                    </div>
                </motion.div>

                {/* Content Area */}
                <motion.article
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    <InfoBox>
                        Lütfen JetPOS platformunu kullanmadan önce bu kullanım koşullarını dikkatlice okuyunuz. Sistemi kullanmaya devam etmeniz, bu şartları kayıtsız şartsız kabul ettiğiniz anlamına gelir.
                    </InfoBox>

                    <H2 id="genel">1. Genel Koşullar</H2>
                    <P>
                        Bu web sitesi ve tüm JetPOS hizmetleri **Jetsoft** (bundan sonra &quot;Şirket&quot; olarak anılacaktır) tarafından işletilmektedir. Kullanım koşulları, Şirket ile kullanıcı arasındaki hukuki ilişkiyi düzenler.
                    </P>
                    <P>
                        Jetsoft, bu koşullarda dilediği zaman değişiklik yapma hakkını saklı tutar. Güncellenen koşullar web sitesinde yayınlandığı andan itibaren geçerlilik kazanır.
                    </P>

                    <H2 id="hizmet">2. Hizmet Tanımı</H2>
                    <P>
                        JetPOS; işletmeler için bulut tabanlı stok takibi, satış yönetimi (POS), finansal raporlama ve yapay zeka destekli analiz hizmetleri sunan bir yazılım (SaaS) platformudur.
                    </P>
                    <ul style={{ margin: 0, padding: 0 }}>
                        <Li>Hizmetin temel amacı ticari operasyonların dijitalleşmesidir.</Li>
                        <Li>Hizmet, internet bağlantısı gerektiren online bir sistemdir.</Li>
                        <Li>Teknik gereksinimler ve destek kapsamı paketlere göre farklılık gösterebilir.</Li>
                    </ul>

                    <H2 id="lisans">3. Kullanım Lisansı</H2>
                    <P>
                        Satın alınan paket kapsamında kullanıcıya, yazılımı ticari amaçlarla kullanma hakkı veren devredilemez ve münhasır olmayan bir kullanım lisansı verilir.
                    </P>
                    <InfoBox icon={AlertCircle} color="#facc15">
                        Kullanıcı, yazılımın kaynak kodlarını kopyalayamaz, tersine mühendislik yapamaz veya sistemi üçüncü taraflara kiralayamaz.
                    </InfoBox>

                    <H2 id="sorumluluk">4. Kullanıcı Sorumlulukları</H2>
                    <P>Kullanıcılar aşağıdaki kurallara uymakla yükümlüdür:</P>
                    <ul style={{ margin: 0, padding: 0, marginBottom: "1.5rem" }}>
                        <Li>Hesap bilgilerini ve şifre güvenliğini sağlamak.</Li>
                        <Li>Sisteme girilen tüm ticari ve kişisel verilerin doğruluğunu teyit etmek.</Li>
                        <Li>Yazılımı yürürlükteki yasalara aykırı amaçlarla kullanmamak.</Li>
                        <Li>Sistem performansını kasten düşürecek yazılım veya araç kullanmamak.</Li>
                    </ul>

                    <H2 id="odeme">5. Ödeme ve Üyelik</H2>
                    <P>
                        Hizmet bedelleri web sitesinde ilan edilen güncel fiyatlar üzerinden tahsil edilir. Seçilen pakete göre aylık veya yıllık faturalandırma yapılır.
                    </P>
                    <P>
                        Ödemesi yapılmayan hesaplar, 7 (yedi) günlük hatırlatma süresinin ardından geçici olarak askıya alınabilir veya erişime kapatılabilir.
                    </P>

                    <H2 id="iptal">6. İptal ve İade Koşulları</H2>
                    <P>
                        Kullanıcı, dilediği zaman aboneliğini iptal edebilir. İptal işlemi bir sonraki fatura döneminden itibaren geçerli olur.
                    </P>
                    <ul style={{ margin: 0, padding: 0 }}>
                        <Li>Kullanıma başlanmış olan aylık paketlerin ücret iadesi yapılmaz.</Li>
                        <Li>Yıllık paketlerde; ilk 14 gün içinde cayma hakkı saklıdır.</Li>
                        <Li>İptal sonrası veriler, kullanıcı talebi doğrultusunda yedeklenebilir veya silinebilir.</Li>
                    </ul>

                    <H2 id="fikri-mulkiyet">7. Fikri Mülkiyet Hakları</H2>
                    <P>
                        JetPOS markası, logoları, arayüz tasarımları ve yazılım kodları üzerindeki tüm haklar münhasıran **Jetsoft**&apos;a aittir. İzinsiz kullanımı halinde yasal yollara başvurulacaktır.
                    </P>

                    <H2 id="garanti">8. Garanti ve Sorumluluk Reddi</H2>
                    <P>
                        Sistem &quot;olduğu gibi&quot; sunulmaktadır. Jetsoft, yazılımın %100 kesintisiz çalışacağını garanti etmez, ancak %99.9 çalışma süresi (uptime) hedefiyle hizmet verir.
                    </P>
                    <P>
                        İnternet kesintileri, donanımsal arızalar veya kullanıcı hatalarından kaynaklanan veri kayıplarından Şirket sorumlu tutulamaz.
                    </P>

                    <H2 id="uyusmazlik">9. Uyuşmazlıkların Çözümü</H2>
                    <P>
                        İşbu kullanım koşullarından doğabilecek her türlü ihtilafta Türkiye Cumhuriyeti Kanunları uygulanacak olup, **İstanbul (Çağlayan) Mahkemeleri ve İcra Daireleri** yetkilidir.
                    </P>

                    <H2 id="iletisim">10. İletişim</H2>
                    <P>Kullanım koşulları hakkında detaylı bilgi ve sorularınız için bize ulaşın:</P>
                    <div style={{
                        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                        borderRadius: "1.25rem", padding: "1.75rem", marginBottom: "3rem"
                    }}>
                        <ul style={{ margin: 0, padding: 0 }}>
                            <Li><strong style={{ color: "white" }}>Ticari Unvan:</strong> Jetsoft</Li>
                            <Li><strong style={{ color: "white" }}>Adres:</strong> Su Yolu Cad Turgut Özal Mah No 31/A</Li>
                            <Li><strong style={{ color: "white" }}>E-posta:</strong> info@jetpos.shop</Li>
                            <Li><strong style={{ color: "white" }}>Telefon:</strong> 0536 661 0169</Li>
                        </ul>
                    </div>
                </motion.article>
            </div>

            {/* Back to top */}
            {showTop && (
                <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                    style={{
                        position: "fixed", bottom: "2.5rem", right: "2.5rem",
                        width: "3rem", height: "3rem", borderRadius: "50%",
                        background: "linear-gradient(135deg, #2563eb, #3b82f6)",
                        border: "none", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: "0 10px 30px rgba(37,99,235,0.5)", zIndex: 50
                    }}
                >
                    <ArrowUp style={{ width: "1.25rem", height: "1.25rem", color: "white" }} />
                </motion.button>
            )}

            <style>{`
                @media (max-width: 900px) {
                    .terms-grid { grid-template-columns: 1fr !important; gap: 3rem !important; }
                    .terms-toc { display: none !important; }
                }
            `}</style>

            <Footer />
        </div>
    );
}
