"use client";

import { useEffect, useState } from "react";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

/**
 * Google Analytics'i YALNIZCA kullanıcı çerez bandından analitik çerezlere
 * açık rıza verdiyse yükler (KVKK / Kurul Çerez Rehberi: opt-in).
 * CookieBanner rıza kaydettiğinde "jetpos-consent-updated" event'i yayınlar.
 */
export default function AnalyticsLoader() {
    const [enabled, setEnabled] = useState(false);

    useEffect(() => {
        const check = () => {
            try {
                const raw = localStorage.getItem("jetpos-cookie-consent");
                setEnabled(raw ? JSON.parse(raw).analytics === true : false);
            } catch {
                setEnabled(false);
            }
        };
        check();
        window.addEventListener("jetpos-consent-updated", check);
        return () => window.removeEventListener("jetpos-consent-updated", check);
    }, []);

    useEffect(() => {
        if (!enabled || !GA_ID || GA_ID === "G-XXXXXXXXXX") return;
        if (document.getElementById("jetpos-ga-script")) return;

        const script = document.createElement("script");
        script.id = "jetpos-ga-script";
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
        document.head.appendChild(script);

        const inline = document.createElement("script");
        inline.id = "jetpos-ga-inline";
        inline.innerHTML = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`;
        document.head.appendChild(inline);
    }, [enabled]);

    return null;
}
