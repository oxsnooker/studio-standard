'use client';

import { useState } from 'react';
import { TableCard } from '@/components/dashboard/table-card';
import type { BilliardTable, SessionItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';

export default function TablesPage() {
  const firestore = useFirestore();
  
  const tablesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'tables');
  }, [firestore]);

  const { data: tables, isLoading } = useCollection<BilliardTable>(tablesQuery);

  const handleAddTable = () => {
    if (!firestore) return;
    const tablesCollection = collection(firestore, 'tables');
    // A simple default table structure.
    const newTable: Omit<BilliardTable, 'id'> = {
      name: `Table ${ (tables?.length || 0) + 1}`,
      status: 'available',
      hourlyRate: 10,
      startTime: 0,
      elapsedTime: 0,
      sessionItems: [],
    };
    addDocumentNonBlocking(tablesCollection, newTable);
  };


  if (isLoading) {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <h1 className="font-headline text-3xl md:text-4xl">Live Tables</h1>
          <Button disabled>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Table
          </Button>
        </div>
        <div className="grid gap-4 md:gap-6 lg:gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-[300px] w-full animate-pulse rounded-lg bg-card" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
            <h1 className="font-headline text-3xl md:text-4xl">Live Tables</h1>
            <Button onClick={handleAddTable}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Table
            </Button>
        </div>
      <div className="grid gap-4 md:gap-6 lg:gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {tables?.map((table) => (
          <TableCard 
            key={table.id} 
            table={table} 
        />
        ))}
      </div>
    </div>
  );
}
