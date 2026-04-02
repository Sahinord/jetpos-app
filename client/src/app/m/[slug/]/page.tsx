import PublicQRMenuClient from "@/components/QRMenu/PublicQRMenuClient";

export async function generateStaticParams() {
    return []; // Statik dışa aktarma için boş parametreler (Electron'da dinamik route serv edilmeyecek)
}

export default function PublicQRMenuPage({ params }: { params: Promise<{ slug: string }> }) {
    return <PublicQRMenuClient params={params} />;
}
