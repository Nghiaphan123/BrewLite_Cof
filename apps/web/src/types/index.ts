export type SizeOption = 'S' | 'M' | 'L';

export interface Topping {
  id: string;
  name: string;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  /** Always present in GET /products; ProductCard (features/menu) requires it. */
  imageUrl: string;
  description?: string;
  stock?: number;
}

export interface CartItem {
  cartItemId: string; // kết hợp productId + size + toppings
  product: Product;
  size: SizeOption;
  toppings: Topping[];
  qty: number;
  unitPrice: number;
  lineTotal: number;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  loyaltyPoints?: number;
}

export type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'PAYMENT_FAILED'
  | 'PREPARING'
  | 'READY'
  | 'COMPLETED'
  | 'CANCELLED';

export interface Order {
  id: string;
  userId?: string;
  status: OrderStatus;
  total: number;
  discountAmount?: number;
  createdAt: string;
  items?: Array<{
    id?: string;
    productId: string;
    productName?: string;
    size: SizeOption;
    qty: number;
    lineTotal: number;
  }>;
}