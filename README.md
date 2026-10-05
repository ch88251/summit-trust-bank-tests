# Summit Trust Bank – Test Automation

Playwright (TypeScript) UI and API tests for the
[`cfhayes/summit-trust-bank`](https://hub.docker.com/r/cfhayes/summit-trust-bank) sample application.

## Prerequisites

- Node.js 20+
- Docker with the Compose plugin

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
| `npm run test:ui` | Browser tests only |
| `npm run test:api` | REST API tests only |
| `npm run test:headed` / `test:debug` | Watch or step through the UI tests |
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
| `TEST_DATA_DIR` | `./test-data` | Folder of JSON test data; point it elsewhere to run the same specs against another data set |
| `APP_PORT` / `DB_PORT` | `8000` / `5433` | Host ports used by Compose |
| `SECRET_KEY`, `TOKEN_TTL_MINUTES` | `local-test-secret`, `60` | Passed to the app container |
| `CI` | unset | Enables retries, `forbidOnly`, and the JUnit report (`test-results/junit.xml`) |

## Project layout

The repo is split into three parts that change at different rates:

```
framework/                  how to drive the app. Changes rarely; specs import it only as '@framework'
  index.ts                  public surface: test, expect, data loader, types, format helpers
  fixtures.ts               extended `test`: DB reset, login, page objects, flows, API clients
  config.ts                 BASE_URL, TEST_DATA_DIR
  global-setup.ts           waits for /api/health; fails with a clear message if the app is down
  pages/                    lean page objects: locators only
  flows/                    business actions (login, transfer, payBill, placeOrder, ...) that take plain data objects
  api/BankApi.ts            typed REST client
  data/                     JSON loader and the users.json types
  utils/                    currency / masking helpers that match the UI's formatting
tests/                      what to check. Add specs here; nothing else needs to change
  ui/                       browser specs (project "ui")
  api/                      REST specs (project "api")
test-data/                  what to check it with. Business data only, no locators
  users.json                seed users, accounts, holdings, payees; `defaultUser`
  market.json               the app's fixed quotes
  auth.json, accounts.json, transfers.json, cash.json, bill-pay.json, payees.json, trade.json
```

### Layers

- **Page objects** (`framework/pages`) are plain factories that return locators, e.g.
  `transferPayPage(page).transfer.amount`. They have no inheritance, no actions and no assertions.
  Parameterised locators are small functions (`accountsPage.balanceOf(nickname)`).
- **Flows** (`framework/flows`) are the business actions. They accept the same objects the JSON
  files contain (e.g. `{ "from": "checking", "to": "savings", "amount": "25.00" }`) and resolve
  account aliases against the logged-in user's data. Fields left out are left untouched, so the
  same flow drives both happy paths and validation scenarios.
- **Specs** (`tests/`) load data, call flows, and assert on page-object locators or the API.
  They never contain selectors.
- **Test data** (`test-data/`) holds inputs and expected business outcomes (amounts, names,
  messages). Accounts are referenced by alias (`"checking"`), never by nickname or locator.

## How the tests stay isolated

- An auto fixture calls `POST /api/test/reset` before **every** test, which restores the seed data.
  Because the reset wipes the whole database, the suite runs with `workers: 1`.
- The browser starts logged in as `defaultUser` from `users.json`. The fixture logs in through the
  API and seeds `localStorage["stb_token"]`, so there's no separate setup project.
  Use `test.use({ loggedInAs: 'jane' })` for another user or `test.use({ loggedInAs: null })` to start logged out.
- Locators use the app's `data-testid` attributes via `page.getByTestId()`.
- Quotes are static in the app, so trade totals can be asserted exactly.

## Writing a test

Add a JSON scenario (or a row to an existing list) in `test-data/`:

```json
// test-data/transfers.json
"savingsToChecking": { "from": "savings", "to": "checking", "amount": "25.00" }
```

Then write a spec in `tests/ui` or `tests/api`; the projects pick up any `*.spec.ts` automatically:

```ts
import { cents, expect, loadData, test, type TransferInput } from '@framework';

const data = loadData<{ savingsToChecking: TransferInput & { amount: string } }>('transfers');

test('moves money from savings', async ({ api, flows, transferPayPage, user }) => {
  await flows.transferPay.openTransferPay('transfer');
  await flows.transferPay.transfer(data.savingsToChecking);

  await expect(transferPayPage.transfer.confirmation).toHaveText(/^TRF-/);
  const checking = await api.accountByNumber(user.accounts.checking.number);
  expect(checking.balance).toBe(cents(user.accounts.checking.balance + 25));
});
```

Lists of `{ scenario, input, expected }` rows (see `invalidTransfers` in `transfers.json`) are
looped over in the spec, so adding a row adds a test with no code change.

Fixtures available to every test: `user`, `api`, `anonApi`, `apiAs(userKey)`, `flows`, and the page
objects `header`, `loginPage`, `accountsPage`, `accountDetailPage`, `tradePage`, `transferPayPage`, `notFoundPage`.

The framework only changes when the app does, for example a new page (add a page object and fixture)
or a new kind of action (add a flow).

## Known issues

- **Logout confirmation message rarely shows** (`tests/ui/login.spec.ts`, marked `test.fixme`).
  `logout()` clears the user before calling `navigate('/login', { state: { loggedOut: true } })`. The
  protected route's `<Navigate to="/login">` usually runs first, so the `loggedOut` state is lost.
