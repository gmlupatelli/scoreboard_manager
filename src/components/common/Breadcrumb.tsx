'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';

interface BreadcrumbItem {
  label: string;
  path: string;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  className?: string;
}

const Breadcrumb = ({ items, className = '' }: BreadcrumbProps) => {
  const pathname = usePathname();

  const routeMap: Record<string, string> = {
    '/public-scoreboard-list': 'Scoreboards',
    '/individual-scoreboard-view': 'Scoreboard View',
    '/admin-login': 'Admin Login',
    '/admin-dashboard': 'Dashboard',
    '/scoreboard-management': 'Manage Scoreboards',
  };

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (items && items.length > 0) return items;

    const paths = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [{ label: 'Home', path: '/' }];

    let currentPath = '';
    paths.forEach((path) => {
      currentPath += `/${path}`;
      const label = routeMap[currentPath] || path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');
      breadcrumbs.push({ label, path: currentPath });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  if (breadcrumbs.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className={`flex items-center space-x-2 text-sm ${className}`}>
      {breadcrumbs.map((item, index) => {
        const isLast = index === breadcrumbs.length - 1;
        const isFirst = index === 0;

        return (
          <div key={item.path} className="flex items-center">
            {!isFirst && <Icon name="ChevronRightIcon" size={16} className="text-muted-foreground mx-2" />}
            {isLast ? (
              <span className="font-medium text-text-primary" aria-current="page">
                {item.label}
              </span>
            ) : (
              <Link
                href={item.path}
                className="text-text-secondary hover:text-text-primary transition-smooth duration-150 hover:underline"
              >
                {item.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
};

export default Breadcrumb;