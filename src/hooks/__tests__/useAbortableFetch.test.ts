import { renderHook, act } from '@testing-library/react';
import { useAbortableFetch } from '../useAbortableFetch';

describe('useAbortableFetch', () => {
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    fetchSpy = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('should execute fetch request successfully', async () => {
    const mockResponse = { ok: true, json: () => Promise.resolve({ data: 'test' }) };
    fetchSpy.mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useAbortableFetch());

    let response: Response | null = null;
    await act(async () => {
      response = await result.current.execute('/api/test', {}, 'test-key');
    });

    expect(response).toBeTruthy();
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      })
    );
  });

  it('should abort specific request by key', async () => {
    // Create a never-resolving promise to simulate pending request
    const abortError = new DOMException('Aborted', 'AbortError');
    fetchSpy.mockImplementation(
      () =>
        new Promise((_, reject) => {
          setTimeout(() => reject(abortError), 1000);
        })
    );

    const { result } = renderHook(() => useAbortableFetch());

    // Start request but don't await
    let requestPromise: Promise<Response | null>;
    act(() => {
      requestPromise = result.current.execute('/api/slow', {}, 'slow-request');
    });

    // Abort immediately
    act(() => {
      result.current.abort('slow-request');
    });

    // The aborted request should return null
    await act(async () => {
      const response = await requestPromise!;
      expect(response).toBeNull();
    });
  });

  it('should abort all requests on unmount', async () => {
    fetchSpy.mockImplementation(() => new Promise(() => {})); // Never resolves

    const { result, unmount } = renderHook(() => useAbortableFetch());

    act(() => {
      result.current.execute('/api/test1', {}, 'key1');
      result.current.execute('/api/test2', {}, 'key2');
    });

    // Unmount should trigger cleanup
    unmount();

    // Fetch was called twice
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('should handle fetch errors gracefully', async () => {
    const networkError = new Error('Network error');
    fetchSpy.mockRejectedValueOnce(networkError);

    const { result } = renderHook(() => useAbortableFetch());

    let response: Response | null = null;
    await act(async () => {
      response = await result.current.execute('/api/fail', {}, 'fail-key');
    });

    expect(response).toBeNull();
  });
});
