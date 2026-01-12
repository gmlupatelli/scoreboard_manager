import type { Metadata } from 'next';
import PublicScoreboardInteractive from './components/PublicScoreboardInteractive';
import Footer from '@/components/common/Footer';

export const metadata: Metadata = {
  title: 'Available Scoreboards - Scoreboard Manager',
  description:
    'Browse and view live rankings across all active competitions and scoreboards. Access real-time performance data and competitive standings.',
};

export default function PublicScoreboardListPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicScoreboardInteractive />
      <Footer />
    </div>
  );
}
