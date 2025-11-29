import Icon from '@/components/ui/AppIcon';

interface StatsCardProps {
  title: string;
  value: number;
  icon: string;
  description: string;
}

const StatsCard = ({ title, value, icon, description }: StatsCardProps) => {
  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
          <Icon name={icon as any} size={24} className="text-primary" />
        </div>
      </div>
      <h3 className="text-2xl font-bold text-text-primary mb-1">{value.toLocaleString()}</h3>
      <p className="text-sm font-medium text-text-secondary mb-1">{title}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
};

export default StatsCard;