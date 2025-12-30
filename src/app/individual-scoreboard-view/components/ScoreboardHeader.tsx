import React from 'react';
import { ScoreboardCustomStyles } from '@/types/models';

interface ScoreboardHeaderProps {
  title: string;
  description: string;
  totalEntries: number;
  customStyles?: ScoreboardCustomStyles | null;
}

const ScoreboardHeader: React.FC<ScoreboardHeaderProps> = ({ title, description, totalEntries, customStyles }) => {
  return (
    <div 
      className="border-b"
      style={{
        backgroundColor: customStyles?.headerColor || 'var(--surface)',
        borderColor: customStyles?.borderColor || 'var(--border)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 
          className="text-3xl sm:text-4xl font-bold mb-3"
          style={{ color: customStyles?.headerTextColor || customStyles?.textColor || 'var(--text-primary)' }}
        >
          {title}
        </h1>
        <p 
          className="text-base sm:text-lg mb-4 max-w-3xl"
          style={{ color: customStyles?.textColor ? `${customStyles.textColor}99` : 'var(--text-secondary)' }}
        >
          {description}
        </p>
        <div 
          className="flex items-center space-x-2 text-sm"
          style={{ color: customStyles?.textColor ? `${customStyles.textColor}99` : 'var(--text-secondary)' }}
        >
          <span className="font-medium">Total Entries:</span>
          <span 
            className="px-3 py-1 rounded-md font-semibold"
            style={{
              backgroundColor: customStyles?.accentColor || 'var(--muted)',
              color: customStyles?.accentColor ? '#ffffff' : 'var(--text-primary)',
            }}
          >
            {totalEntries}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ScoreboardHeader;