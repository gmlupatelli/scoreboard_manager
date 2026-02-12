// Mock bad-words to avoid ESM compatibility issues in Jest
jest.mock('bad-words', () => {
  return {
    Filter: class MockFilter {
      isProfane(text: string): boolean {
        const badWords = ['shit', 'damn', 'fuck', 'ass', 'hell'];
        const lower = text.toLowerCase();
        return badWords.some((word) => lower.includes(word));
      }
    },
  };
});

import { validateDisplayName, resolveDisplayName } from '../supporterUtils';

describe('supporterUtils', () => {
  describe('validateDisplayName', () => {
    it('should accept valid display names', () => {
      expect(validateDisplayName('John Doe')).toBeNull();
      expect(validateDisplayName('Jane')).toBeNull();
      expect(validateDisplayName("O'Brien")).toBeNull();
      expect(validateDisplayName('Mary-Jane')).toBeNull();
      expect(validateDisplayName('Dr. Smith')).toBeNull();
      expect(validateDisplayName('Player123')).toBeNull();
    });

    it('should allow empty display name (falls back to full_name)', () => {
      expect(validateDisplayName('')).toBeNull();
      expect(validateDisplayName('   ')).toBeNull();
    });

    it('should reject names exceeding 50 characters', () => {
      const longName = 'A'.repeat(51);
      expect(validateDisplayName(longName)).toContain('50 characters or less');
    });

    it('should accept names at exactly 50 characters', () => {
      const exactName = 'A'.repeat(50);
      expect(validateDisplayName(exactName)).toBeNull();
    });

    it('should reject names with special characters', () => {
      expect(validateDisplayName('User@Name')).toContain(
        'can only contain letters, numbers, spaces, hyphens'
      );
      expect(validateDisplayName('Name#1')).toContain(
        'can only contain letters, numbers, spaces, hyphens'
      );
      expect(validateDisplayName('Hello!')).toContain(
        'can only contain letters, numbers, spaces, hyphens'
      );
      expect(validateDisplayName('<script>')).toContain(
        'can only contain letters, numbers, spaces, hyphens'
      );
    });

    it('should reject profane display names', () => {
      // The bad-words package filters common profanity
      expect(validateDisplayName('shit')).toContain('inappropriate language');
      expect(validateDisplayName('damn')).toContain('inappropriate language');
    });

    it('should handle trimming properly', () => {
      expect(validateDisplayName('  John  ')).toBeNull();
    });
  });

  describe('resolveDisplayName', () => {
    it('should use supporter_display_name when available', () => {
      expect(resolveDisplayName('CustomName', 'Full Name', 'user@example.com')).toBe('CustomName');
    });

    it('should fall back to full_name when display name is not set', () => {
      expect(resolveDisplayName(null, 'Full Name', 'user@example.com')).toBe('Full Name');
      expect(resolveDisplayName('', 'Full Name', 'user@example.com')).toBe('Full Name');
      expect(resolveDisplayName('   ', 'Full Name', 'user@example.com')).toBe('Full Name');
    });

    it('should fall back to email prefix when neither name is set', () => {
      expect(resolveDisplayName(null, null, 'user@example.com')).toBe('user');
      expect(resolveDisplayName('', '', 'john.doe@example.com')).toBe('john.doe');
      expect(resolveDisplayName(null, '   ', 'hello@world.com')).toBe('hello');
    });

    it('should trim display names', () => {
      expect(resolveDisplayName('  Custom  ', null, 'user@example.com')).toBe('Custom');
      expect(resolveDisplayName(null, '  Full  ', 'user@example.com')).toBe('Full');
    });

    it('should handle undefined values', () => {
      expect(resolveDisplayName(undefined, undefined, 'user@example.com')).toBe('user');
    });
  });
});
