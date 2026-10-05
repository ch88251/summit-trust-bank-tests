/** Shapes of the reference data in `users.json`, plus the generic scenario shape used by feature files. */

export type AccountType = 'CHECKING' | 'SAVINGS' | 'BROKERAGE';

export interface AccountData {
  number: string;
  type: AccountType;
  nickname: string;
  balance: number;
}

export interface HoldingData {
  quantity: number;
  avgCost: number;
}

export interface PayeeData {
  name: string;
  accountNumber: string;
  nickname: string | null;
}

export interface UserData {
  /** The user's key in users.json (e.g. "demo"). Added by the loader. */
  key: string;
  username: string;
  password: string;
  fullName: string;
  email: string;
  /** Keyed by a short alias (e.g. "checking") that scenario files use to refer to the account. */
  accounts: Record<string, AccountData>;
  holdings: Record<string, HoldingData>;
  payees: PayeeData[];
}

/**
 * One row of a data-driven test: what to do (`input`) and what should happen (`expected`).
 * Feature files are free to use other shapes; this is just the common one.
 */
export interface Scenario<Input, Expected = Record<string, never>> {
  scenario: string;
  input: Input;
  expected: Expected;
}
