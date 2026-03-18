import { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BlogPageClient from "./BlogPageClient";

export const metadata: Metadata = {
    title: "Blog | JetPOS – POS, E-Fatura ve İşletme Rehberleri",
    description: "JetPOS bloğunda e-fatura, stok yönetimi, POS sistemi seçimi ve daha fazlası hakkında pratik rehberler bulabilirsiniz.",
};

export const revalidate = 60;

async function getPosts() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return [];
    try {
        const res = await fetch(
            `${url}/rest/v1/blog_posts?select=id,title,slug,excerpt,category,tags,author,read_time,featured,cover_image,created_at&published=eq.true&order=created_at.desc`,
            { headers: { apikey: key, Authorization: `Bearer ${key}` }, next: { revalidate: 60 } }
        );
        if (!res.ok) return [];
        return await res.json();
    } catch { return []; }
}

export default async function BlogPage() {
    const posts = await getPosts();
    return (
        <>
            <div className="site-bg" />
            <main style={{ position: "relative", zIndex: 1, minHeight: "100vh" }}>
                <Navbar />
                <BlogPageClient posts={posts} />
                <Footer />
            </main>
        </>
    );
}
