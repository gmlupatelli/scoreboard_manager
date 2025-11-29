import Icon from '@/components/ui/AppIcon';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: string;
  description?: string;
}

const StatsCard = ({ title, value, icon, description }: StatsCardProps) => {
  return (
    <div className="bg-card border border-border rounded-lg p-6 hover-lift">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-text-secondary">{title}</h3>
        <div className="p-2 bg-primary/10 rounded-lg">
          <Icon name={icon} size={24} className="text-primary" />
        </div>
      </div>
      <p className="text-3xl font-bold text-text-primary mb-1">{value}</p>
      {description && <p className="text-xs text-text-secondary">{description}</p>}
    </div>
  );
};

export default StatsCard;