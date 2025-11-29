'use client';


import { usePathname } from 'next/navigation';


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

  return null;
};

export default Breadcrumb;