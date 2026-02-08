import crypto from 'node:crypto';

/**
 * Verify LemonSqueezy webhook signature using HMAC SHA-256
 *
 * @param rawBody - The raw request body as a string
 * @param signature - The X-Signature header value from the webhook request
 * @param secret - The webhook secret from LEMONSQUEEZY_WEBHOOK_SECRET env var
 * @returns true if signature is valid, false otherwise
 */
export const verifyWebhookSignature = (
  rawBody: string,
  signature: string,
  secret: string
): boolean => {
  if (!rawBody || !signature || !secret) {
    return false;
  }

  const digest = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const digestBuffer = Buffer.from(digest, 'utf8');
  const signatureBuffer = Buffer.from(signature, 'utf8');

  // Length must match for timingSafeEqual
  if (digestBuffer.length !== signatureBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(digestBuffer, signatureBuffer);
};

/**
 * Generate a webhook signature for testing purposes
 *
 * @param rawBody - The raw request body as a string
 * @param secret - The webhook secret
 * @returns The generated HMAC SHA-256 signature as a hex string
 */
export const generateWebhookSignature = (rawBody: string, secret: string): string => {
  return crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
};
