import type { BilliardTable, Product, User } from './types';

export const mockUser: User = {
  id: '1',
  name: 'Admin',
  email: 'admin@cuecontroller.com',
  role: 'admin',
  avatarUrl: 'https://picsum.photos/seed/user1/100/100',
};

export const initialTables: BilliardTable[] = [
  { id: '1', name: 'Table 1', status: 'available', hourlyRate: 10, startTime: 0, elapsedTime: 0, sessionItems: [] },
  { id: '2', name: 'Table 2', status: 'in-use', hourlyRate: 10, startTime: Date.now() - 3600 * 1000, elapsedTime: 3600, sessionItems: [{ product: { id: 'p1', name: 'Chips', price: 2, category: 'Snacks' }, quantity: 1 }] },
  { id: '3', name: 'Table 3', status: 'paused', hourlyRate: 12, startTime: Date.now() - 1800 * 1000, elapsedTime: 1200, sessionItems: [] },
  { id: '4', name: 'Table 4', status: 'available', hourlyRate: 10, startTime: 0, elapsedTime: 0, sessionItems: [] },
  { id: '5', name: 'Pool Table 1', status: 'available', hourlyRate: 15, startTime: 0, elapsedTime: 0, sessionItems: [] },
  { id: '6', name: 'Pool Table 2', status: 'in-use', hourlyRate: 15, startTime: Date.now() - 600 * 1000, elapsedTime: 600, sessionItems: [] },
];

export const mockProducts: Product[] = [
    { id: 'p1', name: 'Classic Chips', price: 2.5, category: 'Snacks' },
    { id: 'p2', name: 'Spicy Nachos', price: 5, category: 'Snacks' },
    { id: 'd1', name: 'Cola', price: 1.5, category: 'Drinks' },
    { id: 'd2', name: 'Lemonade', price: 1.5, category: 'Drinks' },
    { id: 'd3', name: 'Craft Beer', price: 6, category: 'Drinks' },
    { id: 'o1', name: 'Cue Chalk', price: 1, category: 'Other' },
];
