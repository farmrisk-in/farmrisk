"use client";

import React, {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import {
  content,
  loaders,
  LanguageCode,
  TranslationType,
} from "@/constants/content";
import { isAvailableLanguage } from "@/constants/languages/registry";

interface LanguageContextProps {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: TranslationType;
}

export const LanguageContext = createContext<LanguageContextProps | undefined>(
  undefined,
);

const STORAGE_KEY = "farmrisk-language";

// Loaded dictionaries survive re-renders and provider remounts.
const cache: Partial<Record<LanguageCode, TranslationType>> = { en: content.en };

async function loadLanguage(lang: LanguageCode): Promise<TranslationType> {
  const hit = cache[lang];
  if (hit) return hit;
  const dict = await loaders[lang]();
  cache[lang] = dict;
  return dict;
}

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [language, setLanguageState] = useState<LanguageCode>("en");
  const [t, setT] = useState<TranslationType>(content.en);
  const [mounted, setMounted] = useState(false);
  // Guards against an older, slower load overwriting a newer selection.
  const requested = useRef<LanguageCode>("en");

  const apply = useCallback(async (lang: LanguageCode) => {
    requested.current = lang;
    try {
      const dict = await loadLanguage(lang);
      if (requested.current !== lang) return;
      setT(dict);
      setLanguageState(lang);
    } catch (e) {
      console.error(`Failed to load language "${lang}"`, e);
    }
  }, []);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      console.error("Failed to read localStorage language", e);
    }
    const initial = isAvailableLanguage(stored) ? stored : "en";
    // State updates happen after an await inside apply(), not synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void apply(initial).finally(() => setMounted(true));
  }, [apply]);

  const setLanguage = useCallback(
    (lang: LanguageCode) => {
      if (!isAvailableLanguage(lang)) return;
      try {
        localStorage.setItem(STORAGE_KEY, lang);
      } catch (e) {
        console.error("Failed to write localStorage language", e);
      }
      void apply(lang);
    },
    [apply],
  );

  // Keep <html lang> in sync so screen readers and search engines see the
  // active language instead of the hard-coded "en".
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  if (!mounted) {
    return (
      <LanguageContext.Provider
        value={{ language: "en", setLanguage, t: content.en }}
      >
        <div style={{ visibility: "hidden" }}>{children}</div>
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageProvider;
