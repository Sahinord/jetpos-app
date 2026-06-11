"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import tr from './locales/tr';
import en from './locales/en';
import ar from './locales/ar';

export type Language = 'tr' | 'en' | 'ar';

const locales: Record<Language, any> = { tr, en, ar };

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

// Deep access helper: t('pos.cart_title') → locales.tr.pos.cart_title
function getNestedValue(obj: any, path: string): string {
  const keys = path.split('.');
  let current = obj;
  for (const key of keys) {
    if (current === undefined || current === null) return path;
    current = current[key];
  }
  return typeof current === 'string' ? current : path;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('tr');

  useEffect(() => {
    const saved = localStorage.getItem('jetpos_language') as Language;
    if (saved && locales[saved]) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('jetpos_language', lang);
  }, []);

  const t = useCallback((key: string): string => {
    // Try current language first, fall back to Turkish
    const value = getNestedValue(locales[language], key);
    if (value !== key) return value;
    // Fallback to Turkish
    return getNestedValue(locales['tr'], key);
  }, [language]);

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}

export { locales };
