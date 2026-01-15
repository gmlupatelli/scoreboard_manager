'use client';

import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';
import ColorPicker from '@/components/ui/ColorPicker';
import { ScoreboardCustomStyles } from '@/types/models';
import { safeLocalStorage } from '@/utils/localStorage';
import {
  STYLE_PRESETS,
  PRESET_LABELS,
  PRESET_DESCRIPTIONS,
  CUSTOMIZABLE_PROPERTIES,
  RANK_CUSTOMIZATION_PROPERTIES,
  RANK_ICON_OPTIONS,
  getStylePreset,
} from '@/utils/stylePresets';

interface StyleCustomizationSectionProps {
  currentStyles: ScoreboardCustomStyles | null | undefined;
  currentScope: 'main' | 'embed' | 'both';
  onSave: (styles: ScoreboardCustomStyles, scope: 'main' | 'embed' | 'both') => Promise<void>;
  isSaving: boolean;
  scoreboardId?: string;
  isExpanded: boolean;
  onToggleExpanded: (expanded: boolean) => void;
}

export default function StyleCustomizationSection({
  currentStyles,
  currentScope,
  onSave,
  isSaving,
  scoreboardId,
  isExpanded,
  onToggleExpanded,
}: StyleCustomizationSectionProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>(currentStyles?.preset || 'light');
  const [customStyles, setCustomStyles] = useState<ScoreboardCustomStyles>(
    currentStyles || getStylePreset('light')
  );
  const [scope, setScope] = useState<'main' | 'embed' | 'both'>(currentScope || 'both');
  const [hasChanges, setHasChanges] = useState(false);

  // Helper to get localStorage key for this scoreboard's custom styles
  const getCustomStylesKey = () => `scoreboard_custom_styles_${scoreboardId || 'default'}`;

  // Load custom styles from localStorage
  const loadCustomStylesFromCache = (): ScoreboardCustomStyles | null => {
    return safeLocalStorage.getJSON<ScoreboardCustomStyles>(getCustomStylesKey());
  };

  // Save custom styles to localStorage
  const saveCustomStylesToCache = (styles: ScoreboardCustomStyles) => {
    safeLocalStorage.setJSON(getCustomStylesKey(), styles);
  };

  useEffect(() => {
    if (currentStyles) {
      setSelectedPreset(currentStyles.preset || 'light');
      setCustomStyles(currentStyles);
    }
    if (currentScope) {
      setScope(currentScope);
    }
  }, [currentStyles, currentScope]);

  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset);

    // If selecting 'custom', try to load from localStorage first
    if (preset === 'custom') {
      const cachedCustom = loadCustomStylesFromCache();
      if (cachedCustom) {
        setCustomStyles(cachedCustom);
      } else {
        const presetStyles = getStylePreset('custom');
        setCustomStyles({ ...presetStyles, preset: 'custom' });
      }
    } else {
      const presetStyles = getStylePreset(preset);
      setCustomStyles({ ...presetStyles, preset: preset as ScoreboardCustomStyles['preset'] });
    }

    setHasChanges(true);
  };

  // Helper to safely get a style property value
  const getStyleValue = (key: keyof ScoreboardCustomStyles): string | undefined => {
    return customStyles[key] as string | undefined;
  };

  const handlePropertyChange = (key: keyof ScoreboardCustomStyles, value: string) => {
    const updatedStyles = {
      ...customStyles,
      [key]: value,
      preset: 'custom' as const,
    };

    setCustomStyles(updatedStyles);
    setSelectedPreset('custom');
    setHasChanges(true);

    // Save to localStorage so custom changes persist
    saveCustomStylesToCache(updatedStyles);
  };

  const handleScopeChange = (newScope: 'main' | 'embed' | 'both') => {
    setScope(newScope);
    setHasChanges(true);
  };

  const handleSave = async () => {
    // If saving custom styles, also update localStorage cache
    if (customStyles.preset === 'custom') {
      saveCustomStylesToCache(customStyles);
    }

    await onSave(customStyles, scope);
    setHasChanges(false);
  };

  const handleReset = () => {
    const preset = currentStyles?.preset || 'light';
    setSelectedPreset(preset);
    setCustomStyles(currentStyles || getStylePreset('light'));
    setScope(currentScope || 'both');
    setHasChanges(false);
  };

  const getRankColor = (rank: number): string => {
    if (rank === 1) return customStyles.rank1Color || '#ca8a04';
    if (rank === 2) return customStyles.rank2Color || '#9ca3af';
    if (rank === 3) return customStyles.rank3Color || '#b45309';
    return customStyles.textColor || '#1f2937';
  };

  const getRankIcon = (rank: number): string => {
    if (rank === 1) return customStyles.rank1Icon || 'TrophyIcon';
    if (rank === 2) return customStyles.rank2Icon || 'TrophyIcon';
    if (rank === 3) return customStyles.rank3Icon || 'TrophyIcon';
    return 'TrophyIcon';
  };

  return (
    <div className="bg-card border border-border rounded-lg elevation-1 mb-6">
      <button
        onClick={() => onToggleExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-muted/50 transition-colors rounded-lg"
      >
        <div className="flex items-center gap-3">
          <Icon name="PaintBrushIcon" size={20} className="text-primary" />
          <div>
            <h3 className="font-semibold text-text-primary">Style Customization</h3>
            <p className="text-sm text-text-secondary">
              Customize the appearance of your scoreboard for embedding
            </p>
          </div>
        </div>
        <Icon
          name={isExpanded ? 'ChevronUpIcon' : 'ChevronDownIcon'}
          size={20}
          className="text-text-secondary"
        />
      </button>

      {isExpanded && (
        <div className="px-6 pb-6 border-t border-border pt-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex gap-3">
              <Icon
                name="LightBulbIcon"
                size={20}
                className="text-amber-600 flex-shrink-0 mt-0.5"
              />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">How to customize styles</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Choose a preset theme or customize individual colors</li>
                  <li>Apply styles to the embedded version, main public view, or both</li>
                  <li>Colors accept HEX (#ffffff), RGBA, or &quot;transparent&quot;</li>
                  <li>Click Save to apply your changes</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-text-primary mb-3">
              Apply styles to:
            </label>
            <div className="flex gap-3">
              {[
                { value: 'both', label: 'Both Views', desc: 'Embed & Main' },
                { value: 'embed', label: 'Embed Only', desc: 'Just iframe' },
                { value: 'main', label: 'Main View Only', desc: 'Public page' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleScopeChange(option.value as 'main' | 'embed' | 'both')}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                    scope === option.value
                      ? 'border-primary bg-red-600/10 text-primary'
                      : 'border-border hover:border-red-600/50 text-text-secondary'
                  }`}
                >
                  <div className="font-medium text-sm">{option.label}</div>
                  <div className="text-xs opacity-70">{option.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-text-primary mb-3">
              Style Presets
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.keys(STYLE_PRESETS).map((preset) => (
                <button
                  key={preset}
                  onClick={() => handlePresetChange(preset)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    selectedPreset === preset
                      ? 'border-primary bg-red-600/10'
                      : 'border-border hover:border-red-600/50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-4 h-4 rounded-full border border-gray-300"
                      style={{ backgroundColor: STYLE_PRESETS[preset].backgroundColor }}
                    />
                    <span className="font-medium text-sm text-text-primary">
                      {PRESET_LABELS[preset]}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary line-clamp-2">
                    {PRESET_DESCRIPTIONS[preset]}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-text-primary">
                Top 3 Rank Customization
              </label>
              <span className="text-xs text-text-secondary">
                Colors and icons for podium positions
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {RANK_CUSTOMIZATION_PROPERTIES.map((rankProp) => (
                <div
                  key={rankProp.rank}
                  className="p-4 bg-muted/50 rounded-lg border border-border"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Icon
                      name={
                        getStyleValue(rankProp.iconKey as keyof ScoreboardCustomStyles) ||
                        'TrophyIcon'
                      }
                      size={20}
                      style={{
                        color:
                          getStyleValue(rankProp.colorKey as keyof ScoreboardCustomStyles) ||
                          rankProp.defaultColor,
                      }}
                    />
                    <span className="font-medium text-sm text-text-primary">{rankProp.label}</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-text-secondary mb-1">Color</label>
                      <ColorPicker
                        value={
                          getStyleValue(rankProp.colorKey as keyof ScoreboardCustomStyles) ||
                          rankProp.defaultColor
                        }
                        onChange={(color) =>
                          handlePropertyChange(
                            rankProp.colorKey as keyof ScoreboardCustomStyles,
                            color
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-text-secondary mb-1">Icon</label>
                      <select
                        value={
                          getStyleValue(rankProp.iconKey as keyof ScoreboardCustomStyles) ||
                          'TrophyIcon'
                        }
                        onChange={(e) =>
                          handlePropertyChange(
                            rankProp.iconKey as keyof ScoreboardCustomStyles,
                            e.target.value
                          )
                        }
                        className="w-full px-2 py-2 border border-border rounded-md text-sm bg-background text-text-primary"
                      >
                        {RANK_ICON_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-text-primary">
                Custom Properties
              </label>
              <span className="text-xs text-text-secondary">Fine-tune individual settings</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CUSTOMIZABLE_PROPERTIES.map((prop) => (
                <div key={prop.key} className="space-y-1">
                  <label className="block text-sm font-medium text-text-primary">
                    {prop.label}
                  </label>
                  <p className="text-xs text-text-secondary mb-1">{prop.description}</p>
                  {prop.type === 'color' ? (
                    <ColorPicker
                      value={getStyleValue(prop.key as keyof ScoreboardCustomStyles) || '#ffffff'}
                      onChange={(color) =>
                        handlePropertyChange(prop.key as keyof ScoreboardCustomStyles, color)
                      }
                    />
                  ) : prop.type === 'select' && prop.options ? (
                    <select
                      value={
                        getStyleValue(prop.key as keyof ScoreboardCustomStyles) ||
                        prop.options[0].value
                      }
                      onChange={(e) =>
                        handlePropertyChange(
                          prop.key as keyof ScoreboardCustomStyles,
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background text-text-primary"
                    >
                      {prop.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-text-primary mb-3">Preview</label>
            <div
              className="p-4"
              style={{
                backgroundColor: customStyles.backgroundColor,
                fontFamily: customStyles.fontFamily,
              }}
            >
              <div className="text-center mb-3" style={{ color: customStyles.headerColor }}>
                <h4 className="font-bold" style={{ color: customStyles.textColor }}>
                  Sample Scoreboard
                </h4>
                <p className="text-sm opacity-70" style={{ color: customStyles.textColor }}>
                  Preview of your style settings
                </p>
              </div>
              <table
                className="w-full text-sm overflow-hidden"
                style={{
                  borderRadius: customStyles.borderRadius,
                  border: `1px solid ${customStyles.borderColor}`,
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: customStyles.headerColor }}>
                    <th
                      className="px-3 py-2 text-left"
                      style={{ color: customStyles.headerTextColor }}
                    >
                      Rank
                    </th>
                    <th
                      className="px-3 py-2 text-left"
                      style={{ color: customStyles.headerTextColor }}
                    >
                      Name
                    </th>
                    <th
                      className="px-3 py-2 text-right"
                      style={{ color: customStyles.headerTextColor }}
                    >
                      Score
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { rank: 1, name: 'Alex Johnson', score: 2500 },
                    { rank: 2, name: 'Maria Garcia', score: 2350 },
                    { rank: 3, name: 'Sam Wilson', score: 2200 },
                  ].map((entry, idx) => {
                    const isAlternateRow = idx % 2 !== 0;
                    const textColor =
                      isAlternateRow && customStyles.alternateRowTextColor
                        ? customStyles.alternateRowTextColor
                        : customStyles.textColor;

                    return (
                      <tr
                        key={entry.rank}
                        style={{
                          backgroundColor:
                            idx % 2 === 0
                              ? customStyles.backgroundColor
                              : customStyles.rowHoverColor,
                          borderBottom: `1px solid ${customStyles.borderColor}`,
                        }}
                      >
                        <td className="px-3 py-2">
                          <div
                            className="flex items-center gap-2"
                            style={{ color: getRankColor(entry.rank) }}
                          >
                            <Icon name={getRankIcon(entry.rank)} size={18} />
                            <span className="font-semibold">#{entry.rank}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2" style={{ color: textColor }}>
                          {entry.name}
                        </td>
                        <td
                          className="px-3 py-2 text-right font-semibold"
                          style={{ color: customStyles.accentColor }}
                        >
                          {entry.score.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <button
              onClick={handleReset}
              disabled={!hasChanges || isSaving}
              className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed"
              title="Reset style changes"
            >
              Reset Changes
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-md font-medium text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              title="Save style customizations"
            >
              {isSaving ? (
                <>
                  <Icon name="ArrowPathIcon" size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Icon name="CheckIcon" size={16} />
                  Save Styles
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
