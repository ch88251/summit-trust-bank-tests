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
| `npm run test:ui` | Browser tests only (runs the auth setup first) |
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
| `APP_PORT` / `DB_PORT` | `8000` / `5433` | Host ports used by Compose |
| `SECRET_KEY`, `TOKEN_TTL_MINUTES` | `local-test-secret`, `60` | Passed to the app container |
| `CI` | unset | Enables retries, `forbidOnly`, and the JUnit report (`test-results/junit.xml`) |

## Project layout

```
docker-compose.yml
playwright.config.ts        projects: setup → ui, api
src/
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

## Known issues

- **Logout confirmation message rarely shows** (`tests/ui/login.spec.ts`, marked `test.fixme`).
  `logout()` clears the user before calling `navigate('/login', { state: { loggedOut: true } })`. The
  protected route's `<Navigate to="/login">` usually runs first, so the `loggedOut` state is lost.
