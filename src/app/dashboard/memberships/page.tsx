
'use client';

import { useState } from 'react';
import type { Membership } from '@/lib/types';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';


export default function MembershipsPage() {
    const firestore = useFirestore();
    const { toast } = useToast();

    // State for plans
    const [isPlanDialogOpen, setPlanDialogOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Membership | null>(null);
    const [deletingPlan, setDeletingPlan] = useState<Membership | null>(null);
    const [newPlanName, setNewPlanName] = useState('');
    const [newPlanDescription, setNewPlanDescription] = useState('');
    const [newPlanHours, setNewPlanHours] = useState('');
    const [newPlanPrice, setNewPlanPrice] = useState('');

    const plansQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'memberships');
    }, [firestore]);
    const { data: plans, isLoading: isLoadingPlans } = useCollection<Membership>(plansQuery);


    const handleAddOrUpdatePlan = () => {
        if (!firestore) return;
        
        if (editingPlan) {
            // Update
            const planRef = doc(firestore, 'memberships', editingPlan.id);
            updateDocumentNonBlocking(planRef, {
                name: newPlanName,
                description: newPlanDescription,
                totalHours: Number(newPlanHours),
                price: Number(newPlanPrice),
            });
            toast({ title: 'Plan Updated', description: `The "${newPlanName}" plan has been updated.` });
        } else {
            // Add
            const plansCollection = collection(firestore, 'memberships');
            const newPlan: Omit<Membership, 'id'> = {
                name: newPlanName,
                description: newPlanDescription,
                totalHours: Number(newPlanHours),
                price: Number(newPlanPrice),
            };
            addDocumentNonBlocking(plansCollection, newPlan);
            toast({ title: 'Plan Created', description: `The "${newPlanName}" plan has been created.` });
        }
        
        setPlanDialogOpen(false);
        setEditingPlan(null);
        setNewPlanName('');
        setNewPlanDescription('');
        setNewPlanHours('');
        setNewPlanPrice('');
    };

    const openPlanDialog = (plan?: Membership) => {
        if (plan) {
            setEditingPlan(plan);
            setNewPlanName(plan.name);
            setNewPlanDescription(plan.description);
            setNewPlanHours(String(plan.totalHours));
            setNewPlanPrice(String(plan.price));
        } else {
            setEditingPlan(null);
            setNewPlanName('');
            setNewPlanDescription('');
            setNewPlanHours('');
            setNewPlanPrice('');
        }
        setPlanDialogOpen(true);
    };

    const handleDeletePlan = () => {
        if (!firestore || !deletingPlan) return;
        const planRef = doc(firestore, 'memberships', deletingPlan.id);
        deleteDocumentNonBlocking(planRef);
        toast({ title: 'Plan Deleted', description: `The "${deletingPlan.name}" plan has been deleted.` });
        setDeletingPlan(null);
    }
  
  return (
    <div className="flex flex-col gap-8">
        <h1 className="font-headline text-3xl md:text-4xl">Membership Management</h1>
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>All Membership Plans</CardTitle>
                    <Button onClick={() => openPlanDialog()}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Create Plan
                    </Button>
                </div>
                <CardDescription>
                    Create and manage all membership plans for your club.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="rounded-lg border">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Plan Name</TableHead>
                            <TableHead>Total Hours</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoadingPlans ? (
                                [...Array(2)].map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><div className="h-6 w-full animate-pulse rounded-md bg-card" /></TableCell>
                                        <TableCell><div className="h-6 w-full animate-pulse rounded-md bg-card" /></TableCell>
                                        <TableCell><div className="h-6 w-full animate-pulse rounded-md bg-card" /></TableCell>
                                        <TableCell><div className="h-6 w-full animate-pulse rounded-md bg-card" /></TableCell>
                                    </TableRow>
                                ))
                            ) : (
                            plans?.map((plan) => (
                                <TableRow key={plan.id}>
                                    <TableCell className="font-medium">{plan.name}</TableCell>
                                    <TableCell>{plan.totalHours} hours</TableCell>
                                    <TableCell>Rs.{plan.price.toFixed(2)}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => openPlanDialog(plan)}>
                                            <Pencil className="h-4 w-4" />
                                            <span className="sr-only">Edit</span>
                                        </Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" onClick={() => setDeletingPlan(plan)}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                    <span className="sr-only">Delete</span>
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will permanently delete the "{deletingPlan?.name}" plan.
                                                </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                <AlertDialogCancel onClick={() => setDeletingPlan(null)}>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleDeletePlan}>Delete</AlertDialogAction>
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

        {/* Create/Edit Plan Dialog */}
        <Dialog open={isPlanDialogOpen} onOpenChange={setPlanDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>{editingPlan ? 'Edit' : 'Create New'} Membership Plan</DialogTitle>
                <DialogDescription>
                Enter the details for the plan. Click save when you're done.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="plan-name" className="text-right">Name</Label>
                    <Input id="plan-name" value={newPlanName} onChange={(e) => setNewPlanName(e.target.value)} className="col-span-3" placeholder="e.g., Gold Tier"/>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="plan-desc" className="text-right">Description</Label>
                    <Input id="plan-desc" value={newPlanDescription} onChange={(e) => setNewPlanDescription(e.target.value)} className="col-span-3" placeholder="e.g., 20 hours access"/>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="plan-hours" className="text-right">Total Hours</Label>
                    <Input id="plan-hours" type="number" value={newPlanHours} onChange={(e) => setNewPlanHours(e.target.value)} className="col-span-3" placeholder="e.g., 20"/>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="plan-price" className="text-right">Price</Label>
                    <Input id="plan-price" type="number" value={newPlanPrice} onChange={(e) => setNewPlanPrice(e.target.value)} className="col-span-3" placeholder="e.g., 100.00"/>
                </div>
            </div>
            <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => { setPlanDialogOpen(false); setEditingPlan(null); }}>Cancel</Button>
                <Button type="submit" onClick={handleAddOrUpdatePlan}>Save Plan</Button>
            </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}

