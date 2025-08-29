// Main Gemini service - now uses the AI Service Factory for intelligent service selection
import { 
  generateOutfit as factoryGenerateOutfit,
  generateAndRecommendOutfit as factoryGenerateAndRecommendOutfit,
  getStyleRecommendations as factoryGetStyleRecommendations,
  generateClothingItem as factoryGenerateClothingItem,
  getServiceInfo
} from './aiServiceFactory';

// Re-export the factory functions for backward compatibility
export const generateOutfit = factoryGenerateOutfit;
export const generateAndRecommendOutfit = factoryGenerateAndRecommendOutfit;
export const getStyleRecommendations = factoryGetStyleRecommendations;
export const generateClothingItem = factoryGenerateClothingItem;

// Export service info function
export const getAIServiceInfo = getServiceInfo;

// Legacy implementation removed - now using AI Service Factory pattern
// All functionality is handled through the factory pattern above