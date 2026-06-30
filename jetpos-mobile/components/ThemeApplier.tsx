"use client";

import { useEffect } from 'react';

export type ThemeId = 'modern' | 'light' | 'wood' | 'glass' | 'mavi';

export const THEME_STORAGE_KEY = 'jetpos_mobile_theme';
export const THEME_CHANGE_EVENT = 'jetpos-mobile-theme-change';

const THEME_CLASSES = ['theme-light', 'theme-wood', 'theme-glass', 'theme-mavi'];

export function getTheme(): ThemeId {
    if (typeof window === 'undefined') return 'modern';
    return (localStorage.getItem(THEME_STORAGE_KEY) as ThemeId) || 'modern';
}

export function setTheme(theme: ThemeId) {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    applyTheme(theme);
    window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: theme }));
}

function applyTheme(theme: ThemeId) {
    const html = document.documentElement;
    html.classList.remove(...THEME_CLASSES);
    if (theme !== 'modern') {
        html.classList.add(`theme-${theme}`);
    }
}

/**
 * layout.tsx server component — bu yüzden tema sınıfını <html>'e uygulamak
 * için içeride render edilen küçük bir client component (sadece side-effect,
 * görsel çıktısı yok). Aynı localStorage+CustomEvent deseni client/'taki
 * Sidebar.tsx'in pozisyon ayarında kullandığı yöntemle aynı.
 */
export default function ThemeApplier() {
    useEffect(() => {
        applyTheme(getTheme());
    }, []);

    return null;
}
