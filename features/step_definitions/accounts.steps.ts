import { type DataTable, Then, When } from '@cucumber/cucumber';
import { Ensure, equals } from '@serenity-js/assertions';
import type { Actor } from '@serenity-js/core';
import { Text } from '@serenity-js/web';
import { AccountsOverview, ViewTheAccountsOverview } from '../../src/screenplay';

When('{pronoun} view(s) the accounts overview', async (actor: Actor) =>
  actor.attemptsTo(ViewTheAccountsOverview()),
);

Then('{pronoun} should be welcomed with {string}', async (actor: Actor, greeting: string) =>
  actor.attemptsTo(Ensure.eventually(Text.of(AccountsOverview.welcomeMessage()), equals(greeting))),
);

Then('{pronoun} should see the following accounts:', async (actor: Actor, table: DataTable) =>
  actor.attemptsTo(
    ...table
      .hashes()
      .flatMap(({ account, number, balance }) => [
        Ensure.eventually(Text.of(AccountsOverview.numberOf(account)), equals(number)),
        Ensure.eventually(Text.of(AccountsOverview.balanceOf(account)), equals(balance)),
      ]),
  ),
);

Then('{pronoun} total balance should be {string}', async (actor: Actor, total: string) =>
  actor.attemptsTo(Ensure.eventually(Text.of(AccountsOverview.totalBalance()), equals(total))),
);
