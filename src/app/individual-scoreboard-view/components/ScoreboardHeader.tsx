import { ScoreboardCustomStyles } from '@/types/models';

interface ScoreboardHeaderProps {
  title: string;
  description: string;
  totalEntries: number;
  customStyles?: ScoreboardCustomStyles | null;
}

export default function ScoreboardHeader({ title, description, totalEntries, customStyles }: ScoreboardHeaderProps) {
  return (
    <div 
      className="border-b"
      style={{
        backgroundColor: customStyles?.backgroundColor || 'var(--surface)',
        borderColor: customStyles?.borderColor || 'var(--border)',
        fontFamily: customStyles?.fontFamily || 'inherit',
        borderRadius: customStyles?.borderRadius || '0px',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 
          className="text-3xl sm:text-4xl font-bold mb-3"
          style={{ 
            color: customStyles?.titleTextColor || 'var(--text-primary)',
            fontFamily: customStyles?.fontFamily || 'inherit',
          }}
        >
          {title}
        </h1>
        <p 
          className="text-base sm:text-lg mb-4 max-w-3xl"
          style={{ 
            color: customStyles?.titleTextColor ? `${customStyles.titleTextColor}cc` : 'var(--text-secondary)',
            fontFamily: customStyles?.fontFamily || 'inherit',
          }}
        >
          {description}
        </p>
        <div 
          className="flex items-center space-x-2 text-sm"
          style={{ 
            color: customStyles?.titleTextColor || 'var(--text-secondary)',
            fontFamily: customStyles?.fontFamily || 'inherit',
          }}
        >
          <span className="font-medium">Total Entries:</span>
          <span 
            className="px-3 py-1 rounded-md font-semibold"
            style={{
              backgroundColor: customStyles?.accentColor || 'var(--muted)',
              color: customStyles?.accentTextColor || '#ffffff',
              fontFamily: customStyles?.fontFamily || 'inherit',
              borderRadius: customStyles?.borderRadius || '4px',
            }}
          >
            {totalEntries}
          </span>
        </div>
      </div>
    </div>
  );
}