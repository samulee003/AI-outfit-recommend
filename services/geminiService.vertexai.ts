// Vertex AI implementation for Gemini API
import { VertexAI } from '@google-cloud/vertexai';
import { ClothingItem, StyleRecommendation, ClothingType } from "../types";

// Vertex AI configuration
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID || 'your-project-id';
const LOCATION = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

// Initialize Vertex AI
const vertexAI = new VertexAI({
  project: PROJECT_ID,
  location: LOCATION,
});

// Get the Gemini model
const model = vertexAI.preview.getGenerativeModel({
  model: 'gemini-1.5-flash',
});

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

async function callVertexAIImageAPI(
  base64ImageData: string, 
  mimeType: string, 
  prompt: string, 
  referenceImages: ReferenceImage[] = []
): Promise<{ imageBase64: string | null; text: string | null }> {
  try {
    const parts: any[] = [
      {
        inlineData: {
          data: base64ImageData,
          mimeType: mimeType
        }
      }
    ];

    // Add reference images
    for (const refImg of referenceImages) {
      parts.push({
        inlineData: {
          data: refImg.base64,
          mimeType: refImg.mimeType
        }
      });
    }

    // Add text prompt
    parts.push({ text: prompt });

    const request = {
      contents: [{ role: 'user', parts }],
    };

    const response = await model.generateContent(request);
    const result = response.response;

    let imageBase64: string | null = null;
    let text: string | null = null;

    if (result.candidates && result.candidates[0].content && result.candidates[0].content.parts) {
      for (const part of result.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          imageBase64 = part.inlineData.data;
        } else if (part.text) {
          text = part.text;
        }
      }
    }

    // For now, Vertex AI Gemini doesn't support image generation in the same way
    // We'll return text response and use a placeholder for image
    return {
      imageBase64: null, // Vertex AI Gemini doesn't generate images directly
      text: text || 'Generated outfit description from Vertex AI'
    };

  } catch (error) {
    console.error("Error calling Vertex AI Gemini API:", error);
    if (error instanceof Error) {
      throw new Error(`Vertex AI Gemini API Error: ${error.message}`);
    }
    throw new Error("An unknown error occurred while communicating with Vertex AI Gemini API.");
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
  
  return callVertexAIImageAPI(base64ImageData, mimeType, prompt, referenceImages);
}

export async function generateAndRecommendOutfit(
  base64ImageData: string, 
  mimeType: string
): Promise<{ imageBase64: string | null; text: string | null }> {
  
  const styles = [
    'casual chic', 'streetwear', 'business casual', 'minimalist', 'bohemian',
    'preppy', 'athletic leisure', 'vintage-inspired', 'smart casual', 'edgy rock',
    'classic', 'avant-garde', 'eclectic', 'sophisticated urban'
  ];
  const randomStyle = styles[Math.floor(Math.random() * styles.length)];
  const currentSeason = getCurrentSeason();

  const prompt = `Task: Fashion Analysis and Outfit Recommendation.
1. Analyze the person in the image.
2. Design a stylish, complete outfit (top and bottom) in a creative **${randomStyle}** style that would suit them.
3. The outfit must be appropriate for the current **${currentSeason}** season.
4. Describe the recommended outfit in detail, including:
   - Specific clothing items (tops, bottoms, accessories)
   - Colors and patterns that would work well
   - Style reasoning based on the person's appearance
   - How the outfit fits the ${currentSeason} season
   - Background/setting suggestions that would complement the look

Please provide a detailed description of the complete outfit recommendation.`;
  
  return callVertexAIImageAPI(base64ImageData, mimeType, prompt);
}

export async function getStyleRecommendations(closet: ClothingItem[]): Promise<StyleRecommendation[]> {
  const closetDescriptions = closet.map(item => 
    `id: ${item.id}, description: ${item.description} (${item.type})`
  ).join('\n');
  
  const prompt = `You are a professional fashion stylist. Based on the following clothing items from a person's wardrobe, suggest 3 distinct outfit combinations.

My Wardrobe:
${closetDescriptions}

For each outfit suggestion, provide:
1. A creative style name
2. A detailed description of why this combination works
3. The specific item IDs to combine (topId and/or bottomId)

Return your response as a JSON array with this exact structure:
[
  {
    "styleName": "Style Name",
    "description": "Detailed description of the outfit and styling tips",
    "topId": 1,
    "bottomId": 2
  }
]

If an outfit only uses a top or only a bottom, omit the unused field. Ensure all IDs reference items from the provided wardrobe list.`;

  try {
    const request = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      },
    };

    const response = await model.generateContent(request);
    const result = response.response;
    
    if (result.candidates && result.candidates[0].content && result.candidates[0].content.parts) {
      const textResponse = result.candidates[0].content.parts[0].text;
      
      // Try to extract JSON from the response
      const jsonMatch = textResponse?.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const recommendations = JSON.parse(jsonMatch[0]);
        return recommendations;
      }
    }

    // Fallback: return empty array if parsing fails
    return [];

  } catch (error) {
    console.error("Error calling Vertex AI for style recommendations:", error);
    if (error instanceof Error) {
      throw new Error(`Vertex AI API Error: ${error.message}`);
    }
    throw new Error("An unknown error occurred while getting style recommendations.");
  }
}

export async function generateClothingItem(
  style: string, 
  color: string, 
  type: ClothingType, 
  customDescription: string
): Promise<string> {
  
  // Note: Vertex AI Gemini doesn't directly generate images like Imagen
  // This would need to be implemented with a separate image generation service
  // For now, we'll return a descriptive text that could be used with an image generation API
  
  const prompt = `Create a detailed description for generating an image of a ${type.toLowerCase()} with the following specifications:
- Style: ${style}
- Color: ${color}
- Description: ${customDescription}

The description should be suitable for an AI image generation model to create a high-quality, professional studio photograph of the clothing item against a white background.`;

  try {
    const request = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 500,
      },
    };

    const response = await model.generateContent(request);
    const result = response.response;
    
    if (result.candidates && result.candidates[0].content && result.candidates[0].content.parts) {
      const description = result.candidates[0].content.parts[0].text || '';
      
      // For now, return the description as base64 encoded text
      // In a real implementation, this would be sent to an image generation service
      return btoa(description);
    }

    throw new Error("No response generated");

  } catch (error) {
    console.error("Error calling Vertex AI for clothing generation:", error);
    if (error instanceof Error) {
      throw new Error(`Vertex AI API Error: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating the clothing item description.");
  }
}

// Test function to check if Vertex AI is properly configured
export async function testVertexAIConnection(): Promise<boolean> {
  try {
    const request = {
      contents: [{ role: 'user', parts: [{ text: 'Hello, can you respond with "Vertex AI is working"?' }] }],
    };

    const response = await model.generateContent(request);
    const result = response.response;
    
    if (result.candidates && result.candidates[0].content && result.candidates[0].content.parts) {
      const text = result.candidates[0].content.parts[0].text;
      console.log('✅ Vertex AI connection test successful:', text);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Vertex AI connection test failed:', error);
    return false;
  }
}