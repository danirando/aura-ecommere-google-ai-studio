
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ProductGrid from './components/ProductGrid';
import About from './components/About';
import Journal from './components/Journal';
import Assistant from './components/Assistant';
import Footer from './components/Footer';
import ProductDetail from './components/ProductDetail';
import JournalDetail from './components/JournalDetail';
import CartDrawer from './components/CartDrawer';
import Checkout from './components/Checkout';
import TranslationLoader from './components/TranslationLoader';
import { Product, JournalArticle, ViewState } from './types';
import { LanguageProvider } from './components/LanguageProvider';

function App() {
  const [view, setView] = useState<ViewState>({ type: 'home' });
  const [cartItems, setCartItems] = useState<Product[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Handle navigation (clicks on Navbar or Footer links)
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    
    // If we are not home, go home first
    if (view.type !== 'home') {
      setView({ type: 'home' });
      // Allow state update to render Home before scrolling
      setTimeout(() => scrollToSection(targetId), 0);
    } else {
      scrollToSection(targetId);
    }
  };

  const scrollToSection = (targetId: string) => {
    if (!targetId) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }
    
    const element = document.getElementById(targetId);
    if (element) {
      // Manual scroll calculation to account for fixed header
      let headerOffset = 85;
      
      // Special adjustment for products section which has large top padding (py-32).
      // We reduce the offset to scroll further down so the title sits just below the header.
      if (targetId === 'products') {
          headerOffset = 10; 
      }

      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });

      try {
        window.history.pushState(null, '', `#${targetId}`);
      } catch (err) {
        // Ignore SecurityError in restricted environments
      }
    }
  };

  const addToCart = (product: Product) => {
    setCartItems([...cartItems, product]);
    setIsCartOpen(true);
  };

  const removeFromCart = (index: number) => {
    const newItems = [...cartItems];
    newItems.splice(index, 1);
    setCartItems(newItems);
  };

  const handleProductClick = (p: Product) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setView({ type: 'product', product: p });
  };

  // Determine active product for Assistant context
  const activeProduct = view.type === 'product' ? view.product : undefined;
  
  // Determine if the current view has a dark hero image at the top (Home or JournalDetail)
  // This controls the Navbar text color (white for hero views, dark for others)
  const isHeroView = view.type === 'home' || view.type === 'journal';

  return (
    <LanguageProvider>
        <TranslationLoader />
        <div className="min-h-screen bg-[#F5F2EB] font-sans text-[#2C2A26] selection:bg-[#D6D1C7] selection:text-[#2C2A26]">
        {view.type !== 'checkout' && (
            <Navbar 
                onNavClick={handleNavClick} 
                cartCount={cartItems.length}
                onOpenCart={() => setIsCartOpen(true)}
                isHeroView={isHeroView}
            />
        )}
        
        <main>
            {view.type === 'home' && (
            <>
                <Hero />
                <ProductGrid 
                onProductClick={handleProductClick} 
                onAddToCart={addToCart}
                />
                <About />
                <Journal onArticleClick={(a) => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    setView({ type: 'journal', article: a });
                }} />
            </>
            )}

            {view.type === 'product' && (
            <ProductDetail 
                product={view.product} 
                onBack={() => {
                setView({ type: 'home' });
                setTimeout(() => scrollToSection('products'), 50);
                }}
                onAddToCart={addToCart}
                onProductClick={handleProductClick}
            />
            )}

            {view.type === 'journal' && (
            <JournalDetail 
                article={view.article} 
                onBack={() => setView({ type: 'home' })}
            />
            )}

            {view.type === 'checkout' && (
                <Checkout 
                    items={cartItems}
                    onBack={() => setView({ type: 'home' })}
                />
            )}
        </main>

        {view.type !== 'checkout' && <Footer onLinkClick={handleNavClick} />}
        
        <Assistant activeProduct={activeProduct} />
        
        <CartDrawer 
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
            items={cartItems}
            onRemoveItem={removeFromCart}
            onCheckout={() => {
                setIsCartOpen(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setView({ type: 'checkout' });
            }}
        />
        </div>
    </LanguageProvider>
  );
}

export default App;
