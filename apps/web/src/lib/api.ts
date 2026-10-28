import { Order, Product, SizeOption, User } from '@/types';

const configuredApiUrl = (
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'
).replace(/\/+$/, '');
export const API_BASE_URL = configuredApiUrl.endsWith('/api/v1')
  ? configuredApiUrl
  : `${configuredApiUrl}/api/v1`;

function getAuthHeaders(): HeadersInit {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('brewlite_token')
      : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      data?.message || data?.error?.message || `Lỗi kết nối API (${res.status})`;
    throw new Error(Array.isArray(message) ? message.join(', ') : message);
  }
  // Hỗ trợ cả trường hợp backend trả trực tiếp data hoặc bọc trong { data: ... }
  return (data?.data !== undefined ? data.data : data) as T;
}

type ListResponse<T> = { items: T[]; total: number };
type AuthResponse = {
  accessToken?: string;
  access_token?: string;
  token?: string;
  user?: User;
};

function getAuthResult(result: AuthResponse): { accessToken: string; user?: User } {
  const accessToken = result.accessToken ?? result.access_token ?? result.token;
  if (!accessToken) {
    throw new Error('Phản hồi xác thực không có access token.');
  }
  return { accessToken, user: result.user };
}

/** API hiện trả danh sách theo dạng { items, total }; vẫn hỗ trợ mảng cũ để tương thích. */
function getListItems<T>(
  result: ListResponse<T> | T[],
  resourceName: string,
): T[] {
  if (Array.isArray(result)) {
    return result;
  }

  if (result && Array.isArray(result.items)) {
    return result.items;
  }

  throw new Error(`Dữ liệu ${resourceName} từ máy chủ không đúng định dạng.`);
}

export const apiClient = {
  // [Task 2 & 3] GET /products
  async getProducts(): Promise<Product[]> {
    const res = await fetch(`${API_BASE_URL}/products`, {
      headers: getAuthHeaders(),
      cache: 'no-store',
    });
    const result = await handleResponse<ListResponse<Product> | Product[]>(res);
    return getListItems(result, 'sản phẩm');
  },

  // [Task 2 & 4] GET /products/:id
  async getProductById(id: string): Promise<Product> {
    const res = await fetch(`${API_BASE_URL}/products/${id}`, {
      headers: getAuthHeaders(),
      cache: 'no-store',
    });
    return handleResponse<Product>(res);
  },

  // [Task 7] POST /auth/register
  async register(payload: { email: string; password: string; name?: string }): Promise<{
    accessToken: string;
    user?: User;
  }> {
    const name = payload.name || (payload.email.includes('@') ? payload.email.split('@')[0] : payload.email);
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ ...payload, name }),
    });
    const result = await handleResponse<{
      accessToken?: string;
      access_token?: string;
      token?: string;
      user?: User;
    }>(res);
    return {
      accessToken: result.accessToken || result.access_token || result.token || '',
      user: result.user || { email: payload.email, name },
    };
  },

  // [Task 7] POST /auth/login
  async login(payload: { email: string; password: string }): Promise<{
    accessToken: string;
    user?: User;
  }> {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
<<<<<<< HEAD
    const result = await handleResponse<AuthResponse>(res);
    return getAuthResult(result);
  },

  async getProfile(): Promise<User> {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getAuthHeaders(),
      cache: 'no-store',
    });
    return handleResponse<User>(res);
  },

  async changePassword(payload: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE_URL}/auth/password`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<{ message: string }>(res);
=======
    const result = await handleResponse<{
      accessToken?: string;
      access_token?: string;
      token?: string;
      user?: User;
    }>(res);
    return {
      accessToken: result.accessToken || result.access_token || result.token || '',
      user: result.user,
    };
>>>>>>> bb876c0 (feat(web): auth flow, profile, order details)
  },

  // [Task 6 & 10] POST /orders (Bảo vệ bởi JwtAuthGuard)
  async createOrder(payload: {
    items: Array<{ productId: string; size: SizeOption; qty: number; toppings?: string[] }>;
    promoCode?: string;
  }): Promise<Order> {
    const res = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<Order>(res);
  },

  // [Task 8 & 10] POST /payments kèm Idempotency-Key
  async payOrder(
    payload: {
      orderId: string;
      method: 'WALLET' | 'CARD';
      amount?: number;
      simulateFailure?: boolean;
    },
    idempotencyKey: string
  ): Promise<{ status: 'PAID' | 'PAYMENT_FAILED'; orderId: string; loyaltyPointsEarned?: number }> {
    const res = await fetch(`${API_BASE_URL}/payments`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        ...payload,
        idempotencyKey,
      }),
    });
    return handleResponse(res);
  },

  // [Task 9] GET /orders/me
  async getMyOrders(): Promise<Order[]> {
    const res = await fetch(`${API_BASE_URL}/orders/me`, {
      headers: getAuthHeaders(),
      cache: 'no-store',
    });
    const result = await handleResponse<ListResponse<Order> | Order[]>(res);
    return getListItems(result, 'lịch sử đơn hàng');
  },
};