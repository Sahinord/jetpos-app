"use client";

import { useEffect } from 'react';

/**
 * SecurityShield Component
 * - Disables right-click
 * - Disables DevTools shortcuts
 * - Clears and overrides console logs in production
 */
export default function SecurityShield() {
    useEffect(() => {
        const isProduction = process.env.NODE_ENV === 'production';

        // Keep references to original console methods
        const originalLog = console.log;
        const originalWarn = console.warn;
        const originalError = console.error;
        const originalClear = console.clear;

        // Print the giant Instagram-style Self-XSS warning
        const printWarning = () => {
            originalLog(
                "%cDur!",
                "color: #ff3040; font-size: 80px; font-weight: 900; font-family: sans-serif; text-shadow: 2px 2px 0px #000;"
            );
            originalLog(
                "%cBu, geliştiriciler için tasarlanmış bir tarayıcı özelliğidir. Biri sana buraya bir kod kopyalayıp yapıştırmanı söylediyse bu bir dolandırıcılıktır ve bunu yaptığında senin JetPOS hesabına ve verilerine erişebilecektir.",
                "font-size: 18px; font-weight: bold; font-family: sans-serif; line-height: 1.6; color: #f8fafc;"
            );
            originalLog(
                "%cDaha fazla bilgi için https://www.jetpos.shop/guvenlikvekorunmak adresine göz atın.",
                "font-size: 14px; font-family: sans-serif; color: #94a3b8; text-decoration: underline;"
            );
        };

        // Always print warning on startup (both dev and prod)
        printWarning();

        if (isProduction) {
            // Silence all future logs in production
            const noop = () => { };
            (window.console as any).log = noop;
            (window.console as any).info = noop;
            (window.console as any).warn = noop;
            (window.console as any).debug = noop;
            (window.console as any).clear = noop; // Prevent clearing our warning

            // Keep error logging restricted to avoid complete silence on critical issues, 
            // but we can choose to silence it if required.

            // 1. Disable Right Click
            const handleContextMenu = (e: MouseEvent) => {
                e.preventDefault();
            };

            // 2. Disable Shortcuts (F12, Ctrl+Shift+I, etc)
            const handleKeyDown = (e: KeyboardEvent) => {
                // F12
                if (e.key === 'F12') {
                    e.preventDefault();
                }
                // Ctrl+Shift+I / Command+Option+I
                if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I') {
                    e.preventDefault();
                }
                // Ctrl+Shift+J / Command+Option+J
                if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'J') {
                    e.preventDefault();
                }
                // Ctrl+U (View Source)
                if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
                    e.preventDefault();
                }
            };

            document.addEventListener('contextmenu', handleContextMenu);
            document.addEventListener('keydown', handleKeyDown);

            return () => {
                document.removeEventListener('contextmenu', handleContextMenu);
                document.removeEventListener('keydown', handleKeyDown);
            };
        }
    }, []);

    return null; // This component doesn't render anything
}
