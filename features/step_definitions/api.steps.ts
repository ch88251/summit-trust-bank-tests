import { type DataTable, Then, When } from '@cucumber/cucumber';
import { Ensure, equals } from '@serenity-js/assertions';
import { actorInTheSpotlight, type Actor } from '@serenity-js/core';
import { GetRequest, LastResponse, Send } from '@serenity-js/rest';
import type { Account } from '../../src/api/BankApi';

const requestAccounts = async (actor: Actor) => actor.attemptsTo(Send.a(GetRequest.to('/api/accounts')));

When('{actor} requests their accounts from the API', requestAccounts);
When('{pronoun} request(s) their accounts from the API', requestAccounts);

Then('{pronoun} should receive a {int} response', async (actor: Actor, status: number) =>
  actor.attemptsTo(Ensure.that(LastResponse.status(), equals(status))),
);

Then('the API should list these accounts:', async (table: DataTable) => {
  const expected = table.hashes().map(({ account, type, balance }) => ({
    nickname: account,
    account_type: type,
    balance: Number(balance),
  }));

  await actorInTheSpotlight().attemptsTo(
    Ensure.that(
      LastResponse.body<Account[]>().as((accounts) =>
        accounts.map(({ nickname, account_type, balance }) => ({ nickname, account_type, balance })),
      ),
      equals(expected),
    ),
  );
});
