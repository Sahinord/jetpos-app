import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            name, email, phone, company, sector,
            employee_count, current_system, message, package_interest
        } = body;

        // Validation
        if (!name || !email || !phone || !company) {
            return NextResponse.json({ error: "Zorunlu alanlar eksik." }, { status: 400 });
        }

        // Save to Supabase (if env vars are set)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

        if (supabaseUrl && supabaseKey) {
            const supabase = createClient(supabaseUrl, supabaseKey);
            const { error: dbError } = await supabase.from("demo_requests").insert([{
                name, email, phone, company, sector,
                employee_count, current_system, message, package_interest,
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
                    subject: `🚀 Yeni Demo Talebi: ${company} - ${name}`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #111827; color: white; border: 1px solid rgba(217, 224, 255, 0.15); border-radius: 12px; overflow: hidden;">
                            <div style="background: linear-gradient(135deg, #7886C7, #5E6BA7); padding: 2rem; text-align: center;">
                                <h1 style="margin: 0; font-size: 1.5rem;">🎯 Yeni Demo Talebi</h1>
                                <p style="margin: 0.5rem 0 0; opacity: 0.8;">JetPOS Web Sitesinden</p>
                            </div>
                            <div style="padding: 2rem; background: #111827;">
                                <table style="width: 100%; border-collapse: collapse;">
                                    <tr><td style="padding: 0.75rem 0; border-bottom: 1px solid rgba(217, 224, 255, 0.15); color: rgba(255,255,255,0.6); width: 40%;">Ad Soyad</td><td style="padding: 0.75rem 0; border-bottom: 1px solid rgba(217, 224, 255, 0.15); font-weight: bold;">${name}</td></tr>
                                    <tr><td style="padding: 0.75rem 0; border-bottom: 1px solid rgba(217, 224, 255, 0.15); color: rgba(255,255,255,0.6);">E-posta</td><td style="padding: 0.75rem 0; border-bottom: 1px solid rgba(217, 224, 255, 0.15);"><a href="mailto:${email}" style="color: #7886C7; text-decoration: none;">${email}</a></td></tr>
                                    <tr><td style="padding: 0.75rem 0; border-bottom: 1px solid rgba(217, 224, 255, 0.15); color: rgba(255,255,255,0.6);">Telefon</td><td style="padding: 0.75rem 0; border-bottom: 1px solid rgba(217, 224, 255, 0.15);"><a href="tel:${phone}" style="color: #7886C7; text-decoration: none;">${phone}</a></td></tr>
                                    <tr><td style="padding: 0.75rem 0; border-bottom: 1px solid rgba(217, 224, 255, 0.15); color: rgba(255,255,255,0.6);">Firma</td><td style="padding: 0.75rem 0; border-bottom: 1px solid rgba(217, 224, 255, 0.15); font-weight: bold;">${company}</td></tr>
                                    <tr><td style="padding: 0.75rem 0; border-bottom: 1px solid rgba(217, 224, 255, 0.15); color: rgba(255,255,255,0.6);">Sektör</td><td style="padding: 0.75rem 0; border-bottom: 1px solid rgba(217, 224, 255, 0.15);">${sector || "-"}</td></tr>
                                    <tr><td style="padding: 0.75rem 0; border-bottom: 1px solid rgba(217, 224, 255, 0.15); color: rgba(255,255,255,0.6);">Çalışan Sayısı</td><td style="padding: 0.75rem 0; border-bottom: 1px solid rgba(217, 224, 255, 0.15);">${employee_count || "-"}</td></tr>
                                    <tr><td style="padding: 0.75rem 0; border-bottom: 1px solid rgba(217, 224, 255, 0.15); color: rgba(255,255,255,0.6);">Mevcut Sistem</td><td style="padding: 0.75rem 0; border-bottom: 1px solid rgba(217, 224, 255, 0.15);">${current_system || "-"}</td></tr>
                                    <tr><td style="padding: 0.75rem 0; border-bottom: 1px solid rgba(217, 224, 255, 0.15); color: rgba(255,255,255,0.6);">İlgilendiği Paket</td><td style="padding: 0.75rem 0; border-bottom: 1px solid rgba(217, 224, 255, 0.15); color: #4ade80; font-weight: bold;">${package_interest || "-"}</td></tr>
                                    ${message ? `<tr><td colspan="2" style="padding: 1rem 0;"><div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 1rem; color: rgba(255,255,255,0.8);">${message}</div></td></tr>` : ""}
                                </table>
                                <div style="margin-top: 1.5rem; text-align: center;">
                                    <a href="tel:${phone}" style="display: inline-block; background: linear-gradient(135deg, #22c55e, #16a34a); color: white; padding: 0.875rem 2rem; border-radius: 8px; text-decoration: none; font-weight: bold;">📞 Hemen Ara</a>
                                </div>
                            </div>
                        </div>
                    `,
                }),
            });

            // Also send confirmation to the user
            await fetch("https://api.resend.com/emails", {
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
                                <p>Merhaba <strong>${name}</strong>,</p>
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
    } catch (error: any) {
        console.error("Demo request error:", error);
        return NextResponse.json({ error: "Bir hata oluştu. Lütfen tekrar deneyin." }, { status: 500 });
    }
}
