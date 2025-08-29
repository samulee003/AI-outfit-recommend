import { ClothingItem, StoredCloset } from '../types';
import { STORAGE_KEYS, STORAGE_VERSION, ERROR_CODES } from '../constants/types';

/**
 * Storage service for managing localStorage operations with error handling,
 * versioned schema, and graceful degradation
 */

// Storage availability check
let isStorageAvailable: boolean | null = null;

/**
 * Reset storage availability cache (for testing)
 */
function resetStorageAvailabilityCache(): void {
  isStorageAvailable = null;
}

/**
 * Check if localStorage is available and functional
 */
function checkStorageAvailability(): boolean {
  if (isStorageAvailable !== null) {
    return isStorageAvailable;
  }

  try {
    const testKey = '__storage_test__';
    const testValue = 'test';
    
    localStorage.setItem(testKey, testValue);
    const retrieved = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);
    
    isStorageAvailable = retrieved === testValue;
    return isStorageAvailable;
  } catch (error) {
    console.warn('localStorage is not available:', error);
    isStorageAvailable = false;
    return false;
  }
}

/**
 * Validate stored closet data structure
 */
function validateStoredCloset(data: any): data is StoredCloset {
  if (!data || typeof data !== 'object') {
    return false;
  }

  // Check required fields
  if (!data.version || !data.items || !Array.isArray(data.items) || typeof data.lastModified !== 'number') {
    return false;
  }

  // Validate each clothing item
  for (const item of data.items) {
    if (!validateClothingItem(item)) {
      return false;
    }
  }

  return true;
}

/**
 * Validate individual clothing item structure
 */
function validateClothingItem(item: any): item is ClothingItem {
  if (!item || typeof item !== 'object') {
    return false;
  }

  return (
    typeof item.id === 'number' &&
    (item.type === 'TOP' || item.type === 'BOTTOM') &&
    typeof item.description === 'string' &&
    typeof item.imageUrl === 'string' &&
    item.description.length > 0 &&
    item.imageUrl.length > 0
  );
}

/**
 * Handle storage errors with appropriate logging and user feedback
 */
function handleStorageError(operation: string, error: any): StorageResult<any> {
  console.error(`Storage ${operation} failed:`, error);
  
  let errorCode = ERROR_CODES.STORAGE_ERROR;
  let errorMessage = `Failed to ${operation} data`;

  if (error?.name === 'QuotaExceededError' || error?.code === 22) {
    errorCode = ERROR_CODES.STORAGE_QUOTA_EXCEEDED;
    errorMessage = 'Storage quota exceeded. Please clear some data and try again.';
  }

  return {
    success: false,
    error: errorMessage,
    errorCode
  };
}

/**
 * Storage operation result interface
 */
interface StorageResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
}

/**
 * Save closet items to localStorage with versioned schema
 */
export function saveClosetItems(items: ClothingItem[]): StorageResult<void> {
  if (!checkStorageAvailability()) {
    return handleStorageError('save', new Error('Storage unavailable'));
  }

  try {
    const closetData: StoredCloset = {
      version: STORAGE_VERSION,
      items: items,
      lastModified: Date.now()
    };

    const serializedData = JSON.stringify(closetData);
    localStorage.setItem(STORAGE_KEYS.CLOSET, serializedData);

    return { success: true };
  } catch (error) {
    return handleStorageError('save', error);
  }
}

/**
 * Load closet items from localStorage with validation and migration support
 */
export function loadClosetItems(): StorageResult<ClothingItem[]> {
  if (!checkStorageAvailability()) {
    return {
      success: true,
      data: [] // Return empty array for graceful degradation
    };
  }

  try {
    const storedData = localStorage.getItem(STORAGE_KEYS.CLOSET);
    
    if (!storedData) {
      return {
        success: true,
        data: []
      };
    }

    const parsedData = JSON.parse(storedData);
    
    if (!validateStoredCloset(parsedData)) {
      console.warn('Invalid stored closet data, clearing storage');
      localStorage.removeItem(STORAGE_KEYS.CLOSET);
      return {
        success: true,
        data: []
      };
    }

    // Handle version migrations if needed
    const migratedData = migrateStoredData(parsedData);
    
    return {
      success: true,
      data: migratedData.items
    };
  } catch (error) {
    console.error('Failed to load closet items:', error);
    // Try to clear corrupted data
    try {
      localStorage.removeItem(STORAGE_KEYS.CLOSET);
    } catch (clearError) {
      console.error('Failed to clear corrupted data:', clearError);
    }
    
    return {
      success: true,
      data: [] // Return empty array for graceful degradation
    };
  }
}

/**
 * Migrate stored data between versions
 */
function migrateStoredData(data: StoredCloset): StoredCloset {
  // Currently only version 1.0.0 exists, but this function
  // provides a framework for future migrations
  
  if (data.version === STORAGE_VERSION) {
    return data;
  }

  // Future migration logic would go here
  console.warn(`Unknown storage version: ${data.version}, using current version`);
  
  return {
    ...data,
    version: STORAGE_VERSION,
    lastModified: Date.now()
  };
}

/**
 * Add new items to existing closet
 */
export function addClosetItems(newItems: Omit<ClothingItem, 'id'>[]): StorageResult<ClothingItem[]> {
  const loadResult = loadClosetItems();
  
  if (!loadResult.success) {
    return loadResult as StorageResult<ClothingItem[]>;
  }

  const existingItems = loadResult.data || [];
  
  // Generate unique IDs for new items
  const maxId = existingItems.length > 0 
    ? Math.max(...existingItems.map(item => item.id))
    : 0;
  
  const itemsWithIds: ClothingItem[] = newItems.map((item, index) => ({
    ...item,
    id: maxId + index + 1
  }));

  const updatedItems = [...existingItems, ...itemsWithIds];
  
  const saveResult = saveClosetItems(updatedItems);
  
  if (!saveResult.success) {
    return saveResult as StorageResult<ClothingItem[]>;
  }

  return {
    success: true,
    data: updatedItems
  };
}

/**
 * Remove item from closet by ID
 */
export function removeClosetItem(itemId: number): StorageResult<ClothingItem[]> {
  const loadResult = loadClosetItems();
  
  if (!loadResult.success) {
    return loadResult as StorageResult<ClothingItem[]>;
  }

  const existingItems = loadResult.data || [];
  const updatedItems = existingItems.filter(item => item.id !== itemId);
  
  const saveResult = saveClosetItems(updatedItems);
  
  if (!saveResult.success) {
    return saveResult as StorageResult<ClothingItem[]>;
  }

  return {
    success: true,
    data: updatedItems
  };
}

/**
 * Clear all closet items
 */
export function clearClosetItems(): StorageResult<void> {
  if (!checkStorageAvailability()) {
    return { success: true }; // Graceful degradation
  }

  try {
    localStorage.removeItem(STORAGE_KEYS.CLOSET);
    return { success: true };
  } catch (error) {
    // If storage is unavailable, still return success for graceful degradation
    if (!checkStorageAvailability()) {
      return { success: true };
    }
    return handleStorageError('clear', error);
  }
}

/**
 * Get storage usage information
 */
export function getStorageInfo(): {
  isAvailable: boolean;
  itemCount: number;
  lastModified: number | null;
  version: string | null;
} {
  const isAvailable = checkStorageAvailability();
  
  if (!isAvailable) {
    return {
      isAvailable: false,
      itemCount: 0,
      lastModified: null,
      version: null
    };
  }

  const loadResult = loadClosetItems();
  
  if (!loadResult.success) {
    return {
      isAvailable: true,
      itemCount: 0,
      lastModified: null,
      version: null
    };
  }

  try {
    const storedData = localStorage.getItem(STORAGE_KEYS.CLOSET);
    if (storedData) {
      const parsedData = JSON.parse(storedData) as StoredCloset;
      return {
        isAvailable: true,
        itemCount: loadResult.data?.length || 0,
        lastModified: parsedData.lastModified,
        version: parsedData.version
      };
    }
  } catch (error) {
    console.error('Failed to get storage info:', error);
  }

  return {
    isAvailable: true,
    itemCount: loadResult.data?.length || 0,
    lastModified: null,
    version: null
  };
}

/**
 * Export storage service interface for testing and external use
 */
export const storageService = {
  saveClosetItems,
  loadClosetItems,
  addClosetItems,
  removeClosetItem,
  clearClosetItems,
  getStorageInfo,
  checkStorageAvailability,
  resetStorageAvailabilityCache
};

export default storageService;