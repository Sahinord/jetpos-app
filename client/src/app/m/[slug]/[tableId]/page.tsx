import PublicQRMenuClient from "@/components/QRMenu/PublicQRMenuClient";

export const dynamic = 'force-static';
export const dynamicParams = false;

export async function generateStaticParams() {
    return [{ slug: 'demo', tableId: '1' }]; 
}

export default function TableQRMenuPage({ params }: { params: Promise<{ slug: string, tableId: string }> }) {
    return <PublicQRMenuClient params={params} />;
}
