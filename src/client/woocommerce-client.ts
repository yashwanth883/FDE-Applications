import { ConnectorConfig } from '../config.js';
import { AuthManager } from '../auth/auth-manager.js';
import { RateLimiter } from './rate-limiter.js';
import { MockWooCommerceProvider, MockOrder, MockProduct } from './mock-provider.js';

export interface ListOrdersParams {
  page?: number;
  per_page?: number;
  status?: string;
  customer?: number;
  search?: string;
  after?: string;
  before?: string;
}

export interface ListProductsParams {
  page?: number;
  per_page?: number;
  search?: string;
  sku?: string;
  stock_status?: 'instock' | 'outofstock' | 'onbackorder';
  category?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

export class WooCommerceClient {
  private config: ConnectorConfig;
  private authManager: AuthManager;
  private rateLimiter: RateLimiter;
  private mockProvider?: MockWooCommerceProvider;

  constructor(config: ConnectorConfig) {
    this.config = config;
    this.authManager = new AuthManager({
      consumerKey: config.consumerKey,
      consumerSecret: config.consumerSecret,
    });
    this.rateLimiter = new RateLimiter({
      rps: config.rateLimitRps,
      burst: config.rateLimitBurst,
      maxRetries: config.maxRetries,
      retryBaseDelayMs: config.retryBaseDelayMs,
    });

    if (config.isMock) {
      this.mockProvider = new MockWooCommerceProvider();
    }
  }

  public getMockProvider(): MockWooCommerceProvider | undefined {
    return this.mockProvider;
  }

  public getRateLimiter(): RateLimiter {
    return this.rateLimiter;
  }

  public getAuthManager(): AuthManager {
    return this.authManager;
  }

  public isMockMode(): boolean {
    return this.config.isMock;
  }

  /**
   * Internal request dispatcher that executes live WooCommerce REST calls
   * with rate limiting, timeouts, and error normalization.
   */
  private async executeRequest<T>(endpoint: string, queryParams: Record<string, any> = {}): Promise<{ data: T; total: number; totalPages: number }> {
    const url = new URL(`${this.config.baseUrl}/wp-json/wc/v3/${endpoint.replace(/^\//, '')}`);
    
    // Add query parameters
    Object.entries(queryParams).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        url.searchParams.set(k, String(v));
      }
    });

    // Apply URL-based auth if fallback is needed
    this.authManager.applyAuthToUrl(url);

    return this.rateLimiter.executeWithRetry(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.requestTimeoutMs);

      try {
        const headers = this.authManager.getAuthHeaders() as HeadersInit;
        const response = await fetch(url.toString(), {
          method: 'GET',
          headers,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorBody = await response.text().catch(() => '');
          let message = `WooCommerce API error ${response.status}: ${response.statusText}`;
          try {
            const parsed = JSON.parse(errorBody);
            if (parsed.message) message = parsed.message;
          } catch {}

          const error: any = new Error(message);
          error.status = response.status;
          error.headers = response.headers;
          throw error;
        }

        const total = parseInt(response.headers.get('x-wp-total') || '0', 10);
        const totalPages = parseInt(response.headers.get('x-wp-totalpages') || '1', 10);
        const data = (await response.json()) as T;

        return { data, total, totalPages };
      } catch (err: any) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
          throw new Error(`WooCommerce API request timed out after ${this.config.requestTimeoutMs}ms`);
        }
        throw err;
      }
    });
  }

  /**
   * Verify store connectivity and credentials.
   */
  public async verifyConnection(): Promise<{ success: boolean; mode: string; details: any }> {
    if (this.config.isMock) {
      return {
        success: true,
        mode: 'mock_sandbox',
        details: {
          store: 'Agent Studio WooCommerce Mock Sandbox',
          currency: 'INR',
          environment: 'Local Sandbox (Zero external credentials required)',
        },
      };
    }

    try {
      const res = await this.executeRequest<any>('system_status');
      return {
        success: true,
        mode: 'live',
        details: {
          storeUrl: this.config.baseUrl,
          environment: res.data?.environment?.version || 'WooCommerce v3+',
        },
      };
    } catch (err: any) {
      return {
        success: false,
        mode: 'live',
        details: {
          error: err.message,
          hint: 'Verify WOOCOMMERCE_URL, WOOCOMMERCE_CONSUMER_KEY, and WOOCOMMERCE_CONSUMER_SECRET in .env',
        },
      };
    }
  }

  /**
   * List orders with filtering and pagination.
   */
  public async listOrders(params: ListOrdersParams = {}): Promise<PaginatedResult<MockOrder>> {
    const page = params.page || 1;
    const perPage = params.per_page || 10;

    if (this.config.isMock && this.mockProvider) {
      return this.rateLimiter.executeWithRetry(async () => {
        const res = await this.mockProvider!.getOrders(params);
        return {
          data: res.data,
          pagination: {
            page,
            perPage,
            total: res.total,
            totalPages: res.totalPages,
          },
        };
      });
    }

    const res = await this.executeRequest<MockOrder[]>('orders', params);
    return {
      data: res.data,
      pagination: {
        page,
        perPage,
        total: res.total || res.data.length,
        totalPages: res.totalPages,
      },
    };
  }

  /**
   * Get an order by ID.
   */
  public async getOrder(orderId: number): Promise<MockOrder | null> {
    if (this.config.isMock && this.mockProvider) {
      return this.rateLimiter.executeWithRetry(async () => {
        return this.mockProvider!.getOrderById(orderId);
      });
    }

    try {
      const res = await this.executeRequest<MockOrder>(`orders/${orderId}`);
      return res.data;
    } catch (err: any) {
      if (err.status === 404) return null;
      throw err;
    }
  }

  /**
   * Search orders by query (order number, customer name, email, or transaction ID).
   */
  public async searchOrders(query: string, page = 1, perPage = 10): Promise<PaginatedResult<MockOrder>> {
    return this.listOrders({
      search: query,
      page,
      per_page: perPage,
    });
  }

  /**
   * List products with inventory and category filtering.
   */
  public async listProducts(params: ListProductsParams = {}): Promise<PaginatedResult<MockProduct>> {
    const page = params.page || 1;
    const perPage = params.per_page || 10;

    if (this.config.isMock && this.mockProvider) {
      return this.rateLimiter.executeWithRetry(async () => {
        const res = await this.mockProvider!.getProducts(params);
        return {
          data: res.data,
          pagination: {
            page,
            perPage,
            total: res.total,
            totalPages: res.totalPages,
          },
        };
      });
    }

    const res = await this.executeRequest<MockProduct[]>('products', params);
    return {
      data: res.data,
      pagination: {
        page,
        perPage,
        total: res.total || res.data.length,
        totalPages: res.totalPages,
      },
    };
  }

  /**
   * Get a product by ID.
   */
  public async getProduct(productId: number): Promise<MockProduct | null> {
    if (this.config.isMock && this.mockProvider) {
      return this.rateLimiter.executeWithRetry(async () => {
        return this.mockProvider!.getProductById(productId);
      });
    }

    try {
      const res = await this.executeRequest<MockProduct>(`products/${productId}`);
      return res.data;
    } catch (err: any) {
      if (err.status === 404) return null;
      throw err;
    }
  }

  /**
   * Search products by keyword, name, or SKU.
   */
  public async searchProducts(query: string, page = 1, perPage = 10): Promise<PaginatedResult<MockProduct>> {
    return this.listProducts({
      search: query,
      page,
      per_page: perPage,
    });
  }

  /**
   * Look up real-time inventory and stock status for an item by SKU or product ID.
   */
  public async checkInventory(identifier: { id?: number; sku?: string }): Promise<{
    found: boolean;
    productId?: number;
    name?: string;
    sku?: string;
    stockStatus?: string;
    stockQuantity?: number | null;
    manageStock?: boolean;
    price?: string;
  }> {
    if (identifier.id) {
      const product = await this.getProduct(identifier.id);
      if (!product) return { found: false };
      return {
        found: true,
        productId: product.id,
        name: product.name,
        sku: product.sku,
        stockStatus: product.stock_status,
        stockQuantity: product.stock_quantity,
        manageStock: product.manage_stock,
        price: product.price,
      };
    }

    if (identifier.sku) {
      const result = await this.listProducts({ sku: identifier.sku, per_page: 1 });
      if (result.data.length === 0) return { found: false };
      const product = result.data[0];
      return {
        found: true,
        productId: product.id,
        name: product.name,
        sku: product.sku,
        stockStatus: product.stock_status,
        stockQuantity: product.stock_quantity,
        manageStock: product.manage_stock,
        price: product.price,
      };
    }

    return { found: false };
  }
}
