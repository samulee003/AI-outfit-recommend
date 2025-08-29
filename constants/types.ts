import { ClothingType, StyleOption } from '../types';

// Clothing type constants
export const CLOTHING_TYPES: Record<ClothingType, ClothingType> = {
  TOP: 'TOP',
  BOTTOM: 'BOTTOM'
} as const;

export const CLOTHING_TYPE_LABELS: Record<ClothingType, string> = {
  TOP: 'Top',
  BOTTOM: 'Bottom'
} as const;

// Style option constants
export const STYLE_OPTIONS: Record<StyleOption, StyleOption> = {
  japanese: 'japanese',
  korean: 'korean',
  american: 'american',
  chinese: 'chinese',
  casual: 'casual',
  marine: 'marine',
  formal: 'formal',
  athletic: 'athletic'
} as const;

export const STYLE_OPTION_LABELS: Record<StyleOption, string> = {
  japanese: 'Japanese',
  korean: 'Korean',
  american: 'American',
  chinese: 'Chinese',
  casual: 'Casual',
  marine: 'Marine',
  formal: 'Formal',
  athletic: 'Athletic'
} as const;

// App mode constants
export const APP_MODES = {
  BASIC: 'basic',
  ADVANCED: 'advanced'
} as const;

export const APP_MODE_LABELS = {
  [APP_MODES.BASIC]: 'Basic Mode',
  [APP_MODES.ADVANCED]: 'Advanced Mode'
} as const;

// File validation constants
export const FILE_CONSTRAINTS = {
  MAX_SIZE_BYTES: 2 * 1024 * 1024, // 2MB
  MAX_SIZE_LABEL: '2MB',
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
  MAX_DIMENSIONS: {
    WIDTH: 4096,
    HEIGHT: 4096
  }
} as const;

// Storage constants
export const STORAGE_KEYS = {
  CLOSET: 'ai-wardrobe-closet',
  USER_PREFERENCES: 'ai-wardrobe-preferences'
} as const;

export const STORAGE_VERSION = '1.0.0';

// Error codes
export const ERROR_CODES = {
  // File validation errors
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  INVALID_DIMENSIONS: 'INVALID_DIMENSIONS',
  
  // Form validation errors
  REQUIRED: 'REQUIRED',
  MIN_LENGTH: 'MIN_LENGTH',
  MAX_LENGTH: 'MAX_LENGTH',
  INVALID_VALUE: 'INVALID_VALUE',
  INVALID_FORMAT: 'INVALID_FORMAT',
  
  // API errors
  API_ERROR: 'API_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  CONTENT_POLICY_ERROR: 'CONTENT_POLICY_ERROR',
  
  // Storage errors
  STORAGE_ERROR: 'STORAGE_ERROR',
  STORAGE_QUOTA_EXCEEDED: 'STORAGE_QUOTA_EXCEEDED',
  STORAGE_UNAVAILABLE: 'STORAGE_UNAVAILABLE',
  
  // General errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR'
} as const;

// Loading spinner sizes
export const SPINNER_SIZES = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large'
} as const;

// Default values
export const DEFAULT_VALUES = {
  CLOTHING_DESCRIPTION_MAX_LENGTH: 200,
  CLOTHING_DESCRIPTION_MIN_LENGTH: 3,
  COLOR_DESCRIPTION_MAX_LENGTH: 50,
  CUSTOM_DESCRIPTION_MAX_LENGTH: 500,
  RECOMMENDATION_COUNT: 3,
  RETRY_ATTEMPTS: 3,
  API_TIMEOUT_MS: 30000
} as const;

// Component titles and labels
export const COMPONENT_TITLES = {
  VIRTUAL_MODEL_UPLOADER: 'Upload Your Photo',
  CLOSET_MANAGER: 'Your Digital Closet',
  OUTFIT_DISPLAY: 'Virtual Try-On',
  AI_FASHION_GENERATOR: 'AI Fashion Generator'
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  MODEL_UPLOADED: 'Photo uploaded successfully!',
  ITEMS_ADDED: 'Items added to closet successfully!',
  OUTFIT_GENERATED: 'Outfit generated successfully!',
  RECOMMENDATIONS_GENERATED: 'Style recommendations generated!',
  ITEM_GENERATED: 'Clothing item generated successfully!'
} as const;

// Error messages
export const ERROR_MESSAGES = {
  GENERIC: 'Something went wrong. Please try again.',
  NETWORK: 'Network error. Please check your connection and try again.',
  FILE_UPLOAD: 'Failed to upload file. Please try again.',
  API_UNAVAILABLE: 'AI service is currently unavailable. Please try again later.',
  INSUFFICIENT_ITEMS: 'You need at least 2 items in your closet to get recommendations.',
  NO_MODEL_PHOTO: 'Please upload your photo first.',
  NO_ITEMS_SELECTED: 'Please select clothing items to generate an outfit.',
  STORAGE_FAILED: 'Failed to save data. Your items may not persist between sessions.'
} as const;