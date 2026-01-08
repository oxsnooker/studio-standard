'use client';

import { useState } from 'react';
import type { BilliardTable } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function TablesPage() {
  const firestore = useFirestore();
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [newTablePrice, setNewTablePrice] = useState(0);

  const tablesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'tables');
  }, [firestore]);

  const { data: tables, isLoading } = useCollection<BilliardTable>(tablesQuery);

  const handleAddTable = () => {
    if (!firestore || !newTableName || newTablePrice <= 0) return;
    
    const tablesCollection = collection(firestore, 'tables');
    const newTable: Omit<BilliardTable, 'id'> = {
      name: newTableName,
      status: 'available',
      hourlyRate: newTablePrice,
      startTime: 0,
      elapsedTime: 0,
      sessionItems: [],
    };
    addDocumentNonBlocking(tablesCollection, newTable);
    setAddDialogOpen(false);
    setNewTableName('');
    setNewTablePrice(0);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-3xl md:text-4xl">Table Management</h1>
        <Button onClick={() => setAddDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Table
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Table Name</TableHead>
              <TableHead>Price Per Hour</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(3)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><div className="h-6 w-full animate-pulse rounded-md bg-card" /></TableCell>
                  <TableCell><div className="h-6 w-full animate-pulse rounded-md bg-card" /></TableCell>
                  <TableCell><div className="h-6 w-full animate-pulse rounded-md bg-card" /></TableCell>
                </TableRow>
              ))
            ) : (
              tables?.map((table) => (
                <TableRow key={table.id}>
                  <TableCell className="font-medium">{table.name}</TableCell>
                  <TableCell>${table.hourlyRate.toFixed(2)}</TableCell>
                  <TableCell>{table.status}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Table</DialogTitle>
            <DialogDescription>
              Enter the details for the new table. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
                className="col-span-3"
                placeholder="e.g., Table 7"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                Price/Hour
              </Label>
              <Input
                id="price"
                type="number"
                value={newTablePrice}
                onChange={(e) => setNewTablePrice(Number(e.target.value))}
                className="col-span-3"
                placeholder="e.g., 12.50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button type="submit" onClick={handleAddTable}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
