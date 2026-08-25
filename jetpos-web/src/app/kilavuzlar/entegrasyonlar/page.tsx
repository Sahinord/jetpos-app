"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import {
    Plug, ShoppingCart, Package, UtensilsCrossed, CreditCard,
    CheckCircle2, AlertTriangle, ArrowLeft, Link2, Zap, Store,
} from "lucide-react";

// Adım kutusu (açık tema)
function Step({ n, children }: { n: number; children: React.ReactNode }) {
    return (
        <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center text-sm">{n}</div>
            <div className="text-slate-600 leading-relaxed pt-1">{children}</div>
        </div>
    );
}

// "Sık takılınan yer" uyarı kutusu
function Tip({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex gap-3 rounded-2xl bg-amber-50 border border-amber-200 p-4 mt-5">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 leading-relaxed">{children}</div>
        </div>
    );
}

function Section({ icon: Icon, color, bg, title, subtitle, children }: any) {
    return (
        <section className="rounded-[2rem] bg-white border border-slate-200 shadow-[0_8px_30px_-12px_rgba(15,23,42,0.15)] p-7 md:p-9">
            <div className="flex items-center gap-4 pb-5 mb-6 border-b border-slate-100">
                <div className={`w-14 h-14 ${bg} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-7 h-7 ${color}`} />
                </div>
                <div>
                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">{title}</h2>
                    {subtitle && <p className="text-slate-500 text-sm font-medium">{subtitle}</p>}
                </div>
            </div>
            <div className="space-y-4">{children}</div>
        </section>
    );
}

export default function EntegrasyonRehberleriPage() {
    return (
        <>
            <div className="site-bg" />
            <main style={{ position: "relative", zIndex: 1, minHeight: "100vh" }}>
                <Navbar />

                {/* Hero */}
                <section style={{ paddingTop: "9rem", paddingBottom: "2.5rem" }}>
                    <div className="site-container" style={{ maxWidth: "820px", textAlign: "center" }}>
                        <span className="badge" style={{ marginBottom: "1.25rem" }}>
                            <Plug style={{ width: "0.85rem", height: "0.85rem" }} /> ENTEGRASYON REHBERİ
                        </span>
                        <h1 style={{ fontSize: "clamp(2.1rem, 5.5vw, 3.5rem)", fontWeight: 900, color: "#111827", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: "1.1rem" }}>
                            Entegrasyonlar Nasıl Bağlanır?
                        </h1>
                        <p style={{ fontSize: "1.05rem", color: "#4B5563", lineHeight: 1.65, maxWidth: "620px", margin: "0 auto" }}>
                            Trendyol GO, Getir Çarşı, Yemek platformları ve Ödeal kart ödemesini adım adım,
                            hiçbir teknik bilgi gerekmeden bağlamanın en kolay yolu.
                        </p>
                    </div>
                </section>

                {/* İçerik */}
                <section style={{ paddingBottom: "6rem" }}>
                    <div className="site-container" style={{ maxWidth: "820px" }}>
                        <div className="space-y-12">

                            {/* Genel mantık */}
                            <div className="rounded-[2rem] bg-white border border-slate-200 shadow-[0_8px_30px_-12px_rgba(15,23,42,0.15)] p-7 md:p-9">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black mb-4">BAŞLANGIÇ</div>
                                <h2 className="text-2xl font-black text-slate-900 mb-5">Önce şunu anla: her entegrasyon 3 adımdır</h2>
                                <div className="space-y-4">
                                    <Step n={1}><b className="text-slate-900">Bağlan:</b> Platformdan aldığın bilgileri (mağaza no, API anahtarı vb.) ilgili ekrana girip “Kaydet” dersin.</Step>
                                    <Step n={2}><b className="text-slate-900">Eşleştir / Ayarla:</b> Ürünlerini platformla eşleştirir ya da otomatik gönderimi açarsın.</Step>
                                    <Step n={3}><b className="text-slate-900">Yönet:</b> Gelen siparişleri JetPos’tan tek ekranda kabul edip hazırlar, teslim edersin.</Step>
                                </div>
                                <Tip>
                                    API anahtarı, mağaza no gibi bilgiler önce <b>Süper Admin</b> tarafından lisansına tanımlanır.
                                    Menüde bir entegrasyon görünmüyorsa, o özellik lisansında açık değildir — bizimle iletişime geç.
                                </Tip>
                            </div>

                            {/* TRENDYOL GO */}
                            <Section icon={ShoppingCart} color="text-orange-500" bg="bg-orange-500/10"
                                title="Trendyol GO Market" subtitle="Sipariş + stok/fiyat + ürün ekleme">
                                <p className="text-slate-500 font-medium">Sol menüden <b className="text-slate-900">Trendyol GO / Yemek</b> → <b className="text-slate-900">Ayarlar</b>.</p>
                                <Step n={1}>Sana verilen bilgileri gir: <b className="text-slate-900">Seller ID, Store ID, API Key, API Secret, Entegrasyon Referans Kodu</b>.</Step>
                                <Step n={2}>Bilgiler <b className="text-slate-900">test (stage)</b> hesabına aitse, “Senkronizasyon Ayarları”ndaki <b className="text-slate-900">Stage Modu</b> anahtarını AÇ.</Step>
                                <Step n={3}><b className="text-slate-900">Kaydet</b>’e bas, sonra <b className="text-slate-900">Bağlantıyı Test Et</b>. Yeşil “Bağlantı başarılı” görürsen tamamdır.</Step>
                                <Step n={4}><b className="text-slate-900">Ürün göndermek</b> için Ayarlar’ın altındaki <b className="text-slate-900">“Trendyol’a Ürün Gönder”</b> panelinden kategori (en alt) ve marka seç, ürünleri işaretle, gönder.</Step>
                                <Step n={5}><b className="text-slate-900">Otomatik göndermek</b> istersen: aynı panelde “Yeni ürünü otomatik Trendyol’a gönder” anahtarını aç, varsayılan marka seç, JetPos kategorilerini Trendyol kategorileriyle eşle, kaydet. Bundan sonra eklediğin her barkodlu ürün kendiliğinden gider.</Step>
                                <Step n={6}><b className="text-slate-900">Siparişler</b>: “Siparişler” sekmesinden gelen siparişi kabul et → faturalandır → kargola.</Step>
                                <Tip>Bağlantı testinde <b>401 hatası</b> alırsan büyük ihtimalle <b>Stage Modu kapalı</b> ve test bilgileri gerçek ortama gidiyordur. Test hesabında Stage Modu’nu aç. Bir de API Key/Secret’ı başında-sonunda boşluk olmadan yapıştır.</Tip>
                            </Section>

                            {/* GETİR ÇARŞI */}
                            <Section icon={Package} color="text-purple-500" bg="bg-purple-500/10"
                                title="Getir Çarşı" subtitle="Sipariş + ürün eşleştirme + stok/fiyat">
                                <p className="text-slate-500 font-medium">Sol menüden <b className="text-slate-900">Getir Çarşı</b>.</p>
                                <Step n={1}>Bağlantı bilgileri (Shop ID, kullanıcı adı/şifre, mağaza türü) Süper Admin tarafından tanımlanır. “Ayarlar” sekmesinde “Aktif” yazıyorsa hazırsın.</Step>
                                <Step n={2}><b className="text-slate-900">Ürün Eşleştirme</b> sekmesine gir. Solda Getir’deki ürünlerin, sağda JetPos ürünün listelenir.</Step>
                                <Step n={3}><b className="text-slate-900">“Barkodla otomatik eşle”</b> butonuna bas — barkodu aynı olan ürünler saniyede eşlenir. Eşleşmeyenleri kutudan elle seç.</Step>
                                <Step n={4}><b className="text-slate-900">Kaydet</b> → sonra <b className="text-slate-900">“Stok/Fiyat gönder”</b> ile JetPos stok ve fiyatını Getir’e senkronla.</Step>
                                <Step n={5}><b className="text-slate-900">Siparişler</b>: sipariş geldiğinde bildirim çalar; Hazırlanıyor → Teslimatta → Teslim Edildi olarak ilerletirsin.</Step>
                                <Tip>Getir’de <b>JetPos’tan yeni ürün oluşturulamaz</b> — ürünler Getir tarafında tanımlıdır. JetPos sadece bu ürünleri <b>eşleştirir</b> ve stok/fiyatını gönderir. Barkodsuz ürünler otomatik eşlenemez, elle seçilir.</Tip>
                            </Section>

                            {/* YEMEK */}
                            <Section icon={UtensilsCrossed} color="text-rose-500" bg="bg-rose-500/10"
                                title="Yemek Siparişleri" subtitle="Trendyol Yemek · Uber Eats · Getir Yemek">
                                <p className="text-slate-500 font-medium">Sol menüden <b className="text-slate-900">Yemek Siparişleri</b>.</p>
                                <Step n={1}>Platform bağlantı bilgileri Süper Admin tarafından girilir (tek panelde birden fazla platform).</Step>
                                <Step n={2}><b className="text-slate-900">Canlı Siparişler</b> ekranını aç. Yeni sipariş gelince bildirim sesi çalar ve sipariş ekrana düşer.</Step>
                                <Step n={3}>Siparişi <b className="text-slate-900">Kabul et</b> → <b className="text-slate-900">Hazırlanıyor</b> → <b className="text-slate-900">Hazır/Teslim</b> olarak ilerlet. Hepsi tek ekrandan.</Step>
                                <Tip>Bütün yemek platformlarının siparişini tek “Canlı Siparişler” ekranında görürsün; her platform için ayrı ekran açmana gerek yok.</Tip>
                            </Section>

                            {/* ÖDEAL */}
                            <Section icon={CreditCard} color="text-cyan-500" bg="bg-cyan-500/10"
                                title="Ödeal Kart Ödemesi" subtitle="A910S POS cihazı ile kart tahsilatı">
                                <p className="text-slate-500 font-medium">Sol menüden <b className="text-slate-900">Ödeal (Ödeme)</b>.</p>
                                <Step n={1}>Ödeal bilgileri Süper Admin tarafından tanımlanır. “Ayarlar”da aktifse hazırdır.</Step>
                                <Step n={2}>Satışta kasadan <b className="text-slate-900">KART</b> butonuna bas — tutar otomatik olarak Ödeal cihazına gider.</Step>
                                <Step n={3}>Müşteri karttan öder; sonuç JetPos’a otomatik döner ve satış kapanır. Ayrıca <b className="text-slate-900">NAKİT</b> ile de cihazdan işlem yapılabilir.</Step>
                                <Tip>“Geçersiz satış fiyatı” gibi bir hata alırsan sepetteki bir kalemin fiyatı/adedi hatalıdır — kalemi kontrol et. Cihazın internete bağlı ve açık olduğundan emin ol.</Tip>
                            </Section>

                            {/* Özet */}
                            <Section icon={Link2} color="text-emerald-500" bg="bg-emerald-500/10"
                                title="Ürün Ekleme & Eşleştirme — Özet" subtitle="Hangi platformda ne yapılır?">
                                <div className="grid sm:grid-cols-2 gap-3">
                                    {[
                                        { i: Store, c: "text-orange-500", t: "Trendyol GO", d: "Yeni ürün oluşturulabilir (kategori + marka seçilir). Otomatik gönderim açılabilir." },
                                        { i: Package, c: "text-purple-500", t: "Getir Çarşı", d: "Ürün oluşturma yok. Mevcut ürünler eşleştirilir, stok/fiyat gönderilir." },
                                        { i: Zap, c: "text-amber-500", t: "Barkodla eşleştirme", d: "Barkodu aynı ürünler tek tıkla eşlenir. En hızlı yol budur." },
                                        { i: CheckCircle2, c: "text-emerald-500", t: "Altın kural", d: "Her ürünün barkodu olsun — hem eşleştirme hem otomatik gönderim barkodla çalışır." },
                                    ].map((x, k) => (
                                        <div key={k} className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4">
                                            <div className="flex items-center gap-2 text-slate-900 font-black mb-1"><x.i className={`w-4 h-4 ${x.c}`} /> {x.t}</div>
                                            <p className="text-sm text-slate-500">{x.d}</p>
                                        </div>
                                    ))}
                                </div>
                            </Section>

                            <div className="text-center pt-2">
                                <Link href="/kilavuzlar" className="inline-flex items-center gap-2 text-primary font-black hover:gap-3 transition-all">
                                    <ArrowLeft size={18} /> Tüm Kılavuzlara Dön
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                <Footer />
            </main>
        </>
    );
}
