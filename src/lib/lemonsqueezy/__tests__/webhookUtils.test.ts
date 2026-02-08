import { verifyWebhookSignature, generateWebhookSignature } from '../webhookUtils';

describe('webhookUtils', () => {
  const TEST_SECRET = 'test_webhook_secret_123';
  const TEST_PAYLOAD = JSON.stringify({
    meta: { event_name: 'subscription_created' },
    data: { id: '123', type: 'subscriptions' },
  });

  describe('verifyWebhookSignature', () => {
    it('should return true for valid signature', () => {
      const validSignature = generateWebhookSignature(TEST_PAYLOAD, TEST_SECRET);

      const result = verifyWebhookSignature(TEST_PAYLOAD, validSignature, TEST_SECRET);

      expect(result).toBe(true);
    });

    it('should return false for invalid signature', () => {
      const invalidSignature = 'invalid_signature_hex_value';

      const result = verifyWebhookSignature(TEST_PAYLOAD, invalidSignature, TEST_SECRET);

      expect(result).toBe(false);
    });

    it('should return false when signature length differs', () => {
      const shortSignature = 'abc123';

      const result = verifyWebhookSignature(TEST_PAYLOAD, shortSignature, TEST_SECRET);

      expect(result).toBe(false);
    });

    it('should return false for empty payload', () => {
      const validSignature = generateWebhookSignature(TEST_PAYLOAD, TEST_SECRET);

      const result = verifyWebhookSignature('', validSignature, TEST_SECRET);

      expect(result).toBe(false);
    });

    it('should return false for empty signature', () => {
      const result = verifyWebhookSignature(TEST_PAYLOAD, '', TEST_SECRET);

      expect(result).toBe(false);
    });

    it('should return false for empty secret', () => {
      const validSignature = generateWebhookSignature(TEST_PAYLOAD, TEST_SECRET);

      const result = verifyWebhookSignature(TEST_PAYLOAD, validSignature, '');

      expect(result).toBe(false);
    });

    it('should return false when payload is tampered', () => {
      const validSignature = generateWebhookSignature(TEST_PAYLOAD, TEST_SECRET);
      const tamperedPayload = TEST_PAYLOAD.replace('123', '456');

      const result = verifyWebhookSignature(tamperedPayload, validSignature, TEST_SECRET);

      expect(result).toBe(false);
    });

    it('should return false when using wrong secret', () => {
      const validSignature = generateWebhookSignature(TEST_PAYLOAD, TEST_SECRET);

      const result = verifyWebhookSignature(TEST_PAYLOAD, validSignature, 'wrong_secret');

      expect(result).toBe(false);
    });

    it('should handle special characters in payload', () => {
      const specialPayload = JSON.stringify({
        data: { user_name: "O'Brien & Sons <test>" },
      });
      const signature = generateWebhookSignature(specialPayload, TEST_SECRET);

      const result = verifyWebhookSignature(specialPayload, signature, TEST_SECRET);

      expect(result).toBe(true);
    });

    it('should handle unicode characters in payload', () => {
      const unicodePayload = JSON.stringify({
        data: { user_name: '日本語テスト 🎉' },
      });
      const signature = generateWebhookSignature(unicodePayload, TEST_SECRET);

      const result = verifyWebhookSignature(unicodePayload, signature, TEST_SECRET);

      expect(result).toBe(true);
    });
  });

  describe('generateWebhookSignature', () => {
    it('should generate consistent signatures for same input', () => {
      const sig1 = generateWebhookSignature(TEST_PAYLOAD, TEST_SECRET);
      const sig2 = generateWebhookSignature(TEST_PAYLOAD, TEST_SECRET);

      expect(sig1).toBe(sig2);
    });

    it('should generate different signatures for different payloads', () => {
      const sig1 = generateWebhookSignature('payload1', TEST_SECRET);
      const sig2 = generateWebhookSignature('payload2', TEST_SECRET);

      expect(sig1).not.toBe(sig2);
    });

    it('should generate different signatures for different secrets', () => {
      const sig1 = generateWebhookSignature(TEST_PAYLOAD, 'secret1');
      const sig2 = generateWebhookSignature(TEST_PAYLOAD, 'secret2');

      expect(sig1).not.toBe(sig2);
    });

    it('should generate 64-character hex string (SHA-256)', () => {
      const signature = generateWebhookSignature(TEST_PAYLOAD, TEST_SECRET);

      expect(signature).toMatch(/^[a-f0-9]{64}$/);
    });
  });
});
