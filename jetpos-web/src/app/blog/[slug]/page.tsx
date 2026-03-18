import { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BlogPostClient from "./BlogPostClient";

export const revalidate = 60;

async function getPost(slug: string) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    try {
        const res = await fetch(
            `${url}/rest/v1/blog_posts?slug=eq.${slug}&published=eq.true&select=*`,
            { headers: { apikey: key, Authorization: `Bearer ${key}` }, next: { revalidate: 60 } }
        );
        if (!res.ok) return null;
        const data = await res.json();
        return data[0] || null;
    } catch { return null; }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    const post = await getPost(params.slug);
    if (!post) return { title: "Yazı Bulunamadı | JetPOS Blog" };
    return {
        title: `${post.title} | JetPOS Blog`,
        description: post.excerpt,
    };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
    const post = await getPost(params.slug);
    if (!post) notFound();

    return (
        <>
            <div className="site-bg" />
            <main style={{ position: "relative", zIndex: 1, minHeight: "100vh" }}>
                <Navbar />
                <BlogPostClient post={post} />
                <Footer />
            </main>
        </>
    );
}
