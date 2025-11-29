'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Header from '@/components/common/Header';
import UserProfileInteractive from './components/UserProfileInteractive';

export default function UserProfileManagementPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router?.push('/login');
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    await signOut();
    router?.push('/login');
  };

  if (loading) {
    return (
      <>
        <Header isAuthenticated={false} />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading profile...</p>
          </div>
        </div>
      </>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <Header isAuthenticated={true} onLogout={handleLogout} />
      <div className="pt-16">
        <UserProfileInteractive />
      </div>
    </>
  );
}