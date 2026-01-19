import { generateNonce } from '../googleOneTap';

describe('generateNonce', () => {
  it('returns a nonce and a SHA-256 hex hashedNonce', async () => {
    const [nonce, hashedNonce] = await generateNonce();
    expect(nonce).toBeTruthy();
    expect(typeof nonce).toBe('string');

    expect(hashedNonce).toBeTruthy();
    expect(typeof hashedNonce).toBe('string');
    // SHA-256 hex should be 64 hex chars
    expect(hashedNonce).toMatch(/^[a-f0-9]{64}$/i);
    expect(hashedNonce.length).toBe(64);
  });
});
