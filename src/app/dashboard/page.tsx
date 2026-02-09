import { Suspense } from 'react';
import type { Metadata } from 'next';
import AdminDashboardInteractive from './components/AdminDashboardInteractive';
import Footer from '@/components/common/Footer';

export const metadata: Metadata = {
  title: 'Dashboard - Scoreboard Manager',
  description:
    'Central management hub for administrators to oversee all scoreboards, create new competitions, and perform administrative tasks with comprehensive scoreboard management tools.',
};

export default function DashboardPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Suspense>
        <AdminDashboardInteractive />
      </Suspense>
      <Footer />
    </div>
  );
}
