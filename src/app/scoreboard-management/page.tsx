import type { Metadata } from 'next';
import Header from '@/components/common/Header';
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
        <ScoreboardManagementInteractive />
      </div>
    </>
  );
}