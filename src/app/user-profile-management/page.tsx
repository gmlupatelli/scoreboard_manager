'use client';

import { Suspense } from 'react';
import { useAuthGuard } from '@/hooks';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import UserProfileInteractive from './components/UserProfileInteractive';

export default function UserProfileManagementPage() {
  const { isAuthorized, isChecking } = useAuthGuard();

  if (isChecking) {
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

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header isAuthenticated={true} />
      <div className="pt-16 flex-1">
        <Suspense>
          <UserProfileInteractive />
        </Suspense>
      </div>
      <Footer />
    </div>
  );
}
