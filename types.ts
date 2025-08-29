export type ClothingType = 'TOP' | 'BOTTOM';

export interface ClothingItem {
  id: number;
  type: ClothingType;
  description: string;
  imageUrl: string;
}

export interface StyleRecommendation {
    styleName: string;
    description: string;
}
