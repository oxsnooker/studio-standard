'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

export default function CreateAdminPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const auth = getAuth();
      const firestore = getFirestore();
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (user) {
        await setDoc(doc(firestore, 'staff', user.uid), {
          id: user.uid,
          email: user.email,
          firstName: firstName,
          lastName: lastName,
          role: 'admin',
        });

        toast({
          title: 'Admin User Created',
          description: 'You can now log in with your admin credentials.',
        });
        router.push('/login');
      }
    } catch (error: any) {
      console.error("Error creating admin user:", error);
      toast({
        variant: 'destructive',
        title: 'Error creating admin',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Create Admin User</CardTitle>
          <CardDescription>This is a one-time setup for the first administrator.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateAdmin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full !mt-6" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Admin'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}