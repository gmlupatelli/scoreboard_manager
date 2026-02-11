import { escapeCSV, sanitizeFilename, generateFilename, generateCSVContent } from '../csvExport';

describe('csvExport', () => {
  describe('escapeCSV', () => {
    it('should return empty string for null', () => {
      expect(escapeCSV(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(escapeCSV(undefined)).toBe('');
    });

    it('should return plain string when no special characters', () => {
      expect(escapeCSV('hello world')).toBe('hello world');
    });

    it('should wrap in quotes and escape when value contains comma', () => {
      expect(escapeCSV('hello, world')).toBe('"hello, world"');
    });

    it('should wrap in quotes and escape when value contains double quote', () => {
      expect(escapeCSV('say "hello"')).toBe('"say ""hello"""');
    });

    it('should wrap in quotes when value contains newline', () => {
      expect(escapeCSV('line1\nline2')).toBe('"line1\nline2"');
    });

    it('should handle value with both commas and quotes', () => {
      expect(escapeCSV('name "test", value')).toBe('"name ""test"", value"');
    });

    it('should handle empty string', () => {
      expect(escapeCSV('')).toBe('');
    });

    it('should handle numeric value coerced to string', () => {
      expect(escapeCSV('42')).toBe('42');
    });
  });

  describe('sanitizeFilename', () => {
    it('should convert to lowercase kebab-case', () => {
      expect(sanitizeFilename('My Scoreboard')).toBe('my-scoreboard');
    });

    it('should remove special characters', () => {
      expect(sanitizeFilename("John's High Scores!")).toBe('johns-high-scores');
    });

    it('should handle parentheses and numbers', () => {
      expect(sanitizeFilename('Team Rankings (2026)')).toBe('team-rankings-2026');
    });

    it('should collapse multiple hyphens', () => {
      expect(sanitizeFilename('hello   ---   world')).toBe('hello-world');
    });

    it('should remove leading and trailing hyphens', () => {
      expect(sanitizeFilename('---test---')).toBe('test');
    });

    it('should truncate to 80 characters', () => {
      const longTitle = 'a'.repeat(100);
      expect(sanitizeFilename(longTitle).length).toBe(80);
    });

    it('should handle empty string', () => {
      expect(sanitizeFilename('')).toBe('');
    });

    it('should handle all-special-character string', () => {
      expect(sanitizeFilename('!@#$%^&*()')).toBe('');
    });
  });

  describe('generateFilename', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-02-11T12:00:00.000Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should generate correct filename with title and date', () => {
      expect(generateFilename('My Scoreboard')).toBe('scoreboard-my-scoreboard-2026-02-11.csv');
    });

    it('should sanitize special characters in title', () => {
      expect(generateFilename("John's High Scores!")).toBe(
        'scoreboard-johns-high-scores-2026-02-11.csv'
      );
    });

    it('should use "export" fallback for empty/all-special titles', () => {
      expect(generateFilename('!@#$')).toBe('scoreboard-export-2026-02-11.csv');
    });

    it('should handle normal title with numbers', () => {
      expect(generateFilename('Team Rankings 2026')).toBe(
        'scoreboard-team-rankings-2026-2026-02-11.csv'
      );
    });
  });

  describe('generateCSVContent', () => {
    const baseScoreboard = {
      title: 'Test Scoreboard',
      description: 'A test description',
      scoreType: 'number',
      timeFormat: null,
      sortOrder: 'desc',
      visibility: 'public',
      createdAt: '2026-02-01T10:00:00.000Z',
    };

    const sampleEntries = [
      {
        name: 'Alice',
        score: 100,
        details: 'First place',
        created_at: '2026-02-01T10:00:00.000Z',
        updated_at: '2026-02-01T10:00:00.000Z',
      },
      {
        name: 'Bob',
        score: 85,
        details: null,
        created_at: '2026-02-02T10:00:00.000Z',
        updated_at: '2026-02-02T10:00:00.000Z',
      },
    ];

    it('should generate CSV with metadata and entries', () => {
      const csv = generateCSVContent(baseScoreboard, sampleEntries);
      const lines = csv.split('\n');

      expect(lines[0]).toBe('Scoreboard Title,Test Scoreboard');
      expect(lines[1]).toBe('Description,A test description');
      expect(lines[2]).toBe('Score Type,number');
      expect(lines[3]).toBe('Time Format,');
      expect(lines[4]).toBe('Sort Order,desc');
      expect(lines[5]).toBe('Visibility,public');
      expect(lines[6]).toBe('Created,2026-02-01T10:00:00.000Z');
      expect(lines[7]).toBe('Total Entries,2');
      expect(lines[8]).toBe(''); // Empty separator
      expect(lines[9]).toBe('Name,Score,Details,Created At,Updated At');
      expect(lines[10]).toBe(
        'Alice,100,First place,2026-02-01T10:00:00.000Z,2026-02-01T10:00:00.000Z'
      );
      expect(lines[11]).toBe('Bob,85,,2026-02-02T10:00:00.000Z,2026-02-02T10:00:00.000Z');
    });

    it('should handle empty entries array', () => {
      const csv = generateCSVContent(baseScoreboard, []);
      const lines = csv.split('\n');

      expect(lines[7]).toBe('Total Entries,0');
      expect(lines[9]).toBe('Name,Score,Details,Created At,Updated At');
      expect(lines.length).toBe(10); // No entry rows
    });

    it('should escape entries with special characters', () => {
      const entries = [
        {
          name: "O'Brien, Jr.",
          score: 50,
          details: 'Has "quotes" and, commas',
          created_at: '2026-02-01T10:00:00.000Z',
          updated_at: '2026-02-01T10:00:00.000Z',
        },
      ];
      const csv = generateCSVContent(baseScoreboard, entries);
      const lines = csv.split('\n');

      expect(lines[10]).toBe(
        '"O\'Brien, Jr.",50,"Has ""quotes"" and, commas",2026-02-01T10:00:00.000Z,2026-02-01T10:00:00.000Z'
      );
    });

    it('should escape scoreboard metadata with special characters', () => {
      const scoreboard = {
        ...baseScoreboard,
        title: 'Scores, "Best" Team',
        description: 'A description with\nnewlines',
      };
      const csv = generateCSVContent(scoreboard, []);
      const lines = csv.split('\n');

      // Title and description should be properly escaped
      expect(lines[0]).toContain('"Scores, ""Best"" Team"');
    });

    it('should handle time format scoreboard metadata', () => {
      const scoreboard = {
        ...baseScoreboard,
        scoreType: 'time',
        timeFormat: 'mm:ss.sss',
      };
      const csv = generateCSVContent(scoreboard, []);
      const lines = csv.split('\n');

      expect(lines[2]).toBe('Score Type,time');
      expect(lines[3]).toBe('Time Format,mm:ss.sss');
    });

    it('should handle null description', () => {
      const scoreboard = {
        ...baseScoreboard,
        description: null,
      };
      const csv = generateCSVContent(scoreboard, []);
      const lines = csv.split('\n');

      expect(lines[1]).toBe('Description,');
    });
  });
});
