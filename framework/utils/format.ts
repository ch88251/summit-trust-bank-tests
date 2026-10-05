const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

/** Formats like the app: 1234.5 -> "$1,234.50". */
export const currency = (n: number) => usd.format(n);

/** Formats a signed amount like the app's ledger: "+$10.00" / "−$10.00" (U+2212 minus). */
export const signedCurrency = (n: number) => (n > 0 ? '+' : n < 0 ? '−' : '') + usd.format(Math.abs(n));

/** Masks an account number like the app: "1000234567" -> "••••4567". */
export const maskAccount = (number: string) => `••••${number.slice(-4)}`;

/** Rounds to cents to avoid floating point drift in balance assertions. */
export const cents = (n: number) => Math.round(n * 100) / 100;

/** Unique suffix for test data such as memos and payee names. */
export const uniqueId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
