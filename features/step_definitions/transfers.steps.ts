import { Then, When } from '@cucumber/cucumber';
import { Ensure, equals, includes } from '@serenity-js/assertions';
import { actorInTheSpotlight, type Actor } from '@serenity-js/core';
import { Text } from '@serenity-js/web';
import { AccountBalance, TransferForm, TransferFunds } from '../../src/screenplay';
import { currency } from '../../src/utils/format';

When('{pronoun} transfer(s) {string} from {string} to {string}', async (actor: Actor, amount: string, from: string, to: string) =>
  actor.attemptsTo(TransferFunds.of(amount).from(from).to(to)),
);

Then('{pronoun} should see the transfer confirmation {string}', async (actor: Actor, message: string) =>
  actor.attemptsTo(Ensure.eventually(Text.of(TransferForm.success()), includes(message))),
);

Then('{pronoun} should see the transfer error {string}', async (actor: Actor, message: string) =>
  actor.attemptsTo(Ensure.eventually(Text.of(TransferForm.error()), equals(message))),
);

// Checked through the REST API, so it verifies what the server recorded, not just what the UI shows.
Then('the balance of {string} should be {string}', async (account: string, balance: string) =>
  actorInTheSpotlight().attemptsTo(Ensure.that(AccountBalance.of(account).as(currency), equals(balance))),
);
