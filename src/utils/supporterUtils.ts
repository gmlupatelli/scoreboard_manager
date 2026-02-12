import { Filter } from 'bad-words';

const MAX_DISPLAY_NAME_LENGTH = 50;
const DISPLAY_NAME_PATTERN = /^[a-zA-Z0-9\s\-'.]+$/;

/**
 * Validate a supporter display name.
 * Returns an error message if invalid, or null if valid.
 */
export function validateDisplayName(name: string): string | null {
  const trimmed = name.trim();

  if (trimmed.length === 0) {
    // Empty is allowed (falls back to full_name)
    return null;
  }

  if (trimmed.length > MAX_DISPLAY_NAME_LENGTH) {
    return `Display name must be ${MAX_DISPLAY_NAME_LENGTH} characters or less.`;
  }

  if (!DISPLAY_NAME_PATTERN.test(trimmed)) {
    return 'Display name can only contain letters, numbers, spaces, hyphens, apostrophes, and periods.';
  }

  // Check for names that are only whitespace or special characters
  if (!/[a-zA-Z0-9]/.test(trimmed)) {
    return 'Display name must contain at least one letter or number.';
  }

  // Profanity filter
  const filter = new Filter();
  if (filter.isProfane(trimmed)) {
    return 'Display name contains inappropriate language. Please choose another name.';
  }

  return null;
}

/**
 * Determine the display name for a supporter using the fallback chain:
 * 1. supporter_display_name (if set)
 * 2. full_name (if set)
 * 3. email prefix (part before @)
 */
export function resolveDisplayName(
  supporterDisplayName: string | null | undefined,
  fullName: string | null | undefined,
  email: string
): string {
  if (supporterDisplayName && supporterDisplayName.trim()) {
    return supporterDisplayName.trim();
  }
  if (fullName && fullName.trim()) {
    return fullName.trim();
  }
  return email.split('@')[0];
}
