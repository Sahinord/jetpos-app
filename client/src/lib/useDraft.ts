import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Form taslağı + "kaydetmeden çıkış" koruması.
 *  - value anlamlı (shouldSave) olduğu sürece localStorage'a taslak yazar.
 *  - Form boşalırsa taslağı temizler.
 *  - Sekme/uygulama kapanırken (dirty ise) beforeunload uyarısı verir.
 *  - Mount'ta kaydedilmiş taslak varsa `draftFound` ile döner (popup için).
 *
 * Kullanım:
 *   const { draftFound, clearDraft, dismissPrompt } = useDraft("draft_x", value, shouldSave);
 *   // save başarılı olunca: clearDraft()
 *   // <DraftRestoreModal open={!!draftFound} onRestore={()=>{ setValue(draftFound); dismissPrompt(); }} onDiscard={clearDraft} />
 */
export function useDraft<T>(key: string, value: T, shouldSave: (v: T) => boolean) {
    const [draftFound, setDraftFound] = useState<T | null>(null);
    const dirtyRef = useRef(false);
    const firstRun = useRef(true);

    // Mount: kaydedilmiş taslak var mı?
    useEffect(() => {
        try {
            const raw = localStorage.getItem(key);
            if (raw) setDraftFound(JSON.parse(raw) as T);
        } catch { /* yoksay */ }
        // yalnızca mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // value değişince taslağı kaydet (ilk render hariç, yalnızca anlamlı değerlerde)
    useEffect(() => {
        if (firstRun.current) { firstRun.current = false; return; }
        try {
            if (shouldSave(value)) {
                dirtyRef.current = true;
                localStorage.setItem(key, JSON.stringify(value));
            } else {
                dirtyRef.current = false;
                localStorage.removeItem(key);
            }
        } catch { /* yoksay */ }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    // Kapatma/yenileme uyarısı (yalnızca dirty ise)
    useEffect(() => {
        const h = (e: BeforeUnloadEvent) => {
            if (dirtyRef.current) { e.preventDefault(); e.returnValue = ""; }
        };
        window.addEventListener("beforeunload", h);
        return () => window.removeEventListener("beforeunload", h);
    }, []);

    const clearDraft = useCallback(() => {
        dirtyRef.current = false;
        try { localStorage.removeItem(key); } catch { /* yoksay */ }
        setDraftFound(null);
    }, [key]);

    const dismissPrompt = useCallback(() => setDraftFound(null), []);
    const isDirty = useCallback(() => dirtyRef.current, []);

    return { draftFound, clearDraft, dismissPrompt, isDirty };
}
