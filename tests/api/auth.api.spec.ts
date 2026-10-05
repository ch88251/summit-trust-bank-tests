import { expect, getUser, loadData, test, type Credentials, type Scenario } from '@framework';

const data = loadData<{
  invalidCredentials: Scenario<Credentials>[];
  messages: { invalidCredentials: string };
}>('auth');

test.describe('Auth API', () => {
  test('GET /api/health', async ({ anonApi }) => {
    const res = await anonApi.get('/health');
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok' });
  });

  test('login returns a bearer token and the user', async ({ anonApi }) => {
    const user = getUser();
    const body = await anonApi.login(user.username, user.password);
    expect(body.access_token).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
    expect(body.user).toMatchObject({
      username: user.username,
      full_name: user.fullName,
      email: user.email,
    });
  });

  for (const { scenario, input } of data.invalidCredentials) {
    test(`login with ${scenario} is 401`, async ({ anonApi }) => {
      const res = await anonApi.post('/auth/login', input);
      expect(res.status()).toBe(401);
      expect(await res.json()).toEqual({ detail: data.messages.invalidCredentials });
    });
  }

  test('login with missing fields is 422', async ({ anonApi }) => {
    const res = await anonApi.post('/auth/login', { username: '', password: '' });
    expect(res.status()).toBe(422);
  });

  test('GET /auth/me returns the current user', async ({ api, user }) => {
    const res = await api.get('/auth/me');
    expect(res.status()).toBe(200);
    expect((await res.json()).username).toBe(user.username);
  });

  test('logout returns 204', async ({ api }) => {
    expect((await api.post('/auth/logout')).status()).toBe(204);
  });

  for (const path of ['/auth/me', '/accounts', '/payees', '/transfers', '/payments', '/trade/quotes']) {
    test(`GET ${path} without a token is 401`, async ({ anonApi }) => {
      expect((await anonApi.get(path)).status()).toBe(401);
    });
  }

  test('a tampered token is rejected', async ({ request }) => {
    const res = await request.get('/api/auth/me', { headers: { Authorization: 'Bearer abc.def.ghi' } });
    expect(res.status()).toBe(401);
  });
});
