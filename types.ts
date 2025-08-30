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