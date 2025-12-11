
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useState, useEffect, useRef } from 'react';
import { BRAND_NAME } from '../constants';
import { useLanguage, useTranslation } from './LanguageProvider';

interface NavbarProps {
  onNavClick: (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => void;
  cartCount: number;
  onOpenCart: () => void;
  isHeroView?: boolean;
}

const LANGUAGES = [
    { code: 'English', label: 'English' },
    { code: 'Italian', label: 'Italiano' },
    { code: 'French', label: 'Français' },
    { code: 'German', label: 'Deutsch' },
    { code: 'Spanish', label: 'Español' },
    { code: 'Japanese', label: '日本語' },
];

const Navbar: React.FC<NavbarProps> = ({ onNavClick, cartCount, onOpenCart, isHeroView = true }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const { language, setLanguage } = useLanguage();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            setLangDropdownOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
        window.removeEventListener('scroll', handleScroll);
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    setMobileMenuOpen(false);
    onNavClick(e, targetId);
  };

  const handleCartClick = (e: React.MouseEvent) => {
      e.preventDefault();
      setMobileMenuOpen(false);
      onOpenCart();
  }

  const handleLanguageSelect = (langCode: string) => {
      setLanguage(langCode);
      setLangDropdownOpen(false);
  };

  // Determine text color based on state.
  // If we are NOT in a hero view (like Product Detail), we force dark text immediately.
  const textColorClass = (scrolled || mobileMenuOpen || !isHeroView) ? 'text-[#2C2A26]' : 'text-[#F5F2EB]';
  
  const currentLangLabel = LANGUAGES.find(l => l.code === language)?.label || 'English';

  return (
    <>
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ease-in-out ${
          scrolled || mobileMenuOpen ? 'bg-[#F5F2EB]/90 backdrop-blur-md py-4 shadow-sm' : 'bg-transparent py-8'
        }`}
      >
        <div className="max-w-[1800px] mx-auto px-8 flex items-center justify-between">
          {/* Logo */}
          <a 
            href="#" 
            onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
                onNavClick(e, ''); // Pass empty string to just reset to home
            }}
            className={`text-3xl font-serif font-medium tracking-tight z-50 relative transition-colors duration-500 ${textColorClass}`}
          >
            {BRAND_NAME}
          </a>
          
          {/* Center Links - Desktop */}
          <div className={`hidden md:flex items-center gap-12 text-sm font-medium tracking-widest uppercase transition-colors duration-500 ${textColorClass}`}>
            <a href="#products" onClick={(e) => handleLinkClick(e, 'products')} className="hover:opacity-60 transition-opacity">{useTranslation("Shop")}</a>
            <a href="#about" onClick={(e) => handleLinkClick(e, 'about')} className="hover:opacity-60 transition-opacity">{useTranslation("About")}</a>
            <a href="#journal" onClick={(e) => handleLinkClick(e, 'journal')} className="hover:opacity-60 transition-opacity">{useTranslation("Journal")}</a>
          </div>

          {/* Right Actions */}
          <div className={`flex items-center gap-8 z-50 relative transition-colors duration-500 ${textColorClass}`}>
             
             {/* Custom Desktop Language Selector */}
             <div className="relative hidden md:block" ref={dropdownRef}>
                <button 
                    onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                    className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest hover:opacity-60 transition-opacity focus:outline-none"
                >
                    {currentLangLabel}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-3 h-3 transition-transform duration-300 ${langDropdownOpen ? 'rotate-180' : ''}`}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                </button>

                {/* Dropdown Menu */}
                <div 
                    className={`absolute top-full right-0 mt-4 w-32 bg-[#F5F2EB] border border-[#D6D1C7] shadow-lg py-2 flex flex-col transition-all duration-300 origin-top-right rounded-xl overflow-hidden ${
                        langDropdownOpen 
                        ? 'opacity-100 scale-100 translate-y-0 visible' 
                        : 'opacity-0 scale-95 -translate-y-2 invisible'
                    }`}
                >
                    {LANGUAGES.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => handleLanguageSelect(lang.code)}
                            className={`text-left px-4 py-2 text-xs uppercase tracking-widest transition-colors ${
                                language === lang.code 
                                ? 'text-[#2C2A26] font-bold bg-[#EBE7DE]' 
                                : 'text-[#5D5A53] hover:text-[#2C2A26] hover:bg-[#EBE7DE]/50'
                            }`}
                        >
                            {lang.label}
                        </button>
                    ))}
                </div>
            </div>

            <button 
              onClick={handleCartClick}
              className="text-sm font-medium uppercase tracking-widest hover:opacity-60 transition-opacity hidden sm:block"
            >
              {useTranslation("Cart")} ({cartCount})
            </button>
            
            {/* Mobile Menu Toggle */}
            <button 
              className={`block md:hidden focus:outline-none transition-colors duration-500 ${textColorClass}`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
               {mobileMenuOpen ? (
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                 </svg>
               ) : (
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                 </svg>
               )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 bg-[#F5F2EB] z-40 flex flex-col justify-center items-center transition-all duration-500 ease-in-out ${
          mobileMenuOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-10 pointer-events-none'
      }`}>
          <div className="flex flex-col items-center space-y-8 text-xl font-serif font-medium text-[#2C2A26]">
            <a href="#products" onClick={(e) => handleLinkClick(e, 'products')} className="hover:opacity-60 transition-opacity">{useTranslation("Shop")}</a>
            <a href="#about" onClick={(e) => handleLinkClick(e, 'about')} className="hover:opacity-60 transition-opacity">{useTranslation("About")}</a>
            <a href="#journal" onClick={(e) => handleLinkClick(e, 'journal')} className="hover:opacity-60 transition-opacity">{useTranslation("Journal")}</a>
            
            <div className="w-12 h-px bg-[#D6D1C7] my-4"></div>

            {/* Mobile Language List */}
            <div className="flex flex-col items-center gap-4">
                <span className="text-xs font-sans uppercase tracking-widest text-[#A8A29E] mb-2">{useTranslation("Select Language")}</span>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-center">
                    {LANGUAGES.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => {
                                setLanguage(lang.code);
                                // Optional: Close menu on selection or stay open
                                // setMobileMenuOpen(false); 
                            }}
                            className={`text-sm uppercase tracking-widest transition-colors ${
                                language === lang.code 
                                ? 'text-[#2C2A26] font-bold underline underline-offset-4' 
                                : 'text-[#5D5A53] hover:text-[#2C2A26]'
                            }`}
                        >
                            {lang.label}
                        </button>
                    ))}
                </div>
            </div>

            <button 
                onClick={handleCartClick} 
                className="hover:opacity-60 transition-opacity text-base uppercase tracking-widest font-sans mt-8"
            >
                {useTranslation("Cart")} ({cartCount})
            </button>
          </div>
      </div>
    </>
  );
};

export default Navbar;
