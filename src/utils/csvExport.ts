/**
 * CSV Export utilities for scoreboard data.
 * Handles CSV escaping, filename sanitization, and CSV content generation.
 */

/**
 * Escape a value for safe inclusion in a CSV cell.
 * Wraps in double quotes and escapes internal quotes if the value contains
 * commas, double quotes, or newlines.
 */
export function escapeCSV(value: string | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Sanitize a scoreboard title for use in a filename.
 * Converts to lowercase kebab-case, removes special characters, limits length.
 */
export function sanitizeFilename(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Collapse multiple hyphens
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .slice(0, 80); // Limit length
}

/**
 * Generate a descriptive filename for a CSV export.
 * Format: scoreboard-[sanitized-title]-[YYYY-MM-DD].csv
 */
export function generateFilename(title: string): string {
  const sanitized = sanitizeFilename(title);
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return `scoreboard-${sanitized || 'export'}-${date}.csv`;
}

interface CSVScoreboardData {
  title: string;
  description: string | null | undefined;
  scoreType: string;
  timeFormat: string | null | undefined;
  sortOrder: string;
  visibility: string;
  createdAt: string;
}

interface CSVEntryData {
  name: string;
  score: number;
  details: string | null | undefined;
  created_at: string;
  updated_at: string;
}

/**
 * Generate full CSV content for a scoreboard export.
 * Includes metadata header section, separator, and entry rows.
 */
export function generateCSVContent(scoreboard: CSVScoreboardData, entries: CSVEntryData[]): string {
  const lines = [
    `Scoreboard Title,${escapeCSV(scoreboard.title)}`,
    `Description,${escapeCSV(scoreboard.description)}`,
    `Score Type,${scoreboard.scoreType}`,
    `Time Format,${escapeCSV(scoreboard.timeFormat)}`,
    `Sort Order,${scoreboard.sortOrder}`,
    `Visibility,${scoreboard.visibility}`,
    `Created,${scoreboard.createdAt}`,
    `Total Entries,${entries.length}`,
    '', // Empty line separator
    'Name,Score,Details,Created At,Updated At', // Header row
    ...entries.map(
      (entry) =>
        `${escapeCSV(entry.name)},${entry.score},${escapeCSV(entry.details)},${entry.created_at},${entry.updated_at}`
    ),
  ];

  return lines.join('\n');
}
