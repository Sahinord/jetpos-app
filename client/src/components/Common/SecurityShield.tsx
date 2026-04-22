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
        // Only run in production
        const isProduction = process.env.NODE_ENV === 'production';
        
        if (isProduction) {
            // 1. Clear console and override functions
            console.log("%c⚠️ GÜVENLİK UYARISI", "color: red; font-size: 30px; font-weight: bold;");
            console.log("%cBu alan geliştiricilere özeldir. Buraya kod yapıştırmanız verilerinizin çalınmasına neden olabilir.", "font-size: 16px;");
            
            // Re-clear after a short delay
            setTimeout(() => {
                console.clear();
                const noop = () => {};
                (window.console as any).log = noop;
                (window.console as any).info = noop;
                (window.console as any).warn = noop;
                (window.console as any).debug = noop;
                // Leave error for debugging if needed, but we could silence it too
                // (window.console as any).error = noop;
            }, 1000);

            // 2. Disable Right Click
            const handleContextMenu = (e: MouseEvent) => {
                e.preventDefault();
            };

            // 3. Disable Shortcuts (F12, Ctrl+Shift+I, etc)
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
