
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useState, useEffect, useRef } from 'react';
import { Product } from '../types';
import { calculateShippingEstimate, lookupZipLocation } from '../services/geminiService';

interface CheckoutProps {
  items: Product[];
  onBack: () => void;
}

interface LocationSuggestion {
    zip: string;
    city: string;
    country: string;
    region: string;
}

const Checkout: React.FC<CheckoutProps> = ({ items, onBack }) => {
  const [zipCode, setZipCode] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('');
  
  const [shippingCost, setShippingCost] = useState(0);
  const [shippingDetails, setShippingDetails] = useState<{
      city: string, 
      distance: string,
      currency?: string,
      exchangeRate?: number
  } | null>(null);
  const [isShippingCalculated, setIsShippingCalculated] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const totalUSD = subtotal + (isShippingCalculated ? shippingCost : 0);

  // Determine active currency and rate
  const activeCurrency = shippingDetails?.currency || 'USD';
  const exchangeRate = shippingDetails?.exchangeRate || 1;

  const formatPrice = (amountInUSD: number) => {
      const convertedAmount = amountInUSD * exchangeRate;
      
      return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: activeCurrency,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
      }).format(convertedAmount);
  };

  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setZipCode(val);
    setIsShippingCalculated(false);
    setShippingDetails(null);
    setSelectedCountry('');
    
    // Debounce API call
    if (debounceRef.current) clearTimeout(debounceRef.current);
    
    if (val.length >= 3) {
        setIsLookingUp(true);
        debounceRef.current = setTimeout(async () => {
            const results = await lookupZipLocation(val);
            setSuggestions(results);
            setShowSuggestions(true);
            setIsLookingUp(false);
        }, 800);
    } else {
        setSuggestions([]);
        setShowSuggestions(false);
    }
  };

  const selectLocation = (loc: LocationSuggestion) => {
      setZipCode(loc.zip);
      setSelectedCountry(loc.country);
      setSuggestions([]);
      setShowSuggestions(false);
      
      // Trigger calculation immediately with explicit city to avoid ambiguity
      handleCalculateShipping(loc.zip, loc.country, loc.city);
  };

  const handleCalculateShipping = async (zip: string, country: string, city: string) => {
    setIsCalculating(true);
    setShippingDetails(null);
    
    try {
        const result = await calculateShippingEstimate(zip, country, city);
        
        if (result) {
            setShippingCost(result.cost);
            setShippingDetails({ 
                city: result.city, 
                distance: result.distance,
                currency: result.currency,
                exchangeRate: result.exchangeRate
            });
            setIsShippingCalculated(true);
        } else {
            setShippingCost(25);
            setIsShippingCalculated(true);
        }
    } catch (error) {
        setShippingCost(25); 
        setIsShippingCalculated(true);
    } finally {
        setIsCalculating(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-24 px-6 bg-[#F5F2EB] animate-fade-in-up">
      <div className="max-w-6xl mx-auto">
        <button 
          onClick={onBack}
          className="group flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-[#A8A29E] hover:text-[#2C2A26] transition-colors mb-12"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 group-hover:-translate-x-1 transition-transform">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to Shop
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
          
          {/* Left Column: Form */}
          <div>
            <h1 className="text-3xl font-serif text-[#2C2A26] mb-4">Checkout</h1>
            <p className="text-sm text-[#5D5A53] mb-12">This is a sample site. Purchasing is disabled.</p>
            
            <div className="space-y-12">
              {/* Section 1: Contact */}
              <div>
                <h2 className="text-xl font-serif text-[#2C2A26] mb-6">Contact Information</h2>
                <div className="space-y-4">
                   <input type="email" placeholder="Email address" className="w-full bg-transparent border-b border-[#D6D1C7] py-3 text-[#2C2A26] placeholder-[#A8A29E] outline-none focus:border-[#2C2A26] transition-colors cursor-not-allowed" disabled />
                   <div className="flex items-center gap-2">
                     <input type="checkbox" id="newsletter" className="accent-[#2C2A26] cursor-not-allowed" disabled />
                     <label htmlFor="newsletter" className="text-sm text-[#5D5A53] cursor-not-allowed">Email me with news and offers</label>
                   </div>
                </div>
              </div>

              {/* Section 2: Shipping */}
              <div>
                <h2 className="text-xl font-serif text-[#2C2A26] mb-6">Shipping Address</h2>
                <div className="space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                      <input type="text" placeholder="First name" className="w-full bg-transparent border-b border-[#D6D1C7] py-3 text-[#2C2A26] placeholder-[#A8A29E] outline-none focus:border-[#2C2A26] transition-colors cursor-not-allowed" disabled />
                      <input type="text" placeholder="Last name" className="w-full bg-transparent border-b border-[#D6D1C7] py-3 text-[#2C2A26] placeholder-[#A8A29E] outline-none focus:border-[#2C2A26] transition-colors cursor-not-allowed" disabled />
                   </div>
                   <input type="text" placeholder="Address" className="w-full bg-transparent border-b border-[#D6D1C7] py-3 text-[#2C2A26] placeholder-[#A8A29E] outline-none focus:border-[#2C2A26] transition-colors cursor-not-allowed" disabled />
                   
                   <div className="grid grid-cols-2 gap-4 relative items-end">
                        {/* City / Country Display (Auto-filled) */}
                       <div className="w-full border-b border-[#D6D1C7] py-3 text-[#2C2A26]">
                           {selectedCountry ? (
                               <span className="flex flex-col">
                                   <span className="text-xs text-[#A8A29E] uppercase tracking-wider">Destination</span>
                                   <span>{selectedCountry}</span>
                               </span>
                           ) : (
                               <input disabled placeholder="Country (Auto-select)" className="w-full bg-transparent text-[#2C2A26] placeholder-[#A8A29E] outline-none cursor-not-allowed" />
                           )}
                       </div>

                      {/* Interactive Zip Code Input with Suggestions */}
                      <div className="relative">
                          <input 
                            type="text" 
                            placeholder="Postal code" 
                            value={zipCode}
                            onChange={handleZipChange}
                            className="w-full bg-transparent border-b border-[#D6D1C7] py-3 text-[#2C2A26] placeholder-[#A8A29E] outline-none focus:border-[#2C2A26] transition-colors pr-8" 
                          />
                          {isLookingUp && (
                              <div className="absolute right-0 top-3">
                                  <div className="w-4 h-4 border-2 border-[#A8A29E] border-t-[#2C2A26] rounded-full animate-spin"></div>
                              </div>
                          )}

                          {/* Suggestion Dropdown */}
                          {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 z-50 bg-white shadow-xl border border-[#D6D1C7] mt-1 max-h-60 overflow-y-auto animate-fade-in-up">
                                {suggestions.map((loc, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => selectLocation(loc)}
                                        className="w-full text-left px-4 py-3 hover:bg-[#F5F2EB] transition-colors text-sm border-b border-[#F5F2EB] last:border-0"
                                    >
                                        <div className="font-medium text-[#2C2A26]">{loc.zip}</div>
                                        <div className="text-[#5D5A53] text-xs">{loc.city}, {loc.region}, {loc.country}</div>
                                    </button>
                                ))}
                            </div>
                          )}
                          
                          {/* Fallback info if no results found after typing */}
                          {zipCode.length > 4 && !isLookingUp && suggestions.length === 0 && !selectedCountry && (
                              <div className="absolute top-full left-0 text-xs text-red-400 mt-1">No matches found. Try specific zip.</div>
                          )}
                      </div>
                   </div>
                </div>
              </div>

               {/* Section 3: Payment (Mock) */}
              <div>
                <h2 className="text-xl font-serif text-[#2C2A26] mb-6">Payment</h2>
                <div className="p-6 border border-[#D6D1C7] bg-white/50 space-y-4">
                   <p className="text-sm text-[#5D5A53] mb-2">All transactions are secure and encrypted.</p>
                   <input type="text" placeholder="Card number" className="w-full bg-transparent border-b border-[#D6D1C7] py-3 text-[#2C2A26] placeholder-[#A8A29E] outline-none focus:border-[#2C2A26] transition-colors cursor-not-allowed" disabled />
                   <div className="grid grid-cols-2 gap-4">
                      <input type="text" placeholder="Expiration (MM/YY)" className="w-full bg-transparent border-b border-[#D6D1C7] py-3 text-[#2C2A26] placeholder-[#A8A29E] outline-none focus:border-[#2C2A26] transition-colors cursor-not-allowed" disabled />
                      <input type="text" placeholder="Security code" className="w-full bg-transparent border-b border-[#D6D1C7] py-3 text-[#2C2A26] placeholder-[#A8A29E] outline-none focus:border-[#2C2A26] transition-colors cursor-not-allowed" disabled />
                   </div>
                </div>
              </div>

              <div>
                <button 
                    disabled
                    className="w-full py-5 bg-[#A8A29E] text-[#F5F2EB] uppercase tracking-widest text-sm font-medium cursor-not-allowed opacity-80"
                >
                    Pay Now — {formatPrice(totalUSD)}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Summary */}
          <div className="lg:pl-12 lg:border-l border-[#D6D1C7]">
            <h2 className="text-xl font-serif text-[#2C2A26] mb-8">Order Summary</h2>
            
            <div className="space-y-6 mb-8">
               {items.map((item, idx) => (
                 <div key={idx} className="flex gap-4">
                    <div className="w-16 h-16 bg-[#EBE7DE] relative">
                       <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                       <span className="absolute -top-2 -right-2 w-5 h-5 bg-[#2C2A26] text-white text-[10px] flex items-center justify-center rounded-full">1</span>
                    </div>
                    <div className="flex-1">
                       <h3 className="font-serif text-[#2C2A26] text-base">{item.name}</h3>
                       <p className="text-xs text-[#A8A29E]">{item.category}</p>
                    </div>
                    <span className="text-sm text-[#5D5A53]">{formatPrice(item.price)}</span>
                 </div>
               ))}
            </div>

            <div className="border-t border-[#D6D1C7] pt-6 space-y-2">
              <div className="flex justify-between text-sm text-[#5D5A53]">
                 <span>Subtotal</span>
                 <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-[#5D5A53]">
                 <span>Shipping</span>
                 <div className="text-right">
                    <span>
                        {isCalculating ? 'Calculating...' : (
                            isShippingCalculated 
                            ? (shippingCost === 0 ? 'Free' : formatPrice(shippingCost)) 
                            : 'Pending address'
                        )}
                    </span>
                    {shippingDetails && (
                        <p className="text-[10px] text-[#A8A29E] mt-1">
                           From Cupertino to {shippingDetails.city} <br/> ({shippingDetails.distance})
                        </p>
                    )}
                 </div>
              </div>
            </div>
            
            <div className="border-t border-[#D6D1C7] mt-6 pt-6">
               <div className="flex flex-col gap-2">
                 <div className="flex justify-between items-center">
                   <span className="font-serif text-xl text-[#2C2A26]">Total</span>
                   <div className="flex items-end gap-2">
                     <span className="text-xs text-[#A8A29E] mb-1">{activeCurrency}</span>
                     <span className="font-serif text-2xl text-[#2C2A26]">{formatPrice(totalUSD)}</span>
                   </div>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
