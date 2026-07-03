"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, ChevronRight, ArrowUp } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const sections = [
    { id: "veri-sorumlusu", title: "1. Veri Sorumlusu" },
    { id: "kapsam-roller", title: "2. Kapsam ve Roller" },
    { id: "toplanan-veriler", title: "3. Toplanan Kişisel Veriler" },
    { id: "isleme-amaci", title: "4. İşleme Amaçları" },
    { id: "hukuki-dayanak", title: "5. Hukuki Dayanak" },
    { id: "veri-aktarimi", title: "6. Veri Aktarımı" },
    { id: "muhafaza-suresi", title: "7. Saklama Süreleri" },
    { id: "haklariniz", title: "8. Haklarınız ve Başvuru" },
    { id: "cerezler", title: "9. Çerezler (Cookies)" },
    { id: "guvenlik", title: "10. Veri Güvenliği" },
    { id: "degisiklikler", title: "11. Değişiklikler" },
    { id: "iletisim", title: "12. İletişim" },
];

const H2 = ({ id, children }: { id: string; children: React.ReactNode }) => (
    <h2 id={id} style={{
        fontSize: "1.5rem", fontWeight: 800, color: "#111827",
        marginBottom: "1rem", marginTop: "3rem",
        paddingTop: "1rem",
        borderBottom: "1px solid rgba(17,24,39,0.08)",
        paddingBottom: "0.75rem"
    }}>
        {children}
    </h2>
);

const P = ({ children }: { children: React.ReactNode }) => (
    <p style={{ color: "rgba(17,24,39,0.72)", lineHeight: 1.85, marginBottom: "1rem", fontSize: "0.95rem" }}>
        {children}
    </p>
);

const Li = ({ children }: { children: React.ReactNode }) => (
    <li style={{
        color: "rgba(17,24,39,0.72)", lineHeight: 1.8, fontSize: "0.95rem",
        paddingLeft: "0.5rem", marginBottom: "0.35rem",
        listStyleType: "none", display: "flex", alignItems: "flex-start", gap: "0.6rem"
    }}>
        <ChevronRight style={{ width: "1rem", height: "1rem", color: "#7886C7", flexShrink: 0, marginTop: "0.3rem" }} />
        <span>{children}</span>
    </li>
);

const InfoBox = ({ children }: { children: React.ReactNode }) => (
    <div style={{
        background: "rgba(120, 134, 199, 0.08)", border: "1px solid rgba(120, 134, 199, 0.2)",
        borderRadius: "0.875rem", padding: "1.25rem 1.5rem", marginBottom: "1.5rem"
    }}>
        <p style={{ color: "rgba(17,24,39,0.8)", fontSize: "0.9rem", lineHeight: 1.75, margin: 0 }}>
            {children}
        </p>
    </div>
);

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

    const resetCookieConsent = () => {
        localStorage.removeItem("jetpos-cookie-consent");
        window.location.reload();
    };

    return (
        <div style={{ minHeight: "100vh", background: "#ffffff", color: "#111827" }}>
            <Navbar />

            {/* Hero */}
            <section style={{ paddingTop: "8rem", paddingBottom: "4rem", textAlign: "center", borderBottom: "1px solid rgba(17,24,39,0.07)", position: "relative" }}>
                <div style={{
                    position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
                    width: "500px", height: "300px",
                    backgroundImage: "radial-gradient(ellipse at center, rgba(120, 134, 199, 0.12) 0%, transparent 70%)",
                    pointerEvents: "none"
                }} />
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    <div style={{
                        width: "3.5rem", height: "3.5rem", borderRadius: "1rem",
                        background: "rgba(120, 134, 199, 0.15)", border: "1px solid rgba(120, 134, 199, 0.3)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        margin: "0 auto 1.5rem",
                        boxShadow: "0 0 30px rgba(120, 134, 199, 0.2)"
                    }}>
                        <Shield style={{ width: "1.75rem", height: "1.75rem", color: "#7886C7" }} />
                    </div>
                    <p style={{ fontSize: "0.8rem", color: "rgba(17,24,39,0.45)", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
                        Son güncelleme: 2 Temmuz 2026
                    </p>
                    <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 900, color: "#111827", marginBottom: "1rem", lineHeight: 1.15 }}>
                        Gizlilik & KVKK{" "}
                        <span style={{ backgroundImage: "linear-gradient(135deg, #7886C7, #5A659F)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                            Politikası
                        </span>
                    </h1>
                    <p style={{ color: "rgba(17,24,39,0.55)", fontSize: "1.1rem", maxWidth: "560px", margin: "0 auto" }}>
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
                        background: "rgba(17,24,39,0.02)",
                        border: "1px solid rgba(17,24,39,0.08)",
                        borderRadius: "1.25rem", padding: "1.5rem"
                    }}>
                        <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "rgba(17,24,39,0.45)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1rem" }}>
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
                                        background: activeSection === s.id ? "rgba(120, 134, 199, 0.12)" : "transparent",
                                        color: activeSection === s.id ? "#5A659F" : "rgba(17,24,39,0.55)",
                                        fontSize: "0.8rem", cursor: "pointer", fontFamily: "inherit",
                                        fontWeight: activeSection === s.id ? 700 : 400,
                                        transition: "all 0.15s",
                                        borderLeft: `2px solid ${activeSection === s.id ? "#7886C7" : "transparent"}`
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
                        Bu Gizlilik ve KVKK Politikası; JetPOS yazılım hizmetlerini kullanan işletme sahipleri ve çalışanları, demo/iletişim talebinde bulunan kişiler ile web sitemizi ziyaret eden tüm kişilerin kişisel verilerinin korunmasına ilişkin esasları düzenlemektedir.
                    </InfoBox>

                    <H2 id="veri-sorumlusu">1. Veri Sorumlusu</H2>
                    <P>
                        6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) kapsamında veri sorumlusu sıfatını taşıyan kuruluş Jetsoft olup iletişim bilgileri aşağıda yer almaktadır:
                    </P>
                    {/* TODO: Ticaret siciline kayıtlı tam unvan ve il/ilçe dahil açık adres eklenmeli */}
                    <div style={{
                        background: "rgba(17,24,39,0.025)", border: "1px solid rgba(17,24,39,0.08)",
                        borderRadius: "0.875rem", padding: "1.25rem 1.5rem", marginBottom: "1.5rem"
                    }}>
                        <ul style={{ margin: 0, padding: 0 }}>
                            <Li><strong style={{ color: "#111827" }}>Ticari Unvan:</strong> Jetsoft</Li>
                            <Li><strong style={{ color: "#111827" }}>E-posta:</strong> kvkk@jetpos.shop</Li>
                            <Li><strong style={{ color: "#111827" }}>Telefon:</strong> 0536 661 0169</Li>
                            <Li><strong style={{ color: "#111827" }}>Adres:</strong> Su Yolu Cad. Turgut Özal Mah. No: 31/A</Li>
                        </ul>
                    </div>

                    <H2 id="kapsam-roller">2. Kapsam ve Roller</H2>
                    <P>
                        {`Jetsoft; web sitesi ziyaretçileri, demo/iletişim talebinde bulunanlar ve platform kullanıcıları (işletme sahipleri ve çalışanları) bakımından "veri sorumlusu" sıfatıyla hareket eder.`}
                    </P>
                    <InfoBox>
                        {`JetPOS'u kullanan işletmelerin kendi müşterilerine ait olarak platforma girdiği veya platform aracılığıyla işlediği veriler (örneğin cari hesap kayıtları, QR menü siparişleri, e-fatura/e-arşiv belgelerindeki ad-soyad ve TCKN/VKN bilgileri, pazaryeri sipariş bilgileri) bakımından veri sorumlusu ilgili işletmedir. Jetsoft bu veriler üzerinde KVKK kapsamında "veri işleyen" sıfatıyla ve ilgili işletmenin talimatları doğrultusunda hareket eder. Bu verilere ilişkin talepler için öncelikle ilgili işletmeye başvurulmalıdır.`}
                    </InfoBox>

                    <H2 id="toplanan-veriler">3. Toplanan Kişisel Veriler</H2>
                    <P>JetPOS olarak aşağıdaki kapsamlarda kişisel veri toplayabiliriz:</P>

                    <div style={{ marginBottom: "1.5rem" }}>
                        <p style={{ color: "rgba(17,24,39,0.55)", fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.75rem" }}>
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
                        <p style={{ color: "rgba(17,24,39,0.55)", fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.75rem" }}>
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
                        <p style={{ color: "rgba(17,24,39,0.55)", fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.75rem" }}>
                            Web Sitesi Ziyaretçileri
                        </p>
                        <ul style={{ margin: 0, padding: 0 }}>
                            <Li>Zorunlu çerezler aracılığıyla toplanan oturum verileri</Li>
                            <Li>Açık rızanıza bağlı olarak, analitik çerezler aracılığıyla toplanan sayfa görüntüleme ve kullanım istatistikleri</Li>
                        </ul>
                    </div>

                    <H2 id="isleme-amaci">4. İşleme Amaçları</H2>
                    <P>Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:</P>
                    <ul style={{ margin: 0, padding: 0, marginBottom: "1.5rem" }}>
                        <Li>Hizmet sözleşmesinin kurulması ve ifası</Li>
                        <Li>Platform erişiminin ve kullanıcı hesaplarının yönetimi</Li>
                        <Li>Teknik destek ve müşteri hizmetlerinin sağlanması</Li>
                        <Li>Demo taleplerinin değerlendirilmesi ve sizinle iletişim kurulması</Li>
                        <Li>Platform güvenliğinin sağlanması ve yetkisiz erişimlerin engellenmesi</Li>
                        <Li>Yasal yükümlülüklerin yerine getirilmesi (fatura, muhasebe, log saklama vb.)</Li>
                        <Li>Hizmet kalitesinin iyileştirilmesi amacıyla toplulaştırılmış ve anonimleştirilmiş analizler yapılması</Li>
                    </ul>

                    <H2 id="hukuki-dayanak">5. Hukuki Dayanak</H2>
                    <P>{`Kişisel verileriniz KVKK'nın 5. maddesi kapsamında aşağıdaki hukuki dayanaklar çerçevesinde işlenmektedir:`}</P>
                    <ul style={{ margin: 0, padding: 0, marginBottom: "1.5rem" }}>
                        <Li><strong style={{ color: "#111827" }}>Sözleşmenin kurulması ve ifası (m.5/2-c):</strong> Platform kullanım sözleşmesinin kurulması ve yürütülmesi ile talebinize istinaden demo sürecinde sizinle iletişim kurulması (sözleşme öncesi adımlar)</Li>
                        <Li><strong style={{ color: "#111827" }}>Hukuki yükümlülük (m.5/2-ç):</strong> Vergi ve muhasebe mevzuatı ile 5651 sayılı Kanun kapsamındaki kayıt ve saklama gereksinimleri</Li>
                        <Li><strong style={{ color: "#111827" }}>Meşru menfaat (m.5/2-f):</strong> Hizmet güvenliğinin sağlanması, dolandırıcılığın önlenmesi ve hizmet kalitesinin iyileştirilmesi</Li>
                        <Li><strong style={{ color: "#111827" }}>Açık rıza (m.5/1):</strong> Analitik ve pazarlama çerezleri ile 6563 sayılı Kanun kapsamında ticari elektronik ileti gönderimi (ayrıca onaya tabidir)</Li>
                    </ul>

                    <H2 id="veri-aktarimi">6. Veri Aktarımı</H2>
                    <P>
                        Kişisel verileriniz reklam veya pazarlama amacıyla üçüncü kişilere satılmaz ve paylaşılmaz. Verileriniz yalnızca aşağıdaki alıcı gruplarına, belirtilen amaçlarla sınırlı olarak aktarılır:
                    </P>
                    <ul style={{ margin: 0, padding: 0, marginBottom: "1.5rem" }}>
                        <Li><strong style={{ color: "#111827" }}>Supabase:</strong> Veritabanı ve kimlik doğrulama altyapısı (sunucular yurt dışında)</Li>
                        <Li><strong style={{ color: "#111827" }}>Vercel:</strong> Web barındırma (hosting) altyapısı (sunucular yurt dışında)</Li>
                        <Li><strong style={{ color: "#111827" }}>Resend:</strong> Demo ve iletişim taleplerine ilişkin e-posta bildirim altyapısı (sunucular yurt dışında)</Li>
                        <Li><strong style={{ color: "#111827" }}>Google Cloud:</strong> Yapay zeka destekli özellikler (örneğin fatura görseli analizi) kullanıldığında, ilgili belge ve içerikler işlenmek üzere iletilebilir</Li>
                        <Li><strong style={{ color: "#111827" }}>GİB onaylı özel entegratörler:</strong> E-fatura / e-arşiv süreçlerinin yürütülmesi</Li>
                        <Li><strong style={{ color: "#111827" }}>Yetkili kurum ve kuruluşlar:</strong> Yasal yükümlülük hâlinde, talep ile sınırlı olarak</Li>
                    </ul>
                    {/* TODO: Yurt dışı sağlayıcılarla KVKK m.9 standart sözleşmeleri imzalanmalı ve imzadan itibaren 5 iş günü içinde Kuruma bildirilmeli */}
                    <InfoBox>
                        {`Sunucuları yurt dışında bulunan sağlayıcılara yapılan aktarımlar, KVKK'nın 9. maddesinde öngörülen mekanizmalar (Kurul tarafından ilan edilen standart sözleşme hükümleri ve uygun güvenceler) çerçevesinde yürütülmekte olup Kişisel Verileri Koruma Kurulu kararları gözetilmektedir.`}
                    </InfoBox>

                    <H2 id="muhafaza-suresi">7. Saklama Süreleri</H2>
                    <div style={{ overflowX: "auto", marginBottom: "1.5rem" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ background: "rgba(17,24,39,0.04)" }}>
                                    {["Veri Türü", "Saklama Süresi"].map(h => (
                                        <th key={h} style={{
                                            padding: "0.875rem 1rem", textAlign: "left",
                                            color: "rgba(17,24,39,0.8)", fontSize: "0.8rem",
                                            fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
                                            border: "1px solid rgba(17,24,39,0.08)"
                                        }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    ["Hesap ve sözleşme kayıtları", "Sözleşme sona erdikten sonra 10 yıl (genel zamanaşımı)"],
                                    ["Satış, fatura ve muhasebe kayıtları", "10 yıl (VUK / TTK)"],
                                    ["Demo talebi ve iletişim formu verileri", "Talep tarihinden itibaren 2 yıl"],
                                    ["İşlem güvenliği ve trafik logları", "2 yıl (5651 sayılı Kanun)"],
                                    ["Çerez verileri", "Çerez türüne göre 6 ay – 2 yıl"],
                                ].map(([type, duration], i) => (
                                    <tr key={i} style={{ background: i % 2 === 0 ? "transparent" : "rgba(17,24,39,0.02)" }}>
                                        <td style={{ padding: "0.875rem 1rem", color: "rgba(17,24,39,0.8)", fontSize: "0.875rem", border: "1px solid rgba(17,24,39,0.07)" }}>{type}</td>
                                        <td style={{ padding: "0.875rem 1rem", color: "rgba(17,24,39,0.65)", fontSize: "0.875rem", border: "1px solid rgba(17,24,39,0.07)" }}>{duration}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <H2 id="haklariniz">8. Haklarınız ve Başvuru</H2>
                    <P>KVKK&apos;nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:</P>
                    <ul style={{ margin: 0, padding: 0, marginBottom: "1rem" }}>
                        <Li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</Li>
                        <Li>İşlenmişse buna ilişkin bilgi talep etme</Li>
                        <Li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</Li>
                        <Li>Yurt içinde veya yurt dışında kişisel verilerin aktarıldığı üçüncü kişileri bilme</Li>
                        <Li>Eksik veya yanlış işlenmiş verilerin düzeltilmesini isteme</Li>
                        <Li>KVKK&apos;nın 7. maddesi çerçevesinde kişisel verilerin silinmesini veya yok edilmesini isteme</Li>
                        <Li>Düzeltme, silme ve yok etme işlemlerinin, verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme</Li>
                        <Li>Otomatik sistemler vasıtasıyla analiz edilmesi nedeniyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme</Li>
                        <Li>Kanuna aykırı işlenmesi sebebiyle zarara uğramanız halinde tazminat talep etme</Li>
                    </ul>
                    <InfoBox>
                        {`Başvurularınızı, Veri Sorumlusuna Başvuru Usul ve Esasları Hakkında Tebliğ uyarınca; yukarıdaki adresimize yazılı olarak (ıslak imzalı), güvenli elektronik imza veya mobil imza ile ya da sistemimizde kayıtlı e-posta adresiniz üzerinden `}<strong>kvkk@jetpos.shop</strong>{` adresine iletebilirsiniz. Başvurunuz en kısa sürede ve en geç 30 gün içinde ücretsiz olarak sonuçlandırılır (Tebliğ'de öngörülen ücret istisnaları saklıdır).`}
                    </InfoBox>

                    <H2 id="cerezler">9. Çerezler (Cookies)</H2>
                    <P>Web sitemiz, hizmet kalitesini artırmak için çerez kullanmaktadır. Kullandığımız çerez türleri:</P>
                    <ul style={{ margin: 0, padding: 0, marginBottom: "1.5rem" }}>
                        <Li><strong style={{ color: "#111827" }}>Zorunlu Çerezler:</strong> Oturum yönetimi ve güvenlik için gereklidir; açık rıza gerektirmez ve devre dışı bırakılamaz.</Li>
                        <Li><strong style={{ color: "#111827" }}>Analitik Çerezler (Google Analytics):</strong> Açık rızanıza tabidir ve yalnızca çerez bandından onay vermeniz hâlinde yüklenir; varsayılan olarak kapalıdır.</Li>
                        <Li><strong style={{ color: "#111827" }}>Pazarlama Çerezleri:</strong> Açık rızanıza tabidir; varsayılan olarak kapalıdır.</Li>
                    </ul>
                    <P>
                        {`Çerez tercihlerinizi dilediğiniz zaman değiştirebilir veya verdiğiniz rızayı geri alabilirsiniz. Ayrıca tarayıcınızın ayarlarından da çerezleri silebilir veya engelleyebilirsiniz.`}
                    </P>
                    <button
                        onClick={resetCookieConsent}
                        style={{
                            padding: "0.75rem 1.25rem", borderRadius: "0.75rem",
                            background: "rgba(120, 134, 199, 0.12)", border: "1px solid rgba(120, 134, 199, 0.3)",
                            color: "#5A659F", fontWeight: 700, fontSize: "0.875rem",
                            cursor: "pointer", fontFamily: "inherit", marginBottom: "1.5rem"
                        }}
                    >
                        Çerez Tercihlerini Yeniden Aç
                    </button>

                    <H2 id="guvenlik">10. Veri Güvenliği</H2>
                    <P>Kişisel verilerinizin güvenliğini sağlamak amacıyla aldığımız teknik ve idari tedbirler:</P>
                    <ul style={{ margin: 0, padding: 0, marginBottom: "1.5rem" }}>
                        <Li>Tüm veri iletimi TLS ile şifrelenmektedir</Li>
                        <Li>Veriler, sunucu tarafında şifrelenerek (AES-256) saklanmaktadır</Li>
                        <Li>Row Level Security (RLS) ile her işletmenin verileri birbirinden izole tutulmaktadır</Li>
                        <Li>Rol bazlı erişim yetkilendirmesi uygulanmakta, personel işlemleri PIN doğrulaması ile yapılmaktadır</Li>
                        <Li>Kritik işlemler için denetim (audit) kayıtları tutulmaktadır</Li>
                        <Li>Veriler düzenli olarak yedeklenmektedir</Li>
                    </ul>
                    <InfoBox>
                        {`Kişisel verilerin kanuni olmayan yollarla başkaları tarafından elde edilmesi hâlinde, KVKK'nın 12. maddesi uyarınca durum en kısa sürede ilgilisine ve Kişisel Verileri Koruma Kurulu'na bildirilir.`}
                    </InfoBox>

                    <H2 id="degisiklikler">11. Değişiklikler</H2>
                    <P>
                        Bu politika zaman zaman güncellenebilir. Önemli değişiklikler e-posta veya platform bildirimi aracılığıyla kullanıcılara duyurulacaktır. Güncel politikaya her zaman bu sayfadan ulaşabilirsiniz.
                    </P>

                    <H2 id="iletisim">12. İletişim</H2>
                    <P>Gizlilik politikamız veya kişisel verilerinizle ilgili sorularınız için:</P>
                    <ul style={{ margin: 0, padding: 0, marginBottom: "2rem" }}>
                        <Li><strong style={{ color: "#111827" }}>KVKK Başvuruları:</strong> kvkk@jetpos.shop</Li>
                        <Li><strong style={{ color: "#111827" }}>Genel İletişim:</strong> info@jetpos.shop</Li>
                        <Li><strong style={{ color: "#111827" }}>Telefon:</strong> 0536 661 0169</Li>
                    </ul>

                    <div style={{
                        background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)",
                        borderRadius: "1rem", padding: "1.5rem",
                        display: "flex", alignItems: "center", gap: "1rem"
                    }}>
                        <Shield style={{ width: "2rem", height: "2rem", color: "#16a34a", flexShrink: 0 }} />
                        <div>
                            <p style={{ color: "#111827", fontWeight: 700, marginBottom: "0.25rem", fontSize: "0.95rem" }}>
                                Verileriniz Güvende
                            </p>
                            <p style={{ color: "rgba(17,24,39,0.55)", fontSize: "0.85rem", margin: 0 }}>
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
                        backgroundImage: "linear-gradient(135deg, #7886C7, #5A659F)",
                        border: "none", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: "0 4px 20px rgba(120, 134, 199, 0.5)", zIndex: 50
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
