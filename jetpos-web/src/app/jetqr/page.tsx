"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import JetQRMockup from "@/components/JetQRMockup";
import { motion } from "framer-motion";
import { Smartphone, ShoppingCart, RefreshCcw, LineChart, Utensils, Coffee, Store, ChefHat, Check } from "lucide-react";
import Image from "next/image";

export default function JetQRLandingPage() {
    const [demoTab, setDemoTab] = useState("menu");
    const [formStatus, setFormStatus] = useState<"idle" | "submitting" | "success">("idle");

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFormStatus("submitting");
        setTimeout(() => setFormStatus("success"), 1500);
    };

    return (
        <>
            <div className="site-bg" />
            <main className="jetqr-landing-main">
                <Navbar />

                {/* ── 1. Hero Section ── */}
                <section className="jq-hero">
                    <div className="jq-container jq-hero-grid">
                        <motion.div 
                            className="jq-hero-content"
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <div className="jq-badge">🚀 JetQR</div>
                            <h1 className="jq-title">Dijital Menüden <br/><span className="text-gradient">Daha Fazlası.</span></h1>
                            <p className="jq-subtitle">
                                JetQR ile QR menünüzü oluşturun, masadan sipariş alın, ürünlerinizi yönetin ve müşterilerinize modern bir deneyim sunun.
                            </p>
                            <div className="jq-hero-actions">
                                <button className="btn-primary" onClick={() => document.getElementById("demo-section")?.scrollIntoView({ behavior: 'smooth'})}>
                                    Demo İncele
                                </button>
                                <button className="btn-secondary" onClick={() => document.getElementById("lead-form")?.scrollIntoView({ behavior: 'smooth'})}>
                                    Talep Oluştur
                                </button>
                            </div>
                        </motion.div>
                        
                        <motion.div 
                            className="jq-hero-mockup"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                        >
                            <JetQRMockup isVisible={true} />
                        </motion.div>
                    </div>
                </section>

                {/* ── 2. Features Section ── */}
                <section className="jq-features">
                    <div className="jq-container">
                        <div className="section-header">
                            <h2>Neden JetQR?</h2>
                            <p>İşletmenizi bir adım öteye taşıyacak premium özellikler.</p>
                        </div>

                        <div className="features-grid">
                            {[
                                { icon: <Smartphone />, title: "Mobil Uyumlu Menü", desc: "Fiyatları ve ürünleri anında güncelleyin. Mükemmel mobil deneyim." },
                                { icon: <ShoppingCart />, title: "Sipariş Alma Sistemi", desc: "Müşteriler doğrudan telefonlarından sipariş verebilir, sepet oluşturabilir." },
                                { icon: <RefreshCcw />, title: "Anlık Güncelleme", desc: "QR kodlar yeniden basılmadan menü içerikleri saniyeler içinde değişebilir." },
                                { icon: <LineChart />, title: "Sipariş Analitiği", desc: "En çok satan ürünleri ve sipariş performansını anlık olarak takip edin." }
                            ].map((feat, idx) => (
                                <motion.div 
                                    key={idx} 
                                    className="feature-card glass"
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.1 }}
                                >
                                    <div className="f-icon-wrapper">{feat.icon}</div>
                                    <h3>{feat.title}</h3>
                                    <p>{feat.desc}</p>
                                    <div className="card-glow" />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── 3. How It Works ── */}
                <section className="jq-how-it-works">
                    <div className="jq-container">
                        <div className="section-header">
                            <h2>Nasıl Çalışır?</h2>
                        </div>
                        
                        <div className="steps-container">
                            <div className="step-item">
                                <div className="step-circle">1</div>
                                <h4>Menünüzü Oluşturun</h4>
                                <p>Ürünlerinizi ve kategorilerinizi sisteme ekleyin.</p>
                            </div>
                            <div className="step-arrow">→</div>
                            <div className="step-item">
                                <div className="step-circle">2</div>
                                <h4>QR Kodunuzu Yerleştirin</h4>
                                <p>Masanıza veya işletmenize QR kodunuzu koyun.</p>
                            </div>
                            <div className="step-arrow">→</div>
                            <div className="step-item">
                                <div className="step-circle">3</div>
                                <h4>Sipariş Almaya Başlayın</h4>
                                <p>Müşterileriniz saniyeler içinde sipariş verebilir.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── 4. Product Demo Section ── */}
                <section id="demo-section" className="jq-demo-section">
                    <div className="jq-container">
                        <div className="demo-layout glass">
                            <div className="demo-left">
                                <div className="demo-screen-mockup">
                                    <div className="demo-screen-inner">
                                        {demoTab === "menu" && <Image src="/images/qr/classic_burger.png" alt="Menü" fill style={{ objectFit: 'cover' }} />}
                                        
                                        {demoTab === "order" && (
                                            <div className="mockup-ui order-ui">
                                                <div className="m-header">Sipariş Sepeti</div>
                                                <div className="m-body">
                                                    <div className="m-item">
                                                        <div className="m-item-info">
                                                            <span className="m-item-name">Classic Burger</span>
                                                            <span className="m-item-qty">x2</span>
                                                        </div>
                                                        <div className="m-item-price">₺580</div>
                                                    </div>
                                                    <div className="m-item">
                                                        <div className="m-item-info">
                                                            <span className="m-item-name">Kutu Kola</span>
                                                            <span className="m-item-qty">x1</span>
                                                        </div>
                                                        <div className="m-item-price">₺50</div>
                                                    </div>
                                                    <div className="m-item">
                                                        <div className="m-item-info">
                                                            <span className="m-item-name">Patates Kızartması</span>
                                                            <span className="m-item-qty">x1</span>
                                                        </div>
                                                        <div className="m-item-price">₺80</div>
                                                    </div>
                                                </div>
                                                <div className="m-footer">
                                                    <div className="m-total"><span>Toplam:</span> <strong>₺710</strong></div>
                                                    <button className="m-btn">Siparişi Onayla</button>
                                                </div>
                                            </div>
                                        )}

                                        {demoTab === "analytics" && (
                                            <div className="mockup-ui analytics-ui">
                                                <div className="m-header">Canlı Analitik</div>
                                                <div className="m-body">
                                                    <div className="m-stat-cards">
                                                        <div className="m-stat-card">
                                                            <span>Günlük Ciro</span>
                                                            <strong>₺12.450</strong>
                                                        </div>
                                                        <div className="m-stat-card">
                                                            <span>Sipariş</span>
                                                            <strong>48</strong>
                                                        </div>
                                                    </div>
                                                    <div className="m-chart">
                                                        <div className="m-bar" style={{height: "40%"}}></div>
                                                        <div className="m-bar" style={{height: "60%"}}></div>
                                                        <div className="m-bar" style={{height: "30%"}}></div>
                                                        <div className="m-bar" style={{height: "80%"}}></div>
                                                        <div className="m-bar active" style={{height: "100%"}}></div>
                                                    </div>
                                                    <div className="m-recent">
                                                        <div className="m-recent-title">Son Siparişler</div>
                                                        <div className="m-recent-item">Masa 4 <span className="m-badge">Yeni</span></div>
                                                        <div className="m-recent-item">Masa 12 <span className="m-badge" style={{background: 'rgba(16, 185, 129, 0.1)', color: '#10B981'}}>Hazırlanıyor</span></div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {demoTab === "admin" && (
                                            <div className="mockup-ui admin-ui">
                                                <div className="m-header">Menü Yönetimi</div>
                                                <div className="m-body">
                                                    <button className="m-btn-outline">+ Yeni Ürün Ekle</button>
                                                    <div className="m-product-list">
                                                        <div className="m-product-item">
                                                            <div className="m-p-info">
                                                                <strong>Classic Burger</strong>
                                                                <span>₺290</span>
                                                            </div>
                                                            <div className="m-toggle active"></div>
                                                        </div>
                                                        <div className="m-product-item">
                                                            <div className="m-p-info">
                                                                <strong>Cheesecake</strong>
                                                                <span>₺120</span>
                                                            </div>
                                                            <div className="m-toggle"></div>
                                                        </div>
                                                        <div className="m-product-item">
                                                            <div className="m-p-info">
                                                                <strong>Kutu Kola</strong>
                                                                <span>₺50</span>
                                                            </div>
                                                            <div className="m-toggle active"></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="demo-right">
                                <h3>Her Şey Tek Bir Yerde</h3>
                                <div className="demo-tabs">
                                    {[
                                        { id: "menu", label: "Canlı Menü" },
                                        { id: "order", label: "Sipariş Akışı" },
                                        { id: "analytics", label: "Analitik" },
                                        { id: "admin", label: "Yönetim Paneli" }
                                    ].map(tab => (
                                        <div 
                                            key={tab.id} 
                                            className={`demo-tab ${demoTab === tab.id ? "active" : ""}`}
                                            onClick={() => setDemoTab(tab.id)}
                                        >
                                            {tab.label}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── 5. Use Cases ── */}
                <section className="jq-use-cases">
                    <div className="jq-container">
                        <div className="section-header">
                            <h2>Kimler İçin Uygun?</h2>
                        </div>
                        <div className="use-case-grid">
                            {[
                                { icon: <Utensils />, name: "Restoranlar" },
                                { icon: <Coffee />, name: "Kafeler" },
                                { icon: <Store />, name: "Kasaplar" },
                                { icon: <ChefHat />, name: "Pastaneler" }
                            ].map((uc, i) => (
                                <div key={i} className="use-case-card glass">
                                    {uc.icon}
                                    <h4>{uc.name}</h4>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── 6. Lead Form ── */}
                <section id="lead-form" className="jq-lead-form">
                    <div className="jq-container">
                        <div className="form-wrapper glass">
                            {formStatus === "success" ? (
                                <motion.div 
                                    className="form-success"
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                >
                                    <div className="success-icon"><Check size={50} /></div>
                                    <h3>Talebiniz Başarıyla Alındı</h3>
                                    <p>JetQR ekibimiz en kısa sürede sizinle iletişime geçecektir.</p>
                                </motion.div>
                            ) : (
                                <form onSubmit={handleFormSubmit}>
                                    <div className="form-header">
                                        <h2>JetQR İçin İlk Siz Haberdar Olun</h2>
                                        <p>Ürün hakkında detaylı bilgi almak ve erken erişim fırsatlarından yararlanmak için formu doldurun.</p>
                                    </div>
                                    
                                    <div className="form-grid">
                                        <div className="input-group">
                                            <label>Ad Soyad</label>
                                            <input type="text" required placeholder="Ahmet Yılmaz" />
                                        </div>
                                        <div className="input-group">
                                            <label>İşletme Adı</label>
                                            <input type="text" required placeholder="JetPOS Cafe" />
                                        </div>
                                        <div className="input-group">
                                            <label>Telefon</label>
                                            <input type="tel" required placeholder="05XX XXX XX XX" />
                                        </div>
                                        <div className="input-group">
                                            <label>E-Posta</label>
                                            <input type="email" required placeholder="ornek@mail.com" />
                                        </div>
                                        <div className="input-group full-width">
                                            <label>İşletme Türü</label>
                                            <select required>
                                                <option value="">Seçiniz...</option>
                                                <option value="restoran">Restoran</option>
                                                <option value="kafe">Kafe</option>
                                                <option value="kasap">Kasap</option>
                                                <option value="pastane">Pastane</option>
                                                <option value="diger">Diğer</option>
                                            </select>
                                        </div>
                                        <div className="input-group full-width">
                                            <label>Mesajınız</label>
                                            <textarea rows={4} placeholder="Eklemek istedikleriniz..."></textarea>
                                        </div>
                                    </div>

                                    <button type="submit" className="submit-btn" disabled={formStatus === "submitting"}>
                                        {formStatus === "submitting" ? "Gönderiliyor..." : "Talep Gönder"}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </section>

                <Footer />
            </main>

            <style dangerouslySetInnerHTML={{__html: `
                .jetqr-landing-main {
                    position: relative;
                    z-index: 1;
                    padding-top: 80px; /* Navbar space */
                }
                .jq-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 0 24px;
                }
                .section-header {
                    text-align: center;
                    margin-bottom: 50px;
                }
                .section-header h2 {
                    font-size: 2.5rem;
                    font-weight: 800;
                    color: #111827;
                    margin-bottom: 12px;
                }
                .section-header p {
                    color: #6B7280;
                    font-size: 1.1rem;
                }
                .glass {
                    background: rgba(255, 255, 255, 0.7);
                    backdrop-filter: blur(16px);
                    border: 1px solid rgba(255, 255, 255, 0.5);
                    box-shadow: 0 10px 30px rgba(0,0,0,0.05);
                    border-radius: 24px;
                }
                .text-gradient {
                    background: linear-gradient(135deg, #7886C7 0%, #5A659F 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                /* HERO */
                .jq-hero {
                    padding: 80px 0;
                }
                .jq-hero-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 60px;
                    align-items: center;
                }
                .jq-badge {
                    display: inline-block;
                    background: rgba(120, 134, 199, 0.1);
                    color: #7886C7;
                    font-weight: 700;
                    padding: 8px 16px;
                    border-radius: 99px;
                    margin-bottom: 24px;
                }
                .jq-title {
                    font-size: 3.5rem;
                    font-weight: 800;
                    line-height: 1.1;
                    color: #111827;
                    margin-bottom: 24px;
                }
                .jq-subtitle {
                    font-size: 1.25rem;
                    color: #4B5563;
                    line-height: 1.6;
                    margin-bottom: 40px;
                }
                .jq-hero-actions {
                    display: flex;
                    gap: 16px;
                }
                .btn-primary {
                    background: linear-gradient(135deg, #7886C7 0%, #5A659F 100%);
                    color: white;
                    padding: 16px 32px;
                    border-radius: 99px;
                    font-weight: 700;
                    border: none;
                    cursor: pointer;
                    box-shadow: 0 10px 25px rgba(120, 134, 199, 0.4);
                    transition: transform 0.2s;
                }
                .btn-primary:hover { transform: translateY(-3px); }
                .btn-secondary {
                    background: white;
                    color: #111827;
                    padding: 16px 32px;
                    border-radius: 99px;
                    font-weight: 700;
                    border: 1px solid #E5E7EB;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-secondary:hover { background: #F3F4F6; }
                .jq-hero-mockup {
                    display: flex;
                    justify-content: center;
                }

                /* FEATURES */
                .jq-features { padding: 80px 0; }
                .features-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 24px;
                }
                .feature-card {
                    padding: 32px;
                    position: relative;
                    overflow: hidden;
                    transition: transform 0.3s;
                }
                .feature-card:hover {
                    transform: translateY(-5px);
                }
                .f-icon-wrapper {
                    width: 50px; height: 50px;
                    background: rgba(120, 134, 199, 0.1);
                    color: #7886C7;
                    border-radius: 12px;
                    display: flex; align-items: center; justify-content: center;
                    margin-bottom: 20px;
                }
                .feature-card h3 { font-size: 1.25rem; font-weight: 700; margin-bottom: 12px; color: #111827; }
                .feature-card p { color: #6B7280; line-height: 1.5; }
                .card-glow {
                    position: absolute;
                    bottom: -50px; right: -50px;
                    width: 150px; height: 150px;
                    background: radial-gradient(circle, rgba(120,134,199,0.1) 0%, transparent 70%);
                    transition: all 0.5s;
                }
                .feature-card:hover .card-glow {
                    transform: scale(1.5);
                    background: radial-gradient(circle, rgba(120,134,199,0.2) 0%, transparent 70%);
                }

                /* HOW IT WORKS */
                .jq-how-it-works { padding: 80px 0; background: #FFFFFF; }
                .steps-container {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    max-width: 900px;
                    margin: 0 auto;
                }
                .step-item {
                    text-align: center;
                    flex: 1;
                }
                .step-circle {
                    width: 60px; height: 60px;
                    background: #7886C7; color: white;
                    border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 1.5rem; font-weight: 800;
                    margin: 0 auto 20px;
                    box-shadow: 0 10px 25px rgba(120,134,199,0.3);
                }
                .step-item h4 { font-weight: 700; margin-bottom: 8px; color: #111827; }
                .step-item p { color: #6B7280; font-size: 0.9rem; }
                .step-arrow { color: #D1D5DB; font-size: 2rem; padding: 0 20px; margin-bottom: 40px; }

                /* DEMO */
                .jq-demo-section { padding: 100px 0; }
                .demo-layout {
                    display: flex;
                    padding: 40px;
                    gap: 60px;
                    align-items: center;
                }
                .demo-left { flex: 1; display: flex; justify-content: center; }
                .demo-screen-mockup {
                    width: 280px; height: 550px;
                    background: white;
                    border-radius: 30px;
                    border: 8px solid #111827;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                    overflow: hidden;
                    position: relative;
                }
                .demo-screen-inner {
                    width: 100%; height: 100%;
                    background: #F9FAFB;
                    position: relative;
                }
                .dummy-ui {
                    display: flex; align-items: center; justify-content: center;
                    height: 100%; font-weight: 700; color: #7886C7; font-size: 1.5rem; text-align: center;
                }
                
                /* MOCKUP UI STYLES */
                .mockup-ui { display: flex; flex-direction: column; height: 100%; background: #F8FAFC; color: #111827; }
                .m-header { background: white; padding: 16px; font-weight: 800; font-size: 1.05rem; text-align: center; border-bottom: 1px solid #E5E7EB; box-shadow: 0 2px 10px rgba(0,0,0,0.02); }
                .m-body { flex: 1; padding: 14px; display: flex; flex-direction: column; gap: 14px; overflow-y: auto; }
                
                /* Order UI */
                .m-item { display: flex; justify-content: space-between; align-items: center; background: white; padding: 12px; border-radius: 12px; box-shadow: 0 2px 6px rgba(0,0,0,0.03); }
                .m-item-info { display: flex; flex-direction: column; gap: 4px; }
                .m-item-name { font-weight: 700; font-size: 0.9rem; }
                .m-item-qty { font-size: 0.8rem; color: #6B7280; }
                .m-item-price { font-weight: 800; color: #7886C7; }
                .m-footer { background: white; padding: 16px; border-top: 1px solid #E5E7EB; display: flex; flex-direction: column; gap: 12px; }
                .m-total { display: flex; justify-content: space-between; font-size: 1.1rem; }
                .m-total strong { color: #111827; font-weight: 900; }
                .m-btn { background: #7886C7; color: white; border: none; padding: 12px; border-radius: 12px; font-weight: 700; cursor: pointer; transition: 0.2s; font-size: 1rem; }
                .m-btn:hover { background: #5A659F; }
                
                /* Analytics UI */
                .m-stat-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
                .m-stat-card { background: white; padding: 12px; border-radius: 12px; display: flex; flex-direction: column; gap: 4px; box-shadow: 0 2px 6px rgba(0,0,0,0.03); }
                .m-stat-card span { font-size: 0.75rem; color: #6B7280; font-weight: 600; }
                .m-stat-card strong { font-size: 1.1rem; font-weight: 800; color: #111827; }
                .m-chart { display: flex; align-items: flex-end; justify-content: space-between; height: 100px; background: white; padding: 16px; border-radius: 12px; box-shadow: 0 2px 6px rgba(0,0,0,0.03); }
                .m-bar { width: 14%; background: #E5E7EB; border-radius: 4px 4px 0 0; transition: 0.3s; }
                .m-bar.active { background: #7886C7; }
                .m-recent { background: white; border-radius: 12px; padding: 12px; box-shadow: 0 2px 6px rgba(0,0,0,0.03); display: flex; flex-direction: column; gap: 8px; }
                .m-recent-title { font-size: 0.8rem; font-weight: 700; color: #6B7280; margin-bottom: 4px; }
                .m-recent-item { display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; font-weight: 600; padding-bottom: 8px; border-bottom: 1px solid #F3F4F6; }
                .m-recent-item:last-child { border-bottom: none; padding-bottom: 0; }
                .m-badge { background: rgba(120, 134, 199, 0.1); color: #7886C7; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 700; }
                
                /* Admin UI */
                .m-btn-outline { background: transparent; border: 2px dashed #9AA7DF; color: #7886C7; padding: 10px; border-radius: 12px; font-weight: 700; cursor: pointer; text-align: center; }
                .m-product-list { display: flex; flex-direction: column; gap: 10px; }
                .m-product-item { display: flex; justify-content: space-between; align-items: center; background: white; padding: 12px; border-radius: 12px; box-shadow: 0 2px 6px rgba(0,0,0,0.03); }
                .m-p-info { display: flex; flex-direction: column; gap: 4px; }
                .m-p-info strong { font-size: 0.9rem; font-weight: 700; }
                .m-p-info span { font-size: 0.8rem; color: #6B7280; font-weight: 600; }
                .m-toggle { width: 36px; height: 20px; background: #E5E7EB; border-radius: 20px; position: relative; transition: 0.3s; }
                .m-toggle::after { content: ''; position: absolute; left: 2px; top: 2px; width: 16px; height: 16px; background: white; border-radius: 50%; transition: 0.3s; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                .m-toggle.active { background: #10B981; }
                .m-toggle.active::after { left: 18px; }

                .demo-right { flex: 1; }
                .demo-right h3 { font-size: 2rem; font-weight: 800; margin-bottom: 30px; }
                .demo-tabs { display: flex; flex-direction: column; gap: 16px; }
                .demo-tab {
                    padding: 20px 24px;
                    border-radius: 16px;
                    border: 1px solid #E5E7EB;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s;
                    background: white;
                }
                .demo-tab:hover { border-color: #9AA7DF; }
                .demo-tab.active {
                    background: #7886C7;
                    color: white;
                    border-color: #7886C7;
                    transform: scale(1.02);
                    box-shadow: 0 10px 20px rgba(120,134,199,0.2);
                }

                /* USE CASES */
                .jq-use-cases { padding: 80px 0; }
                .use-case-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 20px;
                }
                .use-case-card {
                    padding: 40px 20px;
                    text-align: center;
                    transition: transform 0.3s;
                    display: flex; flex-direction: column; align-items: center; gap: 16px;
                    color: #4B5563;
                }
                .use-case-card:hover { transform: translateY(-10px); color: #7886C7; }
                .use-case-card svg { width: 40px; height: 40px; }
                .use-case-card h4 { font-size: 1.1rem; font-weight: 700; }

                /* LEAD FORM */
                .jq-lead-form { padding: 100px 0; }
                .form-wrapper {
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 50px;
                }
                .form-header { text-align: center; margin-bottom: 40px; }
                .form-header h2 { font-size: 2.25rem; font-weight: 800; margin-bottom: 12px; }
                .form-header p { color: #6B7280; font-size: 1.1rem; }
                
                .form-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 24px;
                    margin-bottom: 30px;
                }
                .input-group { display: flex; flex-direction: column; gap: 8px; }
                .full-width { grid-column: span 2; }
                .input-group label { font-weight: 600; color: #374151; font-size: 0.9rem; }
                .input-group input, .input-group select, .input-group textarea {
                    padding: 14px;
                    border-radius: 12px;
                    border: 1px solid #D1D5DB;
                    background: #F9FAFB;
                    font-family: inherit;
                    font-size: 1rem;
                    transition: border-color 0.2s, box-shadow 0.2s;
                }
                .input-group input:focus, .input-group select:focus, .input-group textarea:focus {
                    outline: none;
                    border-color: #7886C7;
                    box-shadow: 0 0 0 4px rgba(120,134,199,0.1);
                }
                .submit-btn {
                    width: 100%;
                    padding: 18px;
                    background: linear-gradient(135deg, #7886C7 0%, #5A659F 100%);
                    color: white;
                    border: none;
                    border-radius: 12px;
                    font-size: 1.1rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.3s;
                }
                .submit-btn:not(:disabled):hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 25px rgba(120,134,199,0.4);
                }
                .submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }

                .form-success {
                    text-align: center;
                    padding: 60px 0;
                }
                .success-icon {
                    width: 80px; height: 80px;
                    background: #10B981; color: white;
                    border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    margin: 0 auto 24px;
                }
                .form-success h3 { font-size: 2rem; font-weight: 800; margin-bottom: 12px; color: #111827; }
                .form-success p { color: #6B7280; font-size: 1.1rem; }

                /* RESPONSIVE */
                @media (max-width: 992px) {
                    .jq-hero-grid, .features-grid, .demo-layout, .use-case-grid { grid-template-columns: 1fr; }
                    .jq-hero-grid { text-align: center; }
                    .jq-hero-actions { justify-content: center; }
                    .steps-container { flex-direction: column; gap: 20px; }
                    .step-arrow { transform: rotate(90deg); margin: 0; }
                    .demo-layout { flex-direction: column; }
                    .form-grid { grid-template-columns: 1fr; }
                    .full-width { grid-column: span 1; }
                    .form-wrapper { padding: 30px 20px; }
                }
            `}} />
        </>
    );
}
