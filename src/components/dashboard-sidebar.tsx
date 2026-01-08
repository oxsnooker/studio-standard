'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  LayoutGrid,
  FileText,
  UserPlus,
  UtensilsCrossed,
  Award,
  Boxes,
  ClipboardList,
} from 'lucide-react';
import { Logo } from './logo';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';


const adminNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/dashboard/tables', label: 'Tables', icon: LayoutGrid },
  { href: '/dashboard/products', label: 'Snacks & Drinks', icon: UtensilsCrossed },
  { href: '/dashboard/stock', label: 'Stock', icon: Boxes },
  { href: '/dashboard/memberships', label: 'Memberships', icon: Award },
  { href: '/dashboard/staff', label: 'Staff', icon: UserPlus },
  { href: '/dashboard/reports', label: 'Reports', icon: FileText },
];

const staffNavItems = [
    { href: '/staff', label: 'Tables', icon: LayoutGrid },
];


export function DashboardSidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const firestore = useFirestore();
  const [role, setRole] = useState<'admin' | 'staff' | null>(null);

  useEffect(() => {
    if (user && firestore) {
      const userDocRef = doc(firestore, 'staff', user.uid);
      getDoc(userDocRef).then(docSnap => {
        if (docSnap.exists()) {
          setRole(docSnap.data().role);
        }
      });
    }
  }, [user, firestore]);

  const navItems = role === 'admin' ? adminNavItems : staffNavItems;

  const renderNavItem = (item: { href: string; label: string; icon: React.ElementType }) => {
    const Icon = item.icon;
    const isActive = pathname === item.href;
    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
          isActive && "bg-muted text-primary"
        )}
      >
        <Icon className="h-4 w-4" />
        {item.label}
      </Link>
    );
  };

  if (!role) {
      return (
        <div className="hidden border-r bg-card md:block">
            <div className="flex h-full max-h-screen flex-col gap-2">
                <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                    <Logo />
                </div>
            </div>
        </div>
      )
  }

  return (
    <div className="hidden border-r bg-card md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Logo />
        </div>
        <div className="flex-1">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {navItems.map(renderNavItem)}
          </nav>
        </div>
      </div>
    </div>
  );
}
