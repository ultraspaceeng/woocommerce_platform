// Product Types
export interface ProductOption {
  name: string;
  values: string[];
}

export interface ProductInventory {
  sku: string;
  stock: number;
}

export interface ProductSeoData {
  metaTitle: string;
  metaDescription: string;
}

export interface Product {
  _id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  discountedPrice?: number;
  type: 'physical' | 'digital';
  category: string;
  options: ProductOption[];
  inventory: ProductInventory;
  assets: string[];
  digitalFile?: string;
  seoData: ProductSeoData;
  createdAt: string;
  updatedAt: string;
  brand?: string;
}

// Order Types
export interface CartItem {
  product: Product;
  quantity: number;
  selectedOptions?: Record<string, string>;
}

export interface UserDetails {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
}

export type PaymentStatus = 'pending' | 'paid' | 'failed';
export type FulfillmentStatus = 'unfulfilled' | 'processing' | 'shipped' | 'fulfilled';

export interface Order {
  _id: string;
  orderId: string;
  userDetails: UserDetails;
  cartItems: Array<{
    product: string;
    productTitle: string;
    quantity: number;
    price: number;
    selectedOptions?: Record<string, string>;
  }>;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  paystackRef?: string;
  fulfillmentStatus: FulfillmentStatus;
  createdAt: string;
  updatedAt: string;
}

// User Types
export interface User {
  _id: string;
  email: string;
  name: string;
  phone?: string;
  orderHistory: string[];
  createdAt: string;
}

// Admin Types
export interface AdminSession {
  email: string;
  isAuthenticated: boolean;
  token: string;
}

// Dashboard Metrics
export interface DashboardMetrics {
  netSales: number;
  totalOrders: number;
  ordersFulfilled: number;
  ordersUnfulfilled: number;
  totalUsers: number;
  weeklySales: Array<{ date: string; amount: number; orderCount: number }>;
  weekTotalRevenue: number;
  weekTotalOrders: number;
  averageOrderValue: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Theme Types
export type Theme = 'light' | 'dark' | 'system';
