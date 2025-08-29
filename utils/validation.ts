import { 
  FileValidationConfig, 
  FileValidationResult, 
  ImageValidationResult,
  ValidationError,
  ClothingType,
  StyleOption 
} from '../types';

// File validation configuration
export const FILE_VALIDATION_CONFIG: FileValidationConfig = {
  maxSizeBytes: 2 * 1024 * 1024, // 2MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  maxDimensions: {
    width: 4096,
    height: 4096
  }
};

// Validate file upload
export function validateFile(file: File): FileValidationResult {
  // Check file size
  if (file.size > FILE_VALIDATION_CONFIG.maxSizeBytes) {
    return {
      isValid: false,
      error: `File size must be less than ${FILE_VALIDATION_CONFIG.maxSizeBytes / (1024 * 1024)}MB`,
      size: file.size,
      type: file.type
    };
  }

  // Check file type
  if (!FILE_VALIDATION_CONFIG.allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type must be one of: ${FILE_VALIDATION_CONFIG.allowedTypes.join(', ')}`,
      size: file.size,
      type: file.type
    };
  }

  return {
    isValid: true,
    size: file.size,
    type: file.type
  };
}

// Validate image dimensions
export function validateImageDimensions(
  width: number, 
  height: number
): ImageValidationResult {
  const maxDimensions = FILE_VALIDATION_CONFIG.maxDimensions;
  
  if (!maxDimensions) {
    return { isValid: true, dimensions: { width, height } };
  }

  if (width > maxDimensions.width || height > maxDimensions.height) {
    return {
      isValid: false,
      error: `Image dimensions must be less than ${maxDimensions.width}x${maxDimensions.height}px`,
      dimensions: { width, height }
    };
  }

  return {
    isValid: true,
    dimensions: { width, height }
  };
}

// Validate clothing item description
export function validateClothingDescription(description: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!description || description.trim().length === 0) {
    errors.push({
      field: 'description',
      message: 'Description is required',
      code: 'REQUIRED'
    });
  }

  if (description.length > 200) {
    errors.push({
      field: 'description',
      message: 'Description must be less than 200 characters',
      code: 'MAX_LENGTH'
    });
  }

  if (description.length < 3) {
    errors.push({
      field: 'description',
      message: 'Description must be at least 3 characters',
      code: 'MIN_LENGTH'
    });
  }

  return errors;
}

// Validate clothing type
export function validateClothingType(type: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const validTypes: ClothingType[] = ['TOP', 'BOTTOM'];

  if (!validTypes.includes(type as ClothingType)) {
    errors.push({
      field: 'type',
      message: `Type must be one of: ${validTypes.join(', ')}`,
      code: 'INVALID_VALUE'
    });
  }

  return errors;
}

// Validate style option for AI generation
export function validateStyleOption(style: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const validStyles: StyleOption[] = [
    'japanese', 'korean', 'american', 'chinese', 
    'casual', 'marine', 'formal', 'athletic'
  ];

  if (!validStyles.includes(style as StyleOption)) {
    errors.push({
      field: 'style',
      message: `Style must be one of: ${validStyles.join(', ')}`,
      code: 'INVALID_VALUE'
    });
  }

  return errors;
}

// Validate color description
export function validateColorDescription(color: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!color || color.trim().length === 0) {
    errors.push({
      field: 'color',
      message: 'Color is required',
      code: 'REQUIRED'
    });
  }

  if (color.length > 50) {
    errors.push({
      field: 'color',
      message: 'Color description must be less than 50 characters',
      code: 'MAX_LENGTH'
    });
  }

  return errors;
}

// Validate custom description for AI generation
export function validateCustomDescription(description: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (description.length > 500) {
    errors.push({
      field: 'customDescription',
      message: 'Custom description must be less than 500 characters',
      code: 'MAX_LENGTH'
    });
  }

  return errors;
}

// Validate base64 image data
export function validateBase64Image(base64: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!base64 || base64.trim().length === 0) {
    errors.push({
      field: 'base64',
      message: 'Image data is required',
      code: 'REQUIRED'
    });
    return errors;
  }

  // Check if it's a valid data URL
  const dataUrlPattern = /^data:image\/(jpeg|jpg|png|webp|gif);base64,/;
  if (!dataUrlPattern.test(base64)) {
    errors.push({
      field: 'base64',
      message: 'Invalid image data format',
      code: 'INVALID_FORMAT'
    });
  }

  return errors;
}

// Validate MIME type
export function validateMimeType(mimeType: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!FILE_VALIDATION_CONFIG.allowedTypes.includes(mimeType)) {
    errors.push({
      field: 'mimeType',
      message: `MIME type must be one of: ${FILE_VALIDATION_CONFIG.allowedTypes.join(', ')}`,
      code: 'INVALID_VALUE'
    });
  }

  return errors;
}

// Comprehensive validation for clothing item form
export function validateClothingItemForm(
  description: string,
  type: string,
  file: File
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate description
  errors.push(...validateClothingDescription(description));

  // Validate type
  errors.push(...validateClothingType(type));

  // Validate file
  const fileValidation = validateFile(file);
  if (!fileValidation.isValid && fileValidation.error) {
    errors.push({
      field: 'file',
      message: fileValidation.error,
      code: 'FILE_VALIDATION_ERROR'
    });
  }

  return errors;
}

// Comprehensive validation for AI fashion generator form
export function validateAIFashionGeneratorForm(
  style: string,
  color: string,
  type: string,
  customDescription: string
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate style
  errors.push(...validateStyleOption(style));

  // Validate color
  errors.push(...validateColorDescription(color));

  // Validate type
  errors.push(...validateClothingType(type));

  // Validate custom description
  errors.push(...validateCustomDescription(customDescription));

  return errors;
}

// Helper function to check if validation passed
export function hasValidationErrors(errors: ValidationError[]): boolean {
  return errors.length > 0;
}

// Helper function to get error messages by field
export function getErrorsByField(errors: ValidationError[]): Record<string, string[]> {
  return errors.reduce((acc, error) => {
    if (!acc[error.field]) {
      acc[error.field] = [];
    }
    acc[error.field]!.push(error.message);
    return acc;
  }, {} as Record<string, string[]>);
}