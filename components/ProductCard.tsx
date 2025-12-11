
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React from 'react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onClick: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onClick, onAddToCart }) => {
  return (
    <div className="group flex flex-col gap-6 cursor-pointer" onClick={() => onClick(product)}>
      <div className="relative w-full aspect-[4/5] overflow-hidden bg-[#EBE7DE]">
        <img 
          src={product.imageUrl} 
          alt={product.name} 
          className="w-full h-full object-cover transition-transform duration-1000 ease-in-out group-hover:scale-110 sepia-[0.1]"
        />
        
        {/* Hover overlay with "Quick View" and "Add to Cart" */}
        <div className="absolute inset-0 bg-[#2C2A26]/0 group-hover:bg-[#2C2A26]/5 transition-colors duration-500 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0 flex flex-col items-center gap-3">
                <span className="bg-white/90 backdrop-blur text-[#2C2A26] px-8 py-3 rounded-full text-xs uppercase tracking-widest font-medium shadow-sm hover:bg-white hover:scale-105 transform transition-all duration-300 w-40 text-center">
                    View Details
                </span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToCart(product);
                  }}
                  className="bg-[#2C2A26] text-[#F5F2EB] px-8 py-3 rounded-full text-xs uppercase tracking-widest font-medium shadow-sm hover:bg-[#433E38] hover:scale-105 transition-all w-40"
                >
                  Add to Cart
                </button>
            </div>
        </div>
      </div>
      
      <div className="text-center">
        <h3 className="text-2xl font-serif font-medium text-[#2C2A26] mb-1 group-hover:opacity-70 transition-opacity">{product.name}</h3>
        <p className="text-sm font-light text-[#5D5A53] mb-3 tracking-wide">{product.category}</p>
        <span className="text-sm font-medium text-[#2C2A26] block">${product.price}</span>
      </div>
    </div>
  );
};

export default ProductCard;
