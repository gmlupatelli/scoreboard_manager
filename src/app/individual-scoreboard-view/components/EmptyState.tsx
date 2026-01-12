import Icon from '@/components/ui/AppIcon';

interface EmptyStateProps {
  searchQuery?: string;
}

export default function EmptyState({ searchQuery }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
        <Icon name="MagnifyingGlassIcon" size={40} className="text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold text-text-primary mb-2">
        {searchQuery ? 'No Results Found' : 'No Entries Yet'}
      </h3>
      <p className="text-text-secondary text-center max-w-md">
        {searchQuery
          ? `No entries match your search for "${searchQuery}". Try adjusting your search terms.`
          : "This scoreboard doesn't have any entries yet. Check back later for updates."}
      </p>
    </div>
  );
}
