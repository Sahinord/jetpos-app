import { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AboutPageClient from "@/app/hakkimizda/AboutPageClient";

export const metadata: Metadata = {
    title: "Hakkımızda | JetPOS – Türk İşletmelerinin Dijital Dönüşüm Ortağı",
    description: "JetPOS hakkında bilgi edinin. 2022'den bugüne 2.400+ işletmeye hizmet veren bulut tabanlı POS sistemi.",
};

export const revalidate = 300;

async function getAboutContent() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    try {
        const res = await fetch(
            `${url}/rest/v1/about_content?select=section,content`,
            { headers: { apikey: key, Authorization: `Bearer ${key}` }, next: { revalidate: 300 } }
        );
        if (!res.ok) return null;
        const rows: { section: string; content: any }[] = await res.json();
        return Object.fromEntries(rows.map(r => [r.section, r.content]));
    } catch { return null; }
}

export default async function HakkimizdaPage() {
    const content = await getAboutContent();
    return (
        <>
            <div className="site-bg" />
            <main style={{ position: "relative", zIndex: 1, minHeight: "100vh" }}>
                <Navbar />
                <AboutPageClient content={content} />
                <Footer />
            </main>
        </>
    );
}
