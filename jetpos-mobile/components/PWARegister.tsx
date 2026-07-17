"use client";

import { useEffect } from 'react';

export default function PWARegister() {
    useEffect(() => {
        if (!('serviceWorker' in navigator)) return;

        const isLocalhost = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);

        if (isLocalhost) {
            // DEV'de service worker KULLANMA — dev chunk'ları hash/timestamp'li olduğu
            // için SW cache'i eskiyor ve "Yükleniyor..."da takılı beyaz ekran yapıyor.
            // Ayrıca daha önce kurulmuş bozuk SW'yi ve cache'leri otomatik temizle (self-heal).
            navigator.serviceWorker.getRegistrations()
                .then((regs) => regs.forEach((r) => r.unregister()))
                .catch(() => {});
            if (typeof caches !== 'undefined') {
                caches.keys().then((keys) => keys.forEach((k) => caches.delete(k))).catch(() => {});
            }
            return;
        }

        // Yalnızca production'da kayıt et (network-first sw.js).
        navigator.serviceWorker.register('/sw.js')
            .then(() => console.log('✅ Service Worker registered'))
            .catch((err) => console.log('❌ SW registration failed:', err));
    }, []);

    return null;
}
