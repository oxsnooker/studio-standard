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
import type { BilliardTable, SessionItem } from '@/lib/types';
import { Hourglass, Pause, Play, Square, UtensilsCrossed } from 'lucide-react';
import { EndSessionDialog } from './end-session-dialog';

interface TableCardProps {
  table: BilliardTable;
  onUpdate: (tableId: string, updates: Partial<BilliardTable>) => void;
  onAddItem: (tableId: string, item: SessionItem) => void;
}

const formatTime = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export function TableCard({ table, onUpdate, onAddItem }: TableCardProps) {
  const [elapsedTime, setElapsedTime] = useState(table.elapsedTime);
  const [isEndSessionOpen, setEndSessionOpen] = useState(false);

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
    setElapsedTime(table.elapsedTime);
  }, [table.elapsedTime]);

  const handleStart = () => {
    onUpdate(table.id, { status: 'in-use', startTime: Date.now(), elapsedTime: 0, sessionItems: [] });
  };

  const handlePause = () => {
    onUpdate(table.id, { status: 'paused', elapsedTime });
  };

  const handleResume = () => {
    onUpdate(table.id, { status: 'in-use' });
  };

  const handleStop = () => {
    onUpdate(table.id, { status: 'available', elapsedTime });
    setEndSessionOpen(true);
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
          <Button variant="secondary" className="col-span-2" disabled={table.status === 'available'}>
              <UtensilsCrossed className="mr-2 h-4 w-4" /> Add Items
          </Button>
        </CardFooter>
      </Card>
      <EndSessionDialog
        isOpen={isEndSessionOpen}
        onOpenChange={setEndSessionOpen}
        table={table}
        elapsedTime={elapsedTime}
      />
    </>
  );
}
