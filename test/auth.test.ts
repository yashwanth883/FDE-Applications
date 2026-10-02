import { describe, it, expect } from 'vitest';
import { AuthManager } from '../src/auth/auth-manager.js';

describe('AuthManager', () => {
  it('should validate correctly formatted WooCommerce credentials', () => {
    const auth = new AuthManager({
      consumerKey: 'ck_test_1234567890abcdef',
      consumerSecret: 'cs_test_0987654321fedcba',
    });

    const validation = auth.validateFormat();
    expect(validation.valid).toBe(true);
  });

  it('should reject invalid keys missing standard WooCommerce prefixes', () => {
    const invalidKey = new AuthManager({
      consumerKey: 'invalid_key_123',
      consumerSecret: 'cs_test_valid',
    });
    expect(invalidKey.validateFormat().valid).toBe(false);
    expect(invalidKey.validateFormat().message).toContain('ck_');

    const invalidSecret = new AuthManager({
      consumerKey: 'ck_test_valid',
      consumerSecret: 'invalid_secret_123',
    });
    expect(invalidSecret.validateFormat().valid).toBe(false);
    expect(invalidSecret.validateFormat().message).toContain('cs_');
  });

  it('should construct correct HTTP Basic Auth headers', () => {
    const key = 'ck_test_key_123';
    const secret = 'cs_test_secret_456';
    const auth = new AuthManager({ consumerKey: key, consumerSecret: secret });

    const headers = auth.getAuthHeaders();
    expect(headers.Authorization).toBeDefined();

    const expectedToken = Buffer.from(`${key}:${secret}`).toString('base64');
    expect(headers.Authorization).toBe(`Basic ${expectedToken}`);
    expect(headers['User-Agent']).toContain('Razorpay-AgentStudio');
  });

  it('should generate WooCommerce OAuth v1 authorization endpoint URL', () => {
    const url = AuthManager.generateOAuthAuthorizeUrl({
      storeUrl: 'https://mystore.example.com',
      appName: 'Razorpay Agent Studio',
      scope: 'read',
      userId: 'merchant_rzp_42',
      returnUrl: 'https://agent.razorpay.com/oauth/return',
      callbackUrl: 'https://agent.razorpay.com/api/v1/oauth/callback',
    });

    expect(url).toContain('https://mystore.example.com/wc-auth/v1/authorize');
    expect(url).toContain('scope=read');
    expect(url).toContain('app_name=Razorpay+Agent+Studio');
    expect(url).toContain('user_id=merchant_rzp_42');
  });

  it('should mask sensitive credentials in logs and diagnostics', () => {
    const auth = new AuthManager({
      consumerKey: 'ck_1234567890abcdef',
      consumerSecret: 'cs_abcdef1234567890',
    });

    const masked = auth.getMaskedCredentials();
    expect(masked.key).toBe('ck_1...cdef');
    expect(masked.secret).toBe('cs_a...7890');
    expect(masked.key).not.toContain('1234567890');
  });
});
