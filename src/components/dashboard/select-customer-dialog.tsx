
'use client';

import { useState, useMemo } from 'react';
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
import type { Customer, Membership } from '@/lib/types';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from '../ui/scroll-area';
import { UserPlus } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

interface SelectCustomerDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSelectCustomer: (customer: Customer) => void;
}

export function SelectCustomerDialog({ isOpen, onOpenChange, onSelectCustomer }: SelectCustomerDialogProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  // States for new customer
  const [newCustomerFirstName, setNewCustomerFirstName] = useState('');
  const [newCustomerLastName, setNewCustomerLastName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [newCustomerMembershipId, setNewCustomerMembershipId] = useState('');

  // States for existing customer
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Data fetching
  const customersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'customers');
  }, [firestore]);
  const { data: customers, isLoading: isLoadingCustomers } = useCollection<Customer>(customersQuery);

  const plansQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'memberships');
  }, [firestore]);
  const { data: plans } = useCollection<Membership>(plansQuery);
  
  const filteredCustomers = useMemo(() => {
      if (!customers) return [];
      return customers.filter(c => 
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.includes(searchTerm)
      );
  }, [customers, searchTerm]);

  const handleSelectExistingCustomer = () => {
      const customer = customers?.find(c => c.id === selectedCustomerId);
      if (customer) {
          onSelectCustomer(customer);
      } else {
          toast({ variant: 'destructive', title: 'Error', description: 'Could not find selected customer.'})
      }
  }

  const handleAddNewCustomer = async () => {
    if (!firestore || !newCustomerFirstName || !newCustomerLastName) return;

    const isMembershipSelected = newCustomerMembershipId && newCustomerMembershipId !== 'none';
    const plan = plans?.find(p => p.id === newCustomerMembershipId);

    const newCustomerData: Omit<Customer, 'id'> = {
        firstName: newCustomerFirstName,
        lastName: newCustomerLastName,
        phone: newCustomerPhone,
        email: newCustomerEmail,
        membershipId: isMembershipSelected ? newCustomerMembershipId : null,
        remainingHours: isMembershipSelected ? (plan?.totalHours || 0) : 0,
        validFrom: isMembershipSelected ? new Date().toISOString().split('T')[0] : null,
        validTill: isMembershipSelected ? new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0] : null,
    };

    try {
        const customersCollection = collection(firestore, 'customers');
        const docRef = await addDocumentNonBlocking(customersCollection, newCustomerData);
        if (docRef) {
            const newCustomer = { ...newCustomerData, id: docRef.id };
            onSelectCustomer(newCustomer);
            toast({ title: 'Customer Added', description: `${newCustomer.firstName} ${newCustomer.lastName} has been added and assigned to the table.` });
        }
    } catch (e) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to create new customer.'})
    }
  }

  const handleClose = () => {
    setNewCustomerFirstName('');
    setNewCustomerLastName('');
    setNewCustomerPhone('');
    setNewCustomerEmail('');
    setNewCustomerMembershipId('');
    setSelectedCustomerId('');
    setSearchTerm('');
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Customer</DialogTitle>
          <DialogDescription>Select an existing customer or add a new one.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="select" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="select">Select Existing</TabsTrigger>
                <TabsTrigger value="add">Add New</TabsTrigger>
            </TabsList>
            <TabsContent value="select" className="space-y-4 py-4">
                <Input 
                    placeholder="Search by name or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <ScrollArea className="h-48">
                    <RadioGroup value={selectedCustomerId} onValueChange={setSelectedCustomerId} className="space-y-2">
                    {filteredCustomers.map(customer => (
                        <div key={customer.id} className="flex items-center space-x-2 rounded-md border p-2">
                            <RadioGroupItem value={customer.id} id={customer.id} />
                            <Label htmlFor={customer.id} className="flex-grow">
                                <p className="font-medium">{customer.firstName} {customer.lastName}</p>
                                <p className="text-xs text-muted-foreground">{customer.phone}</p>
                            </Label>
                        </div>
                    ))}
                    </RadioGroup>
                </ScrollArea>
                <DialogFooter>
                    <Button onClick={handleClose} variant="secondary">Cancel</Button>
                    <Button onClick={handleSelectExistingCustomer} disabled={!selectedCustomerId}>Assign Customer</Button>
                </DialogFooter>
            </TabsContent>
            <TabsContent value="add" className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                    <Input value={newCustomerFirstName} onChange={(e) => setNewCustomerFirstName(e.target.value)} placeholder="First Name *" />
                    <Input value={newCustomerLastName} onChange={(e) => setNewCustomerLastName(e.target.value)} placeholder="Last Name *" />
                </div>
                <Input value={newCustomerPhone} onChange={(e) => setNewCustomerPhone(e.target.value)} placeholder="Phone Number" />
                <Input type="email" value={newCustomerEmail} onChange={(e) => setNewCustomerEmail(e.target.value)} placeholder="Email Address" />
                <Select onValueChange={setNewCustomerMembershipId} value={newCustomerMembershipId}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select membership (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">No Membership</SelectItem>
                        {plans?.map(plan => (
                            <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                 <DialogFooter>
                    <Button onClick={handleClose} variant="secondary">Cancel</Button>
                    <Button onClick={handleAddNewCustomer} disabled={!newCustomerFirstName || !newCustomerLastName}><UserPlus className="mr-2 h-4 w-4"/> Add & Assign</Button>
                </DialogFooter>
            </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
