/**
 * Example usage of the storage service
 * This file demonstrates how to use the localStorage service in the application
 */

import { ClothingItem } from '../types';
import { storageService } from './storageService';

// Example: Loading closet items when the app starts
export function initializeCloset(): ClothingItem[] {
  const result = storageService.loadClosetItems();
  
  if (result.success) {
    console.log(`Loaded ${result.data?.length || 0} items from storage`);
    return result.data || [];
  } else {
    console.warn('Failed to load closet items:', result.error);
    return [];
  }
}

// Example: Adding new clothing items to the closet
export function addClothingItems(newItems: Omit<ClothingItem, 'id'>[]): ClothingItem[] | null {
  const result = storageService.addClosetItems(newItems);
  
  if (result.success) {
    console.log(`Successfully added ${newItems.length} items to closet`);
    return result.data || [];
  } else {
    console.error('Failed to add items to closet:', result.error);
    // Show user-friendly error message
    if (result.errorCode === 'STORAGE_QUOTA_EXCEEDED') {
      alert('Storage is full. Please remove some items and try again.');
    } else if (result.errorCode === 'STORAGE_UNAVAILABLE') {
      alert('Storage is not available. Items will not be saved between sessions.');
    } else {
      alert('Failed to save items. Please try again.');
    }
    return null;
  }
}

// Example: Removing a clothing item
export function removeClothingItem(itemId: number): ClothingItem[] | null {
  const result = storageService.removeClosetItem(itemId);
  
  if (result.success) {
    console.log(`Successfully removed item ${itemId}`);
    return result.data || [];
  } else {
    console.error('Failed to remove item:', result.error);
    alert('Failed to remove item. Please try again.');
    return null;
  }
}

// Example: Clearing all items (with confirmation)
export function clearAllItems(): boolean {
  if (!confirm('Are you sure you want to remove all items from your closet?')) {
    return false;
  }
  
  const result = storageService.clearClosetItems();
  
  if (result.success) {
    console.log('Successfully cleared all items');
    return true;
  } else {
    console.error('Failed to clear items:', result.error);
    alert('Failed to clear items. Please try again.');
    return false;
  }
}

// Example: Getting storage information for debugging or user info
export function getStorageStatus(): {
  available: boolean;
  itemCount: number;
  lastModified: string | null;
} {
  const info = storageService.getStorageInfo();
  
  return {
    available: info.isAvailable,
    itemCount: info.itemCount,
    lastModified: info.lastModified ? new Date(info.lastModified).toLocaleString() : null
  };
}

// Example: Error handling wrapper for storage operations
export function withStorageErrorHandling<T>(
  operation: () => T,
  errorMessage: string = 'Storage operation failed'
): T | null {
  try {
    return operation();
  } catch (error) {
    console.error(errorMessage, error);
    
    // Check if storage is available
    if (!storageService.checkStorageAvailability()) {
      alert('Storage is not available. Data will not persist between sessions.');
    } else {
      alert(`${errorMessage}. Please try again.`);
    }
    
    return null;
  }
}

// Example: React hook for using storage service
export function useClosetStorage() {
  const loadItems = () => initializeCloset();
  
  const addItems = (items: Omit<ClothingItem, 'id'>[]) => 
    withStorageErrorHandling(
      () => addClothingItems(items),
      'Failed to add items to closet'
    );
  
  const removeItem = (id: number) => 
    withStorageErrorHandling(
      () => removeClothingItem(id),
      'Failed to remove item from closet'
    );
  
  const clearAll = () => 
    withStorageErrorHandling(
      () => clearAllItems(),
      'Failed to clear closet'
    );
  
  const getStatus = () => getStorageStatus();
  
  return {
    loadItems,
    addItems,
    removeItem,
    clearAll,
    getStatus
  };
}