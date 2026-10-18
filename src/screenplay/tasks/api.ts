import { Ensure, equals } from '@serenity-js/assertions';
import { notes, q, Task } from '@serenity-js/core';
import { ChangeApiConfig, LastResponse, PostRequest, Send } from '@serenity-js/rest';
import type { BankNotes } from '../actors/Actors';
import type { Customer } from '../actors/customers';

/** Restores the seed data via POST /api/test/reset. Requires ENABLE_TEST_ENDPOINTS=true. */
export const ResetTestData = () =>
  Task.where(
    `#actor restores the bank's seed data`,
    Send.a(PostRequest.to('/api/test/reset')),
    Ensure.that(LastResponse.status(), equals(200)),
  );

export const SignInToTheApi = {
  /**
   * Logs in through POST /api/auth/login, keeps the JWT in the actor's notes and
   * sends it as a bearer token with every subsequent API request.
   */
  as: (customer: Customer) =>
    Task.where(
      `#actor signs in to the API as ${customer.username}`,
      Send.a(PostRequest.to('/api/auth/login').with({ username: customer.username, password: customer.password })),
      Ensure.that(LastResponse.status(), equals(200)),
      notes<BankNotes>().set('authToken', LastResponse.body<{ access_token: string }>().access_token),
      ChangeApiConfig.setHeader('Authorization', q`Bearer ${notes<BankNotes>().get('authToken')}`),
    ),
};
