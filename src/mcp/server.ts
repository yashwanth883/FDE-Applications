import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { WooCommerceClient } from '../client/woocommerce-client.js';
import { ConnectorConfig } from '../config.js';
import { registerWooCommerceTools } from './tools.js';

export function createMcpServer(config: ConnectorConfig, client?: WooCommerceClient): { server: McpServer; client: WooCommerceClient } {
  const wooClient = client || new WooCommerceClient(config);

  const server = new McpServer({
    name: 'razorpay-agent-studio-woocommerce-connector',
    version: '1.0.0',
  });

  registerWooCommerceTools(server, wooClient);

  return { server, client: wooClient };
}

export async function runStdioMcpServer(config: ConnectorConfig): Promise<void> {
  const { server } = createMcpServer(config);
  const transport = new StdioServerTransport();

  // Log diagnostic info to stderr so stdout remains 100% clean for JSON-RPC MCP messages
  process.stderr.write(
    `[MCP Server] Starting Razorpay Agent Studio WooCommerce Connector in ${
      config.isMock ? 'MOCK SANDBOX' : 'LIVE REST API'
    } mode...\n`
  );

  await server.connect(transport);
  process.stderr.write(`[MCP Server] Connected to Stdio transport. Listening for agent requests.\n`);
}
