import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdminSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    if (!url || !serviceKey) throw new Error("Supabase env vars missing");
    return createClient(url, serviceKey);
}

function checkAdminAuth(req: NextRequest): boolean {
    const token = req.headers.get("x-admin-token");
    const expected = process.env.ADMIN_SECRET_TOKEN || process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
    return !!token && token === expected;
}

function unauthorized() {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
}

// ── GET ───────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
    if (!checkAdminAuth(req)) return unauthorized();
    try {
        const sb = getAdminSupabase();
        // tenants tablosunu kullan, client_name ve user_email olarak alias ver
        const { data, error } = await sb
            .from("tenants")
            .select(`
                id,
                license_key,
                company_name,
                contact_email,
                status,
                features,
                download_link,
                created_at,
                expires_at,
                custom_logo_url,
                branding_config,
                max_stores,
                max_online_stores
            `)
            .order("created_at", { ascending: false });
        
        if (error) throw error;

        // Frontend uyumluluğu için eşleme yap
        const mappedData = data.map(t => ({
            ...t,
            client_name: t.company_name,
            user_email: t.contact_email,
            // total_days (güncel kalan gün) hesapla
            total_days: t.expires_at ? Math.max(0, Math.ceil((new Date(t.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0,
            plan_type: t.features?.enterprise ? "ENTERPRISE" : (t.features?.pro ? "PRO" : "BASIC"),
            max_stores: t.max_stores || 1,
            max_online_stores: t.max_online_stores || 0
        }));

        return NextResponse.json(mappedData);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// ── POST ──────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
    if (!checkAdminAuth(req)) return unauthorized();
    try {
        const body = await req.json();
        // company_name ve license_key zorunlu
        if (!body.client_name || !body.license_key) {
            return NextResponse.json({ error: "client_name ve license_key zorunlu" }, { status: 400 });
        }

        const sb = getAdminSupabase();
        
        // tenants tablosuna ekle
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + (body.total_days || 365));

        const insertData = {
            license_key: body.license_key,
            company_name: body.client_name,
            contact_email: body.user_email,
            status: 'active',
            features: body.features || {},
            download_link: body.download_link,
            expires_at: expiry.toISOString(),
            created_at: new Date().toISOString(),
            custom_logo_url: body.custom_logo_url || null,
            branding_config: body.branding_config || {},
            max_stores: body.max_stores || 1,
            max_online_stores: body.max_online_stores || 0
        };

        const { data, error } = await sb
            .from("tenants")
            .insert([insertData])
            .select()
            .single();

        if (error) throw error;

        // Sync with licenses table for portal login
        await sb.from("licenses").upsert([{
            license_key: body.license_key,
            client_name: body.client_name,
            user_email: body.user_email,
            plan_type: body.plan_type || "PRO",
            total_days: body.total_days || 365,
            features: body.features || { pos: true, products: true },
            download_link: body.download_link,
            max_stores: body.max_stores || 1,
            max_online_stores: body.max_online_stores || 0
        }]);

        return NextResponse.json(data, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// ── PATCH ────────────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
    if (!checkAdminAuth(req)) return unauthorized();
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id zorunlu" }, { status: 400 });
    try {
        const body = await req.json();
        const sb = getAdminSupabase();
        
        const updateData: any = {};
        if (body.client_name) updateData.company_name = body.client_name;
        if (body.user_email) updateData.contact_email = body.user_email;
        if (body.license_key) updateData.license_key = body.license_key;
        if (body.status) updateData.status = body.status;
        if (body.features) updateData.features = body.features;
        if (body.download_link) updateData.download_link = body.download_link;
        if (body.expires_at) updateData.expires_at = body.expires_at;
        if (body.custom_logo_url !== undefined) updateData.custom_logo_url = body.custom_logo_url;
        if (body.branding_config !== undefined) updateData.branding_config = body.branding_config;
        if (body.max_stores !== undefined) updateData.max_stores = body.max_stores;
        if (body.max_online_stores !== undefined) updateData.max_online_stores = body.max_online_stores;

        const { data, error } = await sb
            .from("tenants")
            .update(updateData)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;

        // Sync with licenses table
        if (data.license_key) {
            await sb.from("licenses").update({
                client_name: body.client_name || data.company_name,
                user_email: body.user_email || data.contact_email,
                features: body.features || data.features,
                download_link: body.download_link || data.download_link,
                plan_type: body.plan_type || (data.features?.enterprise ? "ENTERPRISE" : (data.features?.pro ? "PRO" : "BASIC")),
                max_stores: body.max_stores !== undefined ? body.max_stores : data.max_stores,
                max_online_stores: body.max_online_stores !== undefined ? body.max_online_stores : data.max_online_stores
            }).eq("license_key", data.license_key);
        }

        return NextResponse.json(data);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// ── DELETE ────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
    if (!checkAdminAuth(req)) return unauthorized();
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id zorunlu" }, { status: 400 });
    try {
        const sb = getAdminSupabase();
        
        // Önce lisans anahtarını al (silme işlemi için senkronizasyon)
        const { data: tenant } = await sb.from("tenants").select("license_key").eq("id", id).single();
        
        const { error } = await sb.from("tenants").delete().eq("id", id);
        if (error) throw error;

        if (tenant?.license_key) {
            await sb.from("licenses").delete().eq("license_key", tenant.license_key);
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
