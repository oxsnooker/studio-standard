'use client';

import { useState } from 'react';
import type { BilliardTable } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, Pencil, Trash2 } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function TablesPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<BilliardTable | null>(null);
  const [deletingTable, setDeletingTable] = useState<BilliardTable | null>(null);
  
  const [tableName, setTableName] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');

  const tablesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'tables');
  }, [firestore]);

  const { data: tables, isLoading } = useCollection<BilliardTable>(tablesQuery);

  const openDialog = (table?: BilliardTable) => {
    if (table) {
      setEditingTable(table);
      setTableName(table.name);
      setHourlyRate(String(table.hourlyRate));
    } else {
      setEditingTable(null);
      setTableName('');
      setHourlyRate('');
    }
    setDialogOpen(true);
  };

  const handleAddOrUpdateTable = () => {
    if (!firestore || !tableName || !hourlyRate) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please fill out all fields.' });
        return;
    }
    
    const rate = parseFloat(hourlyRate);
    if (isNaN(rate) || rate < 0) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please enter a valid hourly rate.' });
        return;
    }

    if (editingTable) {
      // Update
      const tableRef = doc(firestore, 'tables', editingTable.id);
      updateDocumentNonBlocking(tableRef, {
        name: tableName,
        hourlyRate: rate,
      });
      toast({ title: 'Table Updated', description: `The "${tableName}" table has been updated.` });
    } else {
      // Add
      const tablesCollection = collection(firestore, 'tables');
      const newTable: Partial<BilliardTable> = {
        name: tableName,
        hourlyRate: rate,
        status: 'available', // Default status for new tables
        elapsedTime: 0,
        startTime: 0,
        sessionItems: [],
        createdAt: Date.now(), // Add creation timestamp
      };
      addDocumentNonBlocking(tablesCollection, newTable);
      toast({ title: 'Table Created', description: `The "${tableName}" table has been created.` });
    }

    setDialogOpen(false);
    setEditingTable(null);
  };

  const handleDeleteTable = () => {
    if (!firestore || !deletingTable) return;
    const tableRef = doc(firestore, 'tables', deletingTable.id);
    deleteDocumentNonBlocking(tableRef);
    toast({ title: 'Table Deleted', description: `The "${deletingTable.name}" table has been deleted.` });
    setDeletingTable(null);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-3xl md:text-4xl">Table Management</h1>
        <Button onClick={() => openDialog()}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Table
        </Button>
      </div>

      <Card>
          <CardHeader>
              <CardTitle>All Tables</CardTitle>
              <CardDescription>View, add, edit, or remove tables from your club.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Table Name</TableHead>
                    <TableHead>Hourly Rate</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                    [...Array(3)].map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><div className="h-6 w-full animate-pulse rounded-md bg-card" /></TableCell>
                            <TableCell><div className="h-6 w-full animate-pulse rounded-md bg-card" /></TableCell>
                            <TableCell><div className="h-6 w-full animate-pulse rounded-md bg-card" /></TableCell>
                            <TableCell><div className="h-6 w-full animate-pulse rounded-md bg-card" /></TableCell>
                        </TableRow>
                    ))
                    ) : (
                    tables?.map((table) => (
                        <TableRow key={table.id}>
                        <TableCell className="font-medium">{table.name}</TableCell>
                        <TableCell>₹{table.hourlyRate.toFixed(2)}</TableCell>
                        <TableCell>{table.status}</TableCell>
                        <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => openDialog(table)}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                            </Button>
                            <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => setDeletingTable(table)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                                <span className="sr-only">Delete</span>
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will permanently delete the "{deletingTable?.name}" table.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setDeletingTable(null)}>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteTable}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                            </AlertDialog>
                        </TableCell>
                        </TableRow>
                    ))
                    )}
                </TableBody>
                </Table>
            </div>
          </CardContent>
      </Card>
      
      {/* Dialog for Add/Edit Table */}
      <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingTable ? 'Edit Table' : 'Add New Table'}</DialogTitle>
            <DialogDescription>
              Enter the details for the table. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="table-name" className="text-right">
                Name
              </Label>
              <Input
                id="table-name"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                className="col-span-3"
                placeholder="e.g., Table 1"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="hourly-rate" className="text-right">
                Hourly Rate
              </Label>
              <Input
                id="hourly-rate"
                type="number"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                className="col-span-3"
                placeholder="e.g., 10.00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" onClick={handleAddOrUpdateTable}>Save Table</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
