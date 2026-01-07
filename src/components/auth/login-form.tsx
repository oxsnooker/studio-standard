'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { initiateEmailSignIn } from '@/firebase/non-blocking-login';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { doc, getDoc } from 'firebase/firestore';

export function LoginForm() {
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRedirecting, setIsRedirecting] = useState(false);


  useEffect(() => {
    if (!isUserLoading && user && firestore) {
      setIsRedirecting(true);
      const userDocRef = doc(firestore, 'staff', user.uid);
      getDoc(userDocRef).then(docSnap => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          if (userData.role === 'admin') {
            router.replace('/dashboard');
          } else {
            router.replace('/dashboard/tables');
          }
        } else {
          // Fallback if user document doesn't exist
          router.replace('/dashboard');
        }
      }).catch(() => {
        // Handle error, maybe redirect to a generic page
        router.replace('/dashboard');
      });
    }
  }, [user, isUserLoading, router, firestore]);

  const handleLoginError = (error: any) => {
    console.error("Login failed:", error);
    let description = 'An unexpected error occurred.';
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      description = 'Invalid email or password. Please try again.';
    }
    toast({
      variant: 'destructive',
      title: 'Login Failed',
      description: description,
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!auth) return;
    initiateEmailSignIn(auth, email, password, handleLoginError);
    // Non-blocking call. We'll rely on the `useUser` hook to redirect.
    toast({
        title: 'Logging In...',
        description: 'Please wait while we log you in.',
    });
  };

  if (isUserLoading || user || isRedirecting) {
    return <div className="text-center">Loading...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input 
            id="email" 
            type="email" 
            placeholder="admin@cuecontroller.com" 
            required 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input 
            id="password" 
            type="password" 
            required 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <Button type="submit" className="w-full !mt-8 text-lg" disabled={isUserLoading}>
        {isUserLoading ? 'Logging in...' : 'Log In'}
      </Button>
    </form>
  );
}
