// Core data models
export type ClothingType = 'TOP' | 'BOTTOM';

export interface ClothingItem {
  id: number;
  type: ClothingType;
  description: string;
  imageUrl: string; // Base64 encoded data URL
}

export interface StyleRecommendation {
  styleName: string;
  description: string;
  topId?: number;
  bottomId?: number;
}

export interface UserModel {
  base64: string;
  mimeType: string;
}

// Application state interfaces
export interface AppState {
  appMode: 'basic' | 'advanced';
  userModel: UserModel | null;
  closet: ClothingItem[];
  recommendations: StyleRecommendation[];
  selectedTop: ClothingItem | null;
  selectedBottom: ClothingItem | null;
  generatedOutfitImage: string | null;
  generatedOutfitText: string | null;
  // Loading and error states
  isLoading: boolean;
  isRecommending: boolean;
  error: string | null;
  recommendationError: string | null;
}

// Component prop interfaces
export interface VirtualModelUploaderProps {
  title: string;
  onModelUpload: (base64: string, mimeType: string) => void;
}

export interface ClosetManagerProps {
  title: string;
  closet: ClothingItem[];
  recommendations: StyleRecommendation[];
  onAddItems: (items: Omit<ClothingItem, 'id'>[]) => void;
  onGetRecommendations: () => void;
  onSelectRecommendation: (recommendation: StyleRecommendation) => void;
  isRecommending: boolean;
  error: string | null;
  selectedTopId?: number | null | undefined;
  selectedBottomId?: number | null | undefined;
}

export interface OutfitDisplayProps {
  title: string;
  userModelImage: string | null;
  generatedOutfitImage: string | null;
  generatedOutfitText: string | null;
  onGenerate: () => void;
  isLoading: boolean;
  error: string | null;
  isActionable: boolean;
}

export interface ModeSwitcherProps {
  currentMode: 'basic' | 'advanced';
  onModeChange: (mode: 'basic' | 'advanced') => void;
}

export interface HeaderProps {
  title: string;
  subtitle?: string;
}

export interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
}

// Error state interfaces
export interface ErrorState {
  hasError: boolean;
  errorMessage: string;
  errorCode?: string;
  retryable: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// API response types
export interface AIResponse {
  imageBase64: string | null;
  text: string | null;
}

export interface GeminiGenerateResponse {
  imageBase64: string | null;
  text: string | null;
}

export interface ClothingGenerationRequest {
  style: string;
  color: string;
  type: ClothingType;
  customDescription: string;
}

// Storage interfaces
export interface StoredCloset {
  version: string;
  items: ClothingItem[];
  lastModified: number;
}

// File upload interfaces
export interface FileUploadResult {
  success: boolean;
  data?: string; // Base64 data URL
  mimeType?: string;
  error?: string;
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  size?: number;
  type?: string;
}

// Validation schemas and types
export interface FileValidationConfig {
  maxSizeBytes: number;
  allowedTypes: string[];
  maxDimensions?: {
    width: number;
    height: number;
  };
}

export interface ImageValidationResult {
  isValid: boolean;
  error?: string;
  dimensions?: {
    width: number;
    height: number;
  };
}

// Style and color options for AI generation
export type StyleOption = 
  | 'japanese'
  | 'korean'
  | 'american'
  | 'chinese'
  | 'casual'
  | 'marine'
  | 'formal'
  | 'athletic';

export type ColorOption = string; // Flexible string type for color descriptions

// Form interfaces
export interface ClothingItemForm {
  type: ClothingType;
  description: string;
  file: File;
}

export interface AIFashionGeneratorForm {
  style: StyleOption;
  color: ColorOption;
  type: ClothingType;
  customDescription: string;
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Event handler types
export type FileUploadHandler = (files: FileList) => void;
export type ImageUploadHandler = (base64: string, mimeType: string) => void;
export type ClothingItemHandler = (items: Omit<ClothingItem, 'id'>[]) => void;
export type RecommendationHandler = (recommendation: StyleRecommendation) => void;
export type ModeChangeHandler = (mode: 'basic' | 'advanced') => void;
export type ErrorHandler = (error: string | null) => void;