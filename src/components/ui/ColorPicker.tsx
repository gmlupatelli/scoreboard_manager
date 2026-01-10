'use client';

import React, { useState, useRef, useEffect } from 'react';
import { RgbaColorPicker } from 'react-colorful';

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

// Convert various color formats to RGBA object
const parseColor = (color: string): { r: number; g: number; b: number; a: number } => {
  // Handle rgba format
  const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (rgbaMatch) {
    return {
      r: parseInt(rgbaMatch[1]),
      g: parseInt(rgbaMatch[2]),
      b: parseInt(rgbaMatch[3]),
      a: rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1,
    };
  }

  // Handle hex format
  if (color.startsWith('#')) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const a = hex.length === 8 ? parseInt(hex.substring(6, 8), 16) / 255 : 1;
    return { r, g, b, a };
  }

  // Handle transparent
  if (color === 'transparent') {
    return { r: 255, g: 255, b: 255, a: 0 };
  }

  // Default fallback
  return { r: 255, g: 255, b: 255, a: 1 };
};

// Convert RGBA object to string
const rgbaToString = (rgba: { r: number; g: number; b: number; a: number }): string => {
  if (rgba.a === 1) {
    // If fully opaque, return HEX
    const toHex = (n: number) => n.toString(16).padStart(2, '0');
    return `#${toHex(rgba.r)}${toHex(rgba.g)}${toHex(rgba.b)}`;
  } else if (rgba.a === 0) {
    return 'transparent';
  } else {
    return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a.toFixed(2)})`;
  }
};

const ColorPicker: React.FC<ColorPickerProps> = ({ value, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [rgbaColor, setRgbaColor] = useState(parseColor(value || '#ffffff'));
  const [textInput, setTextInput] = useState(value || '#ffffff');
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setRgbaColor(parseColor(value || '#ffffff'));
    setTextInput(value || '#ffffff');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleColorChange = (newColor: { r: number; g: number; b: number; a: number }) => {
    setRgbaColor(newColor);
    const colorString = rgbaToString(newColor);
    setTextInput(colorString);
    onChange(colorString);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setTextInput(newValue);
    
    // Try to parse and update the color picker
    try {
      const parsed = parseColor(newValue);
      setRgbaColor(parsed);
      onChange(newValue);
    } catch {
      // Invalid color format, just update text but not the picker
    }
  };

  const handleAlphaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAlpha = parseFloat(e.target.value);
    const newColor = { ...rgbaColor, a: newAlpha };
    handleColorChange(newColor);
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-10 h-10 rounded border border-border cursor-pointer flex-shrink-0"
          style={{
            backgroundColor: rgbaToString(rgbaColor),
            backgroundImage: rgbaColor.a < 1 
              ? 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%)'
              : 'none',
            backgroundSize: '8px 8px',
            backgroundPosition: '0 0, 4px 4px',
          }}
          title={label || 'Pick color'}
        />
        <input
          type="text"
          value={textInput}
          onChange={handleTextChange}
          placeholder="#ffffff"
          className="flex-1 px-3 py-2 border border-border rounded-md text-sm bg-background text-text-primary"
        />
      </div>

      {isOpen && (
        <div
          ref={popoverRef}
          className="absolute top-full left-0 mt-2 p-3 bg-card border border-border rounded-lg shadow-lg z-50"
          style={{ minWidth: '240px' }}
        >
          <RgbaColorPicker color={rgbaColor} onChange={handleColorChange} />
          
          <div className="mt-3 space-y-2">
            <div>
              <label className="block text-xs text-text-secondary mb-1">
                Opacity: {Math.round(rgbaColor.a * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={rgbaColor.a}
                onChange={handleAlphaChange}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            <div className="text-xs text-text-secondary pt-2 border-t border-border">
              <div className="font-medium mb-1">Current: {textInput}</div>
              <div className="text-[10px] opacity-70">
                Formats: #RRGGBB, rgba(r,g,b,a), transparent
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorPicker;
