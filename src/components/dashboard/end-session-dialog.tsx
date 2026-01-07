'use client';

import { useState, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { BilliardTable } from '@/lib/types';
import { getSuggestedNotes } from '@/lib/actions';
import { Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '../ui/separator';

interface EndSessionDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  table: BilliardTable;
  elapsedTime: number;
}

export function EndSessionDialog({ isOpen, onOpenChange, table, elapsedTime }: EndSessionDialogProps) {
  const [notes, setNotes] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const tableBill = (elapsedTime / 3600) * table.hourlyRate;
  const itemsBill = table.sessionItems.reduce((total, item) => total + item.product.price * item.quantity, 0);
  const totalBill = tableBill + itemsBill;

  const handleGenerateNotes = () => {
    startTransition(async () => {
      const itemsString = table.sessionItems
        .map(item => `${item.quantity}x ${item.product.name}`)
        .join(', ');
      
      const result = await getSuggestedNotes(elapsedTime, itemsString);
      if (result.success && result.notes) {
        setNotes(result.notes);
        toast({ title: 'AI Notes Generated', description: 'Session notes have been suggested by AI.' });
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
      }
    });
  };
  
  const handleClose = () => {
    setNotes('');
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Session Ended for {table.name}</DialogTitle>
          <DialogDescription>Review the session details and finalize the bill.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div className="flex justify-between"><span>Table Time:</span> <span className="font-mono">{new Date(elapsedTime * 1000).toISOString().slice(11, 19)}</span></div>
            <div className="flex justify-between"><span>Table Bill:</span> <span className="font-mono">${tableBill.toFixed(2)}</span></div>
            {table.sessionItems.length > 0 && (
                <>
                 <Separator />
                 {table.sessionItems.map(item => (
                    <div key={item.product.id} className="flex justify-between text-sm text-muted-foreground">
                        <span>{item.quantity}x {item.product.name}</span>
                        <span className="font-mono">${(item.quantity * item.product.price).toFixed(2)}</span>
                    </div>
                 ))}
                 <Separator />
            </>
            )}
            <div className="flex justify-between text-lg font-bold"><span>Total Bill:</span> <span className="font-mono">${totalBill.toFixed(2)}</span></div>

          <div className="space-y-2 pt-4">
            <label htmlFor="notes" className="text-sm font-medium">Session Notes</label>
            <Textarea
              id="notes"
              placeholder="Add any notes for this session..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateNotes}
              disabled={isPending}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {isPending ? 'Generating...' : 'Suggest Notes with AI'}
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleClose} variant="secondary">Cancel</Button>
          <Button onClick={handleClose}>Confirm Payment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
