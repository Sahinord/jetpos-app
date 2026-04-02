import React from "react";
import PublicQRMenuClient from "@/components/QRMenu/PublicQRMenuClient";

export async function generateStaticParams() {
    return []; // Statik dışa aktarma için boş parametreler
}

export default function TableQRMenuPage({ params }: { params: Promise<{ slug: string, tableId: string }> }) {
    return <PublicQRMenuClient params={params} />;
}
