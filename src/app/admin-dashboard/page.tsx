import type { Metadata } from 'next';
import AdminDashboardInteractive from './components/AdminDashboardInteractive';

export const metadata: Metadata = {
  title: 'Admin Dashboard - Scoreboard Manager',
  description: 'Central management hub for administrators to oversee all scoreboards, create new competitions, and perform administrative tasks with comprehensive scoreboard management tools.',
};

export default function AdminDashboardPage() {
  return <AdminDashboardInteractive />;
}