import { cents, currency, expect, loadData, test, uniqueId, type Scenario, type TransferInput } from '@framework';

const data = loadData<{
  successfulTransfer: Scenario<TransferInput, { message: string }>;
  dropdownRefresh: TransferInput & { from: string; amount: string };
  invalidTransfers: Scenario<TransferInput, { error: string }>[];
}>('transfers');

test.describe('Transfer funds', () => {
  test.beforeEach(async ({ flows }) => {
    await flows.transferPay.openTransferPay('transfer');
  });

  test(data.successfulTransfer.scenario, async ({ api, flows, transferPayPage: { transfer }, user }) => {
    const { input, expected } = data.successfulTransfer;
    const memo = `${input.memo} ${uniqueId()}`;
    const amount = Number(input.amount);
    const fromSeed = user.accounts[input.from!];
    const toSeed = user.accounts[input.to!];

    await flows.transferPay.transfer({ ...input, memo });

    await expect(transfer.success).toContainText(expected.message);
    const confirmation = (await transfer.confirmation.textContent())!;
    expect(confirmation).toMatch(/^TRF-[0-9A-F]{8}$/);
    await expect(transfer.row(confirmation)).toContainText(currency(amount));

    // Form resets after success
    await expect(transfer.amount).toHaveValue('');
    await expect(transfer.from).toHaveValue('');

    // Balances and ledger updated
    const from = await api.accountByNumber(fromSeed.number);
    const to = await api.accountByNumber(toSeed.number);
    expect(from.balance).toBe(cents(fromSeed.balance - amount));
    expect(to.balance).toBe(cents(toSeed.balance + amount));
    const [latest] = await api.transactions(from.id);
    expect(latest).toMatchObject({ category: 'TRANSFER', amount: -amount });
    expect(latest.description).toContain(memo);
  });

  test('updated balances appear in the account dropdowns', async ({ flows, transferPayPage: { transfer }, user }) => {
    const input = data.dropdownRefresh;
    const from = user.accounts[input.from];
    await flows.transferPay.transfer(input);
    await expect(transfer.success).toBeVisible();
    await expect(transfer.fromOptions.filter({ hasText: from.nickname })).toContainText(
      currency(cents(from.balance - Number(input.amount))),
    );
  });

  test('excludes the From account from the To list', async ({ flows, transferPayPage: { transfer }, user }) => {
    await flows.transferPay.fillTransfer({ from: 'checking' });
    await expect(transfer.toOptions.filter({ hasText: user.accounts.checking.nickname })).toHaveCount(0);
  });

  for (const { scenario, input, expected } of data.invalidTransfers) {
    test(`validates ${scenario}`, async ({ flows, transferPayPage: { transfer } }) => {
      await flows.transferPay.transfer(input);
      await expect(transfer.error).toHaveText(expected.error);
      await expect(transfer.success).toBeHidden();
    });
  }
});
