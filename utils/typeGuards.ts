import { 
  ClothingItem, 
  ClothingType, 
  StyleRecommendation, 
  UserModel, 
  StoredCloset,
  StyleOption,
  AIResponse,
  ValidationError
} from '../types';

// Type guards for runtime type checking

export function isClothingType(value: any): value is ClothingType {
  return typeof value === 'string' && ['TOP', 'BOTTOM'].includes(value);
}

export function isStyleOption(value: any): value is StyleOption {
  return typeof value === 'string' && [
    'japanese', 'korean', 'american', 'chinese',
    'casual', 'marine', 'formal', 'athletic'
  ].includes(value);
}

export function isClothingItem(value: any): value is ClothingItem {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.id === 'number' &&
    isClothingType(value.type) &&
    typeof value.description === 'string' &&
    typeof value.imageUrl === 'string'
  );
}

export function isStyleRecommendation(value: any): value is StyleRecommendation {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.styleName === 'string' &&
    typeof value.description === 'string' &&
    (value.topId === undefined || typeof value.topId === 'number') &&
    (value.bottomId === undefined || typeof value.bottomId === 'number')
  );
}

export function isUserModel(value: any): value is UserModel {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.base64 === 'string' &&
    typeof value.mimeType === 'string'
  );
}

export function isStoredCloset(value: any): value is StoredCloset {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.version === 'string' &&
    Array.isArray(value.items) &&
    value.items.every(isClothingItem) &&
    typeof value.lastModified === 'number'
  );
}

export function isAIResponse(value: any): value is AIResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value.imageBase64 === null || typeof value.imageBase64 === 'string') &&
    (value.text === null || typeof value.text === 'string')
  );
}

export function isValidationError(value: any): value is ValidationError {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.field === 'string' &&
    typeof value.message === 'string' &&
    typeof value.code === 'string'
  );
}

// Array type guards
export function isClothingItemArray(value: any): value is ClothingItem[] {
  return Array.isArray(value) && value.every(isClothingItem);
}

export function isStyleRecommendationArray(value: any): value is StyleRecommendation[] {
  return Array.isArray(value) && value.every(isStyleRecommendation);
}

export function isValidationErrorArray(value: any): value is ValidationError[] {
  return Array.isArray(value) && value.every(isValidationError);
}

// Utility functions for type assertions
export function assertClothingItem(value: any): asserts value is ClothingItem {
  if (!isClothingItem(value)) {
    throw new Error('Value is not a valid ClothingItem');
  }
}

export function assertStyleRecommendation(value: any): asserts value is StyleRecommendation {
  if (!isStyleRecommendation(value)) {
    throw new Error('Value is not a valid StyleRecommendation');
  }
}

export function assertUserModel(value: any): asserts value is UserModel {
  if (!isUserModel(value)) {
    throw new Error('Value is not a valid UserModel');
  }
}

// Safe parsing functions that return null on invalid data
export function safeParseClothingItem(value: any): ClothingItem | null {
  return isClothingItem(value) ? value : null;
}

export function safeParseStyleRecommendation(value: any): StyleRecommendation | null {
  return isStyleRecommendation(value) ? value : null;
}

export function safeParseUserModel(value: any): UserModel | null {
  return isUserModel(value) ? value : null;
}

export function safeParseStoredCloset(value: any): StoredCloset | null {
  return isStoredCloset(value) ? value : null;
}

export function safeParseClothingItemArray(value: any): ClothingItem[] | null {
  return isClothingItemArray(value) ? value : null;
}

export function safeParseStyleRecommendationArray(value: any): StyleRecommendation[] | null {
  return isStyleRecommendationArray(value) ? value : null;
}

// Helper functions for working with optional types
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export function isNullOrUndefined<T>(value: T | null | undefined): value is null | undefined {
  return value === null || value === undefined;
}

// File type checking utilities
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

export function isSupportedImageType(mimeType: string): boolean {
  const supportedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  return supportedTypes.includes(mimeType);
}

// Base64 data URL utilities
export function isDataURL(value: string): boolean {
  return /^data:/.test(value);
}

export function isBase64ImageDataURL(value: string): boolean {
  return /^data:image\/(jpeg|jpg|png|webp|gif);base64,/.test(value);
}

export function extractMimeTypeFromDataURL(dataURL: string): string | null {
  const match = dataURL.match(/^data:([^;]+);base64,/);
  return match && match[1] ? match[1] : null;
}

export function extractBase64FromDataURL(dataURL: string): string | null {
  const match = dataURL.match(/^data:[^;]+;base64,(.+)$/);
  return match && match[1] ? match[1] : null;
}