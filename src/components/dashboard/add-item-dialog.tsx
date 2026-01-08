'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Product, SessionItem } from '@/lib/types';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface AddItemDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddItem: (item: SessionItem) => void;
}

export function AddItemDialog({ isOpen, onOpenChange, onAddItem }: AddItemDialogProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);

  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'products');
  }, [firestore]);
  const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);

  const handleAddItem = () => {
    const product = products?.find(p => p.id === selectedProductId);
    if (!product) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please select a product.' });
      return;
    }
    if (quantity <= 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'Quantity must be greater than zero.' });
      return;
    }

    onAddItem({ product, quantity });
    handleClose();
  };

  const handleClose = () => {
    setSelectedProductId('');
    setQuantity(1);
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Item to Session</DialogTitle>
          <DialogDescription>Select a product and quantity to add to the bill.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="product">Product</Label>
            <Select onValueChange={setSelectedProductId} value={selectedProductId}>
              <SelectTrigger id="product">
                <SelectValue placeholder="Select a product..." />
              </SelectTrigger>
              <SelectContent>
                {isLoadingProducts ? (
                  <SelectItem value="loading" disabled>Loading...</SelectItem>
                ) : (
                  products?.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} - ₹{product.price.toFixed(2)}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              min="1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleClose} variant="secondary">Cancel</Button>
          <Button onClick={handleAddItem}>Add Item</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
