import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ClothingItem } from '../../types';
import { STORAGE_KEYS, STORAGE_VERSION } from '../../constants/types';
import {
  saveClosetItems,
  loadClosetItems,
  addClosetItems,
  clearClosetItems,
  storageService
} from '../storageService';

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

describe('storageService - Basic Functionality', () => {
  beforeEach(() => {
    // Clear localStorage and reset cache before each test
    localStorage.clear();
    storageService.resetStorageAvailabilityCache();
    vi.clearAllMocks();
  });

  describe('basic storage operations', () => {
    it('should save and load closet items', () => {
      // Save items
      const saveResult = saveClosetItems(sampleClothingItems);
      expect(saveResult.success).toBe(true);

      // Load items
      const loadResult = loadClosetItems();
      expect(loadResult.success).toBe(true);
      expect(loadResult.data).toEqual(sampleClothingItems);
    });

    it('should return empty array when no data exists', () => {
      const result = loadClosetItems();
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should add new items to existing closet', () => {
      // First save some items
      saveClosetItems(sampleClothingItems);

      // Add new items
      const newItems = [{
        type: 'TOP' as const,
        description: 'Red sweater',
        imageUrl: 'data:image/jpeg;base64,test'
      }];

      const result = addClosetItems(newItems);
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(3);
      expect(result.data?.[2]).toEqual({
        ...newItems[0],
        id: 3
      });
    });

    it('should clear all items', () => {
      // Save some items first
      saveClosetItems(sampleClothingItems);

      // Clear items
      const clearResult = clearClosetItems();
      expect(clearResult.success).toBe(true);

      // Verify items are cleared
      const loadResult = loadClosetItems();
      expect(loadResult.data).toEqual([]);
    });
  });

  describe('data validation', () => {
    it('should handle corrupted data gracefully', () => {
      // Manually set invalid JSON
      localStorage.setItem(STORAGE_KEYS.CLOSET, 'invalid json');

      const result = loadClosetItems();
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should validate stored data structure', () => {
      // Set invalid data structure
      const invalidData = {
        version: STORAGE_VERSION,
        items: [{ invalid: 'item' }], // Invalid item structure
        lastModified: Date.now()
      };
      
      localStorage.setItem(STORAGE_KEYS.CLOSET, JSON.stringify(invalidData));

      const result = loadClosetItems();
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should handle missing required fields', () => {
      const invalidData = {
        version: STORAGE_VERSION,
        // Missing items and lastModified
      };
      
      localStorage.setItem(STORAGE_KEYS.CLOSET, JSON.stringify(invalidData));

      const result = loadClosetItems();
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });

  describe('storage availability', () => {
    it('should check storage availability', () => {
      const isAvailable = storageService.checkStorageAvailability();
      expect(isAvailable).toBe(true);
    });

    it('should cache availability result', () => {
      const spy = vi.spyOn(Storage.prototype, 'setItem');
      
      // First call
      storageService.checkStorageAvailability();
      const firstCallCount = spy.mock.calls.length;
      
      // Second call should use cached result
      storageService.checkStorageAvailability();
      const secondCallCount = spy.mock.calls.length;
      
      // Should not have made additional calls for the test key
      expect(secondCallCount).toBe(firstCallCount);
      
      spy.mockRestore();
    });
  });

  describe('versioned storage', () => {
    it('should save data with version information', () => {
      saveClosetItems(sampleClothingItems);
      
      const rawData = localStorage.getItem(STORAGE_KEYS.CLOSET);
      expect(rawData).toBeTruthy();
      
      const parsedData = JSON.parse(rawData!);
      expect(parsedData.version).toBe(STORAGE_VERSION);
      expect(parsedData.items).toEqual(sampleClothingItems);
      expect(typeof parsedData.lastModified).toBe('number');
    });

    it('should handle unknown version gracefully', () => {
      const futureVersionData = {
        version: '2.0.0',
        items: sampleClothingItems,
        lastModified: Date.now()
      };
      
      localStorage.setItem(STORAGE_KEYS.CLOSET, JSON.stringify(futureVersionData));

      const result = loadClosetItems();
      expect(result.success).toBe(true);
      expect(result.data).toEqual(sampleClothingItems);
    });
  });
});