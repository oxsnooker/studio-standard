'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { BilliardTable, SessionItem, Bill } from '@/lib/types';
import { Hourglass, Pause, Play, Square, UtensilsCrossed } from 'lucide-react';
import { EndSessionDialog } from './end-session-dialog';
import { AddItemDialog } from './add-item-dialog';
import { doc, collection } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { updateDocumentNonBlocking, setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';

interface TableCardProps {
  table: BilliardTable;
  onSessionChange?: () => void;
}

const formatTime = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export function TableCard({ table, onSessionChange }: TableCardProps) {
  const [elapsedTime, setElapsedTime] = useState(table.elapsedTime || 0);
  const [isEndSessionOpen, setEndSessionOpen] = useState(false);
  const [isAddItemOpen, setAddItemOpen] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  const tableRef = doc(firestore, 'tables', table.id);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (table.status === 'in-use') {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [table.status]);
  
  useEffect(() => {
    if (table.status === 'in-use') {
        const timer = setInterval(() => {
          const now = Date.now();
          const elapsed = table.elapsedTime + Math.floor((now - (table.lastPausedTime || table.startTime)) / 1000);
          updateDocumentNonBlocking(tableRef, { elapsedTime: elapsed });
        }, 60000); // Update every minute to reduce writes
        return () => clearInterval(timer);
      }
  }, [table.status, table.elapsedTime, table.startTime, table.lastPausedTime, tableRef]);

  useEffect(() => {
    setElapsedTime(table.elapsedTime || 0);
  }, [table.elapsedTime]);

  const handleStart = () => {
    setDocumentNonBlocking(tableRef, {
        status: 'in-use',
        startTime: Date.now(),
        elapsedTime: 0,
        sessionItems: [],
        lastPausedTime: null
    }, { merge: true });
    onSessionChange?.();
  };

  const handlePause = () => {
    const now = Date.now();
    const newElapsedTime = table.elapsedTime + Math.floor((now - (table.lastPausedTime ? table.startTime - table.lastPausedTime : table.startTime)) / 1000);
    updateDocumentNonBlocking(tableRef, { 
      status: 'paused',
      elapsedTime: elapsedTime,
      lastPausedTime: now,
    });
    onSessionChange?.();
  };

  const handleResume = () => {
    updateDocumentNonBlocking(tableRef, { 
        status: 'in-use',
        startTime: table.startTime + (Date.now() - table.lastPausedTime) // Adjust start time
    });
    onSessionChange?.();
  };

  const handleStop = () => {
    // Don't change status here. Change it after payment is confirmed.
    setEndSessionOpen(true);
  };
  
  const handleSessionEnd = (bill: Omit<Bill, 'id'>) => {
    if (!firestore) return;
    
    // 1. Save the bill
    const billsCollection = collection(firestore, 'bills');
    addDocumentNonBlocking(billsCollection, bill);

    // 2. Reset the table
    updateDocumentNonBlocking(tableRef, { 
        status: 'available', 
        elapsedTime: 0,
        startTime: 0,
        sessionItems: [],
        lastPausedTime: null,
    });

    toast({
        title: "Session Completed",
        description: `Bill for ${table.name} has been finalized.`,
    });
    
    onSessionChange?.();
  }

  const handleAddItem = (item: SessionItem) => {
      if (!tableRef) return;
      const existingItemIndex = table.sessionItems.findIndex(si => si.product.id === item.product.id);
      let newSessionItems: SessionItem[];
      if (existingItemIndex > -1) {
        newSessionItems = [...table.sessionItems];
        newSessionItems[existingItemIndex].quantity += item.quantity;
      } else {
        newSessionItems = [...(table.sessionItems || []), item];
      }
      updateDocumentNonBlocking(tableRef, { sessionItems: newSessionItems });
      toast({ title: 'Item Added', description: `${item.quantity}x ${item.product.name} added to ${table.name}.`})
      onSessionChange?.();
  };

  const getStatusBadge = () => {
    switch (table.status) {
      case 'available':
        return <Badge variant="secondary">Available</Badge>;
      case 'in-use':
        return <Badge className="bg-green-600 text-white">In Use</Badge>;
      case 'paused':
        return <Badge variant="destructive">Paused</Badge>;
    }
  };

  return (
    <>
      <Card className="flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-headline text-2xl">{table.name}</CardTitle>
            {getStatusBadge()}
          </div>
          <CardDescription>${table.hourlyRate.toFixed(2)} / hour</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col items-center justify-center gap-2">
            <div className="flex items-center gap-2 text-4xl font-bold font-mono tracking-wider">
                <Hourglass className={cn("h-8 w-8", table.status === 'in-use' && 'text-accent animate-pulse')} />
                <span>{formatTime(elapsedTime)}</span>
            </div>
            <p className="text-sm text-muted-foreground">
                Bill: ${(elapsedTime / 3600 * table.hourlyRate).toFixed(2)}
            </p>
        </CardContent>
        <CardFooter className="grid grid-cols-2 gap-2">
          {table.status === 'available' && (
            <Button onClick={handleStart} className="col-span-2">
              <Play className="mr-2 h-4 w-4" /> Start Session
            </Button>
          )}
          {table.status === 'in-use' && (
            <>
              <Button onClick={handlePause} variant="outline">
                <Pause className="mr-2 h-4 w-4" /> Pause
              </Button>
              <Button onClick={handleStop} variant="destructive">
                <Square className="mr-2 h-4 w-4" /> Stop
              </Button>
            </>
          )}
          {table.status === 'paused' && (
            <>
              <Button onClick={handleResume}>
                <Play className="mr-2 h-4 w-4" /> Resume
              </Button>
              <Button onClick={handleStop} variant="destructive">
                <Square className="mr-2 h-4 w-4" /> Stop
              </Button>
            </>
          )}
          <Button 
            variant="secondary" 
            className="col-span-2" 
            disabled={table.status === 'available'}
            onClick={() => setAddItemOpen(true)}
        >
              <UtensilsCrossed className="mr-2 h-4 w-4" /> Add Items
          </Button>
        </CardFooter>
      </Card>
      <EndSessionDialog
        isOpen={isEndSessionOpen}
        onOpenChange={setEndSessionOpen}
        table={table}
        elapsedTime={elapsedTime}
        onSessionEnd={handleSessionEnd}
      />
      <AddItemDialog
        isOpen={isAddItemOpen}
        onOpenChange={setAddItemOpen}
        onAddItem={handleAddItem}
      />
    </>
  );
}
