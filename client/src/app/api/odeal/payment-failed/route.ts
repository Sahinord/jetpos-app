import { NextRequest } from "next/server";
import { processOdealWebhook } from "@/lib/odeal/odeal-auth";

// Ödeal → ödeme BAŞARISIZ webhook'u (paymentFailedUrl)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    return processOdealWebhook(req, "failed");
}
export async function GET() {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), { status: 405 });
}
