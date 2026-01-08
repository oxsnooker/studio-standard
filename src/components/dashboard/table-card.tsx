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
import { Hourglass, Pause, Play, Square, UtensilsCrossed, Trash2, FileText } from 'lucide-react';
import { EndSessionDialog } from './end-session-dialog';
import { AddItemDialog } from './add-item-dialog';
import { doc, collection, runTransaction } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { updateDocumentNonBlocking, setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';

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

  const handleOpenBillDialog = () => {
    // Don't change status here. Change it after payment is confirmed.
    setEndSessionOpen(true);
  };
  
  const handleSessionEnd = async (bill: Omit<Bill, 'id'>) => {
    if (!firestore) return;

    try {
      await runTransaction(firestore, async (transaction) => {
        // 1. Save the bill
        const billsCollection = collection(firestore, 'bills');
        const newBillRef = doc(billsCollection); // Create a new ref for the bill
        transaction.set(newBillRef, bill);

        // 2. Update stock for each item
        for (const item of bill.sessionItems) {
          const productRef = doc(firestore, 'products', item.product.id);
          const productDoc = await transaction.get(productRef);
          if (!productDoc.exists()) {
            throw new Error(`Product ${item.product.name} not found!`);
          }
          const currentStock = productDoc.data().stock;
          const newStock = currentStock - item.quantity;
          transaction.update(productRef, { stock: newStock });
        }

        // 3. Reset the table
        transaction.update(tableRef, {
          status: 'available',
          elapsedTime: 0,
          startTime: 0,
          sessionItems: [],
          lastPausedTime: null,
        });
      });

      toast({
        title: "Session Completed",
        description: `Bill for ${table.name} has been finalized and stock updated.`,
      });

      onSessionChange?.();

    } catch (error: any) {
      console.error("Session end transaction failed: ", error);
      toast({
        variant: "destructive",
        title: "Error Ending Session",
        description: error.message || "Could not finalize the bill or update stock.",
      });
    }
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

  const handleRemoveItem = (productId: string) => {
    if (!tableRef) return;
    const newSessionItems = table.sessionItems.filter(si => si.product.id !== productId);
    updateDocumentNonBlocking(tableRef, { sessionItems: newSessionItems });
    toast({ title: 'Item Removed', description: `Item removed from ${table.name}.` });
    onSessionChange?.();
  };


  const getStatusBadge = () => {
    switch (table.status) {
      case 'available':
        return <Badge variant="secondary">Available</Badge>;
      case 'in-use':
        return <Badge className="bg-green-600 text-white">In Use</Badge>;
      case 'paused':
        return <Badge variant="destructive">Stopped</Badge>;
    }
  };

  const itemsBill = table.sessionItems?.reduce((total, item) => total + item.product.price * item.quantity, 0) || 0;
  const tableBill = table.status !== 'available' ? (elapsedTime / 3600 * table.hourlyRate) : 0;
  const totalBill = tableBill + itemsBill;

  return (
    <>
      <Card className="flex flex-col min-h-[450px]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-headline text-2xl">{table.name}</CardTitle>
            {getStatusBadge()}
          </div>
          <CardDescription>${table.hourlyRate.toFixed(2)} / hour</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col items-center justify-center gap-4">
            <div className="flex items-center gap-2 text-4xl font-bold font-mono tracking-wider text-center">
                <Hourglass className={cn("h-8 w-8", table.status === 'in-use' && 'text-accent animate-pulse')} />
                <span>{formatTime(elapsedTime)}</span>
            </div>
            <div className='text-center'>
              <p className="text-sm text-muted-foreground">
                  Table Cost: ${tableBill.toFixed(2)}
              </p>
              <p className="text-xl font-bold">
                  Total Bill: ${totalBill.toFixed(2)}
              </p>
            </div>

            <Separator className='my-2' />

            <div className='w-full flex-grow'>
                <h4 className='text-sm font-medium mb-2 text-center'>Session Items</h4>
                <ScrollArea className='h-24'>
                    <div className='space-y-2 pr-4'>
                    {table.sessionItems?.length > 0 ? (
                        table.sessionItems.map((item, index) => (
                            <div key={`${item.product.id}-${index}`} className="flex justify-between items-center text-sm">
                                <span className='truncate pr-2'>{item.quantity}x {item.product.name}</span>
                                <div className='flex items-center gap-2'>
                                  <span className='font-mono'>${(item.product.price * item.quantity).toFixed(2)}</span>
                                  <Button variant="ghost" size="icon" className='h-6 w-6' onClick={() => handleRemoveItem(item.product.id)}>
                                    <Trash2 className='h-3 w-3 text-destructive' />
                                  </Button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className='text-xs text-muted-foreground text-center pt-4'>No items added yet.</p>
                    )}
                    </div>
                </ScrollArea>
            </div>
        </CardContent>
        <CardFooter className="grid grid-cols-2 gap-2 mt-auto">
          {table.status === 'available' && (
            <Button onClick={handleStart} className="col-span-2">
              <Play className="mr-2 h-4 w-4" /> Start Session
            </Button>
          )}
          {table.status === 'in-use' && (
              <Button onClick={handlePause} variant="outline" className='col-span-2'>
                <Pause className="mr-2 h-4 w-4" /> Stop Timer
              </Button>
          )}
          {table.status === 'paused' && (
            <>
              <Button onClick={handleResume}>
                <Play className="mr-2 h-4 w-4" /> Resume
              </Button>
              <Button onClick={handleOpenBillDialog} variant="destructive">
                <FileText className="mr-2 h-4 w-4" /> Generate Bill
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
