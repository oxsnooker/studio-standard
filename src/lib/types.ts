export type UserRole = 'admin' | 'staff';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
}

export type TableStatus = 'available' | 'in-use' | 'paused';

export interface Product {
  id: string;
  name: string;
  price: number;
  category: 'Snacks' | 'Drinks' | 'Other';
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
}
