// Ödeal LEAD API — partner (JetPos) seviyesi. Potansiyel müşteri (lead) gönderimi.
// Doküman: docs.odeal.com/lead/tr — Basic Authentication, POST /lead.
//   Stage: https://stage.odealapp.com/lead-api/v1/
//   Prod : https://apigw.odeal.com/lead/v1/
// Kimlik bilgileri partner'a özeldir → env'de tutulur (server-only, asla client'a):
//   ODEAL_LEAD_USERNAME, ODEAL_LEAD_PASSWORD, ODEAL_LEAD_ENV (stage|prod)
//   (opsiyonel) ODEAL_LEAD_BASE_URL — özel/geçiş adresi için override.

export interface OdealLeadInput {
    mobile: string;                 // zorunlu — 5XXXXXXXXX (10 hane, başında 0 yok)
    firstName?: string;
    lastName?: string;
    tcNumber?: string;              // 11 hane
    taxNumber?: string;             // 10-11 hane
    owner?: string;                 // temsilci tanımlayıcısı
    optionalFields?: Record<string, string>;
}

export interface OdealLeadResult {
    ok: boolean;
    status: number;
    registerRefCode?: string;
    message?: string;
    errors?: string[];
    raw?: unknown;
}

// 5XXXXXXXXX formatına indir: +90 / 0 / boşluk / tire temizlenir.
export function normalizeMobile(m: string): string {
    let d = String(m || "").replace(/\D/g, "");
    if (d.startsWith("90")) d = d.slice(2);
    if (d.startsWith("0")) d = d.slice(1);
    return d.slice(-10);
}

export function leadBaseUrl(): string {
    const explicit = process.env.ODEAL_LEAD_BASE_URL;
    if (explicit) return explicit.replace(/\/+$/, "");
    const prod = (process.env.ODEAL_LEAD_ENV || "stage").toLowerCase() === "prod";
    return prod
        ? "https://apigw.odeal.com/lead/v1"
        : "https://stage.odealapp.com/lead-api/v1";
}

export function hasLeadCreds(): boolean {
    return !!(process.env.ODEAL_LEAD_USERNAME && process.env.ODEAL_LEAD_PASSWORD);
}

export async function submitLead(input: OdealLeadInput): Promise<OdealLeadResult> {
    const user = process.env.ODEAL_LEAD_USERNAME || "";
    const pass = process.env.ODEAL_LEAD_PASSWORD || "";
    const authHeader = "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");

    const body: Record<string, unknown> = { mobile: normalizeMobile(input.mobile) };
    if (input.firstName) body.firstName = input.firstName;
    if (input.lastName) body.lastName = input.lastName;
    if (input.tcNumber) body.tcNumber = input.tcNumber;
    if (input.taxNumber) body.taxNumber = input.taxNumber;
    if (input.owner) body.owner = input.owner;
    if (input.optionalFields && Object.keys(input.optionalFields).length > 0) {
        body.optionalFields = input.optionalFields;
    }

    console.log("[ODEAL LEAD] → POST /lead", { base: leadBaseUrl(), mobile: body.mobile, keys: Object.keys(body) });

    const res = await fetch(`${leadBaseUrl()}/lead`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: authHeader },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000),
    });
    const text = await res.text();
    let json: any = null;
    try { json = text ? JSON.parse(text) : null; } catch { /* text kalır */ }

    const registerRefCode: string | undefined = json?.data?.registerRefCode;
    // Ödeal 200 döner ama gövdede status:false olabilir → ikisini de kontrol et
    const ok = res.ok && json?.status !== false && !!registerRefCode;

    console.log("[ODEAL LEAD] ← sonuç", res.status, { ok, registerRefCode, message: json?.message, errors: json?.errors });

    return {
        ok,
        status: res.status,
        registerRefCode,
        message: json?.message,
        errors: Array.isArray(json?.errors) ? json.errors : undefined,
        raw: json ?? text,
    };
}
