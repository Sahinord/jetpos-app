import { NextRequest, NextResponse } from "next/server";
import { getAdminContext, getServiceSupabase, hashPassword, getClientIp } from "@/lib/adminAuth";

// Ekip & Yetki yönetimi — yalnızca owner ve admin rolleri erişebilir.

async function requireManager(req: NextRequest) {
    const ctx = await getAdminContext(req);
    if (!ctx) return { ctx: null, res: NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 }) };
    if (ctx.role === "staff") return { ctx: null, res: NextResponse.json({ error: "Ekip yönetimi için yetkiniz yok" }, { status: 403 }) };
    return { ctx, res: null };
}

const sanitizeRole = (r: unknown) => (r === "admin" ? "admin" : "staff");

// IP listesi: en fazla 20 giriş; IPv4/IPv6 + "*" önek jokerine izin verilir
const sanitizeIps = (v: unknown): string[] => {
    if (!Array.isArray(v)) return [];
    return (v as unknown[])
        .map(x => String(x).trim())
        .filter(x => x.length > 0 && x.length <= 45 && /^[0-9a-fA-F:.*]+$/.test(x))
        .slice(0, 20);
};
const sanitizePerms = (p: unknown): Record<string, boolean> => {
    if (!p || typeof p !== "object") return {};
    const out: Record<string, boolean> = {};
    for (const [k, v] of Object.entries(p as Record<string, unknown>)) {
        if (typeof v === "boolean") out[k.slice(0, 40)] = v;
    }
    return out;
};

// ── GET: ekip listesi ──
export async function GET(req: NextRequest) {
    const { res } = await requireManager(req);
    if (res) return res;
    try {
        const sb = getServiceSupabase();
        const { data, error } = await sb
            .from("admin_users")
            .select("id, username, name, role, permissions, allowed_ips, active, last_login_at, created_at")
            .order("created_at", { ascending: true });
        if (error) throw error;
        // Yöneticinin kendi IP'si — panelde "senin IP'n" ipucu olarak gösterilir
        return NextResponse.json(data || [], { headers: { "x-caller-ip": getClientIp(req) } });
    } catch (e) {
        return NextResponse.json({ error: e instanceof Error ? e.message : "Hata" }, { status: 500 });
    }
}

// ── POST: yeni ekip üyesi ──
export async function POST(req: NextRequest) {
    const { res } = await requireManager(req);
    if (res) return res;
    try {
        const body = await req.json();
        const username = String(body.username || "").trim().toLowerCase();
        const password = String(body.password || "");
        if (!/^[a-z0-9_.-]{3,32}$/.test(username)) {
            return NextResponse.json({ error: "Kullanıcı adı 3-32 karakter olmalı (harf, rakam, _ . -)" }, { status: 400 });
        }
        if (password.length < 8) {
            return NextResponse.json({ error: "Şifre en az 8 karakter olmalı" }, { status: 400 });
        }
        const sb = getServiceSupabase();
        const { data, error } = await sb.from("admin_users").insert([{
            username,
            name: String(body.name || "").slice(0, 80),
            password_hash: hashPassword(password),
            role: sanitizeRole(body.role),
            permissions: sanitizePerms(body.permissions),
            allowed_ips: sanitizeIps(body.allowed_ips),
            active: true,
        }]).select("id, username, name, role, permissions, allowed_ips, active, created_at").single();
        if (error) {
            if (error.code === "23505") return NextResponse.json({ error: "Bu kullanıcı adı zaten kayıtlı" }, { status: 400 });
            throw error;
        }
        return NextResponse.json(data);
    } catch (e) {
        return NextResponse.json({ error: e instanceof Error ? e.message : "Hata" }, { status: 500 });
    }
}

// ── PATCH: üye güncelle (?id=) — isim, rol, izinler, aktiflik, şifre ──
export async function PATCH(req: NextRequest) {
    const { res } = await requireManager(req);
    if (res) return res;
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id zorunlu" }, { status: 400 });
    try {
        const body = await req.json();
        const updates: Record<string, unknown> = {};
        if (typeof body.name === "string") updates.name = body.name.slice(0, 80);
        if (body.role !== undefined) updates.role = sanitizeRole(body.role);
        if (body.permissions !== undefined) updates.permissions = sanitizePerms(body.permissions);
        if (body.allowed_ips !== undefined) updates.allowed_ips = sanitizeIps(body.allowed_ips);
        if (typeof body.active === "boolean") updates.active = body.active;
        if (typeof body.password === "string" && body.password.length > 0) {
            if (body.password.length < 8) return NextResponse.json({ error: "Şifre en az 8 karakter olmalı" }, { status: 400 });
            updates.password_hash = hashPassword(body.password);
        }
        if (Object.keys(updates).length === 0) return NextResponse.json({ error: "Güncellenecek alan yok" }, { status: 400 });

        const sb = getServiceSupabase();
        const { error } = await sb.from("admin_users").update(updates).eq("id", id);
        if (error) throw error;
        // Pasife alınan veya şifresi değişen kullanıcının oturumlarını düşür
        if (updates.active === false || updates.password_hash) {
            await sb.from("admin_sessions").delete().eq("user_id", id);
        }
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: e instanceof Error ? e.message : "Hata" }, { status: 500 });
    }
}

// ── DELETE: üye sil (?id=) ──
export async function DELETE(req: NextRequest) {
    const { res } = await requireManager(req);
    if (res) return res;
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id zorunlu" }, { status: 400 });
    try {
        const sb = getServiceSupabase();
        const { error } = await sb.from("admin_users").delete().eq("id", id);
        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: e instanceof Error ? e.message : "Hata" }, { status: 500 });
    }
}
