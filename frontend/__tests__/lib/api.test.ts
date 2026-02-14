/**
 * Unit Tests — API Client Functions (src/lib/api.ts)
 */

// We need to import after mocking
const mockFetch = global.fetch as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  (window.localStorage.getItem as jest.Mock).mockReturnValue(null);
});

describe('getHeaders', () => {
  it('adds Authorization header when token exists', async () => {
    (window.localStorage.getItem as jest.Mock).mockReturnValue('test-token-123');
    const { apiGet } = await import('@/lib/api');

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: 'test' }),
    });

    await apiGet('/test');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers).toHaveProperty('Authorization', 'Bearer test-token-123');
  });

  it('has no Authorization header when no token', async () => {
    (window.localStorage.getItem as jest.Mock).mockReturnValue(null);
    const { apiGet } = await import('@/lib/api');

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: 'test' }),
    });

    await apiGet('/test');

    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers).not.toHaveProperty('Authorization');
  });
});

describe('apiPost', () => {
  it('sends JSON body with Content-Type', async () => {
    (window.localStorage.getItem as jest.Mock).mockReturnValue('test-token');
    const { apiPost } = await import('@/lib/api');

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true }),
    });

    await apiPost('/auth/login', { email: 'test@test.com', password: 'pass' });

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain('/auth/login');
    expect(options.method).toBe('POST');
    expect(options.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(options.body)).toEqual({ email: 'test@test.com', password: 'pass' });
  });
});

describe('handleResponse', () => {
  it('clears tokens on 401', async () => {
    const { apiGet } = await import('@/lib/api');

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: 'Unauthorized' }),
    });

    // Should clear localStorage on 401
    try {
      await apiGet('/protected');
    } catch {
      // expected to throw
    }

    expect(window.localStorage.removeItem).toHaveBeenCalledWith('access_token');
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('refresh_token');
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('user');
  });

  it('parses successful JSON response', async () => {
    const { apiGet } = await import('@/lib/api');

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ total_scans: 10, total_threats: 3 }),
    });

    const result = await apiGet('/dashboard/stats');
    expect(result).toEqual({ total_scans: 10, total_threats: 3 });
  });

  it('throws on error response', async () => {
    const { apiGet } = await import('@/lib/api');

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Internal server error' }),
    });

    await expect(apiGet('/broken')).rejects.toThrow('Internal server error');
  });
});

describe('apiUpload', () => {
  it('does not set Content-Type for FormData', async () => {
    (window.localStorage.getItem as jest.Mock).mockReturnValue('test-token');
    const { apiUpload } = await import('@/lib/api');

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ scan_id: '123' }),
    });

    const formData = new FormData();
    formData.append('file', new Blob(['test']), 'test.exe');

    await apiUpload('/scans', formData);

    const [, options] = mockFetch.mock.calls[0];
    // Content-Type should NOT be explicitly set for multipart
    expect(options.headers['Content-Type']).toBeUndefined();
  });
});
