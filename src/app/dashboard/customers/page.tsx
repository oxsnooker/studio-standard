'use client';

import { useState } from 'react';
import type { Membership, Customer } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { UserPlus, Pencil, Trash2 } from 'lucide-react';
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
} from "@/components/ui/alert-dialog"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';


export default function CustomersPage() {
    const firestore = useFirestore();
    const { toast } = useToast();

    // State for plans (needed for dropdown)
    const plansQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'memberships');
    }, [firestore]);
    const { data: plans, isLoading: isLoadingPlans } = useCollection<Membership>(plansQuery);


    // State for customers
    const [isCustomerDialogOpen, setCustomerDialogOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
    const [newCustomerFirstName, setNewCustomerFirstName] = useState('');
    const [newCustomerLastName, setNewCustomerLastName] = useState('');
    const [newCustomerPhone, setNewCustomerPhone] = useState('');
    const [newCustomerEmail, setNewCustomerEmail] = useState('');
    const [newCustomerMembershipId, setNewCustomerMembershipId] = useState('');
    const [newCustomerValidFrom, setNewCustomerValidFrom] = useState('');
    const [newCustomerValidTill, setNewCustomerValidTill] = useState('');

    const customersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'customers');
    }, [firestore]);
    const { data: customers, isLoading: isLoadingCustomers } = useCollection<Customer>(customersQuery);
    
    const handleAddOrUpdateCustomer = () => {
        if (!firestore) return;

        const isMembershipSelected = newCustomerMembershipId && newCustomerMembershipId !== 'none';
        const plan = plans?.find(p => p.id === newCustomerMembershipId);
        
        const customerData: Omit<Customer, 'id'> & {id?: string} = {
            firstName: newCustomerFirstName,
            lastName: newCustomerLastName,
            phone: newCustomerPhone,
            email: newCustomerEmail,
            membershipId: isMembershipSelected ? newCustomerMembershipId : null,
            remainingHours: isMembershipSelected ? (plan?.totalHours || 0) : 0,
            validFrom: newCustomerValidFrom || null,
            validTill: newCustomerValidTill || null,
        }

        if(editingCustomer) {
            const customerRef = doc(firestore, 'customers', editingCustomer.id);
            updateDocumentNonBlocking(customerRef, customerData);
             toast({ title: 'Customer Updated', description: `${newCustomerFirstName} ${newCustomerLastName}'s details have been updated.` });
        } else {
            const customersCollection = collection(firestore, 'customers');
            addDocumentNonBlocking(customersCollection, customerData);
            toast({ title: 'Customer Added', description: `${newCustomerFirstName} ${newCustomerLastName} has been added.` });
        }

        setCustomerDialogOpen(false);
        setEditingCustomer(null);
        setNewCustomerFirstName('');
        setNewCustomerLastName('');
        setNewCustomerPhone('');
        setNewCustomerEmail('');
        setNewCustomerMembershipId('');
        setNewCustomerValidFrom('');
        setNewCustomerValidTill('');
    }

    const openCustomerDialog = (customer?: Customer) => {
        if (customer) {
            setEditingCustomer(customer);
            setNewCustomerFirstName(customer.firstName);
            setNewCustomerLastName(customer.lastName);
            setNewCustomerPhone(customer.phone || '');
            setNewCustomerEmail(customer.email || '');
            setNewCustomerMembershipId(customer.membershipId || 'none');
            setNewCustomerValidFrom(customer.validFrom || '');
            setNewCustomerValidTill(customer.validTill || '');
        } else {
            setEditingCustomer(null);
            setNewCustomerFirstName('');
            setNewCustomerLastName('');
            setNewCustomerPhone('');
            setNewCustomerEmail('');
            setNewCustomerMembershipId('');
            setNewCustomerValidFrom('');
            setNewCustomerValidTill('');
        }
        setCustomerDialogOpen(true);
    }

    const handleDeleteCustomer = () => {
        if (!firestore || !deletingCustomer) return;
        const customerRef = doc(firestore, 'customers', deletingCustomer.id);
        deleteDocumentNonBlocking(customerRef);
        toast({ title: 'Customer Deleted', description: `${deletingCustomer.firstName} ${deletingCustomer.lastName} has been deleted.` });
        setDeletingCustomer(null);
    }

    const getPlanName = (planId: string | null) => {
        if (!planId) return 'N/A';
        return plans?.find(p => p.id === planId)?.name || 'Unknown Plan';
    }

  return (
    <div className="flex flex-col gap-8">
        <h1 className="font-headline text-3xl md:text-4xl">Customer Management</h1>
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>All Customers</CardTitle>
                    <Button onClick={() => openCustomerDialog()}>
                        <UserPlus className="mr-2 h-4 w-4" /> Add Customer
                    </Button>
                </div>
                <CardDescription>
                    Manage all customer profiles and their memberships.
                </CardDescription>
            </CardHeader>
            <CardContent>
            <div className="rounded-lg border">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Membership</TableHead>
                            <TableHead>Remaining Hours</TableHead>
                            <TableHead>Valid From</TableHead>
                            <TableHead>Valid Till</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoadingCustomers ? (
                                [...Array(3)].map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><div className="h-6 w-full animate-pulse rounded-md bg-card" /></TableCell>
                                        <TableCell><div className="h-6 w-full animate-pulse rounded-md bg-card" /></TableCell>
                                        <TableCell><div className="h-6 w-full animate-pulse rounded-md bg-card" /></TableCell>
                                        <TableCell><div className="h-6 w-full animate-pulse rounded-md bg-card" /></TableCell>
                                        <TableCell><div className="h-6 w-full animate-pulse rounded-md bg-card" /></TableCell>
                                        <TableCell><div className="h-6 w-full animate-pulse rounded-md bg-card" /></TableCell>
                                        <TableCell><div className="h-6 w-full animate-pulse rounded-md bg-card" /></TableCell>
                                    </TableRow>
                                ))
                            ) : (
                            customers?.map((customer) => (
                                <TableRow key={customer.id}>
                                    <TableCell className="font-medium">{customer.firstName} {customer.lastName}</TableCell>
                                    <TableCell>{customer.phone}</TableCell>
                                    <TableCell>{getPlanName(customer.membershipId)}</TableCell>
                                    <TableCell>{customer.remainingHours} hours</TableCell>
                                    <TableCell>{customer.validFrom ? format(new Date(customer.validFrom), "PPP") : 'N/A'}</TableCell>
                                    <TableCell>{customer.validTill ? format(new Date(customer.validTill), "PPP") : 'N/A'}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => openCustomerDialog(customer)}>
                                            <Pencil className="h-4 w-4" />
                                            <span className="sr-only">Edit</span>
                                        </Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" onClick={() => setDeletingCustomer(customer)}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                    <span className="sr-only">Delete</span>
                                                </Button>
                                            </AlertDialogTrigger>
                                             <AlertDialogContent>
                                                <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will permanently delete customer "{deletingCustomer?.firstName} {deletingCustomer?.lastName}".
                                                </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                <AlertDialogCancel onClick={() => setDeletingCustomer(null)}>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleDeleteCustomer}>Delete</AlertDialogAction>
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
        
        {/* Add/Edit Customer Dialog */}
        <Dialog open={isCustomerDialogOpen} onOpenChange={setCustomerDialogOpen}>
            <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>{editingCustomer ? 'Edit' : 'Add New'} Customer</DialogTitle>
                <DialogDescription>
                Enter the details for the customer. Click save when you're done.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="cust-first-name" className="text-right">First Name</Label>
                    <Input id="cust-first-name" value={newCustomerFirstName} onChange={(e) => setNewCustomerFirstName(e.target.value)} className="col-span-3" placeholder="John"/>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="cust-last-name" className="text-right">Last Name</Label>
                    <Input id="cust-last-name" value={newCustomerLastName} onChange={(e) => setNewCustomerLastName(e.target.value)} className="col-span-3" placeholder="Doe"/>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="cust-phone" className="text-right">Phone</Label>
                    <Input id="cust-phone" value={newCustomerPhone} onChange={(e) => setNewCustomerPhone(e.target.value)} className="col-span-3" placeholder="e.g., 555-1234"/>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="cust-email" className="text-right">Email</Label>
                    <Input id="cust-email" type="email" value={newCustomerEmail} onChange={(e) => setNewCustomerEmail(e.target.value)} className="col-span-3" placeholder="e.g., john.d@email.com"/>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="cust-membership" className="text-right">
                        Membership
                    </Label>
                    <Select onValueChange={(value) => setNewCustomerMembershipId(value)} value={newCustomerMembershipId}>
                        <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select a plan (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">No Membership</SelectItem>
                            {plans?.map(plan => (
                                <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="cust-valid-from" className="text-right">Valid From</Label>
                    <Input 
                        id="cust-valid-from"
                        type="date"
                        value={newCustomerValidFrom}
                        onChange={(e) => setNewCustomerValidFrom(e.target.value)}
                        className="col-span-3"
                    />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="cust-valid-till" className="text-right">Valid Till</Label>
                    <Input 
                        id="cust-valid-till"
                        type="date"
                        value={newCustomerValidTill}
                        onChange={(e) => setNewCustomerValidTill(e.target.value)}
                        className="col-span-3"
                    />
                </div>
            </div>
            <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => { setCustomerDialogOpen(false); setEditingCustomer(null); }}>Cancel</Button>
                <Button type="submit" onClick={handleAddOrUpdateCustomer}>Save Customer</Button>
            </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}