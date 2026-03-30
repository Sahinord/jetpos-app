"use client";

import React from "react";
import PublicQRMenu from "../page";

export default function TableQRMenu({ params }: { params: Promise<{ slug: string, tableId: string }> }) {
    const resolvedParams = React.use(params);
    // For now, we reuse the same public menu component
    // In the future, we can use params.tableId to handle table-specific orders
    return <PublicQRMenu params={Promise.resolve(resolvedParams)} />;
}
