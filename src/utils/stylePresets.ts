import { ScoreboardCustomStyles } from '@/types/models';

export const STYLE_PRESETS: Record<string, ScoreboardCustomStyles> = {
  light: {
    preset: 'light',
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
    titleTextColor: '#1f2937',
    headerColor: '#f3f4f6',
    headerTextColor: '#374151',
    borderColor: '#e5e7eb',
    accentColor: '#f77174',
    accentTextColor: '#ffffff',
    fontFamily: 'inherit',
    borderRadius: '8px',
    rowHoverColor: '#f9fafb',
    alternateRowTextColor: '#1f2937',
    rankHighlightColor: '#f77174',
    rank1Color: '#ca8a04',
    rank2Color: '#9ca3af',
    rank3Color: '#b45309',
    rank1Icon: 'TrophyIcon',
    rank2Icon: 'TrophyIcon',
    rank3Icon: 'TrophyIcon',
  },
  dark: {
    preset: 'dark',
    backgroundColor: '#1f2937',
    textColor: '#f9fafb',
    titleTextColor: '#f9fafb',
    headerColor: '#374151',
    headerTextColor: '#f9fafb',
    borderColor: '#4b5563',
    accentColor: '#f77174',
    accentTextColor: '#ffffff',
    fontFamily: 'inherit',
    borderRadius: '8px',
    rowHoverColor: '#374151',
    alternateRowTextColor: '#f9fafb',
    rankHighlightColor: '#f77174',
    rank1Color: '#fbbf24',
    rank2Color: '#d1d5db',
    rank3Color: '#f59e0b',
    rank1Icon: 'TrophyIcon',
    rank2Icon: 'TrophyIcon',
    rank3Icon: 'TrophyIcon',
  },
  transparent: {
    preset: 'transparent',
    backgroundColor: 'transparent',
    textColor: '#1f2937',
    titleTextColor: '#1f2937',
    headerColor: 'rgba(243, 244, 246, 0.8)',
    headerTextColor: '#374151',
    borderColor: 'rgba(229, 231, 235, 0.5)',
    accentColor: '#f77174',
    accentTextColor: '#ffffff',
    fontFamily: 'inherit',
    borderRadius: '8px',
    rowHoverColor: 'rgba(249, 250, 251, 0.5)',
    alternateRowTextColor: '#1f2937',
    rankHighlightColor: '#f77174',
    rank1Color: '#ca8a04',
    rank2Color: '#9ca3af',
    rank3Color: '#b45309',
    rank1Icon: 'TrophyIcon',
    rank2Icon: 'TrophyIcon',
    rank3Icon: 'TrophyIcon',
  },
  'high-contrast': {
    preset: 'high-contrast',
    backgroundColor: '#000000',
    textColor: '#ffffff',
    titleTextColor: '#ffff00',
    headerColor: '#1a1a1a',
    headerTextColor: '#ffff00',
    borderColor: '#ffffff',
    accentColor: '#00ff00',
    accentTextColor: '#000000',
    fontFamily: 'inherit',
    borderRadius: '0px',
    rowHoverColor: '#1a1a1a',
    alternateRowTextColor: '#ffffff',
    rankHighlightColor: '#ff0000',
    rank1Color: '#ffd700',
    rank2Color: '#ffffff',
    rank3Color: '#ff6600',
    rank1Icon: 'TrophyIcon',
    rank2Icon: 'TrophyIcon',
    rank3Icon: 'TrophyIcon',
  },
  minimal: {
    preset: 'minimal',
    backgroundColor: '#ffffff',
    textColor: '#333333',
    titleTextColor: '#333333',
    headerColor: '#ffffff',
    headerTextColor: '#666666',
    borderColor: 'transparent',
    accentColor: '#333333',
    accentTextColor: '#ffffff',
    fontFamily: 'inherit',
    borderRadius: '0px',
    rowHoverColor: '#fafafa',
    alternateRowTextColor: '#333333',
    rankHighlightColor: '#333333',
    rank1Color: '#1f2937',
    rank2Color: '#6b7280',
    rank3Color: '#374151',
    rank1Icon: 'TrophyIcon',
    rank2Icon: 'TrophyIcon',
    rank3Icon: 'TrophyIcon',
  },
  custom: {
    preset: 'custom',
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
    titleTextColor: '#1f2937',
    headerColor: '#f3f4f6',
    headerTextColor: '#374151',
    borderColor: '#e5e7eb',
    accentColor: '#f77174',
    accentTextColor: '#ffffff',
    fontFamily: 'inherit',
    borderRadius: '8px',
    rowHoverColor: '#f9fafb',
    alternateRowTextColor: '#1f2937',
    rankHighlightColor: '#f77174',
    rank1Color: '#ca8a04',
    rank2Color: '#9ca3af',
    rank3Color: '#b45309',
    rank1Icon: 'TrophyIcon',
    rank2Icon: 'TrophyIcon',
    rank3Icon: 'TrophyIcon',
  },
};

export const RANK_ICON_OPTIONS = [
  { value: 'TrophyIcon', label: 'Trophy' },
  { value: 'StarIcon', label: 'Star' },
  { value: 'SparklesIcon', label: 'Sparkles' },
  { value: 'FireIcon', label: 'Fire' },
  { value: 'BoltIcon', label: 'Lightning' },
  { value: 'HeartIcon', label: 'Heart' },
  { value: 'CheckBadgeIcon', label: 'Badge' },
  { value: 'GiftIcon', label: 'Gift' },
];

export const PRESET_LABELS: Record<string, string> = {
  light: 'Light (Default)',
  dark: 'Dark',
  transparent: 'Transparent',
  'high-contrast': 'High Contrast',
  minimal: 'Minimal',
  custom: 'Custom',
};

export const PRESET_DESCRIPTIONS: Record<string, string> = {
  light: 'Clean white background with subtle gray accents. Perfect for most websites.',
  dark: 'Dark gray background with light text. Great for dark-themed websites.',
  transparent: 'See-through background that blends with your site. Borders and text remain visible.',
  'high-contrast': 'Maximum contrast for accessibility. Yellow and green on black for easy reading.',
  minimal: 'No borders or shadows. Ultra-clean look that integrates seamlessly.',
  custom: 'Your personalized styles. Edit any property to create your own unique look.',
};

export function getStylePreset(preset: string): ScoreboardCustomStyles {
  return STYLE_PRESETS[preset] || STYLE_PRESETS.light;
}

export function getAppliedScoreboardStyles(
  scoreboard: { customStyles?: ScoreboardCustomStyles | null; styleScope?: 'main' | 'embed' | 'both' } | null | undefined,
  scope: 'main' | 'embed' = 'main'
): ScoreboardCustomStyles | null {
  const lightPreset = getStylePreset('light');
  
  if (!scoreboard?.customStyles) {
    return null;
  }
  
  const shouldApplyStyles = (scoreScope?: 'main' | 'embed' | 'both') => {
    if (scope === 'main') return scoreScope === 'main' || scoreScope === 'both';
    if (scope === 'embed') return scoreScope === 'embed' || scoreScope === 'both' || !scoreScope;
    return false;
  };
  
  if (!shouldApplyStyles(scoreboard.styleScope)) {
    return null;
  }
  
  if (scoreboard.customStyles.preset) {
    const presetStyles = getStylePreset(scoreboard.customStyles.preset);
    return { ...presetStyles, ...scoreboard.customStyles };
  }
  
  return { ...lightPreset, ...scoreboard.customStyles };
}

export function generateCustomStyles(styles: ScoreboardCustomStyles): React.CSSProperties {
  return {
    '--embed-bg': styles.backgroundColor,
    '--embed-text': styles.textColor,
    '--embed-header': styles.headerColor,
    '--embed-header-text': styles.headerTextColor,
    '--embed-border': styles.borderColor,
    '--embed-accent': styles.accentColor,
    '--embed-font': styles.fontFamily,
    '--embed-radius': styles.borderRadius,
    '--embed-row-hover': styles.rowHoverColor,
    '--embed-rank-highlight': styles.rankHighlightColor,
    '--embed-rank1-color': styles.rank1Color,
    '--embed-rank2-color': styles.rank2Color,
    '--embed-rank3-color': styles.rank3Color,
  } as React.CSSProperties;
}

export const CUSTOMIZABLE_PROPERTIES = [
  {
    key: 'backgroundColor',
    label: 'Background Color',
    type: 'color',
    description: 'The main background color of the scoreboard',
  },
  {
    key: 'textColor',
    label: 'Text Color',
    type: 'color',
    description: 'Primary text color for names and general content',
  },
  {
    key: 'titleTextColor',
    label: 'Title Text Color',
    type: 'color',
    description: 'Text color for scoreboard title, description, and labels',
  },
  {
    key: 'headerColor',
    label: 'Header Background',
    type: 'color',
    description: 'Background color of the table header row',
  },
  {
    key: 'headerTextColor',
    label: 'Header Text Color',
    type: 'color',
    description: 'Text color in the table header',
  },
  {
    key: 'borderColor',
    label: 'Border Color',
    type: 'color',
    description: 'Color of borders and dividers',
  },
  {
    key: 'accentColor',
    label: 'Accent Color',
    type: 'color',
    description: 'Used for scores and interactive elements',
  },
  {
    key: 'accentTextColor',
    label: 'Accent Text Color',
    type: 'color',
    description: 'Text color inside accent-colored elements (badges, buttons)',
  },
  {
    key: 'rowHoverColor',
    label: 'Alternate Row Color',
    type: 'color',
    description: 'Background for alternating table rows',
  },
  {
    key: 'alternateRowTextColor',
    label: 'Alternate Row Text Color',
    type: 'color',
    description: 'Text color for alternating table rows',
  },
  {
    key: 'fontFamily',
    label: 'Font Family',
    type: 'select',
    options: [
      { value: 'inherit', label: 'Default (Inherit from site)' },
      { value: 'Inter, sans-serif', label: 'Inter' },
      { value: 'Arial, sans-serif', label: 'Arial' },
      { value: 'Georgia, serif', label: 'Georgia' },
      { value: '"Courier New", monospace', label: 'Courier New' },
      { value: '"Roboto", sans-serif', label: 'Roboto' },
    ],
    description: 'The font used for all text in the scoreboard',
  },
  {
    key: 'borderRadius',
    label: 'Corner Roundness',
    type: 'select',
    options: [
      { value: '0px', label: 'Sharp (0px)' },
      { value: '4px', label: 'Subtle (4px)' },
      { value: '8px', label: 'Rounded (8px)' },
      { value: '12px', label: 'More Rounded (12px)' },
      { value: '16px', label: 'Very Rounded (16px)' },
    ],
    description: 'How round the corners of the scoreboard should be',
  },
];

export const RANK_CUSTOMIZATION_PROPERTIES = [
  {
    rank: 1,
    colorKey: 'rank1Color',
    iconKey: 'rank1Icon',
    label: '1st Place (Gold)',
    defaultColor: '#ca8a04',
  },
  {
    rank: 2,
    colorKey: 'rank2Color',
    iconKey: 'rank2Icon',
    label: '2nd Place (Silver)',
    defaultColor: '#9ca3af',
  },
  {
    rank: 3,
    colorKey: 'rank3Color',
    iconKey: 'rank3Icon',
    label: '3rd Place (Bronze)',
    defaultColor: '#b45309',
  },
];
