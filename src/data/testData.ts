/** Mirrors the application's seed data (app/seed.py) and static quotes (app/quotes.py). */

export type AccountType = 'CHECKING' | 'SAVINGS' | 'BROKERAGE';

export interface SeedAccount {
  number: string;
  type: AccountType;
  nickname: string;
  balance: number;
}

export const users = {
  demo: {
    username: 'demo',
    password: 'Demo@123',
    fullName: 'Alex Morgan',
    email: 'alex.morgan@example.com',
    accounts: {
      checking: { number: '1000234567', type: 'CHECKING', nickname: 'Everyday Checking', balance: 8992.97 },
      savings: { number: '2000238812', type: 'SAVINGS', nickname: 'High-Yield Savings', balance: 18044.42 },
      brokerage: { number: '3000231190', type: 'BROKERAGE', nickname: 'Self-Directed Brokerage', balance: 10000.0 },
    },
    holdings: { AAPL: 25, MSFT: 10, VTI: 15 } as Record<string, number>,
    payees: ['City Electric', 'Metro Water', 'Summit Visa Card'],
  },
  jane: {
    username: 'jane',
    password: 'Jane@123',
    fullName: 'Jane Cooper',
    email: 'jane.cooper@example.com',
    accounts: {
      checking: { number: '1000987654', type: 'CHECKING', nickname: 'Primary Checking', balance: 1200.0 },
      savings: { number: '2000981432', type: 'SAVINGS', nickname: 'Rainy Day Savings', balance: 3000.0 },
    },
    holdings: {} as Record<string, number>,
    payees: ['Northside Gas Co.'],
  },
} as const satisfies Record<string, {
  username: string;
  password: string;
  fullName: string;
  email: string;
  accounts: Record<string, SeedAccount>;
  holdings: Record<string, number>;
  payees: readonly string[];
}>;

export type UserKey = keyof typeof users;

export const quotes: Record<string, { name: string; price: number }> = {
  AAPL: { name: 'Apple Inc.', price: 189.84 },
  AMZN: { name: 'Amazon.com Inc.', price: 182.75 },
  GOOGL: { name: 'Alphabet Inc. Class A', price: 168.2 },
  JPM: { name: 'JPMorgan Chase & Co.', price: 205.6 },
  MSFT: { name: 'Microsoft Corp.', price: 415.5 },
  NVDA: { name: 'NVIDIA Corp.', price: 121.4 },
  TSLA: { name: 'Tesla Inc.', price: 248.3 },
  VTI: { name: 'Vanguard Total Stock Market ETF', price: 268.9 },
};

export const MAX_DEPOSIT = 10_000;
