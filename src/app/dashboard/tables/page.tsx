'use client';

import { useState } from 'react';
import { TableCard } from '@/components/dashboard/table-card';
import { initialTables } from '@/lib/data';
import type { BilliardTable, SessionItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export default function TablesPage() {
  const [tables, setTables] = useState<BilliardTable[]>(initialTables);

  const updateTable = (tableId: string, updates: Partial<BilliardTable>) => {
    setTables((prevTables) =>
      prevTables.map((table) =>
        table.id === tableId ? { ...table, ...updates } : table
      )
    );
  };

  const addSessionItem = (tableId: string, item: SessionItem) => {
    setTables((prevTables) =>
      prevTables.map((table) => {
        if (table.id === tableId) {
          const existingItemIndex = table.sessionItems.findIndex(si => si.product.id === item.product.id);
          let newSessionItems: SessionItem[];
          if (existingItemIndex > -1) {
            newSessionItems = [...table.sessionItems];
            newSessionItems[existingItemIndex].quantity += item.quantity;
          } else {
            newSessionItems = [...table.sessionItems, item];
          }
          return { ...table, sessionItems: newSessionItems };
        }
        return table;
      })
    );
  };

  return (
    <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
            <h1 className="font-headline text-3xl md:text-4xl">Live Tables</h1>
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Table
            </Button>
        </div>
      <div className="grid gap-4 md:gap-6 lg:gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {tables.map((table) => (
          <TableCard 
            key={table.id} 
            table={table} 
            onUpdate={updateTable}
            onAddItem={addSessionItem}
        />
        ))}
      </div>
    </div>
  );
}
