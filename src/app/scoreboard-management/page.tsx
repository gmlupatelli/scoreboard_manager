import type { Metadata } from 'next';
import Header from '@/components/common/Header';
import Breadcrumb from '@/components/common/Breadcrumb';
import ScoreboardManagementInteractive from './components/ScoreboardManagementInteractive';

export const metadata: Metadata = {
  title: 'Scoreboard Management - Scoreboard Manager',
  description: 'Manage scoreboard entries with comprehensive CRUD operations, CSV import, search filtering, and real-time ranking updates for competition participants.',
};

export default function ScoreboardManagementPage() {
  return (
    <>
      <Header isAuthenticated={true} />
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Breadcrumb />
        </div>
        <ScoreboardManagementInteractive />
      </div>
    </>
  );
}