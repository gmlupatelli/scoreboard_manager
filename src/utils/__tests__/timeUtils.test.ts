import {
  parseTimeToMilliseconds,
  formatScoreDisplay,
  getTimeFormatPlaceholder,
  getTimeFormatLabel,
} from '../timeUtils';
import { TimeFormat } from '@/types/models';

describe('timeUtils', () => {
  describe('parseTimeToMilliseconds', () => {
    it('should parse hh:mm format correctly', () => {
      expect(parseTimeToMilliseconds('01:30', 'hh:mm')).toBe(5400000); // 1.5 hours
      expect(parseTimeToMilliseconds('00:00', 'hh:mm')).toBe(0);
      expect(parseTimeToMilliseconds('12:45', 'hh:mm')).toBe(45900000);
    });

    it('should parse hh:mm:ss format correctly', () => {
      expect(parseTimeToMilliseconds('01:30:45', 'hh:mm:ss')).toBe(5445000);
      expect(parseTimeToMilliseconds('00:00:00', 'hh:mm:ss')).toBe(0);
      expect(parseTimeToMilliseconds('02:00:30', 'hh:mm:ss')).toBe(7230000);
    });

    it('should parse mm:ss format correctly', () => {
      expect(parseTimeToMilliseconds('05:30', 'mm:ss')).toBe(330000); // 5:30
      expect(parseTimeToMilliseconds('0:00', 'mm:ss')).toBe(0);
      expect(parseTimeToMilliseconds('100:59', 'mm:ss')).toBe(6059000);
    });

    it('should parse mm:ss.s format correctly', () => {
      expect(parseTimeToMilliseconds('05:30.5', 'mm:ss.s')).toBe(330500);
      expect(parseTimeToMilliseconds('0:00.0', 'mm:ss.s')).toBe(0);
      expect(parseTimeToMilliseconds('1:23.9', 'mm:ss.s')).toBe(83900);
    });

    it('should parse mm:ss.ss format correctly', () => {
      expect(parseTimeToMilliseconds('05:30.50', 'mm:ss.ss')).toBe(330500);
      expect(parseTimeToMilliseconds('0:00.00', 'mm:ss.ss')).toBe(0);
      expect(parseTimeToMilliseconds('1:23.45', 'mm:ss.ss')).toBe(83450);
    });

    it('should parse mm:ss.sss format correctly', () => {
      expect(parseTimeToMilliseconds('05:30.500', 'mm:ss.sss')).toBe(330500);
      expect(parseTimeToMilliseconds('0:00.000', 'mm:ss.sss')).toBe(0);
      expect(parseTimeToMilliseconds('1:23.456', 'mm:ss.sss')).toBe(83456);
    });

    it('should handle invalid formats gracefully', () => {
      expect(parseTimeToMilliseconds('invalid', 'hh:mm')).toBeNull();
      expect(parseTimeToMilliseconds('00:60', 'mm:ss')).toBeNull(); // Seconds >= 60
      expect(parseTimeToMilliseconds('', 'hh:mm')).toBeNull();
      expect(parseTimeToMilliseconds('   ', 'hh:mm')).toBeNull();
      expect(parseTimeToMilliseconds('12:61', 'hh:mm')).toBeNull(); // Minutes >= 60
    });

    it('should handle edge cases', () => {
      expect(parseTimeToMilliseconds('0:01', 'mm:ss')).toBe(1000);
      expect(parseTimeToMilliseconds('1:00', 'mm:ss')).toBe(60000);
      expect(parseTimeToMilliseconds('00:01', 'hh:mm')).toBe(60000);
    });
  });

  describe('formatScoreDisplay', () => {
    it('should format number scores with locale', () => {
      expect(formatScoreDisplay(1000, 'number')).toBe('1,000');
      expect(formatScoreDisplay(1000000, 'number')).toBe('1,000,000');
      expect(formatScoreDisplay(42, 'number')).toBe('42');
    });

    it('should format time scores using time format', () => {
      expect(formatScoreDisplay(5400000, 'time', 'hh:mm')).toBe('01:30');
      expect(formatScoreDisplay(330000, 'time', 'mm:ss')).toBe('5:30');
      expect(formatScoreDisplay(5445000, 'time', 'hh:mm:ss')).toBe('01:30:45');
      expect(formatScoreDisplay(330500, 'time', 'mm:ss.s')).toBe('5:30.5');
    });

    it('should handle time score without format', () => {
      expect(formatScoreDisplay(1000, 'time')).toBe('1,000');
      expect(formatScoreDisplay(5400000, 'time', null)).toBe('5,400,000');
    });

    it('should handle negative numbers', () => {
      expect(formatScoreDisplay(-1000, 'number')).toBe('-1,000');
      // Time scores should handle negative by showing 0 (formatting converts negatives)
      expect(formatScoreDisplay(-100, 'time', 'hh:mm')).toBe('00:00');
    });
  });

  describe('getTimeFormatPlaceholder', () => {
    it('should return correct placeholders for each format', () => {
      expect(getTimeFormatPlaceholder('hh:mm')).toBe('00:00');
      expect(getTimeFormatPlaceholder('hh:mm:ss')).toBe('00:00:00');
      expect(getTimeFormatPlaceholder('mm:ss')).toBe('0:00');
      expect(getTimeFormatPlaceholder('mm:ss.s')).toBe('0:00.0');
      expect(getTimeFormatPlaceholder('mm:ss.ss')).toBe('0:00.00');
      expect(getTimeFormatPlaceholder('mm:ss.sss')).toBe('0:00.000');
    });

    it('should return empty string for unknown format', () => {
      expect(getTimeFormatPlaceholder('unknown' as TimeFormat)).toBe('');
    });
  });

  describe('getTimeFormatLabel', () => {
    it('should return descriptive labels for each format', () => {
      expect(getTimeFormatLabel('hh:mm')).toBe('Hours:Minutes (hh:mm)');
      expect(getTimeFormatLabel('hh:mm:ss')).toBe('Hours:Minutes:Seconds (hh:mm:ss)');
      expect(getTimeFormatLabel('mm:ss')).toBe('Minutes:Seconds (mm:ss)');
      expect(getTimeFormatLabel('mm:ss.s')).toBe('Minutes:Seconds.Tenths (mm:ss.s)');
      expect(getTimeFormatLabel('mm:ss.ss')).toBe('Minutes:Seconds.Hundredths (mm:ss.ss)');
      expect(getTimeFormatLabel('mm:ss.sss')).toBe('Minutes:Seconds.Milliseconds (mm:ss.sss)');
    });

    it('should return format itself for unknown format', () => {
      const unknownFormat = 'custom' as TimeFormat;
      expect(getTimeFormatLabel(unknownFormat)).toBe('custom');
    });
  });
});
