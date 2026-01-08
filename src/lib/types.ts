export type UserRole = 'admin' | 'staff';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
}

export type TableStatus = 'available' | 'in-use' | 'paused' | 'out of service';

export interface Product {
  id: string;
  name: string;
  price: number;
  category: 'Snacks' | 'Drinks' | 'Other';
  stock: number;
}

export interface SessionItem {
  product: Product;
  quantity: number;
}

export interface BilliardTable {
  id: string;
  name: string;
  status: TableStatus;
  hourlyRate: number;
  startTime: number; // timestamp
  elapsedTime: number; // in seconds
  sessionItems: SessionItem[];
  lastPausedTime?: number | null;
}

export interface Membership {
  id: string;
  name: string;
  description: string;
  totalHours: number;
  price: number;
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  membershipId: string | null;
  remainingHours: number;
  validFrom: string | null;
  validTill: string | null;
}
