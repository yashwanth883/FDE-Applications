import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { WooCommerceClient } from '../client/woocommerce-client.js';

export function registerWooCommerceTools(server: McpServer, client: WooCommerceClient): void {
  // 1. List Orders
  server.tool(
    'wc_list_orders',
    'List orders from WooCommerce with optional filtering by status (e.g. processing, completed, on-hold, refunded, failed) and pagination.',
    {
      page: z.number().int().min(1).default(1).describe('Page number for pagination (starts at 1)'),
      per_page: z.number().int().min(1).max(100).default(10).describe('Number of orders to retrieve per page (max 100)'),
      status: z
        .enum(['any', 'pending', 'processing', 'on-hold', 'completed', 'cancelled', 'refunded', 'failed'])
        .default('any')
        .describe('Filter orders by order status'),
    },
    async ({ page, per_page, status }) => {
      try {
        const result = await client.listOrders({ page, per_page, status });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  status: 'success',
                  pagination: result.pagination,
                  orders_count: result.data.length,
                  orders: result.data.map((o) => ({
                    id: o.id,
                    order_number: o.number,
                    status: o.status,
                    total: `${o.total} ${o.currency}`,
                    created_at: o.date_created,
                    customer: {
                      name: `${o.billing.first_name} ${o.billing.last_name}`.trim(),
                      email: o.billing.email,
                      phone: o.billing.phone,
                    },
                    payment: {
                      method: o.payment_method_title,
                      transaction_id: o.transaction_id,
                    },
                    items_summary: o.line_items.map((i) => `${i.name} (x${i.quantity})`).join(', '),
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error: any) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: JSON.stringify({ status: 'error', message: error.message }, null, 2),
            },
          ],
        };
      }
    }
  );

  // 2. Get Order by ID
  server.tool(
    'wc_get_order',
    'Retrieve complete details for a specific WooCommerce order by its ID, including items, shipping, payment info, and tracking meta.',
    {
      order_id: z.number().int().positive().describe('The unique WooCommerce Order ID (e.g. 1001)'),
    },
    async ({ order_id }) => {
      try {
        const order = await client.getOrder(order_id);
        if (!order) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ status: 'not_found', message: `Order #${order_id} not found.` }, null, 2),
              },
            ],
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  status: 'success',
                  order: {
                    id: order.id,
                    order_number: order.number,
                    status: order.status,
                    created_at: order.date_created,
                    total: `${order.total} ${order.currency}`,
                    customer: {
                      name: `${order.billing.first_name} ${order.billing.last_name}`.trim(),
                      email: order.billing.email,
                      phone: order.billing.phone,
                    },
                    shipping_address: order.shipping,
                    payment: {
                      method: order.payment_method_title,
                      transaction_id: order.transaction_id,
                    },
                    line_items: order.line_items.map((i) => ({
                      product_id: i.product_id,
                      name: i.name,
                      sku: i.sku,
                      quantity: i.quantity,
                      unit_price: i.price,
                      total: i.total,
                    })),
                    meta: order.meta_data,
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error: any) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: JSON.stringify({ status: 'error', message: error.message }, null, 2),
            },
          ],
        };
      }
    }
  );

  // 3. Search Orders
  server.tool(
    'wc_search_orders',
    'Search orders across order numbers, customer name, email address, product name, or payment transaction IDs.',
    {
      query: z.string().min(1).describe('Search term (e.g. customer email, order number, or transaction ID)'),
      page: z.number().int().min(1).default(1).describe('Page number for search results'),
      per_page: z.number().int().min(1).max(50).default(10).describe('Max results per page'),
    },
    async ({ query, page, per_page }) => {
      try {
        const result = await client.searchOrders(query, page, per_page);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  status: 'success',
                  search_query: query,
                  pagination: result.pagination,
                  results_count: result.data.length,
                  orders: result.data.map((o) => ({
                    id: o.id,
                    order_number: o.number,
                    status: o.status,
                    total: `${o.total} ${o.currency}`,
                    created_at: o.date_created,
                    customer: `${o.billing.first_name} ${o.billing.last_name} (${o.billing.email})`,
                    items: o.line_items.map((i) => i.name).join(', '),
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error: any) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: JSON.stringify({ status: 'error', message: error.message }, null, 2),
            },
          ],
        };
      }
    }
  );

  // 4. List Products
  server.tool(
    'wc_list_products',
    'List products in the store catalog with stock levels, categories, and prices.',
    {
      page: z.number().int().min(1).default(1).describe('Page number'),
      per_page: z.number().int().min(1).max(100).default(10).describe('Products per page'),
      category: z.string().optional().describe('Filter by product category slug or name (e.g. "audio", "accessories")'),
      stock_status: z
        .enum(['instock', 'outofstock', 'onbackorder'])
        .optional()
        .describe('Filter by stock availability status'),
    },
    async ({ page, per_page, category, stock_status }) => {
      try {
        const result = await client.listProducts({ page, per_page, category, stock_status });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  status: 'success',
                  pagination: result.pagination,
                  products_count: result.data.length,
                  products: result.data.map((p) => ({
                    id: p.id,
                    name: p.name,
                    sku: p.sku,
                    price: p.price,
                    stock_status: p.stock_status,
                    stock_quantity: p.stock_quantity,
                    categories: p.categories.map((c) => c.name),
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error: any) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: JSON.stringify({ status: 'error', message: error.message }, null, 2),
            },
          ],
        };
      }
    }
  );

  // 5. Get Product Details
  server.tool(
    'wc_get_product',
    'Retrieve full details for a product by its ID, including description, pricing, SKU, and inventory.',
    {
      product_id: z.number().int().positive().describe('Unique WooCommerce Product ID'),
    },
    async ({ product_id }) => {
      try {
        const product = await client.getProduct(product_id);
        if (!product) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ status: 'not_found', message: `Product #${product_id} not found.` }, null, 2),
              },
            ],
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  status: 'success',
                  product: {
                    id: product.id,
                    name: product.name,
                    sku: product.sku,
                    price: product.price,
                    regular_price: product.regular_price,
                    sale_price: product.sale_price,
                    stock_status: product.stock_status,
                    stock_quantity: product.stock_quantity,
                    manage_stock: product.manage_stock,
                    categories: product.categories.map((c) => c.name),
                    description: product.description,
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error: any) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: JSON.stringify({ status: 'error', message: error.message }, null, 2),
            },
          ],
        };
      }
    }
  );

  // 6. Check Inventory / Stock Level
  server.tool(
    'wc_check_inventory',
    'Check real-time inventory level and availability for a product by SKU or Product ID.',
    {
      sku: z.string().optional().describe('Product SKU (e.g. "AUDIO-HP-01")'),
      product_id: z.number().int().positive().optional().describe('Product ID (e.g. 101)'),
    },
    async ({ sku, product_id }) => {
      if (!sku && !product_id) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: JSON.stringify({ status: 'error', message: 'Either sku or product_id must be provided.' }, null, 2),
            },
          ],
        };
      }

      try {
        const result = await client.checkInventory({ id: product_id, sku });
        if (!result.found) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    status: 'not_found',
                    message: `Item not found for identifier: ${sku ? `SKU=${sku}` : `ID=${product_id}`}`,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  status: 'success',
                  inventory: {
                    product_id: result.productId,
                    name: result.name,
                    sku: result.sku,
                    stock_status: result.stockStatus,
                    quantity_available: result.stockQuantity,
                    managed_stock: result.manageStock,
                    unit_price: result.price,
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error: any) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: JSON.stringify({ status: 'error', message: error.message }, null, 2),
            },
          ],
        };
      }
    }
  );

  // 7. Store Connection & Health Diagnostics
  server.tool(
    'wc_verify_connection',
    'Diagnostic tool for Agent Studio to test connection to the merchant WooCommerce store, verify auth, and inspect rate limiter quotas.',
    {},
    async () => {
      try {
        const conn = await client.verifyConnection();
        const masked = client.getAuthManager().getMaskedCredentials();
        const rateStats = client.getRateLimiter().getStats();

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  status: conn.success ? 'connected' : 'error',
                  mode: conn.mode,
                  credentials: {
                    consumer_key: masked.key,
                    consumer_secret: masked.secret,
                  },
                  rate_limiter: rateStats,
                  details: conn.details,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error: any) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: JSON.stringify({ status: 'error', message: error.message }, null, 2),
            },
          ],
        };
      }
    }
  );
}
