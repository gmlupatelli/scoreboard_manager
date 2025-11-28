import type { Metadata } from 'next';
import Header from '@/components/common/Header';
import LoginInteractive from './components/LoginInteractive';

export const metadata: Metadata = {
  title: 'Admin Login - Scoreboard Manager',
  description: 'Secure authentication portal for system administrators to access scoreboard management functionality with JWT-based session management and rate limiting protection.',
};

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header isAuthenticated={false} />
      <main className="pt-16">
        <LoginInteractive />
      </main>
    </div>
  );
}