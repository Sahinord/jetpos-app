import PublicQRMenuClient from "@/components/QRMenu/PublicQRMenuClient";

export const dynamic = 'force-static';
export const dynamicParams = false;

export async function generateStaticParams() {
    return [{ slug: 'demo' }]; 
}

export default function PublicQRMenuPage({ params }: { params: Promise<{ slug: string }> }) {
    return <PublicQRMenuClient params={params} />;
}
