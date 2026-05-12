import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { fetchWithTimeout } from '../../src/utils/fetch.js';

const server = setupServer(
  http.get('http://mock-api.test/ok', () => {
    return HttpResponse.json({ status: 'ok' });
  }),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('fetchWithTimeout', () => {
  it('should throw on timeout', async () => {
    // Use a non-routable IP to guarantee a timeout
    await expect(
      fetchWithTimeout('http://10.255.255.1', { timeoutMs: 100 }),
    ).rejects.toThrow();
  });

  it('should return a successful response', async () => {
    const response = await fetchWithTimeout('http://mock-api.test/ok', {
      timeoutMs: 5000,
    });
    expect(response.ok).toBe(true);
    const body = await response.json();
    expect(body).toEqual({ status: 'ok' });
  });
});
