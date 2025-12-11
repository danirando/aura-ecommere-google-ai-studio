/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import { GoogleGenAI, Type, Schema, FunctionDeclaration, Tool } from "@google/genai";
import { PRODUCTS } from '../constants';
import { Product } from "../types";

const getSystemInstruction = (activeProduct?: Product) => {
  const productContext = PRODUCTS.map(p => 
    `- ${p.name} ($${p.price}): ${p.description}. Features: ${p.features.join(', ')}`
  ).join('\n');

  let baseInstruction = `You are the AI Concierge for "Aura", a warm, organic lifestyle tech brand. 
  Your tone is calm, inviting, grounded, and sophisticated. Avoid overly "techy" jargon; prefer words like "natural", "seamless", "warm", and "texture".
  
  Here is our current product catalog:
  ${productContext}
  
  Answer customer questions about specifications, recommendations, and brand philosophy.
  Keep answers concise (under 3 sentences usually) to fit the chat UI. 
  If asked about products not in the list, gently steer them back to Aura products.`;

  if (activeProduct) {
      baseInstruction += `\n\nCURRENT CONTEXT: The user is currently viewing the product page for "${activeProduct.name}".
      
      Here are the specific details for this product:
      - Name: ${activeProduct.name}
      - Price: $${activeProduct.price}
      - Tagline: ${activeProduct.tagline}
      - Category: ${activeProduct.category}
      - Description: ${activeProduct.longDescription || activeProduct.description}
      - Features: ${activeProduct.features.join(', ')}

      If the user asks "what is this?", "tell me about this", "is it good?", or questions about the "current product", use the details above to provide a specific, helpful answer regarding ${activeProduct.name}.
      
      If the user asks to "describe the image", "what does it look like", or about visual details, look at the IMAGE provided in the input (if any) and describe it using the Aura brand voice (warm, textured, minimalist).
      
      If the user asks to EDIT the image (e.g., "add a cat", "make it blue"), use the 'edit_image' tool.`;
  } else {
      baseInstruction += `\n\nIf the user asks to generate an image, use the 'edit_image' tool.`;
  }

  return baseInstruction;
};

// Define the tool for image editing/generation
const editImageTool: Tool = {
  functionDeclarations: [
    {
      name: "edit_image",
      description: "Generates a new image or edits the current product image based on a text prompt. Use this when the user asks to visualize something, add/remove elements, or change the style of the image.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          prompt: {
            type: Type.STRING,
            description: "The description of the image to generate or the edits to apply.",
          },
        },
        required: ["prompt"],
      },
    },
  ],
};

const generateImageWithNanoBanana = async (apiKey: string, prompt: string, inputImageBase64?: string): Promise<string | undefined> => {
  const ai = new GoogleGenAI({ apiKey });
  const model = 'gemini-2.5-flash-image';
  
  const parts: any[] = [];
  
  // If we have an input image, we include it for image-to-image editing
  if (inputImageBase64) {
      parts.push({
          inlineData: {
              mimeType: 'image/jpeg',
              data: inputImageBase64
          }
      });
  }
  
  parts.push({ text: prompt });

  try {
      const response = await ai.models.generateContent({
          model,
          contents: { parts }
      });

      // Iterate through parts to find the image
      for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData && part.inlineData.data) {
              return part.inlineData.data;
          }
      }
  } catch (e) {
      console.error("Image generation failed:", e);
  }
  return undefined;
};

export const sendMessageToGemini = async (
    history: {role: string, text: string}[], 
    newMessage: string, 
    activeProduct?: Product,
    imageBase64?: string
): Promise<{ text: string, image?: string }> => {
  try {
    let apiKey: string | undefined;
    
    try {
      apiKey = process.env.API_KEY;
    } catch (e) {
      console.warn("Accessing process.env failed");
    }
    
    if (!apiKey) {
      return { text: "I'm sorry, I cannot connect to the server right now. (Missing API Key)" };
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: getSystemInstruction(activeProduct),
        tools: [editImageTool]
      },
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.text }]
      }))
    });

    let messageParts: any[] = [{ text: newMessage }];

    if (imageBase64) {
        messageParts.push({
            inlineData: {
                mimeType: "image/jpeg",
                data: imageBase64
            }
        });
    }

    const result = await chat.sendMessage({ message: messageParts });
    
    // Check for function calls
    const call = result.functionCalls?.[0];
    if (call && call.name === 'edit_image') {
        const prompt = call.args.prompt as string;
        
        // Execute the image generation model (Nano Banana)
        const generatedImage = await generateImageWithNanoBanana(apiKey, prompt, imageBase64);
        
        if (generatedImage) {
            // Inform the model that the image was generated successfully
            const toolResponse = await chat.sendMessage({
                message: [
                    {
                        functionResponse: {
                            name: 'edit_image',
                            response: { result: 'Image generated successfully.' }
                        }
                    }
                ]
            });
            
            return {
                text: toolResponse.text,
                image: generatedImage
            };
        } else {
             const toolResponse = await chat.sendMessage({
                message: [
                    {
                        functionResponse: {
                            name: 'edit_image',
                            response: { result: 'Failed to generate image.' }
                        }
                    }
                ]
            });
            return { text: toolResponse.text };
        }
    }

    return { text: result.text };

  } catch (error) {
    console.error("Gemini API Error:", error);
    return { text: "I apologize, but I seem to be having trouble reaching our archives at the moment." };
  }
};

export const translateProductDetails = async (
    description: string, 
    features: string[],
    targetLanguage: string = 'Italian'
): Promise<{ translatedDescription: string, translatedFeatures: string[] } | null> => {
    try {
        let apiKey: string | undefined;
        try {
          apiKey = process.env.API_KEY;
        } catch (e) { console.warn("Accessing process.env failed"); }
        
        if (!apiKey) return null;
    
        const ai = new GoogleGenAI({ apiKey });
        
        const responseSchema: Schema = {
            type: Type.OBJECT,
            properties: {
                translatedDescription: { type: Type.STRING },
                translatedFeatures: { 
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            },
            required: ["translatedDescription", "translatedFeatures"]
        };

        const prompt = `
          Translate the following product details into ${targetLanguage}. 
          
          Input Description: "${description}"
          Input Features: ${JSON.stringify(features)}
    
          STYLE GUIDELINES:
          - Maintain the "Aura" brand voice: calm, sophisticated, minimalist, and slightly poetic. 
          - The description should feel organic.
          - The features should remain concise specifications but adapted to the target language naturally.
          - Do not add introductory text. Return only the JSON.
        `;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema
            }
        });
        
        if (response.text) {
            return JSON.parse(response.text);
        }
        return null;
    } catch (e) {
          console.error("Translation error", e);
          return null;
    }
}

export const translateContent = async (text: string, targetLanguage: string = 'Italian'): Promise<string> => {
  try {
    let apiKey: string | undefined;
    try {
      apiKey = process.env.API_KEY;
    } catch (e) { console.warn("Accessing process.env failed"); }
    
    if (!apiKey) return text;

    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `
      Translate the following product description into ${targetLanguage}. 
      
      CRITICAL OUTPUT RULES:
      1. Return ONLY the translated text. 
      2. Do NOT include any conversational filler, prefixes, or introductions like "Ecco la traduzione" or "Here is the translation".
      3. Just give me the raw translated string.

      STYLE GUIDELINES:
      - Maintain the "Aura" brand voice: calm, sophisticated, minimalist, and slightly poetic. 
      - Do not sound like a machine translator. Use evocative language (e.g., "warmth", "texture", "organic").
      
      Text to translate:
      "${text}"
    `;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });
    
    return response.text || text;
  } catch (e) {
      console.error("Translation error", e);
      return text;
  }
};

export const translateBatch = async (texts: string[], targetLanguage: string): Promise<string[]> => {
    try {
        let apiKey: string | undefined;
        try { apiKey = process.env.API_KEY; } catch (e) {}
        if (!apiKey) return texts;

        const ai = new GoogleGenAI({ apiKey });

        const responseSchema: Schema = {
            type: Type.ARRAY,
            items: { type: Type.STRING },
        };

        const prompt = `
            Translate the following array of strings into ${targetLanguage}.
            
            Strings: ${JSON.stringify(texts)}
            
            CRITICAL RULES:
            1. DO NOT TRANSLATE the brand name "Aura". Keep it as "Aura".
            2. DO NOT TRANSLATE the slogan "Quiet living" or "Quiet living.". Keep it exactly as is in English.
            3. Maintain the minimalist, sophisticated brand voice.
            4. Return a JSON array of strings corresponding exactly to the input order.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema
            }
        });

        if (response.text) {
            return JSON.parse(response.text);
        }
        return texts;
    } catch (e) {
        console.error("Batch Translation Error:", e);
        return texts;
    }
}

export const lookupZipLocation = async (zipCode: string): Promise<Array<{zip: string, city: string, country: string, region: string}>> => {
  try {
    let apiKey: string | undefined;
    try {
      apiKey = process.env.API_KEY;
    } catch (e) { console.warn("Accessing process.env failed"); }
    if (!apiKey) return [];

    const ai = new GoogleGenAI({ apiKey });

    const responseSchema: Schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          zip: { type: Type.STRING },
          city: { type: Type.STRING },
          country: { type: Type.STRING },
          region: { type: Type.STRING, description: "State, Province, or Region" }
        },
        required: ["zip", "city", "country", "region"]
      }
    };

    // Updated prompt to force international lookup and handle duplicates like 98121 (Messina vs Seattle)
    const prompt = `
      Identify up to 5 distinct locations GLOBALLY that use the postal code "${zipCode}".
      
      CRITICAL INSTRUCTIONS:
      1. This code might exist in multiple countries simultaneously (e.g. 98121 is both Seattle, USA and Messina, Italy).
      2. You MUST check specifically for matches in:
         - Italy (Codice di Avviamento Postale)
         - USA (Zip Code)
         - Europe
         - Asia
      3. Do NOT just return the US location if valid international matches exist. Return BOTH.
      
      Return formatted strictly as JSON.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return [];
  } catch (error) {
    console.error("Zip Lookup Error:", error);
    return [];
  }
}

export const calculateShippingEstimate = async (zipCode: string, country: string, city?: string): Promise<{ 
  cost: number, 
  city: string, 
  distance: string,
  currency: string,
  exchangeRate: number
} | null> => {
  try {
    let apiKey: string | undefined;
    try {
      apiKey = process.env.API_KEY;
    } catch (e) {
      console.warn("Accessing process.env failed");
    }

    if (!apiKey) return null;

    const ai = new GoogleGenAI({ apiKey });

    // Define the expected JSON schema for the response
    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        cost: { type: Type.NUMBER, description: "Calculated shipping cost in USD" },
        city: { type: Type.STRING, description: "City and Country/State of the zip code" },
        distance: { type: Type.STRING, description: "Distance in local unit (e.g. '2500 miles' or '4000 km')" },
        currency: { type: Type.STRING, description: "Local currency code (e.g. EUR, GBP, JPY)" },
        exchangeRate: { type: Type.NUMBER, description: "Exchange rate from USD to local currency (e.g. 0.92)" },
      },
      required: ["cost", "city", "distance", "currency", "exchangeRate"],
    };

    const prompt = `
      I need to calculate shipping for an order.
      Origin: Cupertino, CA, USA.
      Destination: "${city ? city + ', ' : ''}${zipCode}, ${country}".
      
      1. Use the provided city ("${city}") as the exact destination. Do not guess a different city.
      2. Estimate the distance from Cupertino, CA to this location. Use the UNIT OF MEASUREMENT standard for the destination country (e.g. Kilometers for Italy/Europe, Miles for USA).
      3. Calculate shipping cost using this formula: 
         - Base fee: $12.00
         - Distance fee: $0.005 per mile (approximate conversion if km)
         - If international (outside US), add flat $25.00 customs fee.
         - Round to 2 decimal places (USD).
      4. Identify the local currency used in the destination country (e.g. EUR, GBP).
      5. Provide an estimated exchange rate from USD to that currency.
      
      Return the result in JSON format.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return null;

  } catch (error) {
    console.error("Shipping Calculation Error:", error);
    return null;
  }
};