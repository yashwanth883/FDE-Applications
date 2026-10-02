import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

export interface ConnectorConfig {
  baseUrl: string;
  consumerKey: string;
  consumerSecret: string;
  isMock: boolean;
  rateLimitRps: number;
  rateLimitBurst: number;
  maxRetries: number;
  retryBaseDelayMs: number;
  requestTimeoutMs: number;
}

export function loadConfig(overrides?: Partial<ConnectorConfig>): ConnectorConfig {
  const isMockExplicit = process.env.WOOCOMMERCE_MOCK === 'true' || process.argv.includes('--mock');
  const baseUrl = process.env.WOOCOMMERCE_URL || 'https://demo-store.example.com';
  const consumerKey = process.env.WOOCOMMERCE_CONSUMER_KEY || '';
  const consumerSecret = process.env.WOOCOMMERCE_CONSUMER_SECRET || '';

  // Auto-enable mock mode if live credentials are not supplied
  const isMock = isMockExplicit || !consumerKey || !consumerSecret;

  return {
    baseUrl: baseUrl.replace(/\/+$/, ''), // strip trailing slashes
    consumerKey,
    consumerSecret,
    isMock,
    rateLimitRps: Number(process.env.WOOCOMMERCE_RATE_LIMIT_RPS) || 5, // 5 requests/sec standard for WC
    rateLimitBurst: Number(process.env.WOOCOMMERCE_RATE_LIMIT_BURST) || 10,
    maxRetries: Number(process.env.WOOCOMMERCE_MAX_RETRIES) || 3,
    retryBaseDelayMs: Number(process.env.WOOCOMMERCE_RETRY_BASE_DELAY_MS) || 500,
    requestTimeoutMs: Number(process.env.WOOCOMMERCE_TIMEOUT_MS) || 10000,
    ...overrides,
  };
}
