import { expect, test } from '../../src/fixtures';
import { users } from '../../src/data/testData';

test.describe('Auth API', () => {
  test('GET /api/health', async ({ anonApi }) => {
    const res = await anonApi.get('/health');
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok' });
  });

  test('login returns a bearer token and the user', async ({ anonApi }) => {
    const body = await anonApi.login(users.demo.username, users.demo.password);
    expect(body.access_token).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
    expect(body.user).toMatchObject({
      username: users.demo.username,
      full_name: users.demo.fullName,
      email: users.demo.email,
    });
  });

  test('login with wrong password is 401', async ({ anonApi }) => {
    const res = await anonApi.post('/auth/login', { username: 'demo', password: 'nope' });
    expect(res.status()).toBe(401);
    expect(await res.json()).toEqual({ detail: 'Invalid username or password' });
  });

  test('login with missing fields is 422', async ({ anonApi }) => {
    const res = await anonApi.post('/auth/login', { username: '', password: '' });
    expect(res.status()).toBe(422);
  });

  test('GET /auth/me returns the current user', async ({ api }) => {
    const res = await api.get('/auth/me');
    expect(res.status()).toBe(200);
    expect((await res.json()).username).toBe(users.demo.username);
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
