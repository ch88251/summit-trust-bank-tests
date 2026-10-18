# Summit Trust Bank – Test Automation

Playwright (TypeScript) UI and API tests for the
[`cfhayes/summit-trust-bank`](https://hub.docker.com/r/cfhayes/summit-trust-bank) sample application,
plus a [Serenity/JS](https://serenity-js.org) suite written as Cucumber features and implemented with the
Screenplay Pattern.

## Prerequisites

- Node.js 20+
- Docker with the Compose plugin
- Java 17+ (only for generating the Serenity BDD HTML report)

## Quick start

```bash
npm install
npx playwright install chromium

npm run env:up      # start Postgres + the app (http://localhost:8000), waits until healthy
npm test            # run everything (setup + ui + api)
npm run report      # open the HTML report
npm run env:down    # stop the stack (env:clean also removes the database volume)
```

Demo users: `demo / Demo@123` (checking, savings, brokerage) and `jane / Jane@123` (checking, savings; no brokerage).

## Scripts

| Script | What it does |
| --- | --- |
| `npm run env:up` / `env:down` / `env:clean` / `env:logs` | Manage the Docker Compose stack |
| `npm test` | All projects |
| `npm run test:ui` | Browser tests only (runs the auth setup first) |
| `npm run test:api` | REST API tests only |
| `npm run test:headed` / `test:debug` | Watch or step through the UI tests |
| `npm run test:bdd` | Serenity/JS Cucumber features (`HEADED=1` or `test:bdd:headed` to watch) |
| `npm run report:bdd` | Build the Serenity BDD HTML report at `target/site/serenity/index.html` |
| `npm run serenity:update` | Download the Serenity BDD CLI jar if it is missing |
| `npm run typecheck` | `tsc --noEmit` |

## Docker Compose

`docker-compose.yml` runs:

- **db**: `postgres:17-alpine`, user/password/db `bank`, published on host port `5433` (`DB_PORT`)
- **app**: `cfhayes/summit-trust-bank:latest` on host port `8000` (`APP_PORT`), with
  `ENABLE_TEST_ENDPOINTS=true` so the suite can call `POST /api/test/reset`

The app creates its tables and seeds the demo data on first start.

## Configuration

| Env var | Default | Purpose |
| --- | --- | --- |
| `BASE_URL` | `http://localhost:8000` | App under test |
| `APP_PORT` / `DB_PORT` | `8000` / `5433` | Host ports used by Compose |
| `SECRET_KEY`, `TOKEN_TTL_MINUTES` | `local-test-secret`, `60` | Passed to the app container |
| `HEADED` | unset | Runs the Cucumber suite with a visible browser |
| `CI` | unset | Enables retries, `forbidOnly`, and the JUnit report (`test-results/junit.xml`) |

## Project layout

```
docker-compose.yml
playwright.config.ts        projects: setup → ui, api
cucumber.mjs                Serenity/JS + Cucumber config (tsx loader, Serenity formatter)
src/
  config.ts                 BASE_URL, shared by both suites
  screenplay/               Serenity/JS Screenplay layer: actors, tasks, questions, UI targets
  global-setup.ts           waits for /api/health; fails with a clear message if the app is down
  fixtures.ts               extended `test`: resets the DB before each test, page objects, API clients
  api/BankApi.ts            typed REST client
  pages/                    page objects (Header, Login, Accounts, AccountDetail, Trade, TransferPay)
  data/testData.ts          seed users/accounts/holdings/payees and the app's fixed quotes
  utils/format.ts           currency / masking helpers that match the UI's formatting
tests/
  auth.setup.ts             logs in through the UI once, saves storage state to .auth/demo.json
  ui/                       login, navigation, accounts, transfer, deposit/withdraw, bill pay, payees, trade
  api/                      auth, accounts, transfers/cash/payees/payments, trade
features/
  **/*.feature              Gherkin scenarios (authentication, accounts, transfers, api)
  step_definitions/         thin glue: each step asks an actor to perform tasks or check questions
  support/                  serenity.config.ts (browser, cast, reporters, DB reset hook), parameter types
```

## How the tests stay isolated

- An auto fixture calls `POST /api/test/reset` before **every** test, which restores the seed data.
  Because the reset wipes the whole database, the suite runs with `workers: 1`.
- UI tests reuse the `demo` login from `tests/auth.setup.ts` (JWT in `localStorage["stb_token"]`).
  Tests that need to start logged out use `test.use({ storageState: { cookies: [], origins: [] } })`.
- Selectors use the app's `data-testid` attributes via `page.getByTestId()`.
- Quotes are static in the app, so trade totals can be asserted exactly.

## Writing a test

```ts
import { expect, test } from '../../src/fixtures';

test('transfer shows a confirmation', async ({ api, transferPayPage }) => {
  await transferPayPage.goto('transfer');
  await transferPayPage.transfer('Everyday Checking', 'High-Yield Savings', '25.00');
  await expect(transferPayPage.transferConfirmation).toHaveText(/^TRF-/);
  expect((await api.accountByType('CHECKING')).balance).toBe(8967.97);
});
```

## Serenity/JS, Cucumber and Screenplay

The `features/` suite runs alongside the Playwright Test suite and doesn't replace it. Its scenarios
are told from the customer's point of view:

```gherkin
Scenario: Alex moves money from checking to savings
  Given Alex is logged in
  When they transfer "250.75" from "Everyday Checking" to "High-Yield Savings"
  Then they should see the transfer confirmation "Transfer of $250.75 completed."
  And the balance of "Everyday Checking" should be "$8,742.22"
```

- **Actors** are named after the seeded customers: `Alex` is `demo` and `Jane` is `jane`
  (`src/screenplay/actors/customers.ts`). `{actor}` in a step creates or recalls an actor by name, and
  `{pronoun}` (they/their, …) refers back to the actor in the spotlight.
- **Abilities** (`src/screenplay/actors/Actors.ts`): every actor can `BrowseTheWebWithPlaywright`,
  `CallAnApi` and `TakeNotes`. The browser opens lazily with a fresh context per scenario.
- **Tasks** (`src/screenplay/tasks/`): `LogIn`, `StartAnAuthenticatedSession` (logs in through the API and
  puts the token in `localStorage`, which is faster than the login form), `TransferFunds`, `SignInToTheApi`,
  `ResetTestData`.
- **Questions / targets** (`src/screenplay/questions/`, `src/screenplay/ui/targets.ts`): `PageElement`s
  located by `data-testid`, and `AccountBalance`, which reads balances through the REST API so UI
  scenarios can check what the server actually recorded.
- A `Before` hook resets the database before every scenario. Cucumber runs scenarios one at a time
  by default; keep it that way (no `--parallel`).
- Run one feature with `npm run test:bdd -- features/transfers/transfer_funds.feature` and one scenario
  with `--name "<regex>"`. Screenshots of failures and the JSON for the report go to `target/site/serenity`.

## Known issues

- **Logout confirmation message rarely shows** (`tests/ui/login.spec.ts`, marked `test.fixme`).
  `logout()` clears the user before calling `navigate('/login', { state: { loggedOut: true } })`. The
  protected route's `<Navigate to="/login">` usually runs first, so the `loggedOut` state is lost.
