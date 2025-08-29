import { describe, it, expect, beforeEach } from 'vitest';
import { ClothingItem } from '../../types';
import { storageService } from '../storageService';

describe('storageService - Integration Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    storageService.resetStorageAvailabilityCache();
  });

  it('should handle a complete user workflow', () => {
    // 1. Start with empty closet
    const initialLoad = storageService.loadClosetItems();
    expect(initialLoad.success).toBe(true);
    expect(initialLoad.data).toEqual([]);

    // 2. Add first batch of items
    const firstBatch = [
      {
        type: 'TOP' as const,
        description: 'Blue t-shirt',
        imageUrl: 'data:image/jpeg;base64,shirt'
      },
      {
        type: 'BOTTOM' as const,
        description: 'Black jeans',
        imageUrl: 'data:image/jpeg;base64,jeans'
      }
    ];

    const addResult1 = storageService.addClosetItems(firstBatch);
    expect(addResult1.success).toBe(true);
    expect(addResult1.data).toHaveLength(2);

    // 3. Add second batch of items
    const secondBatch = [
      {
        type: 'TOP' as const,
        description: 'Red sweater',
        imageUrl: 'data:image/jpeg;base64,sweater'
      }
    ];

    const addResult2 = storageService.addClosetItems(secondBatch);
    expect(addResult2.success).toBe(true);
    expect(addResult2.data).toHaveLength(3);

    // 4. Verify persistence by loading again
    const loadAfterAdd = storageService.loadClosetItems();
    expect(loadAfterAdd.success).toBe(true);
    expect(loadAfterAdd.data).toHaveLength(3);

    // 5. Remove an item
    const removeResult = storageService.removeClosetItem(1);
    expect(removeResult.success).toBe(true);
    expect(removeResult.data).toHaveLength(2);

    // 6. Verify removal persisted
    const loadAfterRemove = storageService.loadClosetItems();
    expect(loadAfterRemove.success).toBe(true);
    expect(loadAfterRemove.data).toHaveLength(2);
    expect(loadAfterRemove.data?.find(item => item.id === 1)).toBeUndefined();

    // 7. Get storage info
    const storageInfo = storageService.getStorageInfo();
    expect(storageInfo.isAvailable).toBe(true);
    expect(storageInfo.itemCount).toBe(2);
    expect(storageInfo.version).toBe('1.0.0');
    expect(typeof storageInfo.lastModified).toBe('number');

    // 8. Clear all items
    const clearResult = storageService.clearClosetItems();
    expect(clearResult.success).toBe(true);

    // 9. Verify clearing worked
    const finalLoad = storageService.loadClosetItems();
    expect(finalLoad.success).toBe(true);
    expect(finalLoad.data).toEqual([]);
  });

  it('should maintain data integrity across multiple operations', () => {
    // Add items with specific IDs and verify they're maintained
    const items = [
      { type: 'TOP' as const, description: 'Item 1', imageUrl: 'url1' },
      { type: 'BOTTOM' as const, description: 'Item 2', imageUrl: 'url2' },
      { type: 'TOP' as const, description: 'Item 3', imageUrl: 'url3' }
    ];

    const addResult = storageService.addClosetItems(items);
    expect(addResult.success).toBe(true);
    
    const addedItems = addResult.data!;
    expect(addedItems[0].id).toBe(1);
    expect(addedItems[1].id).toBe(2);
    expect(addedItems[2].id).toBe(3);

    // Remove middle item
    const removeResult = storageService.removeClosetItem(2);
    expect(removeResult.success).toBe(true);
    
    const remainingItems = removeResult.data!;
    expect(remainingItems).toHaveLength(2);
    expect(remainingItems[0].id).toBe(1);
    expect(remainingItems[1].id).toBe(3);

    // Add more items - should get next available ID
    const moreItems = [
      { type: 'BOTTOM' as const, description: 'Item 4', imageUrl: 'url4' }
    ];

    const addMoreResult = storageService.addClosetItems(moreItems);
    expect(addMoreResult.success).toBe(true);
    
    const finalItems = addMoreResult.data!;
    expect(finalItems).toHaveLength(3);
    expect(finalItems[2].id).toBe(4); // Should get next available ID
  });

  it('should handle edge cases gracefully', () => {
    // Try to remove non-existent item
    const removeResult = storageService.removeClosetItem(999);
    expect(removeResult.success).toBe(true);
    expect(removeResult.data).toEqual([]);

    // Add empty array
    const addEmptyResult = storageService.addClosetItems([]);
    expect(addEmptyResult.success).toBe(true);
    expect(addEmptyResult.data).toEqual([]);

    // Clear empty storage
    const clearResult = storageService.clearClosetItems();
    expect(clearResult.success).toBe(true);
  });
});