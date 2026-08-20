import crypto from 'crypto';

// Entegrasyon sırlarını (apiKey/apiSecret/token vb.) DB'de ŞİFRELİ saklamak için
// AES-256-GCM yardımcıları. Anahtar SADECE sunucuda bulunur (env). Format:
//   enc:v1:<iv_b64>:<tag_b64>:<cipher_b64>
// Geriye dönük uyum: "enc:v1:" ile başlamayan değer düz metin kabul edilir ve
// olduğu gibi döndürülür (eski kayıtlar bozulmaz).

const PREFIX = 'enc:v1:';

function getKey(): Buffer {
    // Öncelik: özel env. Yoksa service-role key'den türet (yine server-only).
    const secret = process.env.JETPOS_SETTINGS_SECRET
        || process.env.SUPABASE_SERVICE_ROLE_KEY
        || 'jetpos-insecure-fallback-key';
    // 32 baytlık anahtar
    return crypto.createHash('sha256').update(secret).digest();
}

export function isEncrypted(value: unknown): boolean {
    return typeof value === 'string' && value.startsWith(PREFIX);
}

export function encryptSecret(plain: string): string {
    if (plain == null || plain === '') return '';
    if (isEncrypted(plain)) return plain; // zaten şifreli
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
    const enc = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${PREFIX}${iv.toString('base64')}:${tag.toString('base64')}:${enc.toString('base64')}`;
}

export function decryptSecret(value: string): string {
    if (value == null || value === '') return '';
    if (!isEncrypted(value)) return value; // eski düz metin
    try {
        const body = value.slice(PREFIX.length);
        const [ivB64, tagB64, dataB64] = body.split(':');
        const iv = Buffer.from(ivB64, 'base64');
        const tag = Buffer.from(tagB64, 'base64');
        const data = Buffer.from(dataB64, 'base64');
        const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), iv);
        decipher.setAuthTag(tag);
        const dec = Buffer.concat([decipher.update(data), decipher.final()]);
        return dec.toString('utf8');
    } catch (e) {
        console.error('[crypto-settings] decrypt hatası:', (e as any)?.message);
        return '';
    }
}

// Sırrın son birkaç karakterini gösteren maske (UI'da "kayıtlı" göstermek için).
export function maskSecret(plainOrEnc: string): string {
    const plain = decryptSecret(plainOrEnc);
    if (!plain) return '';
    if (plain.length <= 4) return '••••';
    return '••••' + plain.slice(-4);
}
