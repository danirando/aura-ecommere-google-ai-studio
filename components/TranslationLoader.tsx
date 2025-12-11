
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { useLanguage } from './LanguageProvider';

const TranslationLoader: React.FC = () => {
  const { isTranslating, language } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isTranslating) {
      setMounted(true);
      // Small delay to allow DOM render before applying transition class for fade-in
      const timer = setTimeout(() => setVisible(true), 50);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
      // Wait for transition to finish before removing from DOM
      const timer = setTimeout(() => setMounted(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isTranslating]);

  if (!mounted) return null;

  return (
    <div 
        className={`fixed inset-0 z-[100] bg-[#F5F2EB]/90 backdrop-blur-sm flex flex-col items-center justify-center cursor-wait transition-all duration-500 ease-in-out transform ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
    >
      <div className="flex flex-col items-center gap-8">
         {/* Aura style minimalist loader */}
         <div className="relative">
             <div className="w-20 h-20 border border-[#D6D1C7] rounded-full"></div>
             <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-[#2C2A26] rounded-full animate-spin"></div>
         </div>
         <span className="font-serif text-[#2C2A26] text-xl tracking-widest italic animate-pulse">
            Translating to {language}...
         </span>
      </div>
    </div>
  );
};

export default TranslationLoader;
