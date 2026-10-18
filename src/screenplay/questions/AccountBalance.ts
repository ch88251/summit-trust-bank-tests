import { Question } from '@serenity-js/core';
import { CallAnApi } from '@serenity-js/rest';
import type { Account } from '../../api/BankApi';

/**
 * Reads balances from the REST API, so UI scenarios can verify the server-side
 * effect of an action. The actor must have signed in to the API first.
 */
export const AccountBalance = {
  of: (nickname: string) =>
    Question.about(`the balance of ${nickname}`, async (actor) => {
      const response = await CallAnApi.as(actor).request({ method: 'GET', url: '/api/accounts' });
      const account = (response.data as Account[]).find((a) => a.nickname === nickname);
      if (!account) throw new Error(`No account called "${nickname}" in GET /api/accounts`);
      return account.balance;
    }),
};
