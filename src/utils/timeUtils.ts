import { TimeFormat } from '@/types/models';

export function parseTimeToMilliseconds(input: string, format: TimeFormat): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  try {
    switch (format) {
      case 'hh:mm': {
        const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
        if (!match) return null;
        const hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);
        if (minutes >= 60) return null;
        return (hours * 3600 + minutes * 60) * 1000;
      }
      case 'hh:mm:ss': {
        const match = trimmed.match(/^(\d{1,2}):(\d{2}):(\d{2})$/);
        if (!match) return null;
        const hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);
        const seconds = parseInt(match[3], 10);
        if (minutes >= 60 || seconds >= 60) return null;
        return (hours * 3600 + minutes * 60 + seconds) * 1000;
      }
      case 'mm:ss': {
        const match = trimmed.match(/^(\d{1,3}):(\d{2})$/);
        if (!match) return null;
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        if (seconds >= 60) return null;
        return (minutes * 60 + seconds) * 1000;
      }
      case 'mm:ss.s': {
        const match = trimmed.match(/^(\d{1,3}):(\d{2})\.(\d)$/);
        if (!match) return null;
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const tenths = parseInt(match[3], 10);
        if (seconds >= 60) return null;
        return (minutes * 60 + seconds) * 1000 + tenths * 100;
      }
      case 'mm:ss.ss': {
        const match = trimmed.match(/^(\d{1,3}):(\d{2})\.(\d{2})$/);
        if (!match) return null;
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const hundredths = parseInt(match[3], 10);
        if (seconds >= 60) return null;
        return (minutes * 60 + seconds) * 1000 + hundredths * 10;
      }
      case 'mm:ss.sss': {
        const match = trimmed.match(/^(\d{1,3}):(\d{2})\.(\d{3})$/);
        if (!match) return null;
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const milliseconds = parseInt(match[3], 10);
        if (seconds >= 60) return null;
        return (minutes * 60 + seconds) * 1000 + milliseconds;
      }
      default:
        return null;
    }
  } catch {
    return null;
  }
}

export function formatMillisecondsToTime(ms: number, format: TimeFormat): string {
  if (ms < 0) ms = 0;
  
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const remainingMs = ms % 1000;

  const pad2 = (n: number) => n.toString().padStart(2, '0');
  const pad3 = (n: number) => n.toString().padStart(3, '0');

  switch (format) {
    case 'hh:mm':
      return `${pad2(hours)}:${pad2(minutes)}`;
    case 'hh:mm:ss':
      return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
    case 'mm:ss': {
      const totalMinutes = hours * 60 + minutes;
      return `${totalMinutes}:${pad2(seconds)}`;
    }
    case 'mm:ss.s': {
      const totalMinutes = hours * 60 + minutes;
      const tenths = Math.floor(remainingMs / 100);
      return `${totalMinutes}:${pad2(seconds)}.${tenths}`;
    }
    case 'mm:ss.ss': {
      const totalMinutes = hours * 60 + minutes;
      const hundredths = Math.floor(remainingMs / 10);
      return `${totalMinutes}:${pad2(seconds)}.${pad2(hundredths)}`;
    }
    case 'mm:ss.sss': {
      const totalMinutes = hours * 60 + minutes;
      return `${totalMinutes}:${pad2(seconds)}.${pad3(remainingMs)}`;
    }
    default:
      return ms.toString();
  }
}

export function getTimeFormatPlaceholder(format: TimeFormat): string {
  switch (format) {
    case 'hh:mm':
      return '00:00';
    case 'hh:mm:ss':
      return '00:00:00';
    case 'mm:ss':
      return '0:00';
    case 'mm:ss.s':
      return '0:00.0';
    case 'mm:ss.ss':
      return '0:00.00';
    case 'mm:ss.sss':
      return '0:00.000';
    default:
      return '';
  }
}

export function getTimeFormatLabel(format: TimeFormat): string {
  switch (format) {
    case 'hh:mm':
      return 'Hours:Minutes (hh:mm)';
    case 'hh:mm:ss':
      return 'Hours:Minutes:Seconds (hh:mm:ss)';
    case 'mm:ss':
      return 'Minutes:Seconds (mm:ss)';
    case 'mm:ss.s':
      return 'Minutes:Seconds.Tenths (mm:ss.s)';
    case 'mm:ss.ss':
      return 'Minutes:Seconds.Hundredths (mm:ss.ss)';
    case 'mm:ss.sss':
      return 'Minutes:Seconds.Milliseconds (mm:ss.sss)';
    default:
      return format;
  }
}

export function formatScoreDisplay(
  score: number,
  scoreType: 'number' | 'time',
  timeFormat?: TimeFormat | null
): string {
  if (scoreType === 'time' && timeFormat) {
    return formatMillisecondsToTime(score, timeFormat);
  }
  return score.toLocaleString();
}
