"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { content, LanguageCode, TranslationType } from "@/constants/content";

interface LanguageContextProps {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: TranslationType;
}

export const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("farmrisk-language") as LanguageCode;
      if (stored && content[stored]) {
        setLanguageState(stored);
      }
    } catch (e) {
      console.error("Failed to read localStorage language", e);
    }
    setMounted(true);
  }, []);

  const setLanguage = (lang: LanguageCode) => {
    if (content[lang]) {
      setLanguageState(lang);
      try {
        localStorage.setItem("farmrisk-language", lang);
      } catch (e) {
        console.error("Failed to write localStorage language", e);
      }
    }
  };

  const t = (content[language] || content.en) as TranslationType;

  if (!mounted) {
    return (
      <LanguageContext.Provider value={{ language: "en", setLanguage, t: content.en }}>
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
