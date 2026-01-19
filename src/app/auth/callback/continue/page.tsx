import React, { Suspense } from 'react';
import CallbackClient from './CallbackClient';

export default function AuthCallbackContinuePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center p-4">Processing sign-in…</div>}>
      <CallbackClient />
    </Suspense>
  );
}
