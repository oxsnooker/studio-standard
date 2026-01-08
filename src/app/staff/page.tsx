'use client';

import { useState } from 'react';
import type { BilliardTable } from '@/lib/types';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { TableCard } from '@/components/dashboard/table-card';

export default function StaffPage() {
  const firestore = useFirestore();

  const tablesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'tables');
  }, [firestore]);

  const { data: tables, isLoading } = useCollection<BilliardTable>(tablesQuery);

  const [sessionChangeCounter, setSessionChangeCounter] = useState(0);
  const handleSessionChange = () => {
    setSessionChangeCounter(prev => prev + 1);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-3xl md:text-4xl">Table Management</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading
          ? [...Array(6)].map((_, i) => (
              <div key={i} className="h-[350px] w-full animate-pulse rounded-lg bg-card" />
            ))
          : tables?.map(table => (
              <TableCard key={table.id} table={table} onSessionChange={handleSessionChange} />
            ))}
      </div>
    </div>
  );
}
