'use client';

import { useState, useMemo } from 'react';
import type { Customer } from '@/lib/types';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Save } from 'lucide-react';

export default function StaffCustomersPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const [searchTerm, setSearchTerm] = useState('');
    const [balanceEdits, setBalanceEdits] = useState<Record<string, string>>({});

    const customersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'customers');
    }, [firestore]);
    const { data: customers, isLoading: isLoadingCustomers } = useCollection<Customer>(customersQuery);

    const filteredCustomers = useMemo(() => {
        if (!customers) return [];
        return customers.filter(c => 
            `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.phone?.includes(searchTerm)
        );
    }, [customers, searchTerm]);

    const handleBalanceChange = (customerId: string, value: string) => {
        setBalanceEdits(prev => ({ ...prev, [customerId]: value }));
    };

    const handleSaveBalance = (customerId: string) => {
        if (!firestore) return;
        
        const newBalance = parseFloat(balanceEdits[customerId]);
        if (isNaN(newBalance)) {
            toast({ variant: 'destructive', title: 'Invalid amount', description: 'Please enter a valid number for the balance.' });
            return;
        }

        const customerRef = doc(firestore, 'customers', customerId);
        updateDocumentNonBlocking(customerRef, { balance: newBalance });

        const updatedBalanceEdits = { ...balanceEdits };
        delete updatedBalanceEdits[customerId];
        setBalanceEdits(updatedBalanceEdits);

        toast({ title: 'Balance Updated', description: "The customer's balance has been updated." });
    };

  return (
    <div className="flex flex-col gap-8">
        <h1 className="font-headline text-3xl md:text-4xl">Customer Balances</h1>
        <Card>
            <CardHeader>
                <CardTitle>All Customers</CardTitle>
                <CardDescription>
                    View and manage customer debts and credits.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Input 
                    placeholder="Search by name or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                />
                <div className="rounded-lg border">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Balance</TableHead>
                            <TableHead className="text-right w-[200px]">Update Balance</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoadingCustomers ? (
                                [...Array(5)].map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><div className="h-6 w-full animate-pulse rounded-md bg-card" /></TableCell>
                                        <TableCell><div className="h-6 w-full animate-pulse rounded-md bg-card" /></TableCell>
                                        <TableCell><div className="h-6 w-full animate-pulse rounded-md bg-card" /></TableCell>
                                        <TableCell><div className="h-6 w-full animate-pulse rounded-md bg-card" /></TableCell>
                                    </TableRow>
                                ))
                            ) : (
                            filteredCustomers?.map((customer) => (
                                <TableRow key={customer.id}>
                                    <TableCell className="font-medium">{customer.firstName} {customer.lastName}</TableCell>
                                    <TableCell>{customer.phone}</TableCell>
                                    <TableCell className={cn(
                                        "font-mono",
                                        (customer.balance ?? 0) < 0 ? "text-destructive" : "text-green-600"
                                    )}>
                                        Rs. {(customer.balance ?? 0).toFixed(2)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Input
                                                type="number"
                                                value={balanceEdits[customer.id] ?? ''}
                                                onChange={(e) => handleBalanceChange(customer.id, e.target.value)}
                                                className="h-8 w-28"
                                                placeholder="Update balance"
                                            />
                                            <Button 
                                                variant="ghost" 
                                                size="icon"
                                                onClick={() => handleSaveBalance(customer.id)}
                                                disabled={balanceEdits[customer.id] === undefined}
                                            >
                                                <Save className="h-4 w-4 text-primary" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
    