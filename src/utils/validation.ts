/**
 * Validation utilities for data format checking
 */

// UUID validation regex (RFC 4122 compliant)
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validates if a string is a valid UUID format (RFC 4122)
 * @param id - String to validate
 * @returns true if valid UUID, false otherwise
 */
export const isValidUUID = (id: string): boolean => {
  return UUID_REGEX.test(id);
};

/**
 * Sanitizes a UUID by validating format and returning it if valid, or null if invalid
 * @param id - UUID string to sanitize
 * @returns The UUID if valid, null otherwise
 */
export const sanitizeUUID = (id: string | null | undefined): string | null => {
  if (!id) return null;
  return isValidUUID(id) ? id : null;
};
