import Icon from '@/components/ui/AppIcon';

const SecurityBadges = () => {
  const badges = [
    {
      icon: 'ShieldCheckIcon',
      label: 'SSL Secured',
      description: 'End-to-end encryption',
    },
    {
      icon: 'LockClosedIcon',
      label: 'JWT Authentication',
      description: 'Secure session management',
    },
    {
      icon: 'ClockIcon',
      label: 'Rate Limited',
      description: '30 requests per minute',
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto mt-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {badges.map((badge) => (
          <div
            key={badge.label}
            className="flex flex-col items-center text-center p-6 bg-card border border-border rounded-lg elevation-1"
          >
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
              <Icon name={badge.icon as any} size={24} className="text-primary" variant="solid" />
            </div>
            <h3 className="text-sm font-semibold text-text-primary mb-1">{badge.label}</h3>
            <p className="text-xs text-text-secondary">{badge.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SecurityBadges;