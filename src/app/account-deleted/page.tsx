'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import Icon from '@/components/ui/AppIcon';
import Logo from '@/components/ui/Logo';
import { createBrowserClient } from '@supabase/ssr';

export default function AccountDeletedPage() {
  // Clear any remaining session when this page loads
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    );
    supabase.auth.signOut();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          <div className="bg-card border border-border rounded-lg p-8 text-center shadow-sm">
            <div className="flex justify-center mb-6">
              <Logo size={60} />
            </div>
            
            <div className="mb-6">
              <Icon 
                name="HeartIcon" 
                size={48} 
                className="mx-auto text-primary" 
              />
            </div>
            
            <h1 className="text-2xl font-bold text-text-primary mb-4">
              We're Sorry to See You Go
            </h1>
            
            <p className="text-text-secondary mb-6">
              Your account has been successfully deleted. We hope you enjoyed using Scoreboard Manager and would love to have you back anytime.
            </p>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-8">
              <p className="text-sm text-text-secondary">
                If you ever change your mind, you're always welcome to create a new account and start fresh. We'll be here!
              </p>
            </div>

            <div className="space-y-3">
              <Link
                href="/register"
                className="block w-full px-6 py-3 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-smooth font-medium"
              >
                Create New Account
              </Link>
              
              <Link
                href="/"
                className="block w-full px-6 py-3 bg-muted text-text-primary rounded-md hover:bg-muted/80 transition-smooth font-medium"
              >
                Return to Homepage
              </Link>
            </div>

            <p className="mt-8 text-xs text-muted-foreground">
              Thank you for being part of our community.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
