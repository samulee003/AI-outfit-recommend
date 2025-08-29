import { GoogleGenAI, Modality, Type } from "@google/genai";
// Fix: Import `ClothingType` as it is used in the `generateClothingItem` function signature.
import { ClothingItem, StyleRecommendation, ClothingType } from "../types";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface ReferenceImage {
  base64: string;
  mimeType: string;
}

const getCurrentSeason = (): string => {
  const month = new Date().getMonth(); // 0-11 (Jan-Dec)
  // Simple Northern Hemisphere check
  if (month >= 2 && month <= 4) return 'Spring'; // Mar, Apr, May
  if (month >= 5 && month <= 7) return 'Summer'; // Jun, Jul, Aug
  if (month >= 8 && month <= 10) return 'Autumn'; // Sep, Oct, Nov
  return 'Winter'; // Dec, Jan, Feb
};

async function callImageEditAPI(base64ImageData: string, mimeType: string, prompt: string, referenceImages: ReferenceImage[] = []): Promise<{ imageBase64: string | null; text: string | null }> {
    try {
        const parts: any[] = [
            { inlineData: { data: base64ImageData, mimeType: mimeType } },
        ];

        for (const refImg of referenceImages) {
            parts.push({ inlineData: { data: refImg.base64, mimeType: refImg.mimeType } });
        }

        parts.push({ text: prompt });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts },
            config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
        });

        let imageBase64: string | null = null;
        let text: string | null = null;
        
        if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.data) {
                    imageBase64 = part.inlineData.data;
                } else if (part.text) {
                    text = part.text;
                }
            }
        }

        if (!imageBase64 && !text) {
            throw new Error("Invalid response from Gemini API. No image or text found.");
        }

        return { imageBase64, text };

    } catch (error) {
        console.error("Error calling Gemini API for image editing:", error);
        if (error instanceof Error) {
            throw new Error(`Gemini API Error: ${error.message}`);
        }
        throw new Error("An unknown error occurred while communicating with the Gemini API.");
    }
}


export async function generateOutfit(
    base64ImageData: string, 
    mimeType: string, 
    prompt: string,
    topImageUrl: string | null,
    bottomImageUrl: string | null
): Promise<{ imageBase64: string | null; text: string | null }> {
    
    const referenceImages: ReferenceImage[] = [];

    const parseDataUrl = (dataUrl: string): ReferenceImage | null => {
        const match = dataUrl.match(/^data:(image\/\w+);base64,(.*)$/);
        if (match) {
            return { mimeType: match[1], base64: match[2] };
        }
        return null;
    };

    if (topImageUrl) {
        const parsed = parseDataUrl(topImageUrl);
        if (parsed) referenceImages.push(parsed);
    }
    if (bottomImageUrl) {
        const parsed = parseDataUrl(bottomImageUrl);
        if (parsed) referenceImages.push(parsed);
    }
    
    return callImageEditAPI(base64ImageData, mimeType, prompt, referenceImages);
}


export async function generateAndRecommendOutfit(base64ImageData: string, mimeType: string): Promise<{ imageBase64: string | null; text: string | null }> {
  const styles = [
    'casual chic', 'streetwear', 'business casual', 'minimalist', 'bohemian',
    'preppy', 'athletic leisure', 'vintage-inspired', 'smart casual', 'edgy rock',
    'classic', 'avant-garde', 'eclectic', 'sophisticated urban'
  ];
  const randomStyle = styles[Math.floor(Math.random() * styles.length)];
  const currentSeason = getCurrentSeason();

  const prompt = `Task: Fashion Recommendation, Virtual Try-On, and Scene Generation.
1.  Analyze the person in the image.
2.  Design a stylish, complete outfit (top and bottom) in a creative **${randomStyle}** style that would suit them. The outfit must be appropriate for the current **${currentSeason}** season.
3.  Edit the original image to show the person wearing this new outfit.
4.  Completely replace the original background with a new, scenic background that complements the outfit's style and the season.
5.  Describe the outfit you created, clearly mentioning the style.
Important: The person's face and pose must remain unchanged.`;
  
  return callImageEditAPI(base64ImageData, mimeType, prompt);
}


export async function getStyleRecommendations(closet: ClothingItem[]): Promise<StyleRecommendation[]> {
    const closetDescriptions = closet.map(item => `id: ${item.id}, description: ${item.description} (${item.type})`).join('\n');
    const prompt = `You are a fashion stylist. Based on the following clothing items, suggest 3 distinct outfits. For each suggestion, provide a "styleName", a "description", and the exact "topId" and "bottomId" of the items to combine from the provided list.

My Closet (format: id: description (type)):
${closetDescriptions}

Return a valid JSON array matching the schema. If an outfit only uses a top, omit bottomId, and vice-versa.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            styleName: { type: Type.STRING },
                            description: { type: Type.STRING },
                            topId: { type: Type.INTEGER, description: "ID of the recommended top item from the closet list." },
                            bottomId: { type: Type.INTEGER, description: "ID of the recommended bottom item from the closet list." },
                        },
                        required: ["styleName", "description"],
                    },
                },
            },
        });

        const jsonText = response.text.trim();
        const recommendations = JSON.parse(jsonText);
        return recommendations;

    } catch (error) {
        console.error("Error calling Gemini API for style recommendations:", error);
        if (error instanceof Error) {
            throw new Error(`Gemini API Error: ${error.message}`);
        }
        throw new Error("An unknown error occurred while getting style recommendations.");
    }
}

export async function generateClothingItem(style: string, color: string, type: ClothingType, customDescription: string): Promise<string> {
  const prompt = `A high-quality, professionally shot studio photograph of a single piece of clothing: a ${type.toLowerCase()} from a fashion collection.
Style: ${style}.
Color Palette: ${color}.
Description: ${customDescription}.
The item is displayed flat or on a mannequin against a pure white background, with no human models. Focus on the texture and details of the fabric.`;

  try {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/png',
          aspectRatio: '1:1',
        },
    });
    
    if (response.generatedImages && response.generatedImages.length > 0) {
        return response.generatedImages[0].image.imageBytes;
    } else {
        throw new Error("The AI did not return any images.");
    }
  } catch (error) {
    console.error("Error calling Gemini API for clothing generation:", error);
     if (error instanceof Error) {
        throw new Error(`Gemini API Error: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating the clothing item.");
  }
}