'use client';

import { DashboardHeader } from '@/components/dashboard-header';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

function StaffGuard({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [isUserLoading, user, router]);

  if (isUserLoading || !user) {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <p>Loading...</p>
        </div>
    );
  }

  return <>{children}</>;
}


export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StaffGuard>
        <div className="flex flex-col min-h-screen w-full">
          <DashboardHeader />
          <main className="flex-1 bg-background p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
    </StaffGuard>
  );
}
