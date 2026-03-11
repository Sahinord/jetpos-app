"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Shield, ChevronRight, ArrowUp, Zap } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const sections = [
    { id: "veri-sorumlusu", title: "1. Veri Sorumlusu" },
    { id: "toplanan-veriler", title: "2. Toplanan Kişisel Veriler" },
    { id: "isleme-amaci", title: "3. İşleme Amaçları" },
    { id: "hukuki-dayanak", title: "4. Hukuki Dayanak" },
    { id: "veri-aktarimi", title: "5. Veri Aktarımı" },
    { id: "muhafaza-suresi", title: "6. Saklama Süresi" },
    { id: "haklariniz", title: "7. Haklarınız" },
    { id: "cerezler", title: "8. Çerezler (Cookies)" },
    { id: "guvenlik", title: "9. Veri Güvenliği" },
    { id: "degisiklikler", title: "10. Değişiklikler" },
    { id: "iletisim", title: "11. İletişim" },
];

export default function GizlilikPage() {
    const [activeSection, setActiveSection] = useState("veri-sorumlusu");
    const [showTop, setShowTop] = useState(false);

    useEffect(() => {
        const onScroll = () => {
            setShowTop(window.scrollY > 400);

            // Active section tracking
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
        <p style={{ color: "rgba(255,255,255,0.65)", lineHeight: 1.85, marginBottom: "1rem", fontSize: "0.95rem" }}>
            {children}
        </p>
    );

    const Li = ({ children }: { children: React.ReactNode }) => (
        <li style={{
            color: "rgba(255,255,255,0.65)", lineHeight: 1.8, fontSize: "0.95rem",
            paddingLeft: "0.5rem", marginBottom: "0.35rem",
            listStyleType: "none", display: "flex", alignItems: "flex-start", gap: "0.6rem"
        }}>
            <ChevronRight style={{ width: "1rem", height: "1rem", color: "#3b82f6", flexShrink: 0, marginTop: "0.3rem" }} />
            <span>{children}</span>
        </li>
    );

    const InfoBox = ({ children }: { children: React.ReactNode }) => (
        <div style={{
            background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)",
            borderRadius: "0.875rem", padding: "1.25rem 1.5rem", marginBottom: "1.5rem"
        }}>
            <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.9rem", lineHeight: 1.75, margin: 0 }}>
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
                        width: "3.5rem", height: "3.5rem", borderRadius: "1rem",
                        background: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.3)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        margin: "0 auto 1.5rem",
                        boxShadow: "0 0 30px rgba(37,99,235,0.2)"
                    }}>
                        <Shield style={{ width: "1.75rem", height: "1.75rem", color: "#60a5fa" }} />
                    </div>
                    <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.35)", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
                        Son güncelleme: 5 Mart 2025
                    </p>
                    <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 900, color: "white", marginBottom: "1rem", lineHeight: 1.15 }}>
                        Gizlilik & KVKK{" "}
                        <span style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                            Politikası
                        </span>
                    </h1>
                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "1.1rem", maxWidth: "560px", margin: "0 auto" }}>
                        6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında kişisel verilerinizin nasıl işlendiği hakkında bilgilendirme.
                    </p>
                </motion.div>
            </section>

            {/* Main Content */}
            <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "4rem 1.5rem", display: "grid", gridTemplateColumns: "280px 1fr", gap: "4rem", alignItems: "start" }}
                className="kvkk-grid">

                {/* Sidebar TOC */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    style={{ position: "sticky", top: "6rem" }}
                    className="kvkk-toc"
                >
                    <div style={{
                        background: "rgba(255,255,255,0.025)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        borderRadius: "1.25rem", padding: "1.5rem"
                    }}>
                        <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1rem" }}>
                            İçindekiler
                        </p>
                        <nav style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                            {sections.map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => scrollTo(s.id)}
                                    style={{
                                        textAlign: "left", padding: "0.5rem 0.75rem",
                                        borderRadius: "0.625rem", border: "none",
                                        background: activeSection === s.id ? "rgba(59,130,246,0.12)" : "transparent",
                                        color: activeSection === s.id ? "#93c5fd" : "rgba(255,255,255,0.45)",
                                        fontSize: "0.8rem", cursor: "pointer", fontFamily: "inherit",
                                        fontWeight: activeSection === s.id ? 700 : 400,
                                        transition: "all 0.15s",
                                        borderLeft: `2px solid ${activeSection === s.id ? "#3b82f6" : "transparent"}`
                                    }}
                                >
                                    {s.title}
                                </button>
                            ))}
                        </nav>
                    </div>
                </motion.div>

                {/* Content */}
                <motion.article
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    <InfoBox>
                        Bu Gizlilik ve KVKK Politikası, JetPOS yazılım hizmetlerini kullanan işletme sahipleri, çalışanlar ve web sitemizi ziyaret eden tüm kişilerin kişisel verilerinin korunmasına ilişkin esasları düzenlemektedir.
                    </InfoBox>

                    <H2 id="veri-sorumlusu">1. Veri Sorumlusu</H2>
                    <P>
                        6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) kapsamında veri sorumlusu sıfatını taşıyan kuruluş JetPOS Yazılım Hizmetleri olup iletişim bilgileri aşağıda yer almaktadır:
                    </P>
                    <div style={{
                        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                        borderRadius: "0.875rem", padding: "1.25rem 1.5rem", marginBottom: "1.5rem"
                    }}>
                        <ul style={{ margin: 0, padding: 0 }}>
                            <Li><strong style={{ color: "white" }}>Ticari Unvan:</strong> JetPOS Yazılım Hizmetleri</Li>
                            <Li><strong style={{ color: "white" }}>E-posta:</strong> kvkk@jetpos.com.tr</Li>
                            <Li><strong style={{ color: "white" }}>Telefon:</strong> +90 500 123 45 67</Li>
                            <Li><strong style={{ color: "white" }}>Adres:</strong> Teknoloji Caddesi No: 123, Şişli / İstanbul</Li>
                        </ul>
                    </div>

                    <H2 id="toplanan-veriler">2. Toplanan Kişisel Veriler</H2>
                    <P>JetPOS olarak aşağıdaki kapsamlarda kişisel veri toplayabiliriz:</P>

                    <div style={{ marginBottom: "1.5rem" }}>
                        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.75rem" }}>
                            Platform Kullanıcıları (İşletme Çalışanları)
                        </p>
                        <ul style={{ margin: 0, padding: 0 }}>
                            <Li>Ad, soyad ve kullanıcı adı</Li>
                            <Li>E-posta adresi ve telefon numarası</Li>
                            <Li>IP adresi ve cihaz bilgileri</Li>
                            <Li>Giriş saatleri ve sistem kullanım logları</Li>
                            <Li>Yapılan satış ve işlem kayıtları</Li>
                        </ul>
                    </div>

                    <div style={{ marginBottom: "1.5rem" }}>
                        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.75rem" }}>
                            Demo / İletişim Formu Dolduranlar
                        </p>
                        <ul style={{ margin: 0, padding: 0 }}>
                            <Li>Ad, soyad ve firma bilgisi</Li>
                            <Li>E-posta adresi ve telefon numarası</Li>
                            <Li>Sektör, çalışan sayısı ve mevcut sistem bilgisi</Li>
                            <Li>Serbest metin olarak iletilen mesaj içerikleri</Li>
                        </ul>
                    </div>

                    <div style={{ marginBottom: "1.5rem" }}>
                        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.75rem" }}>
                            Web Sitesi Ziyaretçileri
                        </p>
                        <ul style={{ margin: 0, padding: 0 }}>
                            <Li>Çerezler aracılığıyla toplanan tarayıcı ve ziyaret verileri</Li>
                            <Li>Sayfa görüntüleme ve tıklama istatistikleri (anonim)</Li>
                        </ul>
                    </div>

                    <H2 id="isleme-amaci">3. İşleme Amaçları</H2>
                    <P>Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:</P>
                    <ul style={{ margin: 0, padding: 0, marginBottom: "1.5rem" }}>
                        <Li>Hizmet sözleşmesinin kurulması ve ifası</Li>
                        <Li>Platform erişiminin ve kullanıcı hesaplarının yönetimi</Li>
                        <Li>Teknik destek ve müşteri hizmetlerinin sağlanması</Li>
                        <Li>Demo taleplerinin değerlendirilmesi ve sizinle iletişim kurulması</Li>
                        <Li>Platform güvenliğinin sağlanması ve yetkisiz erişimlerin engellenmesi</Li>
                        <Li>Yasal yükümlülüklerin yerine getirilmesi (fatura, muhasebe vb.)</Li>
                        <Li>Hizmet kalitesinin iyileştirilmesi amacıyla anonim analiz yapılması</Li>
                    </ul>

                    <H2 id="hukuki-dayanak">4. Hukuki Dayanak</H2>
                    <P>Kişisel verileriniz KVKK'nın 5. maddesi kapsamında aşağıdaki hukuki dayanaklar çerçevesinde işlenmektedir:</P>
                    <ul style={{ margin: 0, padding: 0, marginBottom: "1.5rem" }}>
                        <Li><strong style={{ color: "white" }}>Sözleşmenin ifası:</strong> Platform kullanım sözleşmesinin kurulması ve yürütülmesi</Li>
                        <Li><strong style={{ color: "white" }}>Açık rıza:</strong> Demo ve iletişim formları aracılığıyla toplanan veriler</Li>
                        <Li><strong style={{ color: "white" }}>Meşru menfaat:</strong> Hizmet güvenliği ve fraud önleme faaliyetleri</Li>
                        <Li><strong style={{ color: "white" }}>Yasal yükümlülük:</strong> Vergi, muhasebe ve yasal saklama gereksinimleri</Li>
                    </ul>

                    <H2 id="veri-aktarimi">5. Veri Aktarımı</H2>
                    <P>
                        Kişisel verileriniz üçüncü kişilerle paylaşılmaz. Yalnızca hizmet altyapımızı oluşturan aşağıdaki teknoloji sağlayıcılarına güvenli şekilde aktarılabilir:
                    </P>
                    <ul style={{ margin: 0, padding: 0, marginBottom: "1.5rem" }}>
                        <Li><strong style={{ color: "white" }}>Supabase (ABD):</strong> Veritabanı ve kimlik doğrulama altyapısı — GDPR uyumlu</Li>
                        <Li><strong style={{ color: "white" }}>Vercel (ABD):</strong> Web hosting altyapısı — SOC 2 sertifikalı</Li>
                        <Li><strong style={{ color: "white" }}>Google Cloud:</strong> AI hizmetleri (anonim,  kişisel veri içermez)</Li>
                    </ul>
                    <InfoBox>
                        Yurt dışına aktarım yapılması durumunda KVKK&apos;nın 9. maddesi kapsamındaki güvenceler sağlanmakta olup Kişisel Verileri Koruma Kurulu kararları gözetilmektedir.
                    </InfoBox>

                    <H2 id="muhafaza-suresi">6. Saklama Süresi</H2>
                    <div style={{ overflowX: "auto", marginBottom: "1.5rem" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ background: "rgba(255,255,255,0.04)" }}>
                                    {["Veri Türü", "Saklama Süresi"].map(h => (
                                        <th key={h} style={{
                                            padding: "0.875rem 1rem", textAlign: "left",
                                            color: "rgba(255,255,255,0.7)", fontSize: "0.8rem",
                                            fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
                                            border: "1px solid rgba(255,255,255,0.07)"
                                        }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    ["Hesap ve kullanıcı verileri", "Hesap kapatmadan sonra 3 yıl"],
                                    ["Satış ve işlem kayıtları", "10 yıl (yasal zorunluluk)"],
                                    ["Demo talep verileri", "2 yıl / müşteri ilişkisi sona erene kadar"],
                                    ["İletişim formu mesajları", "3 yıl"],
                                    ["Log kayıtları", "6 ay"],
                                    ["Çerez verileri", "En fazla 1 yıl"],
                                ].map(([type, duration], i) => (
                                    <tr key={i} style={{ background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)" }}>
                                        <td style={{ padding: "0.875rem 1rem", color: "rgba(255,255,255,0.7)", fontSize: "0.875rem", border: "1px solid rgba(255,255,255,0.06)" }}>{type}</td>
                                        <td style={{ padding: "0.875rem 1rem", color: "rgba(255,255,255,0.55)", fontSize: "0.875rem", border: "1px solid rgba(255,255,255,0.06)" }}>{duration}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <H2 id="haklariniz">7. Haklarınız</H2>
                    <P>KVKK&apos;nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:</P>
                    <ul style={{ margin: 0, padding: 0, marginBottom: "1rem" }}>
                        <Li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</Li>
                        <Li>İşlenmişse buna ilişkin bilgi talep etme</Li>
                        <Li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</Li>
                        <Li>Yurt içinde veya yurt dışında kişisel verilerin aktarıldığı üçüncü kişileri bilme</Li>
                        <Li>Eksik veya yanlış işlenmiş verilerin düzeltilmesini isteme</Li>
                        <Li>Kişisel verilerin silinmesini veya yok edilmesini isteme</Li>
                        <Li>Otomatik sistemler vasıtasıyla analiz edilmesi nedeniyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme</Li>
                        <Li>Kanuna aykırı işlenmesi sebebiyle zarara uğramanız halinde tazminat talep etme</Li>
                    </ul>
                    <InfoBox>
                        Haklarınızı kullanmak için <strong>kvkk@jetpos.com.tr</strong> adresine kimliğinizi doğrulayan bilgilerle yazılı başvuru yapabilirsiniz. Talebiniz en geç 30 gün içinde yanıtlanacaktır.
                    </InfoBox>

                    <H2 id="cerezler">8. Çerezler (Cookies)</H2>
                    <P>Web sitemiz, hizmet kalitesini artırmak için çerez kullanmaktadır. Kullandığımız çerez türleri:</P>
                    <ul style={{ margin: 0, padding: 0, marginBottom: "1.5rem" }}>
                        <Li><strong style={{ color: "white" }}>Zorunlu Çerezler:</strong> Oturum yönetimi ve güvenlik için gereklidir, devre dışı bırakılamaz.</Li>
                        <Li><strong style={{ color: "white" }}>Analitik Çerezler:</strong> Sitenin nasıl kullanıldığını anlamamıza yardımcı olur (anonim).</Li>
                        <Li><strong style={{ color: "white" }}>Tercih Çerezleri:</strong> Dil ve görünüm tercihlerinizi hatırlar.</Li>
                    </ul>
                    <P>Tarayıcınızın ayarlarından çerezleri devre dışı bırakabilirsiniz; ancak bu durumda bazı özellikler çalışmayabilir.</P>

                    <H2 id="guvenlik">9. Veri Güvenliği</H2>
                    <P>Kişisel verilerinizin güvenliğini sağlamak amacıyla aldığımız teknik ve idari tedbirler:</P>
                    <ul style={{ margin: 0, padding: 0, marginBottom: "1.5rem" }}>
                        <Li>Tüm veriler TLS 1.3 şifrelemesi ile iletilmektedir</Li>
                        <Li>Veritabanı verileri AES-256 ile şifrelenerek saklanmaktadır</Li>
                        <Li>Row Level Security (RLS) ile her işletmenin verileri birbirinden izole tutulmaktadır</Li>
                        <Li>Erişim yetkilendirmesi ve çok faktörlü kimlik doğrulama uygulanmaktadır</Li>
                        <Li>Düzenli güvenlik denetimleri ve penetrasyon testleri yapılmaktadır</Li>
                        <Li>Çalışanlar veri gizliliği konusunda düzenli eğitim almaktadır</Li>
                    </ul>

                    <H2 id="degisiklikler">10. Değişiklikler</H2>
                    <P>
                        Bu politika zaman zaman güncellenebilir. Önemli değişiklikler e-posta veya platform bildirimi aracılığıyla kullanıcılara duyurulacaktır. Güncel politikaya her zaman bu sayfadan ulaşabilirsiniz.
                    </P>

                    <H2 id="iletisim">11. İletişim</H2>
                    <P>Gizlilik politikamız veya kişisel verilerinizle ilgili sorularınız için:</P>
                    <ul style={{ margin: 0, padding: 0, marginBottom: "2rem" }}>
                        <Li><strong style={{ color: "white" }}>KVKK Başvuruları:</strong> kvkk@jetpos.com.tr</Li>
                        <Li><strong style={{ color: "white" }}>Genel İletişim:</strong> info@jetpos.com.tr</Li>
                        <Li><strong style={{ color: "white" }}>Telefon:</strong> +90 500 123 45 67</Li>
                    </ul>

                    <div style={{
                        background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)",
                        borderRadius: "1rem", padding: "1.5rem",
                        display: "flex", alignItems: "center", gap: "1rem"
                    }}>
                        <Shield style={{ width: "2rem", height: "2rem", color: "#4ade80", flexShrink: 0 }} />
                        <div>
                            <p style={{ color: "white", fontWeight: 700, marginBottom: "0.25rem", fontSize: "0.95rem" }}>
                                Verileriniz Güvende
                            </p>
                            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem", margin: 0 }}>
                                JetPOS olarak verilerinizin korunmasına en yüksek önemi veriyoruz. Herhangi bir sorunuzda bize ulaşmaktan çekinmeyin.
                            </p>
                        </div>
                    </div>
                </motion.article>
            </div>

            {/* Back to top */}
            {showTop && (
                <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                    style={{
                        position: "fixed", bottom: "2rem", right: "2rem",
                        width: "2.75rem", height: "2.75rem", borderRadius: "50%",
                        background: "linear-gradient(135deg, #2563eb, #3b82f6)",
                        border: "none", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: "0 4px 20px rgba(37,99,235,0.5)", zIndex: 50
                    }}
                >
                    <ArrowUp style={{ width: "1.125rem", height: "1.125rem", color: "white" }} />
                </motion.button>
            )}

            <style>{`
                @media (max-width: 768px) {
                    .kvkk-grid { grid-template-columns: 1fr !important; }
                    .kvkk-toc { display: none !important; }
                }
            `}</style>

            <Footer />
        </div>
    );
}
