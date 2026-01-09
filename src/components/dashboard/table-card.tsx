
'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { Hourglass, Pause, Play, UtensilsCrossed, Trash2, FileText, Clock, PlayCircle, PauseCircle } from 'lucide-react';
import { EndSessionDialog } from './end-session-dialog';
import { AddItemDialog } from './add-item-dialog';
import { doc, collection, runTransaction } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { updateDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { generateBillPdf } from '@/lib/generate-pdf';
import { format } from 'date-fns';

interface TableCardProps {
  table: BilliardTable;
  onSessionChange?: () => void;
}

const formatTime = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export function TableCard({ table, onSessionChange }: TableCardProps) {
  const [elapsedTime, setElapsedTime] = useState(table.elapsedTime || 0);
  const [isEndSessionOpen, setEndSessionOpen] = useState(false);
  const [isAddItemOpen, setAddItemOpen] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  const tableRef = useMemo(() => {
    if(!firestore) return null;
    return doc(firestore, 'tables', table.id);
  }, [firestore, table.id]);


  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (table.status === 'in-use' && table.startTime) {
        // Function to calculate elapsed time and set it
        const calculateAndSetElapsedTime = () => {
            const now = Date.now();
            // elapsed since the current segment started
            const elapsedSinceStart = Math.floor((now - (table.startTime || now)) / 1000);
            // total elapsed time is previous elapsed time + current segment's elapsed time
            setElapsedTime((table.elapsedTime || 0) + elapsedSinceStart);
        };
        
        calculateAndSetElapsedTime(); // Initial calculation

        interval = setInterval(() => {
            // We can just increment here for smoother updates
            setElapsedTime(prev => prev + 1);
        }, 1000);

    } else {
        // If not in-use, just display the stored elapsedTime
        setElapsedTime(table.elapsedTime || 0);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [table.status, table.startTime, table.elapsedTime]);

  const handleStart = () => {
    if (!tableRef) return;
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
    if (!tableRef || !table.startTime) return;
    const now = Date.now();
    const elapsedSinceStart = Math.floor((now - table.startTime) / 1000);
    const newElapsedTime = (table.elapsedTime || 0) + elapsedSinceStart;
    
    updateDocumentNonBlocking(tableRef, { 
      status: 'paused',
      elapsedTime: newElapsedTime,
      lastPausedTime: now,
      startTime: 0 // Reset start time as we now rely on elapsedTime
    });
    onSessionChange?.();
  };

  const handleResume = () => {
    if (!tableRef) return;
    updateDocumentNonBlocking(tableRef, { 
        status: 'in-use',
        startTime: Date.now(), // Set new start time for current running segment
        lastPausedTime: null,
    });
    onSessionChange?.();
  };

  const handleOpenBillDialog = () => {
    // Don't change status here. Change it after payment is confirmed.
    setEndSessionOpen(true);
  };
  
  const handleSessionEnd = async (bill: Omit<Bill, 'id'>, tableName: string) => {
    if (!firestore || !tableRef) return;

    try {
      await runTransaction(firestore, async (transaction) => {
        const newBillRef = doc(collection(firestore, 'bills'));
        transaction.set(newBillRef, bill);

        transaction.update(tableRef, {
          status: 'available',
          elapsedTime: 0,
          startTime: 0,
          sessionItems: [],
          lastPausedTime: null,
        });
      });

      // Generate and download PDF after transaction is successful
      generateBillPdf(bill, tableName, elapsedTime);

      toast({
        title: "Session Completed",
        description: `Bill for ${tableName} has been finalized.`,
      });

      onSessionChange?.();

    } catch (error: any) {
      console.error("Session end transaction failed: ", error);
      toast({
        variant: "destructive",
        title: "Error Ending Session",
        description: error.message || "Could not finalize the bill.",
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
          <CardDescription>₹{table.hourlyRate.toFixed(2)} / hour</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col items-center justify-center gap-4">
            <div className="flex items-center gap-2 text-4xl font-bold font-mono tracking-wider text-center">
                <Hourglass className={cn("h-8 w-8", table.status === 'in-use' && 'text-accent animate-pulse')} />
                <span>{formatTime(elapsedTime)}</span>
            </div>
            <div className='text-center'>
              <p className="text-sm text-muted-foreground">
                  Table Cost: ₹{tableBill.toFixed(2)}
              </p>
              <p className="text-xl font-bold">
                  Total Bill: ₹{totalBill.toFixed(2)}
              </p>
            </div>
            
            <div className="text-xs text-muted-foreground mt-2 grid grid-cols-2 gap-x-4 text-center">
                {table.status !== 'available' && table.startTime ? (
                    <div className="flex items-center gap-1">
                        <PlayCircle className="h-3 w-3 text-green-500" />
                        <span>Start: {format(table.startTime, 'p')}</span>
                    </div>
                ) : <div />}
                {table.status === 'paused' && table.lastPausedTime ? (
                    <div className="flex items-center gap-1">
                        <PauseCircle className="h-3 w-3 text-red-500" />
                        <span>Stop: {format(table.lastPausedTime, 'p')}</span>
                    </div>
                ) : <div />}
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
                                  <span className='font-mono'>₹{(item.product.price * item.quantity).toFixed(2)}</span>
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
                <Pause className="mr-2 h-4 w-4" /> Stop/Resume
              </Button>
          )}
          {table.status === 'paused' && (
            <>
              <Button onClick={handleResume}>
                <Play className="mr-2 h-4 w-4" /> Resume
              </Button>
              <Button onClick={handleOpenBillDialog} variant="destructive">
                <FileText className="mr-2 h-4 w-4" /> Close
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

