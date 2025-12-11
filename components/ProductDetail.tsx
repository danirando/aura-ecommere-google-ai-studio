
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useState, useMemo, useEffect } from 'react';
import { Product } from '../types';
import { PRODUCTS } from '../constants';
import ProductCard from './ProductCard';
import { translateProductDetails } from '../services/geminiService';

interface ProductDetailProps {
  product: Product;
  onBack: () => void;
  onAddToCart: (product: Product) => void;
  onProductClick: (product: Product) => void;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ product, onBack, onAddToCart, onProductClick }) => {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [translatedDesc, setTranslatedDesc] = useState<string | null>(null);
  const [translatedFeatures, setTranslatedFeatures] = useState<string[] | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  
  // Reset translation when product changes
  useEffect(() => {
    setTranslatedDesc(null);
    setTranslatedFeatures(null);
    setShowTranslation(false);
    setIsTranslating(false);
    setSelectedSize(null);
  }, [product]);

  // Mock sizes for demonstration if not in data
  const sizes = ['S', 'M', 'L'];
  const showSizes = product.category === 'Wearable';

  // Logic to find related products: Same category first, exclude current, limit to 3
  const relatedProducts = useMemo(() => {
    const otherProducts = PRODUCTS.filter(p => p.id !== product.id);
    const sameCategory = otherProducts.filter(p => p.category === product.category);
    const remaining = otherProducts.filter(p => p.category !== product.category);
    
    // Combine same category + others to fill 3 spots
    return [...sameCategory, ...remaining].slice(0, 3);
  }, [product]);

  const handleTranslate = async () => {
      if (showTranslation) {
          setShowTranslation(false);
          return;
      }
      
      if (translatedDesc && translatedFeatures) {
          setShowTranslation(true);
          return;
      }

      setIsTranslating(true);
      const textToTranslate = product.longDescription || product.description;
      
      const result = await translateProductDetails(textToTranslate, product.features, 'Italian');
      
      if (result) {
        setTranslatedDesc(result.translatedDescription);
        setTranslatedFeatures(result.translatedFeatures);
        setShowTranslation(true);
      }
      
      setIsTranslating(false);
  };

  const currentFeatures = showTranslation && translatedFeatures ? translatedFeatures : product.features;

  return (
    <div className="pt-24 min-h-screen bg-[#F5F2EB] animate-fade-in-up">
      <div className="max-w-[1800px] mx-auto px-6 md:px-12 pb-12">
        
        {/* Breadcrumb / Back */}
        <button 
          onClick={onBack}
          className="group flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-[#A8A29E] hover:text-[#2C2A26] transition-colors mb-8"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 group-hover:-translate-x-1 transition-transform">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to Shop
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 mb-32">
          
          {/* Left: Main Image Only */}
          <div className="flex flex-col gap-4">
            <div className="w-full aspect-[4/5] bg-[#EBE7DE] overflow-hidden">
              <img 
                src={product.imageUrl} 
                alt={product.name} 
                className="w-full h-full object-cover animate-fade-in-up"
              />
            </div>
          </div>

          {/* Right: Details */}
          <div className="flex flex-col justify-center max-w-xl">
             <span className="text-sm font-medium text-[#A8A29E] uppercase tracking-widest mb-2">{product.category}</span>
             <h1 className="text-4xl md:text-5xl font-serif text-[#2C2A26] mb-4">{product.name}</h1>
             <span className="text-2xl font-light text-[#2C2A26] mb-8">${product.price}</span>
             
             <div className="mb-8 border-b border-[#D6D1C7] pb-8">
                 <p className="text-[#5D5A53] leading-relaxed font-light text-lg mb-4 min-h-[100px] transition-all duration-300">
                   {showTranslation ? translatedDesc : (product.longDescription || product.description)}
                 </p>
                 <button 
                     onClick={handleTranslate}
                     disabled={isTranslating}
                     className="text-xs font-medium uppercase tracking-widest text-[#A8A29E] hover:text-[#2C2A26] transition-colors flex items-center gap-2"
                 >
                     {isTranslating ? (
                         <span className="animate-pulse">Translating...</span>
                     ) : (
                         showTranslation ? 'Show Original' : 'Translate to Italian'
                     )}
                     {!isTranslating && !showTranslation && (
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
                        </svg>
                     )}
                 </button>
             </div>

             {showSizes && (
                <div className="mb-8">
                  <span className="block text-xs font-bold uppercase tracking-widest text-[#2C2A26] mb-4">Select Size</span>
                  <div className="flex gap-4">
                    {sizes.map(size => (
                      <button 
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`w-12 h-12 flex items-center justify-center border transition-all duration-300 hover:scale-110 ${
                          selectedSize === size 
                            ? 'border-[#2C2A26] bg-[#2C2A26] text-[#F5F2EB]' 
                            : 'border-[#D6D1C7] text-[#5D5A53] hover:border-[#2C2A26]'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
             )}

             <div className="flex flex-col gap-4">
               <button 
                 onClick={() => onAddToCart(product)}
                 className="w-full py-5 bg-[#2C2A26] text-[#F5F2EB] uppercase tracking-widest text-sm font-medium hover:bg-[#433E38] hover:scale-[1.02] active:scale-[0.98] transform transition-all duration-300"
               >
                 Add to Cart — ${product.price}
               </button>
               <ul className="mt-8 space-y-2 text-sm text-[#5D5A53]">
                 {currentFeatures.map((feature, idx) => (
                   <li key={idx} className="flex items-center gap-3">
                     <span className="w-1 h-1 bg-[#2C2A26] rounded-full"></span>
                     {feature}
                   </li>
                 ))}
               </ul>
             </div>
          </div>
        </div>

        {/* Related Products Section */}
        <div className="border-t border-[#D6D1C7] pt-24">
            <h2 className="text-3xl font-serif text-[#2C2A26] mb-12 text-center">Complementary Objects</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {relatedProducts.map(p => (
                    <ProductCard 
                        key={p.id}
                        product={p}
                        onClick={onProductClick}
                        onAddToCart={onAddToCart}
                    />
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
