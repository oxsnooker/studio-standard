'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  LayoutGrid,
  FileText,
  DollarSign,
  UserPlus,
  Settings,
  UtensilsCrossed,
  Award,
} from 'lucide-react';
import { Logo } from './logo';
import { cn } from '@/lib/utils';
import { Separator } from './ui/separator';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/dashboard/tables', label: 'Tables', icon: LayoutGrid },
  { href: '/dashboard/billing', label: 'Billing', icon: FileText },
  { href: '/dashboard/products', label: 'Snacks & Drinks', icon: UtensilsCrossed },
];

const adminNavItems = [
    { href: '/dashboard/reports', label: 'Revenue Reports', icon: DollarSign },
    { href: '/dashboard/expenses', label: 'Expenses', icon: WalletIcon },
    { href: '/dashboard/memberships', label: 'Memberships', icon: Award },
    { href: '/dashboard/staff', label: 'Staff', icon: UserPlus },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
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
            <Separator className="my-4" />
            <h3 className="px-3 py-2 text-xs font-semibold uppercase text-muted-foreground/70">Admin</h3>
            {adminNavItems.map(renderNavItem)}
          </nav>
        </div>
      </div>
    </div>
  );
}

function WalletIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
        <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
      </svg>
    );
}
