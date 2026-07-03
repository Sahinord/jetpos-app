import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, isValidEmail } from "@/lib/api-safety";

export async function POST(req: NextRequest) {
    // Kötüye kullanım/spam koruması: IP başına dakikada 5 istek
    if (rateLimit(req, "contact", 5, 60_000)) {
        return NextResponse.json({ error: "Çok fazla istek. Lütfen biraz sonra tekrar deneyin." }, { status: 429 });
    }
    try {
        const body = await req.json();
        const name = String(body.name || "").trim().slice(0, 120);
        const email = String(body.email || "").trim().slice(0, 254);
        const message = String(body.message || "").trim().slice(0, 5000);

        if (!name || !email || !message) {
            return NextResponse.json({ error: "Tüm alanlar zorunludur." }, { status: 400 });
        }
        if (!isValidEmail(email)) {
            return NextResponse.json({ error: "Geçerli bir e-posta adresi girin." }, { status: 400 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

        if (supabaseUrl && supabaseKey) {
            const supabase = createClient(supabaseUrl, supabaseKey);
            const { error } = await supabase.from("contact_messages").insert([{
                name, email, message,
                created_at: new Date().toISOString()
            }]);

            if (error) {
                console.error("Supabase contact error:", error);
                return NextResponse.json({ error: "Mesaj kaydedilemedi." }, { status: 500 });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Contact error:", error);
        return NextResponse.json({ error: "Bir hata oluştu." }, { status: 500 });
    }
}
