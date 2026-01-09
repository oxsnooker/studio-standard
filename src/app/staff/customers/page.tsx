'use client';

import { useState, useMemo } from 'react';
import type { Customer, Payment } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, doc, runTransaction, query, where, orderBy } from 'firebase/firestore';
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
import { Save, History } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { format } from 'date-fns';


export default function StaffCustomersPage() {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    
    const [searchTerm, setSearchTerm] = useState('');
    const [paymentAmount, setPaymentAmount] = useState<Record<string, string>>({});
    const [viewingHistory, setViewingHistory] = useState<Customer | null>(null);

    const customersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'customers');
    }, [firestore]);
    const { data: customers, isLoading: isLoadingCustomers } = useCollection<Customer>(customersQuery);

    const paymentsQuery = useMemoFirebase(() => {
        if (!firestore || !viewingHistory) return null;
        return query(
            collection(firestore, 'payments'),
            where('customerId', '==', viewingHistory.id),
            orderBy('paymentDate', 'desc')
        );
    }, [firestore, viewingHistory]);
    const { data: payments, isLoading: isLoadingPayments } = useCollection<Payment>(paymentsQuery);

    const filteredCustomers = useMemo(() => {
        if (!customers) return [];
        return customers.filter(c => 
            `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.phone?.includes(searchTerm)
        );
    }, [customers, searchTerm]);

    const handlePaymentAmountChange = (customerId: string, value: string) => {
        setPaymentAmount(prev => ({ ...prev, [customerId]: value }));
    };

    const handleRecordPayment = async (customer: Customer) => {
        if (!firestore || !user) {
            toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to record a payment.' });
            return;
        };
        
        const amountPaid = parseFloat(paymentAmount[customer.id]);
        if (isNaN(amountPaid) || amountPaid <= 0) {
            toast({ variant: 'destructive', title: 'Invalid amount', description: 'Please enter a valid positive number for the payment.' });
            return;
        }

        const customerRef = doc(firestore, 'customers', customer.id);
        const paymentRef = doc(collection(firestore, 'payments'));

        try {
            await runTransaction(firestore, async (transaction) => {
                const customerDoc = await transaction.get(customerRef);
                if (!customerDoc.exists()) {
                    throw "Customer not found.";
                }

                const currentBalance = customerDoc.data().balance;
                const newBalance = currentBalance + amountPaid;

                transaction.update(customerRef, { balance: newBalance });

                const newPayment: Omit<Payment, 'id'> = {
                    customerId: customer.id,
                    amount: amountPaid,
                    paymentDate: new Date().toISOString(),
                    staffId: user.uid
                };
                transaction.set(paymentRef, newPayment);
            });

            const updatedPaymentAmount = { ...paymentAmount };
            delete updatedPaymentAmount[customer.id];
            setPaymentAmount(updatedPaymentAmount);

            toast({ title: 'Payment Recorded', description: `Rs. ${amountPaid.toFixed(2)} recorded for ${customer.firstName}. New balance is Rs. ${(customer.balance + amountPaid).toFixed(2)}.` });

        } catch (error) {
            console.error("Payment transaction failed: ", error);
            toast({ variant: 'destructive', title: 'Transaction Failed', description: 'Could not record payment. Please try again.' });
        }
    };

  return (
    <>
    <div className="flex flex-col gap-8">
        <h1 className="font-headline text-3xl md:text-4xl">Customer Balances</h1>
        <Card>
            <CardHeader>
                <CardTitle>All Customers</CardTitle>
                <CardDescription>
                    View and manage customer debts and credits. Enter an amount and click save to record a payment.
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
                            <TableHead className="text-right w-[240px]">Record Payment</TableHead>
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
                                                value={paymentAmount[customer.id] ?? ''}
                                                onChange={(e) => handlePaymentAmountChange(customer.id, e.target.value)}
                                                className="h-8 w-28"
                                                placeholder="Amount paid"
                                            />
                                            <Button 
                                                variant="ghost" 
                                                size="icon"
                                                onClick={() => handleRecordPayment(customer)}
                                                disabled={!paymentAmount[customer.id]}
                                            >
                                                <Save className="h-4 w-4 text-primary" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setViewingHistory(customer)}
                                            >
                                                <History className="h-4 w-4" />
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

    {/* Payment History Dialog */}
    <Dialog open={!!viewingHistory} onOpenChange={(isOpen) => !isOpen && setViewingHistory(null)}>
        <DialogContent className="sm:max-w-lg">
            <DialogHeader>
                <DialogTitle>Payment History for {viewingHistory?.firstName} {viewingHistory?.lastName}</DialogTitle>
                <DialogDescription>
                    A log of all past payments received from this customer.
                </DialogDescription>
            </DialogHeader>
            <div className="mt-4 max-h-96 overflow-y-auto">
                {isLoadingPayments ? (
                     <p>Loading payment history...</p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {payments && payments.length > 0 ? (
                            payments.map(payment => (
                                <TableRow key={payment.id}>
                                    <TableCell>{format(new Date(payment.paymentDate), 'PPP p')}</TableCell>
                                    <TableCell className="text-right font-mono">Rs. {payment.amount.toFixed(2)}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={2} className="text-center h-24">No payment history found.</TableCell>
                            </TableRow>
                        )}
                        </TableBody>
                    </Table>
                )}
            </div>
            <DialogFooter>
                <Button variant="secondary" onClick={() => setViewingHistory(null)}>Close</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
    
