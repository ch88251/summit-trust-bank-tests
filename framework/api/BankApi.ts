import { expect, type APIRequestContext, type APIResponse } from '@playwright/test';
import type { AccountType } from '../data/types';

export interface User {
  id: number;
  username: string;
  full_name: string;
  email: string;
}

export interface Account {
  id: number;
  account_number: string;
  account_type: AccountType;
  nickname: string;
  balance: number;
  opened_at: string;
}

export interface Transaction {
  id: number;
  posted_at: string;
  description: string;
  category: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER' | 'PAYMENT' | 'TRADE';
  amount: number;
  balance_after: number;
}

export interface Payee {
  id: number;
  name: string;
  account_number: string;
  nickname: string | null;
}

export interface Holding {
  symbol: string;
  name: string;
  quantity: number;
  avg_cost: number;
  price: number;
  market_value: number;
  gain_loss: number;
}

export interface Portfolio {
  account: Account;
  cash: number;
  holdings: Holding[];
  holdings_value: number;
  total_value: number;
}

/**
 * Thin typed client for the Summit Trust Bank REST API.
 *
 * Raw methods (`post`, `get`, ...) return the APIResponse so tests can assert on
 * status codes; the convenience helpers assert success and return parsed bodies.
 */
export class BankApi {
  private token: string | null = null;

  constructor(private readonly request: APIRequestContext) {}

  get accessToken() {
    return this.token;
  }

  private headers(): Record<string, string> {
    return this.token ? { Authorization: `Bearer ${this.token}` } : {};
  }

  get(path: string, params?: Record<string, string | number>) {
    return this.request.get(`/api${path}`, { headers: this.headers(), params });
  }

  post(path: string, data?: unknown) {
    return this.request.post(`/api${path}`, { headers: this.headers(), data });
  }

  delete(path: string) {
    return this.request.delete(`/api${path}`, { headers: this.headers() });
  }

  private async ok<T>(res: APIResponse, status = 200): Promise<T> {
    expect(res.status(), `${res.url()} -> ${await res.text()}`).toBe(status);
    return res.status() === 204 ? (null as T) : res.json();
  }

  // --- test support -------------------------------------------------------

  /** Restores the seeded demo data. Requires ENABLE_TEST_ENDPOINTS=true. */
  async resetDatabase() {
    await this.ok(await this.post('/test/reset'));
  }

  // --- auth -----------------------------------------------------------------

  async login(username: string, password: string) {
    const body = await this.ok<{ access_token: string; user: User }>(
      await this.post('/auth/login', { username, password }),
    );
    this.token = body.access_token;
    return body;
  }

  // --- accounts -------------------------------------------------------------

  async accounts() {
    return this.ok<Account[]>(await this.get('/accounts'));
  }

  async accountByType(type: AccountType) {
    const account = (await this.accounts()).find((a) => a.account_type === type);
    if (!account) throw new Error(`No ${type} account for the current user`);
    return account;
  }

  async accountByNumber(accountNumber: string) {
    const account = (await this.accounts()).find((a) => a.account_number === accountNumber);
    if (!account) throw new Error(`No account ${accountNumber} for the current user`);
    return account;
  }

  async account(id: number) {
    return this.ok<Account>(await this.get(`/accounts/${id}`));
  }

  async transactions(accountId: number, category?: Transaction['category']) {
    return this.ok<Transaction[]>(
      await this.get(`/accounts/${accountId}/transactions`, category ? { category } : undefined),
    );
  }

  // --- money movement -------------------------------------------------------

  async transfer(fromAccountId: number, toAccountId: number, amount: string, memo?: string) {
    return this.ok<{ confirmation_number: string; amount: number }>(
      await this.post('/transfers', { from_account_id: fromAccountId, to_account_id: toAccountId, amount, memo }),
      201,
    );
  }

  async payees() {
    return this.ok<Payee[]>(await this.get('/payees'));
  }

  async addPayee(name: string, accountNumber: string, nickname?: string) {
    return this.ok<Payee>(await this.post('/payees', { name, account_number: accountNumber, nickname }), 201);
  }

  // --- trading --------------------------------------------------------------

  async portfolio(accountId: number) {
    return this.ok<Portfolio>(await this.get(`/trade/portfolio/${accountId}`));
  }
}
