'use client';

import { useState, useEffect } from 'react';
import type { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';

export default function StockPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [stockLevels, setStockLevels] = useState<Record<string, number>>({});

  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'products');
  }, [firestore]);

  const { data: products, isLoading } = useCollection<Product>(productsQuery);

  useEffect(() => {
    if (products) {
      const initialStock = products.reduce((acc, product) => {
        acc[product.id] = product.stock;
        return acc;
      }, {} as Record<string, number>);
      setStockLevels(initialStock);
    }
  }, [products]);

  const handleStockChange = (productId: string, value: string) => {
    const newStock = parseInt(value, 10);
    setStockLevels(prev => ({
      ...prev,
      [productId]: isNaN(newStock) ? 0 : newStock,
    }));
  };

  const handleUpdateStock = (productId: string) => {
    if (!firestore) return;
    const newStock = stockLevels[productId];
    if (newStock === undefined || newStock < 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Stock Value',
        description: 'Stock cannot be negative.',
      });
      return;
    }
    
    const productRef = doc(firestore, 'products', productId);
    updateDocumentNonBlocking(productRef, { stock: newStock });

    toast({
      title: 'Stock Updated',
      description: `Stock for product has been saved.`,
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-headline text-3xl md:text-4xl">Stock Management</h1>
      
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="w-[150px]">Current Stock</TableHead>
              <TableHead className="w-[120px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(4)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><div className="h-6 w-full animate-pulse rounded-md bg-card" /></TableCell>
                  <TableCell><div className="h-6 w-full animate-pulse rounded-md bg-card" /></TableCell>
                  <TableCell><div className="h-6 w-full animate-pulse rounded-md bg-card" /></TableCell>
                  <TableCell><div className="h-6 w-full animate-pulse rounded-md bg-card" /></TableCell>
                </TableRow>
              ))
            ) : (
              products?.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={stockLevels[product.id] ?? ''}
                      onChange={(e) => handleStockChange(product.id, e.target.value)}
                      className="h-8 w-24"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleUpdateStock(product.id)}
                      disabled={(stockLevels[product.id] ?? 0) === product.stock}
                    >
                      <Save className="h-4 w-4 text-primary" />
                      <span className="sr-only">Save Stock</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
            {!isLoading && products?.length === 0 && (
                <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">
                        No products found. Add products on the 'Snacks & Drinks' page.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
