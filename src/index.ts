import { loadConfig } from './config.js';
import { runStdioMcpServer } from './mcp/server.js';
import { WooCommerceClient } from './client/woocommerce-client.js';

async function main() {
  const args = process.argv.slice(2);
  const config = loadConfig();

  if (args.includes('--mode=mcp') || args.includes('mcp')) {
    // Run stdio MCP server for Claude Desktop / Cursor / Agent Studio
    await runStdioMcpServer(config);
    return;
  }

  // Interactive CLI banner and diagnostic check
  console.log('='.repeat(65));
  console.log('   RAZORPAY AGENT STUDIO - WOOCOMMERCE PRIVATE CONNECTOR   ');
  console.log('='.repeat(65));
  console.log(` Mode:               ${config.isMock ? 'MOCK SANDBOX (Zero-setup test mode)' : 'LIVE STORE'}`);
  console.log(` Target Store URL:   ${config.baseUrl}`);
  console.log(` Rate Limiting:      ${config.rateLimitRps} RPS (Burst: ${config.rateLimitBurst})`);
  console.log(` Max Retries (429):  ${config.maxRetries} with exponential backoff`);
  console.log('='.repeat(65));

  const client = new WooCommerceClient(config);
  const conn = await client.verifyConnection();

  console.log(`\nConnection Status:   [${conn.success ? 'SUCCESS' : 'FAILED'}]`);
  console.log(`Store Details:       ${JSON.stringify(conn.details, null, 2)}`);

  console.log('\nAvailable MCP Tools Registered:');
  console.log('  1. wc_list_orders      - List orders with pagination & status filters');
  console.log('  2. wc_get_order        - Fetch order details, line items & shipping');
  console.log('  3. wc_search_orders    - Search by order number, customer email or query');
  console.log('  4. wc_list_products    - List catalog products with stock levels');
  console.log('  5. wc_get_product      - Get product pricing, SKU, and specifications');
  console.log('  6. wc_check_inventory  - Check real-time stock availability by SKU/ID');
  console.log('  7. wc_verify_connection- Diagnostic health check and rate limit quotas');

  console.log('\nHow to Run:');
  console.log('  npm run demo           - Run interactive end-to-end agent scenarios');
  console.log('  npm test               - Run full automated test suite (Vitest)');
  console.log('  npm run mcp            - Start stdio Model Context Protocol (MCP) server');
  console.log('='.repeat(65));
}

main().catch((err) => {
  console.error('Fatal error starting connector:', err);
  process.exit(1);
});
