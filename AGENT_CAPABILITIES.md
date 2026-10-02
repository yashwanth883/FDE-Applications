# Agent Studio: WooCommerce Connector Capabilities & Guardrails

This document outlines the operational scope, security boundaries, and explicit guardrails governing the **WooCommerce Private Connector** within **Razorpay Agent Studio**.

---

## 1. Scope & Design Philosophy

As a Forward-Deployed Engineer (FDE) integration, the connector is designed with the **Principle of Least Privilege (PoLP)** and **Zero-Trust Data Protection**. The connector equips AI agents with contextual awareness across merchant transactions and catalog states while enforcing strict read-only boundaries to protect merchant systems.

---

## 2. What the Agent CAN Do

### A. Order Lookups & Customer Support
- **Fetch Order Status:** Retrieve real-time lifecycle states (`processing`, `completed`, `on-hold`, `failed`, `refunded`, `cancelled`).
- **Search Across Identifiers:** Search orders via Order ID, customer email address, customer billing name, or payment transaction IDs.
- **Inspect Fulfillment & Logistics:** Extract carrier names (e.g., BlueDart, Delhivery), tracking numbers, and delivery date estimates stored in order metadata.
- **Verify Line Items:** Itemize products purchased, quantities, unit prices, line item subtotals, and billing/shipping addresses.

### B. Catalog & Real-Time Inventory Checks
- **Check Stock Availability:** Verify whether a given product SKU or Product ID is `instock`, `outofstock`, or `onbackorder`.
- **Read Quantity Levels:** Inspect remaining inventory counts for stock-managed items.
- **Catalog Navigation:** List products filtered by category, price, and availability to help customers discover alternative products if an item is out of stock.

### C. Payment Investigation & Razorpay Reconciliation
- **Inspect Payment Status:** Identify payment gateway method (e.g., `Razorpay Payment Gateway (UPI / Card)`) and capture the corresponding Razorpay Transaction ID (`pay_...`).
- **Surface Failure & Hold Explanations:** Access merchant and gateway notes explaining why an order is `on-hold` (e.g., awaiting bank settlement confirmation) or `failed` (e.g., UPI PIN timeout).

### D. System Diagnostics & Self-Healing
- **Proactive Throttling:** Throttle outbound requests according to merchant server capacity using a Token Bucket algorithm.
- **Automatic Backoff Recovery:** Reactively handle HTTP 429 ("Too Many Requests") via exponential backoff with full jitter, retrying requests without human intervention.
- **Connection Health Checks:** Test API key validity and inspect rate limit quotas via `wc_verify_connection`.

---

## 3. What the Agent CANNOT Do (Guardrails & Boundaries)

| Boundary | Restriction Details | Rationale |
| :--- | :--- | :--- |
| **No State Mutation (Read-Only)** | The agent cannot create, update, cancel, or delete orders, products, or inventory levels. | Prevents unauthorized modifications or hallucinated state changes from affecting the merchant's live store. |
| **No Direct Fund Movement** | The agent cannot initiate refunds, trigger fund captures, or debit customer accounts directly through this connector. | Financial actions require explicit merchant approval or a dedicated high-security human-in-the-loop workflow. |
| **No Sensitive Payment Instrument Access** | The agent cannot view or process raw credit/debit card numbers (PANs), CVVs, banking passwords, or UPI PINs. | Compliance with **PCI-DSS** and **RBI Payment Aggregator** regulations. The agent only views the tokenized `transaction_id`. |
| **No WordPress Core Administration** | The agent cannot access WordPress users, password hashes, server configuration, themes, or non-WooCommerce plugins. | Isolates the agent strictly to the e-commerce domain. |
| **No Bypassing Merchant Rate Limits** | The agent cannot override or flood merchant endpoints beyond configured RPS limits. | Protects shared or low-spec WooCommerce hosting servers from accidental denial of service (DoS). |

---

## 4. Security & Privacy Safeguards

1. **Credential Masking:** Consumer keys and secrets are never surfaced in raw text across agent prompts, logs, or MCP tool responses (e.g., masked as `ck_1...cdef`).
2. **Read-Only Scope Enforcement:** When utilizing the WooCommerce OAuth flow, the authorization scope is explicitly pinned to `scope=read`.
3. **Structured Schema Validation:** Every incoming parameter is strictly validated using Zod schemas before being dispatched to the WooCommerce API, preventing injection vulnerabilities.

---

## 5. Human-in-the-Loop (HITL) Escalation Triggers

The agent is instructed to escalate to a human merchant support representative when:
1. A customer disputes a payment status that marked as `failed` but where funds were debited from their bank account.
2. A customer requests an order cancellation or full refund.
3. Persistent HTTP 429 or 503 server errors occur after all automatic retries are exhausted.
