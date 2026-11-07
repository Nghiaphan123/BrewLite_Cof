export type SizeOption = 'S' | 'M' | 'L';

export interface Topping {
  id: string;
  name: string;
  price: number;
  stock?: number;
  active?: boolean;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  /** Always present in GET /products; ProductCard (features/menu) requires it. */
  imageUrl: string;
  description?: string;
  stock?: number;
  /** Chỉ có ở GET /products/:id. */
  toppings?: Topping[];
}

export interface Promotion {
  id?: string;
  code: string;
  type: 'PERCENT' | 'FIXED';
  value: number;
  minOrderTotal: number;
  validFrom?: string;
  validTo?: string;
  active?: boolean;
  usageLimit?: number | null;
  usedCount?: number;
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
  name?: string;
  email: string;
  role?: 'ADMIN' | 'CUSTOMER' | string;
  loyaltyPoints?: number;
  createdAt?: string;
  _count?: {
    orders: number;
  };
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
  code?: string;
  userId?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  status: OrderStatus;
  subtotal?: number;
  total: number;
  discountAmount?: number;
  promoCode?: string | null;
  createdAt: string;
  updatedAt?: string;
  /** Chỉ có ở GET /orders/:code: lần thanh toán thành công gần nhất, hoặc null nếu chưa trả tiền. */
  payment?: {
    method: 'WALLET' | 'CARD';
    paidAt: string;
    loyaltyPointsEarned: number;
  } | null;
  items?: Array<{
    id?: string;
    productId: string;
    productName?: string;
    name?: string;
    imageUrl?: string;
    size: SizeOption;
    qty: number;
    lineTotal: number;
    unitPrice?: number;
    toppings?: Array<{
      id?: string;
      name?: string;
      unitPrice?: number;
    }>;
  }>;
}
