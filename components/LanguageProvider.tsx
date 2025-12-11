
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { translateBatch } from '../services/geminiService';

type LanguageContextType = {
  language: string;
  setLanguage: (lang: string) => void;
  translate: (text: string) => string;
  isTranslating: boolean;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState('English');
  const [cache, setCache] = useState<Record<string, string>>({});
  const [isTranslating, setIsTranslating] = useState(false);
  
  // Use a ref to collect strings during the render phase without triggering re-renders
  const missingTranslations = useRef<Set<string>>(new Set());

  const getCacheKey = (text: string, lang: string) => `${lang}|${text}`;

  const handleSetLanguage = (lang: string) => {
      if (lang === language) return;
      setLanguage(lang);
      if (lang !== 'English') {
          setIsTranslating(true);
          // Clear missing translations to start fresh collection for the new language
          missingTranslations.current.clear();
      } else {
          setIsTranslating(false);
      }
  };

  useEffect(() => {
     if (!isTranslating) return;

     const processTranslations = async () => {
         // Filter items that are actually missing from cache for the CURRENT language
         const needed = (Array.from(missingTranslations.current) as string[]).filter(text => !cache[getCacheKey(text, language)]);
         
         if (needed.length === 0) {
             // If we waited and nothing is missing (all cached or no text), stop loading
             setIsTranslating(false);
             return;
         }

         try {
            const results = await translateBatch(needed, language);
            
            setCache(prev => {
                const newCache = { ...prev };
                needed.forEach((text, index) => {
                    if (results[index]) {
                        newCache[getCacheKey(text, language)] = results[index];
                    }
                });
                return newCache;
            });
         } catch (error) {
             console.error("Translation failed", error);
         } finally {
             // Translation complete
             setIsTranslating(false);
         }
     };

     // Debounce: Wait for all components to render and register their strings (800ms)
     const timer = setTimeout(processTranslations, 800);
     return () => clearTimeout(timer);

  }, [language, isTranslating, cache]); 

  const translate = (text: string): string => {
      if (language === 'English' || !text) return text;
      
      // Brand/Slogan protection
      if (text.toLowerCase().includes('quiet living') || text === 'Aura') return text;

      const key = getCacheKey(text, language);
      if (cache[key]) return cache[key];

      // If missing, track it in the ref
      missingTranslations.current.add(text);
      
      // Return original text while loading
      return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, translate, isTranslating }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) throw new Error("useLanguage must be used within a LanguageProvider");
    return context;
};

export const useTranslation = (text: string) => {
    const { translate } = useLanguage();
    return translate(text);
};
