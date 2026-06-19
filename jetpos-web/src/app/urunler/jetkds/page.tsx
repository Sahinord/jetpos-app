"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import JetKDSSection from "@/components/JetKDSSection";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, CheckCircle2, TrendingUp, Users, Smartphone, Bell, BarChart3, ChefHat, Building2, Store, Coffee, ChevronRight, Check, X, RefreshCcw } from "lucide-react";

export default function JetKDSLandingPage() {
    const [formStatus, setFormStatus] = useState<"idle" | "submitting" | "success">("idle");

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFormStatus("submitting");
        setTimeout(() => setFormStatus("success"), 1500);
    };

    return (
        <>
            <div className="site-bg" />
            <main className="jk-landing-main">
                <Navbar />

                {/* ── 1. HERO SECTION ── */}
                <section className="jk-hero">
                    <div className="jk-container jk-hero-grid">
                        <motion.div 
                            className="jk-hero-content"
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <div className="jk-badge">⚡ JetKDS</div>
                            <h1 className="jk-title">Mutfağınızı <br/><span className="text-gradient">Kaostan Kurtarın.</span></h1>
                            <p className="jk-subtitle">
                                Siparişler garson ekranından mutfağa saniyeler içinde ulaşsın. Hazırlık süreçlerini yönetin, gecikmeleri azaltın ve servis hızınızı artırın.
                            </p>
                            <div className="jk-hero-actions">
                                <button className="btn-primary" onClick={() => document.getElementById("demo-section")?.scrollIntoView({ behavior: 'smooth'})}>
                                    Demo İzle
                                </button>
                                <button className="btn-secondary" onClick={() => document.getElementById("lead-form")?.scrollIntoView({ behavior: 'smooth'})}>
                                    Talep Oluştur
                                </button>
                            </div>
                            
                            <div className="jk-hero-stats">
                                <div className="jk-stat">
                                    <strong>%40</strong>
                                    <span>Daha Hızlı Sipariş</span>
                                </div>
                                <div className="jk-stat">
                                    <strong>%60</strong>
                                    <span>Daha Az Hata</span>
                                </div>
                                <div className="jk-stat">
                                    <strong>7/24</strong>
                                    <span>Operasyon Takibi</span>
                                </div>
                            </div>
                        </motion.div>
                        
                        <motion.div 
                            className="jk-hero-mockup"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                        >
                            {/* Simple Hero Animation Mockup */}
                            <div className="hero-kds-glass">
                                <div className="hero-kds-header">
                                    <div className="hk-dot" style={{background: "#EF4444"}}></div>
                                    <div className="hk-dot" style={{background: "#F59E0B"}}></div>
                                    <div className="hk-dot" style={{background: "#10B981"}}></div>
                                </div>
                                <div className="hero-kds-body">
                                    <div className="hk-col">
                                        <div className="hk-col-title">Masa 12</div>
                                        <div className="hk-item">2x Burger</div>
                                        <div className="hk-item">1x Kola</div>
                                        <div className="hk-status blue">Yeni Sipariş</div>
                                    </div>
                                    <div className="hk-arrow">→</div>
                                    <div className="hk-col">
                                        <div className="hk-col-title">Masa 12</div>
                                        <div className="hk-item">2x Burger</div>
                                        <div className="hk-item">1x Kola</div>
                                        <div className="hk-status yellow">Hazırlanıyor</div>
                                    </div>
                                    <div className="hk-arrow">→</div>
                                    <div className="hk-col" style={{opacity: 0.5}}>
                                        <div className="hk-col-title">Masa 12</div>
                                        <div className="hk-status green"><Check size={14}/> Teslim Edildi</div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* ── 2. SORUN / ÇÖZÜM ALANI ── */}
                <section className="jk-problem-solution">
                    <div className="jk-container">
                        <div className="jk-ps-grid">
                            <motion.div 
                                className="jk-ps-card error-card"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                            >
                                <h3>Eski Yöntem</h3>
                                <ul>
                                    <li><X size={20} color="#EF4444"/> Kağıt fişlerle karmaşa</li>
                                    <li><X size={20} color="#EF4444"/> Sipariş karışıklıkları</li>
                                    <li><X size={20} color="#EF4444"/> Geciken servisler</li>
                                    <li><X size={20} color="#EF4444"/> Mutfak yoğunluğu kontrolsüz</li>
                                </ul>
                            </motion.div>

                            <motion.div 
                                className="jk-ps-card success-card"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.2 }}
                            >
                                <h3>JetKDS</h3>
                                <ul>
                                    <li><CheckCircle2 size={20} color="#10B981"/> Anlık sipariş aktarımı</li>
                                    <li><CheckCircle2 size={20} color="#10B981"/> Hazırlık süreleri kontrolü</li>
                                    <li><CheckCircle2 size={20} color="#10B981"/> Anlık durum takibi</li>
                                    <li><CheckCircle2 size={20} color="#10B981"/> Tam ekip senkronizasyonu</li>
                                </ul>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* ── 3. NASIL ÇALIŞIR (TIMELINE) ── */}
                <section className="jk-timeline-section">
                    <div className="jk-container">
                        <div className="jk-section-head">
                            <div className="jk-badge">Nasıl Çalışır?</div>
                            <h2>Siparişten Teslimata Mükemmel Uyum</h2>
                        </div>
                        
                        <div className="jk-timeline">
                            {[
                                { step: "1", title: "Garson Siparişi Alır", desc: "Mobil uygulama veya POS üzerinden.", icon: <Smartphone/> },
                                { step: "2", title: "Sipariş Mutfağa Düşer", desc: "Anında KDS ekranına aktarılır.", icon: <RefreshCcw/> },
                                { step: "3", title: "Hazırlık Süreci Başlar", desc: "Mutfak siparişi yönetir.", icon: <ChefHat/> },
                                { step: "4", title: "Hazır Bildirimi Gönderilir", desc: "Garson anında bilgilendirilir.", icon: <Bell/> }
                            ].map((item, i) => (
                                <motion.div 
                                    key={i}
                                    className="jk-timeline-item"
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                >
                                    <div className="jk-t-icon">{item.icon}</div>
                                    <div className="jk-t-step">{item.step}</div>
                                    <h4>{item.title}</h4>
                                    <p>{item.desc}</p>
                                    {i < 3 && <div className="jk-t-arrow">↓</div>}
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── 4. CANLI DEMO ALANI ── */}
                <div id="demo-section">
                    <JetKDSSection hideContent={true} />
                </div>

                {/* ── 5. ÖZELLİKLER ── */}
                <section className="jk-features">
                    <div className="jk-container">
                        <div className="jk-section-head">
                            <div className="jk-badge">Özellikler</div>
                            <h2>Neden JetKDS?</h2>
                        </div>
                        <div className="jk-features-grid">
                            {[
                                { title: "Anlık Sipariş Bildirimleri", icon: <Bell/> },
                                { title: "Hazırlık Süresi Takibi", icon: <Clock/> },
                                { title: "Operasyon Analitiği", icon: <BarChart3/> },
                                { title: "Mutfak Yönetimi", icon: <ChefHat/> },
                                { title: "Garson Entegrasyonu", icon: <Smartphone/> },
                                { title: "Gerçek Zamanlı Senkronizasyon", icon: <RefreshCcw/> },
                            ].map((feature, i) => (
                                <motion.div 
                                    key={i} className="jk-feature-card"
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                >
                                    <div className="jk-fc-icon">{feature.icon}</div>
                                    <h4>{feature.title}</h4>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── 6. KİMLER İÇİN? ── */}
                <section className="jk-who">
                    <div className="jk-container">
                        <div className="jk-section-head">
                            <div className="jk-badge">Kimler İçin?</div>
                            <h2>İşletmenize Uygun Çözüm</h2>
                        </div>
                        <div className="jk-who-grid">
                            {[
                                { title: "Restoranlar", icon: <Store size={32}/> },
                                { title: "Kafeler", icon: <Coffee size={32}/> },
                                { title: "Fast Food Zincirleri", icon: <ChefHat size={32}/> },
                                { title: "Oteller", icon: <Building2 size={32}/> },
                            ].map((item, i) => (
                                <div key={i} className="jk-who-card">
                                    <div className="jk-wc-icon">{item.icon}</div>
                                    <h4>{item.title}</h4>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── 7. ANALİTİKLER ── */}
                <section className="jk-analytics">
                    <div className="jk-container jk-analytics-grid">
                        <div className="jk-an-content">
                            <div className="jk-badge">Performans</div>
                            <h2>Verilerle Konuşan Bir Mutfak</h2>
                            <p>
                                Ortalama hazırlık sürenizi ölçün, en yoğun saatleri belirleyin ve personelinizin performansını gerçek zamanlı izleyin.
                            </p>
                            <ul className="jk-an-list">
                                <li><CheckCircle2 size={18} color="#7886C7"/> Ortalama hazırlık süresi</li>
                                <li><CheckCircle2 size={18} color="#7886C7"/> Tamamlanan sipariş sayısı</li>
                                <li><CheckCircle2 size={18} color="#7886C7"/> Bekleyen siparişler</li>
                                <li><CheckCircle2 size={18} color="#7886C7"/> Yoğun saat analizi</li>
                                <li><CheckCircle2 size={18} color="#7886C7"/> Garson performansı</li>
                            </ul>
                        </div>
                        <div className="jk-an-mockup">
                            <div className="jk-dashboard-glass">
                                <div className="jk-dash-top">
                                    <div className="jk-dash-card">
                                        <span>Ortalama Süre</span>
                                        <strong>12 Dk</strong>
                                    </div>
                                    <div className="jk-dash-card">
                                        <span>Tamamlanan</span>
                                        <strong>142</strong>
                                    </div>
                                </div>
                                <div className="jk-dash-chart">
                                    {/* Mock Chart Bars */}
                                    <div className="bar-wrapper"><div className="bar" style={{height: "40%"}}></div></div>
                                    <div className="bar-wrapper"><div className="bar" style={{height: "60%"}}></div></div>
                                    <div className="bar-wrapper"><div className="bar" style={{height: "100%", background: "#7886C7"}}></div></div>
                                    <div className="bar-wrapper"><div className="bar" style={{height: "80%"}}></div></div>
                                    <div className="bar-wrapper"><div className="bar" style={{height: "30%"}}></div></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── 8. MÜŞTERİ YORUMLARI ── */}
                <section className="jk-testimonials">
                    <div className="jk-container">
                        <div className="jk-section-head">
                            <h2>İşletmeler Ne Diyor?</h2>
                        </div>
                        <div className="jk-test-grid">
                            {[
                                { text: "JetKDS sayesinde mutfaktaki bağrışmalar tamamen bitti. Garson ve aşçı arasındaki iletişim kusursuz.", author: "Ahmet Y., Restoran Sahibi" },
                                { text: "Sipariş gecikme şikayetlerimiz %80 azaldı. Herkes ne yapması gerektiğini anında ekranda görüyor.", author: "Selin K., Kafe Yöneticisi" },
                                { text: "Hafta sonu yoğunluğunda bile sıfır hata ile servis çıkardık. Sistemin hızı inanılmaz.", author: "Murat T., Fast Food Zinciri" }
                            ].map((test, i) => (
                                <div key={i} className="jk-test-card">
                                    <div className="jk-stars">★★★★★</div>
                                    <p>"{test.text}"</p>
                                    <div className="jk-author">{test.author}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── 9. TALEP FORMU ── */}
                <section id="lead-form" className="jk-lead-section">
                    <div className="jk-container">
                        <div className="jk-form-glass">
                            {formStatus === "success" ? (
                                <motion.div 
                                    className="jk-form-success"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                >
                                    <div className="success-icon"><Check size={40} color="white"/></div>
                                    <h3>Talebiniz Alındı! 🎉</h3>
                                    <p>JetPOS ekibimiz en kısa sürede sizinle iletişime geçecektir.</p>
                                    <button className="btn-secondary" onClick={() => setFormStatus("idle")}>Yeni Form Gönder</button>
                                </motion.div>
                            ) : (
                                <>
                                    <div className="jk-form-head">
                                        <h2>JetKDS İçin Talep Oluşturun</h2>
                                        <p>İşletmenize özel çözümler için formu doldurun.</p>
                                    </div>
                                    <form onSubmit={handleFormSubmit} className="jk-form">
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label>Ad Soyad</label>
                                                <input type="text" required placeholder="Adınız Soyadınız" />
                                            </div>
                                            <div className="form-group">
                                                <label>İşletme Adı</label>
                                                <input type="text" required placeholder="İşletmenizin Adı" />
                                            </div>
                                        </div>
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label>Telefon</label>
                                                <input type="tel" required placeholder="05XX XXX XX XX" />
                                            </div>
                                            <div className="form-group">
                                                <label>E-Posta</label>
                                                <input type="email" required placeholder="ornek@sirket.com" />
                                            </div>
                                        </div>
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label>Şube Sayısı</label>
                                                <select required>
                                                    <option value="">Seçiniz</option>
                                                    <option value="1">1 Şube</option>
                                                    <option value="2-5">2-5 Şube</option>
                                                    <option value="5+">5+ Şube</option>
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label>İşletme Türü</label>
                                                <select required>
                                                    <option value="">Seçiniz</option>
                                                    <option value="Restoran">Restoran</option>
                                                    <option value="Kafe">Kafe</option>
                                                    <option value="Fast Food">Fast Food</option>
                                                    <option value="Otel">Otel</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label>Mesaj (Opsiyonel)</label>
                                            <textarea rows={3} placeholder="Eklemek istedikleriniz..."></textarea>
                                        </div>
                                        <button type="submit" className="btn-primary form-submit" disabled={formStatus === "submitting"}>
                                            {formStatus === "submitting" ? "Gönderiliyor..." : "JetKDS Talebi Gönder"}
                                        </button>
                                    </form>
                                </>
                            )}
                        </div>
                    </div>
                </section>

                {/* ── 10. FOOTER CTA ── */}
                <section className="jk-footer-cta">
                    <div className="jk-container">
                        <h2>Mutfağınızı Daha Akıllı Hale Getirin.</h2>
                        <p>JetKDS ile sipariş süreçlerinizi hızlandırın ve operasyonel verimliliğinizi artırın.</p>
                        <div className="jk-hero-actions" style={{justifyContent: 'center', marginTop: '30px'}}>
                            <button className="btn-primary" onClick={() => document.getElementById("lead-form")?.scrollIntoView({ behavior: 'smooth'})}>
                                Demo Talep Et
                            </button>
                            <button className="btn-secondary">
                                Satış Ekibiyle Görüş
                            </button>
                        </div>
                    </div>
                </section>

                <Footer />
            </main>

            <style dangerouslySetInnerHTML={{
                __html: `
                .jk-landing-main {
                    font-family: 'Inter', sans-serif;
                    color: #111827;
                    padding-top: 80px; /* Navbar space */
                    position: relative;
                    z-index: 1;
                }
                .jk-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 0 20px;
                }
                .jk-section-head { text-align: center; margin-bottom: 50px; }
                .jk-section-head h2 { font-size: 2.5rem; font-weight: 800; color: #111827; letter-spacing: -0.02em; margin-top: 10px; }
                
                .jk-badge { display: inline-block; padding: 6px 14px; background: rgba(120, 134, 199, 0.1); color: #7886C7; font-weight: 800; font-size: 0.85rem; border-radius: 99px; }
                .text-gradient { background: linear-gradient(135deg, #7886C7, #5A659F); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
                
                .btn-primary { background: linear-gradient(135deg, #7886C7, #5A659F); color: white; padding: 14px 28px; border-radius: 12px; font-weight: 700; border: none; cursor: pointer; transition: 0.3s; box-shadow: 0 10px 25px rgba(120,134,199,0.3); font-size: 1rem; }
                .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 15px 30px rgba(120,134,199,0.4); }
                .btn-secondary { background: white; color: #111827; padding: 14px 28px; border-radius: 12px; font-weight: 700; border: 1px solid #E5E7EB; cursor: pointer; transition: 0.3s; box-shadow: 0 4px 6px rgba(0,0,0,0.05); font-size: 1rem; }
                .btn-secondary:hover { border-color: #7886C7; color: #7886C7; transform: translateY(-2px); }

                /* 1. HERO */
                .jk-hero { padding: 80px 0 100px; }
                .jk-hero-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; }
                .jk-title { font-size: 4rem; font-weight: 800; line-height: 1.1; margin: 20px 0; letter-spacing: -0.04em; }
                .jk-subtitle { font-size: 1.2rem; color: #4B5563; line-height: 1.6; margin-bottom: 40px; }
                .jk-hero-actions { display: flex; gap: 16px; margin-bottom: 50px; }
                
                .jk-hero-stats { display: flex; gap: 30px; border-top: 1px solid rgba(120,134,199,0.2); padding-top: 30px; }
                .jk-stat { display: flex; flex-direction: column; }
                .jk-stat strong { font-size: 1.8rem; font-weight: 800; color: #7886C7; }
                .jk-stat span { font-size: 0.85rem; color: #4B5563; font-weight: 600; }

                .hero-kds-glass { background: rgba(255,255,255,0.7); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.5); border-radius: 20px; box-shadow: 0 30px 60px rgba(0,0,0,0.08); overflow: hidden; transform: perspective(1000px) rotateY(-5deg) rotateX(5deg) translateZ(0); transition: 0.5s; will-change: transform; }
                .hero-kds-glass:hover { transform: perspective(1000px) rotateY(0) rotateX(0) translateZ(0); }
                .hero-kds-header { display: flex; gap: 8px; padding: 16px; background: rgba(255,255,255,0.5); border-bottom: 1px solid rgba(0,0,0,0.05); }
                .hk-dot { width: 12px; height: 12px; border-radius: 50%; }
                .hero-kds-body { padding: 20px; display: flex; align-items: center; justify-content: space-between; gap: 10px; }
                .hk-col { background: white; padding: 16px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); flex: 1; border: 1px solid #F3F4F6; }
                .hk-col-title { font-weight: 800; font-size: 0.9rem; margin-bottom: 10px; }
                .hk-item { font-size: 0.8rem; color: #4B5563; margin-bottom: 4px; }
                .hk-status { margin-top: 12px; font-size: 0.7rem; font-weight: 800; padding: 4px 8px; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px; }
                .hk-status.blue { background: #EFF6FF; color: #3B82F6; }
                .hk-status.yellow { background: #FEF3C7; color: #D97706; }
                .hk-status.green { background: #D1FAE5; color: #10B981; }
                .hk-arrow { color: #9CA3AF; font-weight: bold; }

                /* 2. PROBLEM / SOLUTION */
                .jk-problem-solution { padding: 80px 0; background: #F9FAFB; }
                .jk-ps-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
                .jk-ps-card { padding: 40px; border-radius: 24px; background: white; box-shadow: 0 10px 30px rgba(0,0,0,0.03); border: 1px solid #E5E7EB; }
                .jk-ps-card h3 { font-size: 1.8rem; font-weight: 800; margin-bottom: 24px; }
                .jk-ps-card ul { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 16px; }
                .jk-ps-card li { display: flex; align-items: center; gap: 12px; font-size: 1.1rem; font-weight: 500; color: #4B5563; }
                .error-card { border-top: 6px solid #EF4444; }
                .success-card { border-top: 6px solid #10B981; }

                /* 3. TIMELINE */
                .jk-timeline-section { padding: 100px 0; }
                .jk-timeline { display: flex; justify-content: space-between; align-items: flex-start; text-align: center; gap: 20px; }
                .jk-timeline-item { flex: 1; display: flex; flex-direction: column; align-items: center; position: relative; }
                .jk-t-icon { width: 64px; height: 64px; background: #EEF2FF; color: #7886C7; border-radius: 20px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; }
                .jk-t-step { width: 28px; height: 28px; background: #7886C7; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.8rem; position: absolute; top: -10px; right: 50%; transform: translateX(45px); border: 3px solid white; }
                .jk-timeline-item h4 { font-size: 1.2rem; font-weight: 800; margin-bottom: 10px; }
                .jk-timeline-item p { font-size: 0.95rem; color: #4B5563; line-height: 1.5; }
                .jk-t-arrow { font-size: 1.5rem; color: #D1D5DB; margin-top: 20px; display: none; }

                /* 5. FEATURES */
                .jk-features { padding: 100px 0; background: #F9FAFB; }
                .jk-features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; }
                .jk-feature-card { background: white; padding: 30px; border-radius: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); border: 1px solid #E5E7EB; transition: 0.3s; will-change: transform, box-shadow; transform: translateZ(0); }
                .jk-feature-card:hover { transform: translateY(-5px); box-shadow: 0 10px 30px rgba(120,134,199,0.1); border-color: rgba(120,134,199,0.3); }
                .jk-fc-icon { width: 50px; height: 50px; background: rgba(120,134,199,0.1); color: #7886C7; border-radius: 14px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; }
                .jk-feature-card h4 { font-size: 1.2rem; font-weight: 800; color: #111827; }

                /* 6. WHO */
                .jk-who { padding: 100px 0; }
                .jk-who-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
                .jk-who-card { text-align: center; padding: 40px 20px; background: #FFFFFF; border-radius: 20px; border: 1px solid #E5E7EB; transition: 0.3s; }
                .jk-who-card:hover { background: #7886C7; color: white; transform: translateY(-5px); }
                .jk-wc-icon { margin-bottom: 20px; color: #7886C7; transition: 0.3s; }
                .jk-who-card:hover .jk-wc-icon { color: white; }
                .jk-who-card h4 { font-size: 1.2rem; font-weight: 800; }

                /* 7. ANALYTICS */
                .jk-analytics { padding: 100px 0; background: #111827; color: white; overflow: hidden; }
                .jk-analytics .jk-badge { background: rgba(255,255,255,0.1); color: white; }
                .jk-analytics-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; }
                .jk-an-content h2 { font-size: 3rem; font-weight: 800; margin: 20px 0; letter-spacing: -0.03em; color: white; }
                .jk-an-content p { font-size: 1.1rem; color: #9CA3AF; line-height: 1.6; margin-bottom: 30px; }
                .jk-an-list { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 16px; }
                .jk-an-list li { display: flex; align-items: center; gap: 12px; font-size: 1.1rem; font-weight: 500; }

                .jk-dashboard-glass { background: rgba(255,255,255,0.05); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; padding: 30px; transform: translateZ(0); }
                .jk-dash-top { display: flex; gap: 20px; margin-bottom: 30px; }
                .jk-dash-card { flex: 1; background: rgba(255,255,255,0.05); padding: 20px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); }
                .jk-dash-card span { display: block; font-size: 0.85rem; color: #9CA3AF; margin-bottom: 8px; }
                .jk-dash-card strong { font-size: 2rem; font-weight: 800; color: white; }
                .jk-dash-chart { display: flex; align-items: flex-end; justify-content: space-between; height: 150px; padding: 20px; background: rgba(0,0,0,0.2); border-radius: 16px; }
                .bar-wrapper { width: 15%; height: 100%; display: flex; align-items: flex-end; }
                .bar { width: 100%; background: #4B5563; border-radius: 6px 6px 0 0; transition: 0.3s; }

                /* 8. TESTIMONIALS */
                .jk-testimonials { padding: 100px 0; background: #F9FAFB; }
                .jk-test-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; margin-top: 40px; }
                .jk-test-card { background: white; padding: 40px 30px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.03); border: 1px solid #E5E7EB; }
                .jk-stars { color: #F59E0B; font-size: 1.5rem; letter-spacing: 2px; margin-bottom: 20px; }
                .jk-test-card p { font-size: 1.1rem; color: #4B5563; line-height: 1.6; font-style: italic; margin-bottom: 24px; }
                .jk-author { font-weight: 800; color: #111827; }

                /* 9. LEAD FORM */
                .jk-lead-section { padding: 100px 0; background: #EEF2FF; }
                .jk-form-glass { background: white; padding: 50px; border-radius: 30px; box-shadow: 0 20px 50px rgba(120,134,199,0.1); max-width: 800px; margin: 0 auto; position: relative; overflow: hidden; }
                .jk-form-head { text-align: center; margin-bottom: 40px; }
                .jk-form-head h2 { font-size: 2.5rem; font-weight: 800; color: #111827; margin-bottom: 10px; }
                .jk-form-head p { color: #4B5563; font-size: 1.1rem; }
                
                .form-row { display: flex; gap: 20px; margin-bottom: 20px; }
                .form-group { flex: 1; display: flex; flex-direction: column; gap: 8px; }
                .form-group label { font-weight: 700; font-size: 0.9rem; color: #374151; }
                .form-group input, .form-group select, .form-group textarea { padding: 14px 16px; border-radius: 12px; border: 1px solid #D1D5DB; font-family: inherit; font-size: 1rem; outline: none; transition: 0.3s; background: #F9FAFB; }
                .form-group input:focus, .form-group select:focus, .form-group textarea:focus { border-color: #7886C7; background: white; box-shadow: 0 0 0 4px rgba(120,134,199,0.1); }
                .form-submit { width: 100%; margin-top: 20px; padding: 18px; font-size: 1.1rem; }
                .form-submit:disabled { opacity: 0.7; cursor: not-allowed; }

                .jk-form-success { text-align: center; padding: 40px 0; }
                .success-icon { width: 80px; height: 80px; background: #10B981; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; box-shadow: 0 10px 25px rgba(16,185,129,0.3); }
                .jk-form-success h3 { font-size: 2rem; font-weight: 800; margin-bottom: 16px; }
                .jk-form-success p { color: #4B5563; font-size: 1.1rem; margin-bottom: 30px; }

                /* 10. FOOTER CTA */
                .jk-footer-cta { padding: 120px 0; background: linear-gradient(135deg, #111827, #1F2937); text-align: center; color: white; }
                .jk-footer-cta h2 { font-size: 3.5rem; font-weight: 800; letter-spacing: -0.03em; margin-bottom: 20px; color: white; }
                .jk-footer-cta p { font-size: 1.2rem; color: #9CA3AF; max-width: 600px; margin: 0 auto; }
                .jk-footer-cta .btn-secondary { background: rgba(255,255,255,0.1); color: white; border-color: rgba(255,255,255,0.2); }
                .jk-footer-cta .btn-secondary:hover { background: white; color: #111827; }

                /* RESPONSIVE */
                @media (max-width: 1024px) {
                    .jk-hero-grid, .jk-ps-grid, .jk-analytics-grid { grid-template-columns: 1fr; gap: 50px; text-align: center; }
                    .jk-hero-actions { justify-content: center; }
                    .jk-hero-stats { justify-content: center; }
                    .jk-timeline { flex-direction: column; align-items: center; gap: 40px; }
                    .jk-t-arrow { display: block; }
                    .jk-timeline-item { width: 100%; }
                    .jk-t-step { right: auto; left: 20px; transform: none; top: 0; }
                    .jk-features-grid, .jk-test-grid { grid-template-columns: 1fr 1fr; }
                    .jk-who-grid { grid-template-columns: 1fr 1fr; }
                    .jk-an-list { align-items: center; }
                }
                @media (max-width: 768px) {
                    .jk-title { font-size: 3rem; }
                    .jk-features-grid, .jk-test-grid, .jk-who-grid { grid-template-columns: 1fr; }
                    .form-row { flex-direction: column; gap: 0; }
                    .jk-footer-cta h2 { font-size: 2.5rem; }
                    .jk-form-glass { padding: 30px 20px; }
                }
            `}} />
        </>
    );
}
