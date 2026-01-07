import type { Product, User } from './types';

export const mockUser: User = {
  id: '1',
  name: 'Admin',
  email: 'admin@cuecontroller.com',
  role: 'admin',
  avatarUrl: 'https://picsum.photos/seed/user1/100/100',
};

export const mockProducts: Product[] = [
    { id: 'p1', name: 'Classic Chips', price: 2.5, category: 'Snacks' },
    { id: 'p2', name: 'Spicy Nachos', price: 5, category: 'Snacks' },
    { id: 'd1', name: 'Cola', price: 1.5, category: 'Drinks' },
    { id: 'd2', name: 'Lemonade', price: 1.5, category: 'Drinks' },
    { id: 'd3', name: 'Craft Beer', price: 6, category: 'Drinks' },
    { id: 'o1', name: 'Cue Chalk', price: 1, category: 'Other' },
];
