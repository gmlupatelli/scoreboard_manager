import React from 'react';

interface ScoreboardHeaderProps {
  title: string;
  description: string;
  totalEntries: number;
}

const ScoreboardHeader: React.FC<ScoreboardHeaderProps> = ({ title, description, totalEntries }) => {
  return (
    <div className="bg-surface border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-3">{title}</h1>
        <p className="text-base sm:text-lg text-text-secondary mb-4 max-w-3xl">{description}</p>
        <div className="flex items-center space-x-2 text-sm text-text-secondary">
          <span className="font-medium">Total Entries:</span>
          <span className="px-3 py-1 bg-muted rounded-md font-semibold text-text-primary">{totalEntries}</span>
        </div>
      </div>
    </div>
  );
};

export default ScoreboardHeader;