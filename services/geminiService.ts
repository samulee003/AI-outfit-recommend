import { GoogleGenAI, Modality, Type } from "@google/genai";
import { ClothingItem, StyleRecommendation } from "../types";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateOutfit(base64ImageData: string, mimeType: string, prompt: string): Promise<{ imageBase64: string | null; text: string | null }> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64ImageData,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
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
    console.error("Error calling Gemini API for outfit generation:", error);
    if (error instanceof Error) {
        throw new Error(`Gemini API Error: ${error.message}`);
    }
    throw new Error("An unknown error occurred while communicating with the Gemini API.");
  }
}


export async function getStyleRecommendations(closet: ClothingItem[]): Promise<StyleRecommendation[]> {
    const closetDescriptions = closet.map(item => `- ${item.description} (${item.type})`).join('\n');
    const prompt = `You are a fashion stylist. Based on the following clothing items in a user's closet, suggest 3 distinct outfit combinations. For each suggestion, provide a creative "styleName" and a "description" of which items to combine. Be specific.

My Closet:
${closetDescriptions}

Return the suggestions as a valid JSON array.`;

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
