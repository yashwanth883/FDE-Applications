import { describe, it, expect } from 'vitest';
import { WooCommerceClient } from '../src/client/woocommerce-client.js';
import { loadConfig } from '../src/config.js';

describe('WooCommerce Primitives (Orders & Inventory)', () => {
  const config = loadConfig({ isMock: true });
  const client = new WooCommerceClient(config);

  describe('Orders Primitives', () => {
    it('should list orders with pagination', async () => {
      const result = await client.listOrders({ page: 1, per_page: 2 });
      expect(result.data).toHaveLength(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.perPage).toBe(2);
      expect(result.pagination.total).toBeGreaterThanOrEqual(5);
    });

    it('should filter orders by status', async () => {
      const processing = await client.listOrders({ status: 'processing' });
      expect(processing.data.length).toBeGreaterThan(0);
      expect(processing.data.every((o) => o.status === 'processing')).toBe(true);

      const failed = await client.listOrders({ status: 'failed' });
      expect(failed.data.length).toBeGreaterThan(0);
      expect(failed.data[0].status).toBe('failed');
      expect(failed.data[0].meta_data.some((m) => m.key === '_failure_reason')).toBe(true);
    });

    it('should get order by ID', async () => {
      const order = await client.getOrder(1001);
      expect(order).toBeDefined();
      expect(order?.id).toBe(1001);
      expect(order?.billing.email).toBe('aarav.sharma@example.com');
      expect(order?.line_items[0].sku).toBe('AUDIO-HP-01');
    });

    it('should return null for non-existent order ID', async () => {
      const order = await client.getOrder(99999);
      expect(order).toBeNull();
    });

    it('should search orders by customer email or order number', async () => {
      const searchByEmail = await client.searchOrders('priya.patel@example.com');
      expect(searchByEmail.data).toHaveLength(1);
      expect(searchByEmail.data[0].id).toBe(1002);

      const searchByNumber = await client.searchOrders('1003');
      expect(searchByNumber.data).toHaveLength(1);
      expect(searchByNumber.data[0].billing.first_name).toBe('Rohan');
    });
  });

  describe('Products & Inventory Primitives', () => {
    it('should list products and categories', async () => {
      const result = await client.listProducts({ page: 1, per_page: 10 });
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data[0]).toHaveProperty('sku');
      expect(result.data[0]).toHaveProperty('stock_status');
    });

    it('should get product by ID', async () => {
      const product = await client.getProduct(101);
      expect(product).toBeDefined();
      expect(product?.name).toBe('Wireless Noise-Cancelling Headphones Pro');
      expect(product?.stock_quantity).toBe(42);
      expect(product?.stock_status).toBe('instock');
    });

    it('should check inventory by SKU', async () => {
      const stock = await client.checkInventory({ sku: 'PWR-GAN-65' });
      expect(stock.found).toBe(true);
      expect(stock.name).toBe('Fast Charging 65W GaN Adapter');
      expect(stock.stockQuantity).toBe(128);
      expect(stock.stockStatus).toBe('instock');
    });

    it('should report out-of-stock items accurately', async () => {
      const stock = await client.checkInventory({ sku: 'MOU-VERT-01' });
      expect(stock.found).toBe(true);
      expect(stock.stockQuantity).toBe(0);
      expect(stock.stockStatus).toBe('outofstock');
    });
  });
});
