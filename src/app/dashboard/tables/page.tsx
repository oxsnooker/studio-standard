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

export default function TablesPage() {
  const firestore = useFirestore();

  // State for Add dialog
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [newTablePrice, setNewTablePrice] = useState('');

  // State for Edit dialog
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<BilliardTable | null>(null);
  const [editTableName, setEditTableName] = useState('');
  const [editTablePrice, setEditTablePrice] = useState('');
  
  // State for Delete dialog
  const [deletingTable, setDeletingTable] = useState<BilliardTable | null>(null);


  const tablesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'tables');
  }, [firestore]);

  const { data: tables, isLoading } = useCollection<BilliardTable>(tablesQuery);

  const handleAddTable = () => {
    if (!firestore || !newTableName || !newTablePrice || Number(newTablePrice) <= 0) return;
    
    const tablesCollection = collection(firestore, 'tables');
    const newTable: Omit<BilliardTable, 'id'> = {
      name: newTableName,
      status: 'available',
      hourlyRate: Number(newTablePrice),
      startTime: 0,
      elapsedTime: 0,
      sessionItems: [],
    };
    addDocumentNonBlocking(tablesCollection, newTable);
    setAddDialogOpen(false);
    setNewTableName('');
    setNewTablePrice('');
  };
  
  const openEditDialog = (table: BilliardTable) => {
    setEditingTable(table);
    setEditTableName(table.name);
    setEditTablePrice(table.hourlyRate.toString());
    setEditDialogOpen(true);
  };
  
  const handleUpdateTable = () => {
    if (!firestore || !editingTable || !editTableName || !editTablePrice || Number(editTablePrice) <= 0) return;
    const tableRef = doc(firestore, 'tables', editingTable.id);
    updateDocumentNonBlocking(tableRef, { 
      name: editTableName,
      hourlyRate: Number(editTablePrice)
    });
    setEditDialogOpen(false);
    setEditingTable(null);
  };

  const handleDeleteTable = () => {
    if (!firestore || !deletingTable) return;
    const tableRef = doc(firestore, 'tables', deletingTable.id);
    deleteDocumentNonBlocking(tableRef);
    setDeletingTable(null);
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
                  <TableCell>${table.hourlyRate.toFixed(2)}</TableCell>
                  <TableCell>{table.status}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(table)}>
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
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the table
                             "{deletingTable?.name}" and all its associated data.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteTable}>Continue</AlertDialogAction>
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

      {/* Add Table Dialog */}
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
                onChange={(e) => setNewTablePrice(e.target.value)}
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
      
      {/* Edit Table Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Table</DialogTitle>
            <DialogDescription>
              Update the details for the table. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Name
              </Label>
              <Input
                id="edit-name"
                value={editTableName}
                onChange={(e) => setEditTableName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-price" className="text-right">
                Price/Hour
              </Label>
              <Input
                id="edit-price"
                type="number"
                value={editTablePrice}
                onChange={(e) => setEditTablePrice(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button type="submit" onClick={handleUpdateTable}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
