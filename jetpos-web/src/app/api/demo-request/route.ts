import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, isValidEmail, escapeHtml } from "@/lib/api-safety";

export async function POST(req: NextRequest) {
    // Spam / e-posta bombalama koruması: IP başına dakikada 5 istek
    if (rateLimit(req, "demo-request", 5, 60_000)) {
        return NextResponse.json({ error: "Çok fazla istek. Lütfen biraz sonra tekrar deneyin." }, { status: 429 });
    }
    try {
        const body = await req.json();
        const {
            name, email, phone, company, sector,
            employee_count, current_system, message, package_interest,
            kvkk_acknowledged, marketing_consent, source
        } = body;

        // E-posta şablonuna gömülecek alanları kaçır (HTML enjeksiyonu önlenir)
        const s = {
            name: escapeHtml(name), email: escapeHtml(email), phone: escapeHtml(phone),
            company: escapeHtml(company), sector: escapeHtml(sector),
            employee_count: escapeHtml(employee_count), current_system: escapeHtml(current_system),
            message: escapeHtml(message), package_interest: escapeHtml(package_interest),
        };
        const validEmail = isValidEmail(email); // onay e-postası yalnızca geçerli adrese

        // Validation — email/company optional (popup/çark/oyun lead'leri sadece ad+telefon gönderir)
        const isQuickLead = source === "popup" || source === "wheel" || source === "game";
        if (!name || !phone || (!company && !isQuickLead)) {
            return NextResponse.json({ error: "Zorunlu alanlar eksik." }, { status: 400 });
        }

        // KVKK aydınlatma metni onayı zorunlu (ispat için kayıt altına alınır)
        if (kvkk_acknowledged !== true) {
            return NextResponse.json({ error: "Gizlilik & KVKK Politikası onayı gereklidir." }, { status: 400 });
        }

        // Save to Supabase (if env vars are set)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

        if (supabaseUrl && supabaseKey) {
            const supabase = createClient(supabaseUrl, supabaseKey);
            // NOT: kvkk_acknowledged / marketing_consent kolonları için
            // supabase/migrations/20260702_demo_requests_consent.sql uygulanmalı
            const { error: dbError } = await supabase.from("demo_requests").insert([{
                name, email, phone, company, sector,
                employee_count, current_system, message, package_interest,
                kvkk_acknowledged: kvkk_acknowledged === true,
                marketing_consent: marketing_consent === true,
                consent_at: new Date().toISOString(),
                source: source || "demo-form",
                status: "new",
                created_at: new Date().toISOString()
            }]);

            if (dbError) {
                console.error("Supabase error:", dbError);
                // Don't fail the request — still send email
            }
        }

        // Send notification email via Resend (if API key is set)
        const resendKey = process.env.RESEND_API_KEY;
        if (resendKey) {
            await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${resendKey}`,
                },
                body: JSON.stringify({
                    from: "JetPOS Demo <demo@jetpos.shop>",
                    to: ["info@jetpos.shop"],
                    subject: source === "wheel"
                        ? `🎡 Çark Ödülü Talebi: ${s.name}`
                        : source === "game"
                            ? `🕹️ Oyun Ödülü Talebi: ${s.name}`
                            : source === "popup"
                                ? `⚡ Yeni Teklif Talebi (Popup): ${s.name}`
                                : `🚀 Yeni Demo Talebi: ${s.company} - ${s.name}`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #111827; color: white; border: 1px solid rgba(217, 224, 255, 0.15); border-radius: 12px; overflow: hidden;">
                            <div style="background: linear-gradient(135deg, #7886C7, #5E6BA7); padding: 2rem; text-align: center;">
                                <h1 style="margin: 0; font-size: 1.5rem;">🎯 Yeni Demo Talebi</h1>
                                <p style="margin: 0.5rem 0 0; opacity: 0.8;">JetPOS Web Sitesinden</p>
                            </div>
                            <div style="padding: 2rem; background: #111827;">
                                <table style="width: 100%; border-collapse: collapse;">
                                    <tr><td style="padding: 0.75rem 0; border-bottom: 1px solid rgba(217, 224, 255, 0.15); color: rgba(255,255,255,0.6); width: 40%;">Ad Soyad</td><td style="padding: 0.75rem 0; border-bottom: 1px solid rgba(217, 224, 255, 0.15); font-weight: bold;">${s.name}</td></tr>
                                    <tr><td style="padding: 0.75rem 0; border-bottom: 1px solid rgba(217, 224, 255, 0.15); color: rgba(255,255,255,0.6);">E-posta</td><td style="padding: 0.75rem 0; border-bottom: 1px solid rgba(217, 224, 255, 0.15);">${s.email || "-"}</td></tr>
                                    <tr><td style="padding: 0.75rem 0; border-bottom: 1px solid rgba(217, 224, 255, 0.15); color: rgba(255,255,255,0.6);">Telefon</td><td style="padding: 0.75rem 0; border-bottom: 1px solid rgba(217, 224, 255, 0.15);">${s.phone || "-"}</td></tr>
                                    <tr><td style="padding: 0.75rem 0; border-bottom: 1px solid rgba(217, 224, 255, 0.15); color: rgba(255,255,255,0.6);">Firma</td><td style="padding: 0.75rem 0; border-bottom: 1px solid rgba(217, 224, 255, 0.15); font-weight: bold;">${s.company || "-"}</td></tr>
                                    <tr><td style="padding: 0.75rem 0; border-bottom: 1px solid rgba(217, 224, 255, 0.15); color: rgba(255,255,255,0.6);">Sektör</td><td style="padding: 0.75rem 0; border-bottom: 1px solid rgba(217, 224, 255, 0.15);">${s.sector || "-"}</td></tr>
                                    <tr><td style="padding: 0.75rem 0; border-bottom: 1px solid rgba(217, 224, 255, 0.15); color: rgba(255,255,255,0.6);">Çalışan Sayısı</td><td style="padding: 0.75rem 0; border-bottom: 1px solid rgba(217, 224, 255, 0.15);">${s.employee_count || "-"}</td></tr>
                                    <tr><td style="padding: 0.75rem 0; border-bottom: 1px solid rgba(217, 224, 255, 0.15); color: rgba(255,255,255,0.6);">Mevcut Sistem</td><td style="padding: 0.75rem 0; border-bottom: 1px solid rgba(217, 224, 255, 0.15);">${s.current_system || "-"}</td></tr>
                                    <tr><td style="padding: 0.75rem 0; border-bottom: 1px solid rgba(217, 224, 255, 0.15); color: rgba(255,255,255,0.6);">İlgilendiği Paket</td><td style="padding: 0.75rem 0; border-bottom: 1px solid rgba(217, 224, 255, 0.15); color: #4ade80; font-weight: bold;">${s.package_interest || "-"}</td></tr>
                                    ${s.message ? `<tr><td colspan="2" style="padding: 1rem 0;"><div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 1rem; color: rgba(255,255,255,0.8);">${s.message}</div></td></tr>` : ""}
                                </table>
                                <div style="margin-top: 1.5rem; text-align: center;">
                                    <a href="tel:${s.phone}" style="display: inline-block; background: linear-gradient(135deg, #22c55e, #16a34a); color: white; padding: 0.875rem 2rem; border-radius: 8px; text-decoration: none; font-weight: bold;">📞 Hemen Ara</a>
                                </div>
                            </div>
                        </div>
                    `,
                }),
            });

            // Onay e-postası YALNIZCA geçerli e-posta formatına gönderilir
            // (e-posta relay / bombalama kötüye kullanımını engeller)
            if (validEmail) await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${resendKey}`,
                },
                body: JSON.stringify({
                    from: "JetPOS <demo@jetpos.shop>",
                    to: [email],
                    subject: "Demo Talebiniz Alındı! 🎉",
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid rgba(217, 224, 255, 0.15); border-radius: 12px; overflow: hidden;">
                            <div style="background: linear-gradient(135deg, #7886C7, #5E6BA7); padding: 2rem; text-align: center;">
                                <h1 style="color: white; margin: 0;">JetPOS Demo Talebiniz Alındı!</h1>
                            </div>
                            <div style="background: #111827; padding: 2rem; color: white;">
                                <p>Merhaba <strong>${s.name}</strong>,</p>
                                <p>Demo talebinizi başarıyla aldık! Ekibimiz en kısa sürede sizinle iletişime geçecek.</p>
                                <p style="color: rgba(255,255,255,0.6);">Ortalama yanıt süremiz: <strong style="color: #4ade80;">2 saat içinde</strong></p>
                                <hr style="border-color: rgba(217, 224, 255, 0.15); margin: 1.5rem 0;">
                                <p style="color: rgba(255,255,255,0.5); font-size: 0.875rem;">Acil sorularınız için: <a href="tel:+905001234567" style="color: #7886C7; text-decoration: none;">+90 500 123 45 67</a></p>
                            </div>
                        </div>
                    `,
                }),
            });
        }

        return NextResponse.json({ success: true, message: "Demo talebi başarıyla alındı." });
    } catch (error) {
        console.error("Demo request error:", error);
        return NextResponse.json({ error: "Bir hata oluştu. Lütfen tekrar deneyin." }, { status: 500 });
    }
}
