
'use client';

import { useState, useTransition, useMemo } from 'react';
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
import type { BilliardTable, Bill } from '@/lib/types';
import { getSuggestedNotes } from '@/lib/actions';
import { Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '../ui/separator';
import { useFirestore, useUser } from '@/firebase';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';

interface EndSessionDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  table: BilliardTable;
  elapsedTime: number;
  onSessionEnd: (bill: Omit<Bill, 'id'>, tableName: string) => void;
}

export function EndSessionDialog({ isOpen, onOpenChange, table, elapsedTime, onSessionEnd }: EndSessionDialogProps) {
  const [notes, setNotes] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { user } = useUser();
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi'>('cash');
  

  const tableBill = useMemo(() => (elapsedTime / 3600) * table.hourlyRate, [elapsedTime, table.hourlyRate]);
  const itemsBill = useMemo(() => table.sessionItems.reduce((total, item) => total + item.product.price * item.quantity, 0), [table.sessionItems]);
  const totalBill = useMemo(() => Math.floor(tableBill + itemsBill), [tableBill, itemsBill]);

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

  
  const handleConfirmPayment = () => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not process payment. User not logged in.' });
        return;
    }

    const bill: Omit<Bill, 'id'> = {
        sessionId: table.id, // Assuming session ID is the table ID for simplicity
        billDate: new Date().toISOString(),
        totalAmount: totalBill,
        amountPaid: totalBill,
        paymentMethod: paymentMethod,
        staffId: user.uid,
        sessionItems: table.sessionItems,
        tableBill: tableBill,
        itemsBill: itemsBill,
        notes: notes,
    };

    onSessionEnd(bill, table.name);
    handleClose();
  }

  const handleClose = () => {
    setNotes('');
    setPaymentMethod('cash');
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Final Bill: {table.name}</DialogTitle>
          <DialogDescription>Review the final bill and confirm payment.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Table Time:</span> 
              <span className="font-mono">{new Date(elapsedTime * 1000).toISOString().slice(11, 19)}</span>
            </div>
            <div className="flex justify-between items-center font-medium">
              <span>Table Cost:</span> 
              <span className="font-mono">₹{tableBill.toFixed(2)}</span>
            </div>

            {table.sessionItems.length > 0 && (
                <>
                 <Separator className="my-2"/>
                 <div className="flex justify-between items-center font-medium">
                  <span>Products Cost:</span>
                  <span className="font-mono">₹{itemsBill.toFixed(2)}</span>
                 </div>
                 <div className="pl-4 border-l-2 border-dashed border-muted-foreground/50 ml-1 space-y-1 mt-1">
                  {table.sessionItems.map(item => (
                      <div key={item.product.id} className="flex justify-between text-sm text-muted-foreground">
                          <span>{item.quantity}x {item.product.name}</span>
                          <span className="font-mono">₹{(item.quantity * item.product.price).toFixed(2)}</span>
                      </div>
                  ))}
                 </div>
            </>
            )}

            <Separator className="my-2" />

            <div className="flex justify-between text-lg font-bold">
              <span>Total Bill:</span> 
              <span className="font-mono">₹{totalBill.toFixed(2)}</span>
            </div>


            <Separator className="my-2" />

            <div className="space-y-2 pt-2">
                <Label>Payment Method</Label>
                <RadioGroup
                    defaultValue="cash"
                    value={paymentMethod}
                    onValueChange={(value: 'cash' | 'upi') => setPaymentMethod(value)}
                    className="flex gap-4"
                >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="cash" id="cash" />
                      <Label htmlFor="cash">Cash</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="upi" id="upi" />
                      <Label htmlFor="upi">UPI</Label>
                    </div>
                </RadioGroup>
            </div>

          <div className="space-y-2 pt-4">
            <Label htmlFor="notes">Session Notes (Optional)</Label>
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
          <Button onClick={handleConfirmPayment}>Download Bill &amp; End Session</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Add 'notes' to the Bill type in your types file
declare module '@/lib/types' {
    interface Bill {
        notes?: string;
    }
}
