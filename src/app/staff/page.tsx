'use client';

import { useState, useMemo } from 'react';
import type { BilliardTable } from '@/lib/types';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { TableCard } from '@/components/dashboard/table-card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ExternalLink, Calculator as CalculatorIcon } from 'lucide-react';
import { Calculator } from '@/components/dashboard/calculator';

export default function StaffPage() {
  const firestore = useFirestore();
  const [isCalculatorOpen, setCalculatorOpen] = useState(false);

  const tablesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    // Temporarily reverted to a simpler query.
    // The orderBy clause requires a Firestore index.
    return query(collection(firestore, 'tables'));
  }, [firestore]);

  const { data: tables, isLoading } = useCollection<BilliardTable>(tablesQuery);

  const [sessionChangeCounter, setSessionChangeCounter] = useState(0);
  const handleSessionChange = () => {
    setSessionChangeCounter(prev => prev + 1);
  };
  
  const sortedTables = useMemo(() => {
    // Sort client-side for now
    if (!tables) return [];
    return [...tables].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  }, [tables]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-3xl md:text-4xl">THE OX SNOOKER</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setCalculatorOpen(true)}>
            <CalculatorIcon className="mr-2 h-4 w-4" />
            OX calculator
          </Button>
          <Button asChild variant="outline">
            <Link href="https://balance-standard.vercel.app/login" target="_blank">
              <ExternalLink className="mr-2 h-4 w-4" />
              Balance
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading
          ? [...Array(6)].map((_, i) => (
              <div key={i} className="h-[450px] w-full animate-pulse rounded-lg bg-card" />
            ))
          : sortedTables?.map(table => (
              <TableCard key={table.id} table={table} onSessionChange={handleSessionChange} />
            ))}
      </div>

      <Calculator isOpen={isCalculatorOpen} onOpenChange={setCalculatorOpen} />
    </div>
  );
}
