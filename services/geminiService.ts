import { ClothingItem, StyleRecommendation, ClothingType, ShoppingAssistantResult, OotdAnalysisResult, StyleProfile, SavedOutfit } from "../types";

// A helper function to handle API calls to our own backend
async function apiFetch(endpoint: string, body: object) {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      // Try to parse a JSON error response from the server
      const errorData = await response.json().catch(() => ({ error: `伺服器錯誤，狀態碼: ${response.status}` }));
      throw new Error(errorData.error || '伺服器發生未知錯誤。');
    }
    
    return await response.json();

  } catch (error) {
    console.error(`Error fetching from API endpoint ${endpoint}:`, error);
    // Re-throw the error to be caught by the calling component
    throw error;
  }
}

interface ImagePart {
  base64: string;
  mimeType: string;
}

export async function generateVirtualTryOn(
    userModel: ImagePart,
    top: ClothingItem | null,
    bottom: ClothingItem | null
): Promise<{ imageBase64: string | null; text: string | null }> {
    return apiFetch('/api/generate-virtual-try-on', { userModel, top, bottom });
}

export async function generateAndRecommendOutfit(base64ImageData: string, mimeType: string, styleProfile?: StyleProfile): Promise<{ imageBase64: string | null; text: string | null }> {
    return apiFetch('/api/generate-and-recommend-outfit', { base64ImageData, mimeType, styleProfile });
}

export async function getStyleRecommendations(closet: ClothingItem[], feedback?: Record<string, 'liked' | 'disliked'>, styleProfile?: StyleProfile): Promise<StyleRecommendation[]> {
    return apiFetch('/api/get-style-recommendations', { closet, feedback, styleProfile });
}

export async function describeClothingItem(base64ImageData: string, mimeType: string): Promise<{ description: string; type: ClothingType; tags: string[] }> {
    return apiFetch('/api/describe-clothing-item', { base64ImageData, mimeType });
}

export async function generateClothingItem(style: string, color: string, type: ClothingType, customDescription: string): Promise<string> {
    const result = await apiFetch('/api/generate-clothing-item', { style, color, type, customDescription });
    return result.imageBase64; // The server returns { imageBase64: '...' }
}

export async function findSimilarItems(imageBase64: string, mimeType: string, outfitDescription: string): Promise<ShoppingAssistantResult[]> {
    return apiFetch('/api/find-similar-items', { imageBase64, mimeType, outfitDescription });
}

export async function validateUserModelImage(base64ImageData: string, mimeType: string): Promise<{ isValid: boolean; reason: string | null }> {
    return apiFetch('/api/validate-user-model-image', { base64ImageData, mimeType });
}

export async function analyzeOotd(base64ImageData: string, mimeType: string): Promise<OotdAnalysisResult> {
    return apiFetch('/api/analyze-ootd', { base64ImageData, mimeType });
}
