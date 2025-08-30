export type ClothingType = 'TOP' | 'BOTTOM';

export interface ClothingItem {
  id: string;
  type: ClothingType;
  description: string;
  imageUrl: string;
  tags?: string[];
}

export interface StyleRecommendation {
    styleName: string;
    description: string;
    topId?: string;
    bottomId?: string;
}

export interface SavedOutfit {
  id: string;
  imageUrl: string;
  text: string;
  createdAt: string;
}

export interface ShoppingAssistantResult {
  itemName: string;
  searchQuery: string;
}

export interface UpgradeSuggestion {
  suggestion: string;
  upgradedImageBase64: string;
}

export interface IdentifiedItem {
  description: string;
  type: ClothingType;
}

export interface OotdAnalysisResult {
  critique: string;
  upgradeSuggestions: UpgradeSuggestion[];
  identifiedItems: IdentifiedItem[];
}
