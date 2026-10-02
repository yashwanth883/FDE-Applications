import { loadConfig } from '../config.js';
import { WooCommerceClient } from '../client/woocommerce-client.js';

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runDemo() {
  console.log('\n================================================================');
  console.log('   RAZORPAY AGENT STUDIO - INTERACTIVE CONNECTOR DEMO   ');
  console.log('================================================================\n');

  const config = loadConfig({ isMock: true });
  const client = new WooCommerceClient(config);

  // 1. Connection Verification
  console.log('👉 STEP 1: Verifying Merchant Store Connection & Diagnostics');
  const conn = await client.verifyConnection();
  console.log(`   Connection Status: ${conn.success ? 'CONNECTED' : 'FAILED'}`);
  console.log(`   Mode:              ${conn.mode}`);
  console.log(`   Rate Limiter:      RPS=${config.rateLimitRps}, Burst=${config.rateLimitBurst}`);
  await sleep(1000);

  // 2. Scenario 1: Customer Order Inquiry
  console.log('\n----------------------------------------------------------------');
  console.log('👉 SCENARIO 1: Customer asks "Where is my order for Aarav Sharma?"');
  console.log('   Agent Action: Invoking wc_search_orders(query: "aarav.sharma@example.com")');
  
  const searchResult = await client.searchOrders('aarav.sharma@example.com');
  const orderSummary = searchResult.data[0];
  console.log(`   Found ${searchResult.data.length} order(s):`);
  console.log(`   - Order #${orderSummary.number} | Total: ${orderSummary.total} INR | Status: ${orderSummary.status.toUpperCase()}`);
  
  console.log('\n   Agent Action: Invoking wc_get_order(order_id: 1001) for tracking details');
  const fullOrder = await client.getOrder(orderSummary.id);
  const carrier = fullOrder?.meta_data.find((m) => m.key === '_shipping_carrier')?.value;
  const tracking = fullOrder?.meta_data.find((m) => m.key === '_tracking_number')?.value;
  const eta = fullOrder?.meta_data.find((m) => m.key === '_estimated_delivery')?.value;
  
  console.log(`   📦 Shipping Carrier:     ${carrier}`);
  console.log(`   📍 Tracking Number:      ${tracking}`);
  console.log(`   📅 Estimated Delivery:   ${eta}`);
  console.log(`   💳 Payment Method:       ${fullOrder?.payment_method_title} (ID: ${fullOrder?.transaction_id})`);
  await sleep(1200);

  // 3. Scenario 2: Inventory & Stock Check
  console.log('\n----------------------------------------------------------------');
  console.log('👉 SCENARIO 2: Customer asks "Is the Fast Charging Adapter in stock?"');
  console.log('   Agent Action: Invoking wc_check_inventory(sku: "PWR-GAN-65")');
  
  const inventory1 = await client.checkInventory({ sku: 'PWR-GAN-65' });
  console.log(`   Product:        ${inventory1.name}`);
  console.log(`   Stock Status:   ${inventory1.stockStatus?.toUpperCase()}`);
  console.log(`   Quantity Left:  ${inventory1.stockQuantity} units available`);
  console.log(`   Unit Price:     ₹${inventory1.price}`);
  await sleep(1200);

  // 4. Scenario 3: Out-of-Stock and Low-Stock Guardrails
  console.log('\n----------------------------------------------------------------');
  console.log('👉 SCENARIO 3: Agent checks items with low or out-of-stock status');
  console.log('   Agent Action: Checking Ergonomic Vertical Mouse (SKU: MOU-VERT-01)');
  const oosItem = await client.checkInventory({ sku: 'MOU-VERT-01' });
  console.log(`   - ${oosItem.name}: [${oosItem.stockStatus?.toUpperCase()}] (Qty: ${oosItem.stockQuantity})`);

  console.log('   Agent Action: Checking Mechanical Gaming Keyboard (SKU: KB-MECH-RGB)');
  const lowStockItem = await client.checkInventory({ sku: 'KB-MECH-RGB' });
  console.log(`   - ${lowStockItem.name}: [${lowStockItem.stockStatus?.toUpperCase()}] (⚠️ ONLY ${lowStockItem.stockQuantity} LEFT IN STOCK!)`);
  await sleep(1200);

  // 5. Scenario 4: Investigating Payment & On-Hold Orders
  console.log('\n----------------------------------------------------------------');
  console.log('👉 SCENARIO 4: Merchant asks Agent "Which orders need payment attention?"');
  console.log('   Agent Action: Listing orders with status "on-hold" and "failed"');
  
  const onHoldOrders = await client.listOrders({ status: 'on-hold' });
  for (const o of onHoldOrders.data) {
    const holdReason = o.meta_data.find((m) => m.key === '_hold_reason')?.value;
    console.log(`   ⚠️ Order #${o.number} [ON-HOLD]: Customer ${o.billing.first_name} | Reason: ${holdReason}`);
  }

  const failedOrders = await client.listOrders({ status: 'failed' });
  for (const o of failedOrders.data) {
    const failReason = o.meta_data.find((m) => m.key === '_failure_reason')?.value;
    console.log(`   ❌ Order #${o.number} [FAILED]: Customer ${o.billing.first_name} | Reason: ${failReason}`);
  }
  await sleep(1200);

  // 6. Scenario 5: Rate Limiting & 429 Exponential Backoff Demonstration
  console.log('\n----------------------------------------------------------------');
  console.log('👉 SCENARIO 5: Proactive Rate Limiting & 429 Exponential Backoff Recovery');
  console.log('   Simulating merchant server returning HTTP 429 Too Many Requests...');
  
  const mockProvider = client.getMockProvider();
  if (mockProvider) {
    // Inject 2 consecutive 429 errors to prove automatic backoff and retry works
    mockProvider.triggerRateLimitForNextRequests(2);
    console.log('   [Simulation] Injected 2 simulated HTTP 429 responses into provider.');
  }

  const startTime = Date.now();
  console.log('   Making request for order #1002 with retry handling active...');
  
  const recoveredOrder = await client.getOrder(1002);
  const elapsed = Date.now() - startTime;
  
  console.log(`   ✅ Successfully recovered after automatic backoff retry!`);
  console.log(`   Received Order: #${recoveredOrder?.number} (Total time with backoff: ${elapsed}ms)`);
  console.log('   Rate Limiter Stats:', client.getRateLimiter().getStats());

  console.log('\n================================================================');
  console.log('   DEMO COMPLETED SUCCESSFULLY: ALL AGENT PRIMITIVES OPERATIONAL');
  console.log('================================================================\n');
}

runDemo().catch((err) => {
  console.error('Demo failed:', err);
  process.exit(1);
});
