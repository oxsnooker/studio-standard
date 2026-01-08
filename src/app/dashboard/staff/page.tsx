'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Pencil, Trash2 } from 'lucide-react';
import { useCollection, useFirestore, useAuth, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

// We need a specific type for staff members from Firestore, let's define it here
interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'staff' | 'admin';
}

export default function StaffPage() {
    const firestore = useFirestore();
    const { toast } = useToast();

    const [isStaffDialogOpen, setStaffDialogOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
    const [deletingStaff, setDeletingStaff] = useState<StaffMember | null>(null);

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'staff' | 'admin'>('staff');

    const staffQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'staff');
    }, [firestore]);
    const { data: staff, isLoading: isLoadingStaff } = useCollection<StaffMember>(staffQuery);
    
    const openStaffDialog = (staffMember?: StaffMember) => {
        if (staffMember) {
            setEditingStaff(staffMember);
            setFirstName(staffMember.firstName);
            setLastName(staffMember.lastName);
            setEmail(staffMember.email);
            setRole(staffMember.role);
            setPassword(''); // Don't show password on edit
        } else {
            setEditingStaff(null);
            setFirstName('');
            setLastName('');
            setEmail('');
            setPassword('');
            setRole('staff');
        }
        setStaffDialogOpen(true);
    };

    const handleAddOrUpdateStaff = async () => {
        if (!firestore) return;

        if (editingStaff) {
            // Update existing staff document in Firestore
            const staffRef = doc(firestore, 'staff', editingStaff.id);
            updateDocumentNonBlocking(staffRef, {
                firstName,
                lastName,
                role,
                // Email/auth credentials are not updated here for simplicity
            });
            toast({ title: 'Staff Updated', description: `${firstName} ${lastName}'s details have been updated.` });
        } else {
            // Create a new staff member
            if (!email || !password || !firstName || !lastName) {
                toast({ variant: 'destructive', title: 'Error', description: 'Please fill out all fields.'});
                return;
            }

            try {
                // Create user in Firebase Auth
                // We use a temporary auth instance for this secondary operation
                const tempAuth = getAuth();
                const userCredential = await createUserWithEmailAndPassword(tempAuth, email, password);
                const user = userCredential.user;

                // Create staff document in Firestore
                const staffRef = doc(firestore, 'staff', user.uid);
                const newStaff: StaffMember = {
                    id: user.uid,
                    firstName,
                    lastName,
                    email,
                    role,
                };
                // Use a blocking set here to ensure the doc is created after auth user
                await setDoc(staffRef, newStaff);

                toast({ title: 'Staff Created', description: `Account for ${firstName} ${lastName} has been created.` });

            } catch (error: any) {
                console.error("Error creating staff user:", error);
                toast({
                    variant: 'destructive',
                    title: 'Error creating staff',
                    description: error.message || 'An unexpected error occurred.',
                });
                return; // Stop execution on error
            }
        }
        
        setStaffDialogOpen(false);
    };

    const handleDeleteStaff = () => {
        if (!firestore || !deletingStaff) return;
        // Note: This only deletes the Firestore record, not the Auth user.
        // Deleting Auth users requires admin privileges and is a more complex operation.
        const staffRef = doc(firestore, 'staff', deletingStaff.id);
        deleteDocumentNonBlocking(staffRef);
        toast({ title: 'Staff Deleted', description: `The record for ${deletingStaff.firstName} ${deletingStaff.lastName} has been deleted.` });
        setDeletingStaff(null);
    }

  return (
    <div className="flex flex-col gap-8">
        <h1 className="font-headline text-3xl md:text-4xl">Staff Management</h1>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Staff Accounts</CardTitle>
                        <Button onClick={() => openStaffDialog()}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Create Staff Account
                        </Button>
                    </div>
                    <CardDescription>
                        Create and manage accounts for your staff members.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-lg border">
                        <Table>
                            <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoadingStaff ? (
                                    [...Array(2)].map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><div className="h-6 w-full animate-pulse rounded-md bg-card" /></TableCell>
                                            <TableCell><div className="h-6 w-full animate-pulse rounded-md bg-card" /></TableCell>
                                            <TableCell><div className="h-6 w-full animate-pulse rounded-md bg-card" /></TableCell>
                                            <TableCell><div className="h-6 w-full animate-pulse rounded-md bg-card" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                staff?.map((staffMember) => (
                                    <TableRow key={staffMember.id}>
                                        <TableCell className="font-medium">{staffMember.firstName} {staffMember.lastName}</TableCell>
                                        <TableCell>{staffMember.email}</TableCell>
                                        <TableCell>{staffMember.role}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => openStaffDialog(staffMember)}>
                                                <Pencil className="h-4 w-4" />
                                                <span className="sr-only">Edit</span>
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" onClick={() => setDeletingStaff(staffMember)}>
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                        <span className="sr-only">Delete</span>
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This will permanently delete the staff record for "{deletingStaff?.firstName} {deletingStaff?.lastName}". This does not delete their login account.
                                                    </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                    <AlertDialogCancel onClick={() => setDeletingStaff(null)}>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={handleDeleteStaff}>Delete Record</AlertDialogAction>
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

        {/* Create/Edit Staff Dialog */}
        <Dialog open={isStaffDialogOpen} onOpenChange={setStaffDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>{editingStaff ? 'Edit' : 'Create New'} Staff Account</DialogTitle>
                <DialogDescription>
                    {editingStaff ? "Edit the staff member's details." : "Enter details to create a new login for a staff member."}
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="staff-first-name" className="text-right">First Name</Label>
                    <Input id="staff-first-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="staff-last-name" className="text-right">Last Name</Label>
                    <Input id="staff-last-name" value={lastName} onChange={(e) => setLastName(e.target.value)} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="staff-email" className="text-right">Email</Label>
                    <Input id="staff-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="col-span-3" disabled={!!editingStaff} />
                </div>
                {!editingStaff && (
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="staff-password" className="text-right">Password</Label>
                        <Input id="staff-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="col-span-3" />
                    </div>
                )}
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="staff-role" className="text-right">Role</Label>
                    <Select onValueChange={(value: 'staff' | 'admin') => setRole(value)} value={role}>
                        <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="staff">Staff</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setStaffDialogOpen(false)}>Cancel</Button>
                <Button type="submit" onClick={handleAddOrUpdateStaff}>Save Account</Button>
            </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}
