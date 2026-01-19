// Utilities for Google One-Tap: nonce generation and hashing

export async function generateNonce(): Promise<[string, string]> {
  // Generate 32 bytes of randomness (works in browser and Node)
  let array = new Uint8Array(32);
  if (typeof crypto?.getRandomValues === 'function') {
    crypto.getRandomValues(array);
  } else {
    // Node fallback
    const nodeCrypto = await import('crypto');
    const buf = nodeCrypto.randomBytes(32);
    array = new Uint8Array(buf);
  }

  let nonceStr = '';
  for (let i = 0; i < array.length; i++) {
    nonceStr += String.fromCharCode(array[i]);
  }
  const nonce =
    typeof btoa === 'function'
      ? btoa(nonceStr)
      : Buffer.from(nonceStr, 'binary').toString('base64');

  // Hash with SHA-256
  let hashedNonce: string;

  if (crypto?.subtle && typeof crypto.subtle.digest === 'function') {
    const encoder = new TextEncoder();
    const encoded = encoder.encode(nonce);
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    hashedNonce = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } else {
    // Node fallback
    const nodeCrypto = await import('crypto');
    hashedNonce = nodeCrypto.createHash('sha256').update(nonce).digest('hex');
  }

  return [nonce, hashedNonce];
}
