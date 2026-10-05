import fs from 'node:fs';
import path from 'node:path';
import { TEST_DATA_DIR } from '../config';
import type { AccountData, UserData } from './types';

const cache = new Map<string, unknown>();

/**
 * Reads `<TEST_DATA_DIR>/<name>.json`. Synchronous so specs can build data-driven
 * tests at collection time. Each call returns a fresh copy, so tests can't leak
 * changes into each other.
 */
export function loadData<T = unknown>(name: string): T {
  const file = path.join(TEST_DATA_DIR, name.endsWith('.json') ? name : `${name}.json`);
  if (!cache.has(file)) {
    let text: string;
    try {
      text = fs.readFileSync(file, 'utf8');
    } catch {
      throw new Error(`Test data file not found: ${file} (TEST_DATA_DIR=${TEST_DATA_DIR})`);
    }
    try {
      cache.set(file, JSON.parse(text));
    } catch (e) {
      throw new Error(`Invalid JSON in ${file}: ${(e as Error).message}`);
    }
  }
  return structuredClone(cache.get(file)) as T;
}

interface UsersFile {
  /** User the UI and `api` fixture are logged in as unless a test says otherwise. */
  defaultUser: string;
  users: Record<string, Omit<UserData, 'key'>>;
}

export function defaultUserKey() {
  return loadData<UsersFile>('users').defaultUser;
}

/** A user from users.json; the default user when no key is given. */
export function getUser(key = defaultUserKey()): UserData {
  const { users } = loadData<UsersFile>('users');
  if (!users[key]) throw new Error(`No user "${key}" in users.json (have: ${Object.keys(users).join(', ')})`);
  return { key, ...users[key] };
}

export function allUsers(): UserData[] {
  return Object.keys(loadData<UsersFile>('users').users).map((key) => getUser(key));
}

/** Resolves an account alias (e.g. "checking") against a user's accounts. */
export function accountOf(user: UserData, alias: string): AccountData {
  const account = user.accounts[alias];
  if (!account) {
    throw new Error(`User "${user.key}" has no account "${alias}" (have: ${Object.keys(user.accounts).join(', ')})`);
  }
  return account;
}
