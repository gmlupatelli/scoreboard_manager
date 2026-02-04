import { safeLocalStorage } from '../localStorage';

describe('localStorage utilities', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('setItem and getItem', () => {
    it('should set and retrieve string values', () => {
      safeLocalStorage.setItem('key1', 'value1');
      expect(safeLocalStorage.getItem('key1')).toBe('value1');
    });

    it('should return null for missing keys', () => {
      expect(safeLocalStorage.getItem('nonexistent')).toBeNull();
    });

    it('should overwrite existing values', () => {
      safeLocalStorage.setItem('key1', 'value1');
      safeLocalStorage.setItem('key1', 'value2');
      expect(safeLocalStorage.getItem('key1')).toBe('value2');
    });

    it('should handle empty strings', () => {
      safeLocalStorage.setItem('empty', '');
      expect(safeLocalStorage.getItem('empty')).toBe('');
    });

    it('should handle special characters', () => {
      const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      safeLocalStorage.setItem('special', special);
      expect(safeLocalStorage.getItem('special')).toBe(special);
    });

    it('should handle very long strings', () => {
      const longString = 'x'.repeat(10000);
      safeLocalStorage.setItem('long', longString);
      expect(safeLocalStorage.getItem('long')).toBe(longString);
    });

    it('should return true on successful set', () => {
      expect(safeLocalStorage.setItem('key', 'value')).toBe(true);
    });

    it('should handle quota exceeded gracefully', () => {
      const originalSetItem = Storage.prototype.setItem;
      jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('Storage full', 'QuotaExceededError');
      });

      const result = safeLocalStorage.setItem('key', 'value');
      expect(result).toBe(false);

      Storage.prototype.setItem = originalSetItem;
    });
  });

  describe('removeItem', () => {
    it('should remove stored items', () => {
      safeLocalStorage.setItem('key1', 'value1');
      safeLocalStorage.removeItem('key1');
      expect(safeLocalStorage.getItem('key1')).toBeNull();
    });

    it('should not error when removing non-existent keys', () => {
      expect(() => safeLocalStorage.removeItem('nonexistent')).not.toThrow();
    });

    it('should return true on successful remove', () => {
      safeLocalStorage.setItem('key', 'value');
      expect(safeLocalStorage.removeItem('key')).toBe(true);
    });

    it('should not affect other keys', () => {
      safeLocalStorage.setItem('key1', 'value1');
      safeLocalStorage.setItem('key2', 'value2');
      safeLocalStorage.removeItem('key1');
      expect(safeLocalStorage.getItem('key2')).toBe('value2');
    });
  });

  describe('getJSON and setJSON', () => {
    interface TestData {
      id: number;
      name: string;
      nested: { value: string };
    }

    it('should serialize and deserialize JSON objects', () => {
      const data: TestData = {
        id: 1,
        name: 'test',
        nested: { value: 'nested' },
      };

      safeLocalStorage.setJSON('data', data);
      const retrieved = safeLocalStorage.getJSON<TestData>('data');
      expect(retrieved).toEqual(data);
    });

    it('should handle JSON arrays', () => {
      const arr = [1, 2, 3, 'test', { key: 'value' }];
      safeLocalStorage.setJSON('array', arr);
      const retrieved = safeLocalStorage.getJSON<typeof arr>('array');
      expect(retrieved).toEqual(arr);
    });

    it('should return null for missing JSON keys', () => {
      expect(safeLocalStorage.getJSON<unknown>('nonexistent')).toBeNull();
    });

    it('should handle null values', () => {
      safeLocalStorage.setJSON('null', null);
      expect(safeLocalStorage.getJSON('null')).toBeNull();
    });

    it('should handle undefined by storing null', () => {
      safeLocalStorage.setJSON('undefined', undefined);
      expect(safeLocalStorage.getJSON('undefined')).toBeNull();
    });

    it('should handle numbers and booleans', () => {
      safeLocalStorage.setJSON('number', 42);
      expect(safeLocalStorage.getJSON<number>('number')).toBe(42);

      safeLocalStorage.setJSON('boolean', true);
      expect(safeLocalStorage.getJSON<boolean>('boolean')).toBe(true);
    });

    it('should handle complex nested structures', () => {
      const complex = {
        users: [
          { id: 1, name: 'Alice', tags: ['admin', 'user'] },
          { id: 2, name: 'Bob', tags: ['user'] },
        ],
        settings: {
          theme: 'dark',
          notifications: { email: true, sms: false },
        },
      };

      safeLocalStorage.setJSON('complex', complex);
      expect(safeLocalStorage.getJSON('complex')).toEqual(complex);
    });

    it('should return null for invalid JSON in localStorage', () => {
      localStorage.setItem('invalid', 'not json');
      expect(safeLocalStorage.getJSON('invalid')).toBeNull();
    });

    it('should handle JSON serialization errors gracefully', () => {
      const circular: Record<string, unknown> = {};
      circular.self = circular;

      expect(safeLocalStorage.setJSON('circular', circular)).toBe(false);
    });
  });

  describe('Integration', () => {
    it('should work with multiple concurrent operations', () => {
      safeLocalStorage.setItem('string1', 'value1');
      safeLocalStorage.setJSON('json1', { key: 'value' });
      safeLocalStorage.setItem('string2', 'value2');
      safeLocalStorage.setJSON('json2', [1, 2, 3]);

      expect(safeLocalStorage.getItem('string1')).toBe('value1');
      expect(safeLocalStorage.getJSON('json1')).toEqual({ key: 'value' });
      expect(safeLocalStorage.getItem('string2')).toBe('value2');
      expect(safeLocalStorage.getJSON('json2')).toEqual([1, 2, 3]);
    });

    it('should handle mixed operations on same key', () => {
      safeLocalStorage.setItem('key', 'string');
      expect(safeLocalStorage.getItem('key')).toBe('string');

      safeLocalStorage.setJSON('key', { obj: true });
      expect(safeLocalStorage.getJSON('key')).toEqual({ obj: true });
      expect(safeLocalStorage.getItem('key')).toBe('{"obj":true}');
    });
  });
});
