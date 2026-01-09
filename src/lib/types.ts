

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
  createdAt?: number;
  currentSegmentStartTime?: number;
  customerName?: string | null;
  customerId?: string | null;
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
  phone?: string;
  email?: string;
  membershipId: string | null;
  remainingHours: number;
  validFrom: string | null;
  validTill: string | null;
  balance: number;
}


export interface Bill {
    id: string;
    sessionId: string;
    customerId?: string | null;
    billDate: string; // ISO 8601 string
    totalAmount: number;
    amountPaid: number;
    paymentMethod: 'cash' | 'upi' | 'member';
    staffId: string;
    sessionItems: SessionItem[];
    tableBill: number;
    itemsBill: number;
    notes?: string;
    startTime: number;
    endTime: number;
    duration: number;
    memberDetails?: {
        name: string;
        hoursUsed: number;
        remainingHours: number;
    };
}

export interface Payment {
    id: string;
    customerId: string;
    paymentDate: string; // ISO 8601 string
    amount: number;
    staffId: string;
}
    
