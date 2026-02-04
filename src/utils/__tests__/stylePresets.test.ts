import {
  STYLE_PRESETS,
  CUSTOMIZABLE_PROPERTIES,
  getStylePreset,
  getAppliedScoreboardStyles,
  generateCustomStyles,
} from '../stylePresets';
import { ScoreboardCustomStyles } from '@/types/models';

describe('stylePresets', () => {
  describe('STYLE_PRESETS constant', () => {
    it('should contain all expected presets', () => {
      expect(STYLE_PRESETS).toHaveProperty('light');
      expect(STYLE_PRESETS).toHaveProperty('dark');
      expect(STYLE_PRESETS).toHaveProperty('transparent');
    });

    it('should have all presets with required properties', () => {
      Object.entries(STYLE_PRESETS).forEach(([_name, preset]) => {
        expect(preset).toHaveProperty('backgroundColor');
        expect(preset).toHaveProperty('textColor');
        expect(preset).toHaveProperty('titleTextColor');
        expect(preset).toHaveProperty('headerColor');
        expect(preset).toHaveProperty('headerTextColor');
        expect(preset).toHaveProperty('borderColor');
        expect(preset).toHaveProperty('accentColor');
        expect(preset).toHaveProperty('accentTextColor');
        expect(preset).toHaveProperty('fontFamily');
        expect(preset).toHaveProperty('borderRadius');
      });
    });

    it('light preset uses light colors', () => {
      const light = STYLE_PRESETS.light;
      expect(light.backgroundColor).toBe('#ffffff');
      expect(light.textColor).toBe('#1f2937');
    });

    it('dark preset uses dark colors', () => {
      const dark = STYLE_PRESETS.dark;
      expect(dark.backgroundColor).toBe('#1f2937');
      expect(dark.textColor).toBe('#f9fafb');
    });
  });

  describe('CUSTOMIZABLE_PROPERTIES constant', () => {
    it('should be an array of property configuration objects', () => {
      expect(Array.isArray(CUSTOMIZABLE_PROPERTIES)).toBe(true);
      expect(CUSTOMIZABLE_PROPERTIES.length).toBeGreaterThan(0);
    });

    it('should include common style properties by key', () => {
      const keys = CUSTOMIZABLE_PROPERTIES.map((prop) => prop.key);
      expect(keys).toContain('backgroundColor');
      expect(keys).toContain('textColor');
      expect(keys).toContain('accentColor');
      expect(keys).toContain('fontFamily');
      expect(keys).toContain('borderRadius');
    });

    it('each property should have required metadata', () => {
      CUSTOMIZABLE_PROPERTIES.forEach((prop) => {
        expect(prop).toHaveProperty('key');
        expect(prop).toHaveProperty('label');
        expect(prop).toHaveProperty('type');
        expect(prop).toHaveProperty('description');
        expect(typeof prop.key).toBe('string');
        expect(typeof prop.label).toBe('string');
        expect(typeof prop.type).toBe('string');
      });
    });
  });

  describe('getStylePreset', () => {
    it('should return preset by name', () => {
      const light = getStylePreset('light');
      expect(light).toEqual(STYLE_PRESETS.light);

      const dark = getStylePreset('dark');
      expect(dark).toEqual(STYLE_PRESETS.dark);
    });

    it('should return default (light) for unknown preset', () => {
      const unknown = getStylePreset('unknown-preset');
      expect(unknown).toEqual(STYLE_PRESETS.light);
    });
  });

  describe('getAppliedScoreboardStyles', () => {
    it('should return null when scoreboard is null/undefined', () => {
      expect(getAppliedScoreboardStyles(null)).toBeNull();
      expect(getAppliedScoreboardStyles(undefined)).toBeNull();
    });

    it('should return null when scoreboard has no custom styles', () => {
      const scoreboard = {
        customStyles: null,
        styleScope: 'main' as const,
      };
      expect(getAppliedScoreboardStyles(scoreboard)).toBeNull();
    });

    it('should merge custom styles with preset', () => {
      const scoreboard = {
        customStyles: {
          preset: 'dark',
          backgroundColor: '#ff0000',
          textColor: '#00ff00',
          titleTextColor: '#00ff00',
          headerColor: '#000',
          headerTextColor: '#fff',
          borderColor: '#ccc',
          accentColor: '#ff0000',
          accentTextColor: '#fff',
          fontFamily: 'Arial',
          borderRadius: '4px',
          rowHoverColor: '#eee',
          alternateRowTextColor: '#333',
          rankHighlightColor: '#gold',
          rank1Color: '#gold',
          rank2Color: '#silver',
          rank3Color: '#bronze',
          rank1Icon: 'Trophy',
          rank2Icon: 'Trophy',
          rank3Icon: 'Trophy',
        } as ScoreboardCustomStyles,
        styleScope: 'main' as const,
      };

      const applied = getAppliedScoreboardStyles(scoreboard);
      expect(applied).not.toBeNull();
      expect(applied!.backgroundColor).toBe('#ff0000');
      expect(applied!.textColor).toBe('#00ff00');
    });

    it('should respect styleScope for main context', () => {
      const scoreboard = {
        customStyles: {
          preset: 'light',
          backgroundColor: '#abcdef',
          titleTextColor: '#abcdef',
          headerColor: '#000',
          headerTextColor: '#fff',
          textColor: '#000',
          borderColor: '#ccc',
          accentColor: '#ff0000',
          accentTextColor: '#fff',
          fontFamily: 'Arial',
          borderRadius: '4px',
          rowHoverColor: '#eee',
          alternateRowTextColor: '#333',
          rankHighlightColor: '#gold',
          rank1Color: '#gold',
          rank2Color: '#silver',
          rank3Color: '#bronze',
          rank1Icon: 'Trophy',
          rank2Icon: 'Trophy',
          rank3Icon: 'Trophy',
        } as ScoreboardCustomStyles,
        styleScope: 'embed' as const,
      };

      // Should not apply when scope is 'main' but scoreScope is only 'embed'
      expect(getAppliedScoreboardStyles(scoreboard, 'main')).toBeNull();
      // Should apply when scope is 'embed'
      expect(getAppliedScoreboardStyles(scoreboard, 'embed')).not.toBeNull();
    });

    it('should apply both scopes when styleScope is both', () => {
      const scoreboard = {
        customStyles: {
          preset: 'light',
          backgroundColor: '#abcdef',
          titleTextColor: '#abcdef',
          headerColor: '#000',
          headerTextColor: '#fff',
          textColor: '#000',
          borderColor: '#ccc',
          accentColor: '#ff0000',
          accentTextColor: '#fff',
          fontFamily: 'Arial',
          borderRadius: '4px',
          rowHoverColor: '#eee',
          alternateRowTextColor: '#333',
          rankHighlightColor: '#gold',
          rank1Color: '#gold',
          rank2Color: '#silver',
          rank3Color: '#bronze',
          rank1Icon: 'Trophy',
          rank2Icon: 'Trophy',
          rank3Icon: 'Trophy',
        } as ScoreboardCustomStyles,
        styleScope: 'both' as const,
      };

      expect(getAppliedScoreboardStyles(scoreboard, 'main')).not.toBeNull();
      expect(getAppliedScoreboardStyles(scoreboard, 'embed')).not.toBeNull();
    });
  });

  describe('generateCustomStyles', () => {
    it('should convert custom styles to CSS variables', () => {
      const styles: ScoreboardCustomStyles = {
        preset: 'light',
        backgroundColor: '#ffffff',
        textColor: '#000000',
        headerColor: '#f0f0f0',
        headerTextColor: '#000000',
        borderColor: '#cccccc',
        accentColor: '#ff0000',
        fontFamily: 'Arial',
        borderRadius: '8px',
        rowHoverColor: '#eeeeee',
        alternateRowTextColor: '#333333',
        rankHighlightColor: '#ffff00',
        accentTextColor: '#ffffff',
        titleTextColor: '#000',
        rank1Color: '#ffd700',
        rank2Color: '#c0c0c0',
        rank3Color: '#cd7f32',
        rank1Icon: 'TrophyIcon',
        rank2Icon: 'TrophyIcon',
        rank3Icon: 'TrophyIcon',
      };

      const css = generateCustomStyles(styles) as Record<string, string>;

      expect(css['--embed-bg']).toBe('#ffffff');
      expect(css['--embed-text']).toBe('#000000');
      expect(css['--embed-header']).toBe('#f0f0f0');
      expect(css['--embed-font']).toBe('Arial');
      expect(css['--embed-radius']).toBe('8px');
      expect(css['--embed-rank1-color']).toBe('#ffd700');
      expect(css['--embed-rank2-color']).toBe('#c0c0c0');
      expect(css['--embed-rank3-color']).toBe('#cd7f32');
    });
  });
});
