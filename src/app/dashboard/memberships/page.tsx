'use client';

import { useState } from 'react';
import type { Membership, Customer } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, Pencil, Trash2, UserPlus } from 'lucide-react';
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
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


export default function MembershipsPage() {
    const firestore = useFirestore();

    // State for plans
    const [isPlanDialogOpen, setPlanDialogOpen] = useState(false);
    const [newPlanName, setNewPlanName] = useState('');
    const [newPlanDescription, setNewPlanDescription] = useState('');
    const [newPlanHours, setNewPlanHours] = useState('');
    const [newPlanPrice, setNewPlanPrice] = useState('');

    // State for customers
    const [isCustomerDialogOpen, setCustomerDialogOpen] = useState(false);
    const [newCustomerFirstName, setNewCustomerFirstName] = useState('');
    const [newCustomerLastName, setNewCustomerLastName] = useState('');
    const [newCustomerPhone, setNewCustomerPhone] = useState('');
    const [newCustomerEmail, setNewCustomerEmail] = useState('');
    const [newCustomerMembershipId, setNewCustomerMembershipId] = useState('');
    const [newCustomerValidFrom, setNewCustomerValidFrom] = useState('');
    const [newCustomerValidTill, setNewCustomerValidTill] = useState('');


    const plansQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'memberships');
    }, [firestore]);
    const { data: plans, isLoading: isLoadingPlans } = useCollection<Membership>(plansQuery);

    const customersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'customers');
    }, [firestore]);
    const { data: customers, isLoading: isLoadingCustomers } = useCollection<Customer>(customersQuery);

    const handleAddPlan = () => {
        if (!firestore || !newPlanName || !newPlanHours || !newPlanPrice) return;
        
        const plansCollection = collection(firestore, 'memberships');
        const newPlan: Omit<Membership, 'id'> = {
            name: newPlanName,
            description: newPlanDescription,
            totalHours: Number(newPlanHours),
            price: Number(newPlanPrice),
        };
        addDocumentNonBlocking(plansCollection, newPlan);
        
        setPlanDialogOpen(false);
        setNewPlanName('');
        setNewPlanDescription('');
        setNewPlanHours('');
        setNewPlanPrice('');
    };

    const handleAddCustomer = () => {
        if (!firestore || !newCustomerFirstName || !newCustomerLastName) return;

        const customersCollection = collection(firestore, 'customers');
        
        const isMembershipSelected = newCustomerMembershipId && newCustomerMembershipId !== 'none';
        
        const newCustomer: Omit<Customer, 'id'> = {
            firstName: newCustomerFirstName,
            lastName: newCustomerLastName,
            phone: newCustomerPhone,
            email: newCustomerEmail,
            membershipId: isMembershipSelected ? newCustomerMembershipId : null,
            remainingHours: isMembershipSelected ? (plans?.find(p => p.id === newCustomerMembershipId)?.totalHours || 0) : 0,
            validFrom: newCustomerValidFrom,
            validTill: newCustomerValidTill,
        }
        addDocumentNonBlocking(customersCollection, newCustomer);

        setCustomerDialogOpen(false);
        setNewCustomerFirstName('');
        setNewCustomerLastName('');
        setNewCustomerPhone('');
        setNewCustomerEmail('');
        setNewCustomerMembershipId('');
        setNewCustomerValidFrom('');
        setNewCustomerValidTill('');
    }

    const getPlanName = (planId: string | null) => {
        if (!planId) return 'N/A';
        return plans?.find(p => p.id === planId)?.name || 'Unknown Plan';
    }

  return (
    <div className="flex flex-col gap-8">
        <h1 className="font-headline text-3xl md:text-4xl">Membership Management</h1>
        <Tabs defaultValue="plans">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="plans">Membership Plans</TabsTrigger>
                <TabsTrigger value="customers">Customers</TabsTrigger>
            </TabsList>
            <TabsContent value="plans" className="mt-4">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>All Membership Plans</CardTitle>
                            <Button onClick={() => setPlanDialogOpen(true)}>
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
                                            <TableCell>${plan.price.toFixed(2)}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon">
                                                    <Pencil className="h-4 w-4" />
                                                    <span className="sr-only">Edit</span>
                                                </Button>
                                                <Button variant="ghost" size="icon">
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                    <span className="sr-only">Delete</span>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="customers" className="mt-4">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>All Customers</CardTitle>
                            <Button onClick={() => setCustomerDialogOpen(true)}>
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
                                                <Button variant="ghost" size="icon">
                                                    <Pencil className="h-4 w-4" />
                                                    <span className="sr-only">Edit</span>
                                                </Button>
                                                <Button variant="ghost" size="icon">
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                    <span className="sr-only">Delete</span>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>

        {/* Create Plan Dialog */}
        <Dialog open={isPlanDialogOpen} onOpenChange={setPlanDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Create New Membership Plan</DialogTitle>
                <DialogDescription>
                Enter the details for the new plan. Click save when you're done.
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
                <Button type="button" variant="secondary" onClick={() => setPlanDialogOpen(false)}>Cancel</Button>
                <Button type="submit" onClick={handleAddPlan}>Save Plan</Button>
            </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* Add Customer Dialog */}
        <Dialog open={isCustomerDialogOpen} onOpenChange={setCustomerDialogOpen}>
            <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Add New Customer</DialogTitle>
                <DialogDescription>
                Enter the details for the new customer. Click save when you're done.
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
                <Button type="button" variant="secondary" onClick={() => setCustomerDialogOpen(false)}>Cancel</Button>
                <Button type="submit" onClick={handleAddCustomer}>Save Customer</Button>
            </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}
