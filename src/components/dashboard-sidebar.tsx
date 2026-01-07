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
} from 'lucide-react';
import { Logo } from './logo';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/dashboard/tables', label: 'Tables', icon: LayoutGrid },
  { href: '/dashboard/products', label: 'Snacks & Drinks', icon: UtensilsCrossed },
  { href: '/dashboard/stock', label: 'Stock', icon: Boxes },
  { href: '/dashboard/memberships', label: 'Memberships', icon: Award },
  { href: '/dashboard/staff', label: 'Staff', icon: UserPlus },
  { href: '/dashboard/reports', label: 'Reports', icon: FileText },
];


export function DashboardSidebar() {
  const pathname = usePathname();

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
