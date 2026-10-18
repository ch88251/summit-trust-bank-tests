import { users } from '../../data/testData';

/**
 * Actors are named after the seeded customers' first names, so "Alex" in a
 * feature file is the `demo` user (Alex Morgan) and "Jane" is `jane` (Jane Cooper).
 */
const customersByName = {
  Alex: users.demo,
  Jane: users.jane,
} as const;

export type Customer = (typeof customersByName)[keyof typeof customersByName];

export function customerCalled(actorName: string): Customer {
  const customer = customersByName[actorName as keyof typeof customersByName];
  if (!customer) {
    throw new Error(
      `No seeded customer called "${actorName}". Known customers: ${Object.keys(customersByName).join(', ')}`,
    );
  }
  return customer;
}
