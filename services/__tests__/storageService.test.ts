import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ClothingItem } from '../../types';
import { STORAGE_KEYS, STORAGE_VERSION, ERROR_CODES } from '../../constants/types';
import {
  saveClosetItems,
  loadClosetItems,
  addClosetItems,
  removeClosetItem,
  clearClosetItems,
  getStorageInfo,
  storageService
} from '../storageService';

// Mock localStorage
const createLocalStorageMock = () => {
  let store: Record<string, string> = {};
  
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
    _store: store // For direct access in tests
  };
};

// Mock console methods
const consoleMock = {
  warn: vi.fn(),
  error: vi.fn()
};

// Sample test data
const sampleClothingItems: ClothingItem[] = [
  {
    id: 1,
    type: 'TOP',
    description: 'Blue cotton t-shirt',
    imageUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...'
  },
  {
    id: 2,
    type: 'BOTTOM',
    description: 'Black jeans',
    imageUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...'
  }
];

const sampleNewItems: Omit<ClothingItem, 'id'>[] = [
  {
    type: 'TOP',
    description: 'Red sweater',
    imageUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...'
  }
];

describe('storageService', () => {
  let localStorageMock: ReturnType<typeof createLocalStorageMock>;

  beforeEach(() => {
    // Create fresh mock for each test
    localStorageMock = createLocalStorageMock();
    
    // Setup mocks
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true
    });
    
    Object.defineProperty(console, 'warn', {
      value: consoleMock.warn,
      writable: true,
      configurable: true
    });
    
    Object.defineProperty(console, 'error', {
      value: consoleMock.error,
      writable: true,
      configurable: true
    });
    
    // Clear all mocks and reset storage cache
    vi.clearAllMocks();
    storageService.resetStorageAvailabilityCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('checkStorageAvailability', () => {
    it('should return true when localStorage is available', () => {
      const result = storageService.checkStorageAvailability();
      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('__storage_test__', 'test');
      expect(localStorageMock.getItem).toHaveBeenCalledWith('__storage_test__');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('__storage_test__');
    });

    it('should return false when localStorage throws an error', () => {
      // Reset cache first
      storageService.resetStorageAvailabilityCache();
      
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage not available');
      });

      const result = storageService.checkStorageAvailability();
      expect(result).toBe(false);
      expect(consoleMock.warn).toHaveBeenCalledWith(
        'localStorage is not available:',
        expect.any(Error)
      );
    });

    it('should cache the availability result', () => {
      // Reset cache to ensure clean state
      storageService.resetStorageAvailabilityCache();
      
      // First call
      storageService.checkStorageAvailability();
      // Second call should not test again
      storageService.checkStorageAvailability();
      
      expect(localStorageMock.setItem).toHaveBeenCalledTimes(1);
    });
  });

  describe('saveClosetItems', () => {
    it('should save closet items successfully', () => {
      const result = saveClosetItems(sampleClothingItems);
      
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.CLOSET,
        expect.stringContaining('"version":"1.0.0"')
      );
    });

    it('should handle storage quota exceeded error', () => {
      // Reset cache and setup working storage first
      storageService.resetStorageAvailabilityCache();
      
      // Make setItem fail only for the actual save, not the availability check
      localStorageMock.setItem.mockImplementation((key: string) => {
        if (key === STORAGE_KEYS.CLOSET) {
          const error = new Error('Quota exceeded');
          error.name = 'QuotaExceededError';
          throw error;
        }
        // Allow the availability check to pass
        return;
      });

      const result = saveClosetItems(sampleClothingItems);
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe(ERROR_CODES.STORAGE_QUOTA_EXCEEDED);
      expect(result.error).toContain('Storage quota exceeded');
    });

    it('should handle general storage errors', () => {
      // Reset cache and setup working storage first
      storageService.resetStorageAvailabilityCache();
      
      // Make setItem fail only for the actual save, not the availability check
      localStorageMock.setItem.mockImplementation((key: string) => {
        if (key === STORAGE_KEYS.CLOSET) {
          throw new Error('Storage error');
        }
        // Allow the availability check to pass
        return;
      });

      const result = saveClosetItems(sampleClothingItems);
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe(ERROR_CODES.STORAGE_ERROR);
      expect(consoleMock.error).toHaveBeenCalled();
    });
  });

  describe('loadClosetItems', () => {
    it('should load closet items successfully', () => {
      const storedData = {
        version: STORAGE_VERSION,
        items: sampleClothingItems,
        lastModified: Date.now()
      };
      
      // Set up the mock to return data for the closet key
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === STORAGE_KEYS.CLOSET) {
          return JSON.stringify(storedData);
        }
        return null;
      });

      const result = loadClosetItems();
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(sampleClothingItems);
    });

    it('should return empty array when no data exists', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = loadClosetItems();
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should handle corrupted data gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');

      const result = loadClosetItems();
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
      expect(consoleMock.error).toHaveBeenCalled();
    });

    it('should validate and clear invalid stored data', () => {
      const invalidData = {
        version: STORAGE_VERSION,
        items: [{ invalid: 'item' }], // Invalid item structure
        lastModified: Date.now()
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(invalidData));

      const result = loadClosetItems();
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
      expect(consoleMock.warn).toHaveBeenCalledWith(
        'Invalid stored closet data, clearing storage'
      );
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.CLOSET);
    });

    it('should handle missing required fields in stored data', () => {
      const invalidData = {
        version: STORAGE_VERSION,
        // Missing items and lastModified
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(invalidData));

      const result = loadClosetItems();
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.CLOSET);
    });

    it('should gracefully degrade when storage is unavailable', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage not available');
      });

      const result = loadClosetItems();
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });

  describe('addClosetItems', () => {
    it('should add new items to existing closet', () => {
      // Setup existing items
      const existingData = {
        version: STORAGE_VERSION,
        items: sampleClothingItems,
        lastModified: Date.now()
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingData));

      const result = addClosetItems(sampleNewItems);
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(3);
      expect(result.data?.[2]).toEqual({
        ...sampleNewItems[0],
        id: 3 // Should get next available ID
      });
    });

    it('should add items to empty closet', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = addClosetItems(sampleNewItems);
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0]).toEqual({
        ...sampleNewItems[0],
        id: 1
      });
    });

    it('should handle load errors', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Load error');
      });

      const result = addClosetItems(sampleNewItems);
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('removeClosetItem', () => {
    beforeEach(() => {
      const existingData = {
        version: STORAGE_VERSION,
        items: sampleClothingItems,
        lastModified: Date.now()
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingData));
    });

    it('should remove item by ID', () => {
      const result = removeClosetItem(1);
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].id).toBe(2);
    });

    it('should handle non-existent item ID', () => {
      const result = removeClosetItem(999);
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2); // No items removed
    });
  });

  describe('clearClosetItems', () => {
    it('should clear all items successfully', () => {
      const result = clearClosetItems();
      
      expect(result.success).toBe(true);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.CLOSET);
    });

    it('should handle storage errors gracefully', () => {
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('Remove error');
      });

      const result = clearClosetItems();
      
      expect(result.success).toBe(false);
      expect(consoleMock.error).toHaveBeenCalled();
    });

    it('should gracefully degrade when storage is unavailable', () => {
      // Reset cache and make storage unavailable
      storageService.resetStorageAvailabilityCache();
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage not available');
      });

      const result = clearClosetItems();
      
      expect(result.success).toBe(true); // Graceful degradation
    });
  });

  describe('getStorageInfo', () => {
    it('should return storage information when available', () => {
      const testData = {
        version: STORAGE_VERSION,
        items: sampleClothingItems,
        lastModified: 1234567890
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(testData));

      const info = getStorageInfo();
      
      expect(info.isAvailable).toBe(true);
      expect(info.itemCount).toBe(2);
      expect(info.lastModified).toBe(1234567890);
      expect(info.version).toBe(STORAGE_VERSION);
    });

    it('should handle unavailable storage', () => {
      // Reset cache and make storage unavailable
      storageService.resetStorageAvailabilityCache();
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage not available');
      });

      const info = getStorageInfo();
      
      expect(info.isAvailable).toBe(false);
      expect(info.itemCount).toBe(0);
      expect(info.lastModified).toBe(null);
      expect(info.version).toBe(null);
    });

    it('should handle empty storage', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const info = getStorageInfo();
      
      expect(info.isAvailable).toBe(true);
      expect(info.itemCount).toBe(0);
      expect(info.lastModified).toBe(null);
      expect(info.version).toBe(null);
    });
  });

  describe('data validation', () => {
    it('should reject items with invalid types', () => {
      const invalidData = {
        version: STORAGE_VERSION,
        items: [{
          id: 1,
          type: 'INVALID_TYPE', // Invalid type
          description: 'Test item',
          imageUrl: 'data:image/jpeg;base64,test'
        }],
        lastModified: Date.now()
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(invalidData));

      const result = loadClosetItems();
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.CLOSET);
    });

    it('should reject items with missing required fields', () => {
      const invalidData = {
        version: STORAGE_VERSION,
        items: [{
          id: 1,
          type: 'TOP',
          // Missing description and imageUrl
        }],
        lastModified: Date.now()
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(invalidData));

      const result = loadClosetItems();
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should reject items with empty strings', () => {
      const invalidData = {
        version: STORAGE_VERSION,
        items: [{
          id: 1,
          type: 'TOP',
          description: '', // Empty description
          imageUrl: 'data:image/jpeg;base64,test'
        }],
        lastModified: Date.now()
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(invalidData));

      const result = loadClosetItems();
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });
});