import { AuthCredentials, AuthHeaders, AuthMode, OAuthAuthorizeParams, AuthValidationResult } from './types.js';

export class AuthManager {
  private consumerKey: string;
  private consumerSecret: string;
  private authMode: AuthMode;

  constructor(credentials: AuthCredentials) {
    this.consumerKey = credentials.consumerKey.trim();
    this.consumerSecret = credentials.consumerSecret.trim();
    this.authMode = credentials.authMode || 'basic_auth';
  }

  /**
   * Generates authorization headers for WooCommerce REST API calls.
   * Over HTTPS, WooCommerce standard is HTTP Basic Auth using Base64(key:secret).
   */
  public getAuthHeaders(): AuthHeaders {
    if (this.authMode === 'basic_auth' && this.consumerKey && this.consumerSecret) {
      const token = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
      return {
        Authorization: `Basic ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Razorpay-AgentStudio-WooCommerce-Connector/1.0',
      };
    }

    return {
      'Content-Type': 'application/json',
      'User-Agent': 'Razorpay-AgentStudio-WooCommerce-Connector/1.0',
    };
  }

  /**
   * Injects authentication into URL query parameters if using query_param mode
   * (useful for HTTP environments or reverse-proxies stripping Authorization headers).
   */
  public applyAuthToUrl(url: URL): URL {
    if (this.authMode === 'query_param' || !url.protocol.startsWith('https:')) {
      url.searchParams.set('consumer_key', this.consumerKey);
      url.searchParams.set('consumer_secret', this.consumerSecret);
    }
    return url;
  }

  /**
   * Generates a WooCommerce OAuth 1.0a / v1 Endpoint URL for merchant onboarding.
   * This allows Agent Studio to initiate a secure authorization flow with merchant stores.
   */
  public static generateOAuthAuthorizeUrl(params: OAuthAuthorizeParams): string {
    const url = new URL(`${params.storeUrl.replace(/\/+$/, '')}/wc-auth/v1/authorize`);
    url.searchParams.set('app_name', params.appName);
    url.searchParams.set('scope', params.scope);
    url.searchParams.set('user_id', params.userId);
    url.searchParams.set('return_url', params.returnUrl);
    url.searchParams.set('callback_url', params.callbackUrl);
    return url.toString();
  }

  /**
   * Safely masks credentials for logging, error reports, and agent outputs.
   */
  public getMaskedCredentials(): { key: string; secret: string } {
    const mask = (str: string) => {
      if (!str) return '[NOT_SET]';
      if (str.length <= 8) return '****';
      return `${str.substring(0, 4)}...${str.substring(str.length - 4)}`;
    };

    return {
      key: mask(this.consumerKey),
      secret: mask(this.consumerSecret),
    };
  }

  /**
   * Validates credential formats. WooCommerce keys follow standard prefixes:
   * Key: ck_...
   * Secret: cs_...
   */
  public validateFormat(): { valid: boolean; message?: string } {
    if (!this.consumerKey || !this.consumerSecret) {
      return { valid: false, message: 'Consumer Key and Consumer Secret are required.' };
    }
    if (!this.consumerKey.startsWith('ck_')) {
      return {
        valid: false,
        message: 'Invalid Consumer Key format. WooCommerce keys typically begin with "ck_".',
      };
    }
    if (!this.consumerSecret.startsWith('cs_')) {
      return {
        valid: false,
        message: 'Invalid Consumer Secret format. WooCommerce secrets typically begin with "cs_".',
      };
    }
    return { valid: true };
  }
}
