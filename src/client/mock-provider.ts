export interface MockOrder {
  id: number;
  number: string;
  status: 'pending' | 'processing' | 'on-hold' | 'completed' | 'cancelled' | 'refunded' | 'failed';
  currency: string;
  date_created: string;
  total: string;
  customer_id: number;
  billing: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    city: string;
    country: string;
  };
  shipping: {
    first_name: string;
    last_name: string;
    address_1: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  payment_method: string;
  payment_method_title: string;
  transaction_id: string; // E.g. Razorpay payment ID: pay_N9aK3x...
  line_items: Array<{
    id: number;
    name: string;
    product_id: number;
    quantity: number;
    price: number;
    total: string;
    sku: string;
  }>;
  meta_data: Array<{
    key: string;
    value: string;
  }>;
}

export interface MockProduct {
  id: number;
  name: string;
  slug: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  status: 'publish' | 'draft';
  manage_stock: boolean;
  stock_quantity: number | null;
  stock_status: 'instock' | 'outofstock' | 'onbackorder';
  categories: Array<{ id: number; name: string; slug: string }>;
  description: string;
}

export class MockWooCommerceProvider {
  private orders: MockOrder[] = [
    {
      id: 1001,
      number: '1001',
      status: 'processing',
      currency: 'INR',
      date_created: '2026-09-30T10:15:00',
      total: '2499.00',
      customer_id: 201,
      billing: {
        first_name: 'Aarav',
        last_name: 'Sharma',
        email: 'aarav.sharma@example.com',
        phone: '+919876543210',
        city: 'Bengaluru',
        country: 'IN',
      },
      shipping: {
        first_name: 'Aarav',
        last_name: 'Sharma',
        address_1: 'Indiranagar 100ft Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        postcode: '560038',
        country: 'IN',
      },
      payment_method: 'razorpay',
      payment_method_title: 'Razorpay Payment Gateway (UPI / Card)',
      transaction_id: 'pay_P198xKlqwe897',
      line_items: [
        {
          id: 501,
          name: 'Wireless Noise-Cancelling Headphones Pro',
          product_id: 101,
          quantity: 1,
          price: 2499,
          total: '2499.00',
          sku: 'AUDIO-HP-01',
        },
      ],
      meta_data: [
        { key: '_shipping_carrier', value: 'BlueDart' },
        { key: '_tracking_number', value: 'BD-884920194' },
        { key: '_estimated_delivery', value: '2026-10-04' },
      ],
    },
    {
      id: 1002,
      number: '1002',
      status: 'completed',
      currency: 'INR',
      date_created: '2026-09-28T14:22:10',
      total: '899.00',
      customer_id: 202,
      billing: {
        first_name: 'Priya',
        last_name: 'Patel',
        email: 'priya.patel@example.com',
        phone: '+919811223344',
        city: 'Mumbai',
        country: 'IN',
      },
      shipping: {
        first_name: 'Priya',
        last_name: 'Patel',
        address_1: 'Bandra West, Hill Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        postcode: '400050',
        country: 'IN',
      },
      payment_method: 'razorpay',
      payment_method_title: 'Razorpay UPI',
      transaction_id: 'pay_P281mBna0918',
      line_items: [
        {
          id: 502,
          name: 'Fast Charging 65W GaN Adapter',
          product_id: 102,
          quantity: 1,
          price: 899,
          total: '899.00',
          sku: 'PWR-GAN-65',
        },
      ],
      meta_data: [
        { key: '_shipping_carrier', value: 'Delhivery' },
        { key: '_tracking_number', value: 'DEL-99128312' },
        { key: '_delivery_status', value: 'Delivered on Sep 30' },
      ],
    },
    {
      id: 1003,
      number: '1003',
      status: 'on-hold',
      currency: 'INR',
      date_created: '2026-10-01T09:40:00',
      total: '4999.00',
      customer_id: 203,
      billing: {
        first_name: 'Rohan',
        last_name: 'Verma',
        email: 'rohan.verma@example.com',
        phone: '+919777888999',
        city: 'Delhi',
        country: 'IN',
      },
      shipping: {
        first_name: 'Rohan',
        last_name: 'Verma',
        address_1: 'Connaught Place',
        city: 'New Delhi',
        state: 'Delhi',
        postcode: '110001',
        country: 'IN',
      },
      payment_method: 'razorpay',
      payment_method_title: 'Razorpay Netbanking',
      transaction_id: 'pay_pending_R91823',
      line_items: [
        {
          id: 503,
          name: 'Mechanical Gaming Keyboard RGB',
          product_id: 103,
          quantity: 1,
          price: 4999,
          total: '4999.00',
          sku: 'KB-MECH-RGB',
        },
      ],
      meta_data: [
        { key: '_hold_reason', value: 'Awaiting Bank Settlement Confirmation' },
      ],
    },
    {
      id: 1004,
      number: '1004',
      status: 'refunded',
      currency: 'INR',
      date_created: '2026-09-25T11:05:00',
      total: '1299.00',
      customer_id: 204,
      billing: {
        first_name: 'Sneha',
        last_name: 'Reddy',
        email: 'sneha.reddy@example.com',
        phone: '+919666555444',
        city: 'Hyderabad',
        country: 'IN',
      },
      shipping: {
        first_name: 'Sneha',
        last_name: 'Reddy',
        address_1: 'Gachibowli',
        city: 'Hyderabad',
        state: 'Telangana',
        postcode: '500032',
        country: 'IN',
      },
      payment_method: 'razorpay',
      payment_method_title: 'Razorpay Cards',
      transaction_id: 'pay_ref_S881729',
      line_items: [
        {
          id: 504,
          name: 'Ergonomic Vertical Mouse',
          product_id: 104,
          quantity: 1,
          price: 1299,
          total: '1299.00',
          sku: 'MOU-VERT-01',
        },
      ],
      meta_data: [
        { key: '_refund_id', value: 'rfnd_RzP1098230' },
        { key: '_refund_reason', value: 'Customer returned item within 7-day policy' },
      ],
    },
    {
      id: 1005,
      number: '1005',
      status: 'failed',
      currency: 'INR',
      date_created: '2026-10-01T16:10:00',
      total: '3499.00',
      customer_id: 205,
      billing: {
        first_name: 'Vikram',
        last_name: 'Singh',
        email: 'vikram.singh@example.com',
        phone: '+919555111222',
        city: 'Jaipur',
        country: 'IN',
      },
      shipping: {
        first_name: 'Vikram',
        last_name: 'Singh',
        address_1: 'Civil Lines',
        city: 'Jaipur',
        state: 'Rajasthan',
        postcode: '302006',
        country: 'IN',
      },
      payment_method: 'razorpay',
      payment_method_title: 'Razorpay UPI',
      transaction_id: 'pay_fail_V91827',
      line_items: [
        {
          id: 505,
          name: 'Smart Fitness Tracker Band 5',
          product_id: 105,
          quantity: 1,
          price: 3499,
          total: '3499.00',
          sku: 'FIT-BAND-05',
        },
      ],
      meta_data: [
        { key: '_failure_reason', value: 'Bank server timeout during UPI PIN entry' },
      ],
    },
  ];

  private products: MockProduct[] = [
    {
      id: 101,
      name: 'Wireless Noise-Cancelling Headphones Pro',
      slug: 'wireless-noise-cancelling-headphones-pro',
      sku: 'AUDIO-HP-01',
      price: '2499',
      regular_price: '3499',
      sale_price: '2499',
      status: 'publish',
      manage_stock: true,
      stock_quantity: 42,
      stock_status: 'instock',
      categories: [{ id: 10, name: 'Audio', slug: 'audio' }],
      description: 'Premium wireless headphones with Active Noise Cancellation and 30-hour battery life.',
    },
    {
      id: 102,
      name: 'Fast Charging 65W GaN Adapter',
      slug: 'fast-charging-65w-gan-adapter',
      sku: 'PWR-GAN-65',
      price: '899',
      regular_price: '1199',
      sale_price: '899',
      status: 'publish',
      manage_stock: true,
      stock_quantity: 128,
      stock_status: 'instock',
      categories: [{ id: 11, name: 'Accessories', slug: 'accessories' }],
      description: 'Ultra-compact 65W USB-C GaN wall charger compatible with laptops and smartphones.',
    },
    {
      id: 103,
      name: 'Mechanical Gaming Keyboard RGB',
      slug: 'mechanical-gaming-keyboard-rgb',
      sku: 'KB-MECH-RGB',
      price: '4999',
      regular_price: '5999',
      sale_price: '4999',
      status: 'publish',
      manage_stock: true,
      stock_quantity: 3, // Low stock!
      stock_status: 'instock',
      categories: [{ id: 12, name: 'Gaming', slug: 'gaming' }],
      description: 'Hot-swappable mechanical keyboard with RGB backlighting and blue switches.',
    },
    {
      id: 104,
      name: 'Ergonomic Vertical Mouse',
      slug: 'ergonomic-vertical-mouse',
      sku: 'MOU-VERT-01',
      price: '1299',
      regular_price: '1499',
      sale_price: '1299',
      status: 'publish',
      manage_stock: true,
      stock_quantity: 0, // Out of stock!
      stock_status: 'outofstock',
      categories: [{ id: 11, name: 'Accessories', slug: 'accessories' }],
      description: 'Ergonomic vertical wireless mouse designed to reduce wrist strain.',
    },
    {
      id: 105,
      name: 'Smart Fitness Tracker Band 5',
      slug: 'smart-fitness-tracker-band-5',
      sku: 'FIT-BAND-05',
      price: '3499',
      regular_price: '3999',
      sale_price: '3499',
      status: 'publish',
      manage_stock: true,
      stock_quantity: 18,
      stock_status: 'instock',
      categories: [{ id: 13, name: 'Wearables', slug: 'wearables' }],
      description: 'Waterproof fitness tracker with heart-rate monitoring and AMOLED display.',
    },
    {
      id: 106,
      name: 'UltraWide Curved Monitor 34-inch',
      slug: 'ultrawide-curved-monitor-34',
      sku: 'DISP-UW-34',
      price: '32999',
      regular_price: '35999',
      sale_price: '32999',
      status: 'publish',
      manage_stock: true,
      stock_quantity: 0,
      stock_status: 'onbackorder', // Backordered!
      categories: [{ id: 14, name: 'Displays', slug: 'displays' }],
      description: '34-inch WQHD 144Hz curved gaming and productivity monitor.',
    },
  ];

  // Simulated rate-limit simulation counter for tests
  private rateLimitSimulationsLeft = 0;

  public triggerRateLimitForNextRequests(count: number): void {
    this.rateLimitSimulationsLeft = count;
  }

  private checkSimulatedRateLimit(): void {
    if (this.rateLimitSimulationsLeft > 0) {
      this.rateLimitSimulationsLeft--;
      const err: any = new Error('WooCommerce API: Too Many Requests (Simulated 429)');
      err.status = 429;
      err.headers = new Headers({
        'retry-after': '1',
        'x-ratelimit-limit': '5',
        'x-ratelimit-remaining': '0',
      });
      throw err;
    }
  }

  public async getOrders(params: {
    page?: number;
    per_page?: number;
    status?: string;
    customer?: number;
    search?: string;
  }): Promise<{ data: MockOrder[]; total: number; totalPages: number }> {
    this.checkSimulatedRateLimit();

    let filtered = [...this.orders];

    if (params.status && params.status !== 'any') {
      filtered = filtered.filter((o) => o.status.toLowerCase() === params.status?.toLowerCase());
    }

    if (params.customer) {
      filtered = filtered.filter((o) => o.customer_id === params.customer);
    }

    if (params.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.number.includes(q) ||
          o.billing.email.toLowerCase().includes(q) ||
          o.billing.first_name.toLowerCase().includes(q) ||
          o.billing.last_name.toLowerCase().includes(q) ||
          o.transaction_id.toLowerCase().includes(q) ||
          o.line_items.some((item) => item.name.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q))
      );
    }

    const page = Math.max(1, params.page || 1);
    const perPage = Math.min(100, Math.max(1, params.per_page || 10));
    const total = filtered.length;
    const totalPages = Math.ceil(total / perPage);
    const startIndex = (page - 1) * perPage;
    const data = filtered.slice(startIndex, startIndex + perPage);

    return { data, total, totalPages };
  }

  public async getOrderById(id: number): Promise<MockOrder | null> {
    this.checkSimulatedRateLimit();
    const order = this.orders.find((o) => o.id === id);
    return order ? JSON.parse(JSON.stringify(order)) : null;
  }

  public async getProducts(params: {
    page?: number;
    per_page?: number;
    search?: string;
    sku?: string;
    stock_status?: string;
    category?: string;
  }): Promise<{ data: MockProduct[]; total: number; totalPages: number }> {
    this.checkSimulatedRateLimit();

    let filtered = [...this.products];

    if (params.stock_status) {
      filtered = filtered.filter((p) => p.stock_status === params.stock_status);
    }

    if (params.sku) {
      filtered = filtered.filter((p) => p.sku.toLowerCase() === params.sku?.toLowerCase());
    }

    if (params.category) {
      filtered = filtered.filter((p) =>
        p.categories.some((c) => c.slug.toLowerCase() === params.category?.toLowerCase() || c.name.toLowerCase() === params.category?.toLowerCase())
      );
    }

    if (params.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    const page = Math.max(1, params.page || 1);
    const perPage = Math.min(100, Math.max(1, params.per_page || 10));
    const total = filtered.length;
    const totalPages = Math.ceil(total / perPage);
    const startIndex = (page - 1) * perPage;
    const data = filtered.slice(startIndex, startIndex + perPage);

    return { data, total, totalPages };
  }

  public async getProductById(id: number): Promise<MockProduct | null> {
    this.checkSimulatedRateLimit();
    const product = this.products.find((p) => p.id === id);
    return product ? JSON.parse(JSON.stringify(product)) : null;
  }
}
