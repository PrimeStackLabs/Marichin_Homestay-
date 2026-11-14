import React, { createContext, useContext, useState, useEffect } from 'react';
import { en } from '../translations/en';
import { kn } from '../translations/kn';

const DEFAULT_LANGUAGE_CONTEXT = {
  language: 'en',
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (path) => path
};

const LANGUAGE_CONTEXT_KEY = '__marichin_language_context__';
const LanguageContext = (typeof globalThis !== 'undefined' && globalThis[LANGUAGE_CONTEXT_KEY])
  ? globalThis[LANGUAGE_CONTEXT_KEY]
  : createContext(DEFAULT_LANGUAGE_CONTEXT);
if (typeof globalThis !== 'undefined') {
  globalThis[LANGUAGE_CONTEXT_KEY] = LanguageContext;
}

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('marichin_lang') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('marichin_lang', language);
    document.documentElement.lang = language;
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'kn' : 'en');
  };

  const t = (path, replacements = {}) => {
    const dict = language === 'kn' ? kn : en;
    const fallbackDict = en;

    const keys = path.split('.');
    let value = dict;
    for (const key of keys) {
      if (value && value[key] !== undefined) {
        value = value[key];
      } else {
        // Fallback to English
        let fallbackVal = fallbackDict;
        for (const fbKey of keys) {
          if (fallbackVal && fallbackVal[fbKey] !== undefined) {
            fallbackVal = fallbackVal[fbKey];
          } else {
            return path;
          }
        }
        value = fallbackVal;
        break;
      }
    }

    if (typeof value === 'string') {
      let result = value;
      Object.keys(replacements).forEach(rKey => {
        result = result.replace(new RegExp(`\\{${rKey}\\}`, 'g'), replacements[rKey]);
      });
      return result;
    }

    return value;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext) || DEFAULT_LANGUAGE_CONTEXT;

