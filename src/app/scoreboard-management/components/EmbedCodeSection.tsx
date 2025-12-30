'use client';

import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';

interface EmbedCodeSectionProps {
  scoreboardId: string;
  scoreboardTitle: string;
}

const EMBED_EXPANDED_STORAGE_KEY = 'embedCodeExpanded';

const EmbedCodeSection: React.FC<EmbedCodeSectionProps> = ({
  scoreboardId,
  scoreboardTitle,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [embedWidth, setEmbedWidth] = useState('100%');
  const [embedHeight, setEmbedHeight] = useState('600');

  useEffect(() => {
    const storageKey = `${EMBED_EXPANDED_STORAGE_KEY}_${scoreboardId}`;
    const stored = sessionStorage.getItem(storageKey);
    if (stored !== null) {
      setIsExpanded(stored === 'true');
    }
  }, [scoreboardId]);

  const handleToggleExpanded = () => {
    const newValue = !isExpanded;
    setIsExpanded(newValue);
    const storageKey = `${EMBED_EXPANDED_STORAGE_KEY}_${scoreboardId}`;
    sessionStorage.setItem(storageKey, String(newValue));
  };

  const getBaseUrl = () => {
    if (typeof window === 'undefined') return '';
    return window.location.origin;
  };

  const getEmbedUrl = () => {
    return `${getBaseUrl()}/embed/${scoreboardId}`;
  };

  const getIframeCode = () => {
    const width = embedWidth.includes('%') ? embedWidth : `${embedWidth}px`;
    const height = embedHeight.includes('%') ? embedHeight : `${embedHeight}px`;
    
    return `<iframe
  src="${getEmbedUrl()}"
  width="${width}"
  height="${height}"
  frameborder="0"
  loading="lazy"
  title="${scoreboardTitle}"
  style="border: none; border-radius: 8px;"
></iframe>`;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getIframeCode());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(getEmbedUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
    }
  };

  const handleOpenPreview = () => {
    window.open(getEmbedUrl(), '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="bg-card border border-border rounded-lg elevation-1 mb-6">
      <button
        onClick={handleToggleExpanded}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-muted/50 transition-colors rounded-lg"
      >
        <div className="flex items-center gap-3">
          <Icon name="CodeBracketIcon" size={20} className="text-secondary" />
          <div>
            <h3 className="font-semibold text-text-primary">Embed Code</h3>
            <p className="text-sm text-text-secondary">
              Get the code to embed this scoreboard on your website
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
              <Icon name="LightBulbIcon" size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">How to embed your scoreboard</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Copy the iframe code below</li>
                  <li>Paste it into your website's HTML where you want the scoreboard to appear</li>
                  <li>Adjust the width and height to fit your layout</li>
                  <li>The scoreboard will update in real-time automatically</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-text-primary mb-2">
              Embed URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={getEmbedUrl()}
                readOnly
                className="flex-1 px-3 py-2 border border-border rounded-md text-sm bg-muted text-text-primary font-mono"
              />
              <button
                onClick={handleCopyUrl}
                className="px-4 py-2 bg-secondary/10 text-secondary rounded-md font-medium text-sm hover:bg-secondary/20 flex items-center gap-2"
              >
                <Icon name="ClipboardDocumentIcon" size={16} />
                Copy URL
              </button>
              <button
                onClick={handleOpenPreview}
                className="px-4 py-2 bg-primary/10 text-primary rounded-md font-medium text-sm hover:bg-primary/20 flex items-center gap-2"
              >
                <Icon name="ArrowTopRightOnSquareIcon" size={16} />
                Preview
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-text-primary mb-2">
              Dimensions
            </label>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs text-text-secondary mb-1">Width</label>
                <select
                  value={embedWidth}
                  onChange={(e) => setEmbedWidth(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background text-text-primary"
                >
                  <option value="100%">100% (Full width)</option>
                  <option value="800">800px</option>
                  <option value="600">600px</option>
                  <option value="500">500px</option>
                  <option value="400">400px</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs text-text-secondary mb-1">Height</label>
                <select
                  value={embedHeight}
                  onChange={(e) => setEmbedHeight(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background text-text-primary"
                >
                  <option value="400">400px (Compact)</option>
                  <option value="500">500px</option>
                  <option value="600">600px (Recommended)</option>
                  <option value="700">700px</option>
                  <option value="800">800px (Large)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-text-primary">
                Iframe Code
              </label>
              <button
                onClick={handleCopy}
                className={`px-3 py-1.5 rounded-md font-medium text-sm flex items-center gap-2 transition-colors ${
                  copied 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-primary text-primary-foreground hover:opacity-90'
                }`}
              >
                {copied ? (
                  <>
                    <Icon name="CheckIcon" size={16} />
                    Copied!
                  </>
                ) : (
                  <>
                    <Icon name="ClipboardDocumentIcon" size={16} />
                    Copy Code
                  </>
                )}
              </button>
            </div>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm font-mono overflow-x-auto whitespace-pre-wrap">
              {getIframeCode()}
            </pre>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex gap-3">
              <Icon name="InformationCircleIcon" size={20} className="text-gray-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-700">
                <p className="font-medium mb-1">Tips for best results</p>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>The embed updates in real-time as scores change</li>
                  <li>Use <code className="bg-gray-200 px-1 rounded">loading="lazy"</code> for better page performance</li>
                  <li>Customize the appearance using the Style Customization section above</li>
                  <li>The embed works on both public and private scoreboards (via direct URL)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmbedCodeSection;
