'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function Home() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Prevent multiple redirects
    if (isRedirecting) return;

    // Wait until Firebase auth state is resolved
    if (isUserLoading) {
      return;
    }

    if (!user) {
      // If no user, redirect to login
      setIsRedirecting(true);
      router.replace('/login');
    } else if (firestore) {
      // If user exists, determine their role and redirect
      setIsRedirecting(true);
      const userDocRef = doc(firestore, 'staff', user.uid);
      
      getDoc(userDocRef).then(docSnap => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          if (userData.role === 'admin') {
            router.replace('/dashboard');
          } else {
            router.replace('/staff');
          }
        } else {
          // Fallback if user document doesn't exist
          router.replace('/login');
        }
      }).catch(() => {
        // Handle potential errors fetching the document
        router.replace('/login');
      });
    }
  }, [user, isUserLoading, firestore, router, isRedirecting]);

  // Show a loading indicator while checking auth state and redirecting
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p>Loading...</p>
    </div>
  );
}
