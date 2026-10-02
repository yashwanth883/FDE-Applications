import { describe, it, expect } from 'vitest';
import { createMcpServer } from '../src/mcp/server.js';
import { loadConfig } from '../src/config.js';

describe('MCP Server Specification & Tools', () => {
  const config = loadConfig({ isMock: true });
  const { server, client } = createMcpServer(config);

  it('should create an MCP server instance with server metadata', () => {
    expect(server).toBeDefined();
    expect(client).toBeDefined();
  });

  it('should verify connection via client diagnostic method', async () => {
    const conn = await client.verifyConnection();
    expect(conn.success).toBe(true);
    expect(conn.mode).toBe('mock_sandbox');
    expect(conn.details.store).toContain('Agent Studio');
  });

  it('should execute list orders primitive matching MCP tool schema', async () => {
    const orders = await client.listOrders({ page: 1, per_page: 5 });
    expect(orders.data).toBeInstanceOf(Array);
    expect(orders.pagination).toHaveProperty('page', 1);
    expect(orders.pagination).toHaveProperty('perPage', 5);
  });

  it('should execute search orders primitive matching MCP tool schema', async () => {
    const results = await client.searchOrders('1001');
    expect(results.data).toHaveLength(1);
    expect(results.data[0].number).toBe('1001');
  });

  it('should execute inventory stock check primitive matching MCP tool schema', async () => {
    const inventory = await client.checkInventory({ sku: 'AUDIO-HP-01' });
    expect(inventory.found).toBe(true);
    expect(inventory.sku).toBe('AUDIO-HP-01');
    expect(inventory.stockStatus).toBe('instock');
  });
});
