/**
 * Safe localStorage wrapper with error handling
 * Handles QuotaExceededError and other localStorage failures gracefully
 */

export const safeLocalStorage = {
  /**
   * Safely get an item from localStorage
   * @param key - The localStorage key
   * @returns The stored value or null if not found/error
   */
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;

    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error(`localStorage.getItem failed for key "${key}":`, error);
      return null;
    }
  },

  /**
   * Safely set an item in localStorage
   * @param key - The localStorage key
   * @param value - The value to store
   * @returns true if successful, false otherwise
   */
  setItem: (key: string, value: string): boolean => {
    if (typeof window === 'undefined') return false;

    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.error('localStorage quota exceeded. Consider clearing old data.');
      } else {
        console.error(`localStorage.setItem failed for key "${key}":`, error);
      }
      return false;
    }
  },

  /**
   * Safely remove an item from localStorage
   * @param key - The localStorage key
   * @returns true if successful, false otherwise
   */
  removeItem: (key: string): boolean => {
    if (typeof window === 'undefined') return false;

    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`localStorage.removeItem failed for key "${key}":`, error);
      return false;
    }
  },

  /**
   * Safely parse JSON from localStorage
   * @param key - The localStorage key
   * @returns Parsed object or null if not found/invalid JSON
   */
  getJSON: <T>(key: string): T | null => {
    const value = safeLocalStorage.getItem(key);
    if (!value) return null;

    try {
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`Failed to parse JSON for key "${key}":`, error);
      return null;
    }
  },

  /**
   * Safely stringify and store JSON in localStorage
   * @param key - The localStorage key
   * @param value - The value to stringify and store
   * @returns true if successful, false otherwise
   */
  setJSON: <T>(key: string, value: T): boolean => {
    try {
      const jsonString = JSON.stringify(value);
      return safeLocalStorage.setItem(key, jsonString);
    } catch (error) {
      console.error(`Failed to stringify value for key "${key}":`, error);
      return false;
    }
  },
};
