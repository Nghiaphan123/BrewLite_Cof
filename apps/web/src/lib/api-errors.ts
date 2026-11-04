// API trả thông báo tiếng Anh theo hợp đồng; người dùng chỉ thấy bản tiếng Việt ở đây.
const MESSAGES_BY_CODE: Record<string, string> = {
  AUTH_USER_NOT_FOUND: 'Thông tin tài khoản không chính xác. Vui lòng thử lại!',
  AUTH_WRONG_PASSWORD: 'Mật khẩu không chính xác. Xin vui lòng thử lại!',
  AUTH_INVALID: 'Thông tin tài khoản hoặc mật khẩu không chính xác. Xin vui lòng thử lại!',
  AUTH_REQUIRED: 'Vui lòng đăng nhập để tiếp tục.',
  AUTH_EXPIRED: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  EMAIL_TAKEN: 'Email này đã được đăng ký.',
  INVALID_NAME: 'Tên phải có từ 2 đến 80 ký tự.',
  USER_NOT_FOUND: 'Không tìm thấy tài khoản.',
  CURRENT_PASSWORD_INVALID: 'Mật khẩu hiện tại không đúng.',
  PASSWORD_UNCHANGED: 'Mật khẩu mới phải khác mật khẩu hiện tại.',
  IDEMPOTENCY_KEY_REQUIRED: 'Không thể xử lý thanh toán. Vui lòng thử lại.',
  IDEMPOTENCY_CONFLICT: 'Yêu cầu thanh toán bị trùng. Vui lòng thử lại.',
  ORDER_NOT_FOUND: 'Không tìm thấy đơn hàng.',
  OUT_OF_STOCK: 'Sản phẩm đã hết hàng.',
  INVALID_STATE_TRANSITION: 'Không thể thực hiện thao tác với trạng thái hiện tại của đơn hàng.',
  PRODUCT_NOT_FOUND: 'Không tìm thấy sản phẩm.',
  TOPPING_NOT_FOUND: 'Không tìm thấy topping.',
  TOPPING_INACTIVE: 'Topping này hiện không còn phục vụ.',
  PROMO_NOT_FOUND: 'Mã khuyến mãi không tồn tại.',
  PROMO_INACTIVE: 'Mã khuyến mãi không còn hiệu lực.',
  PROMO_EXPIRED: 'Mã khuyến mãi đã hết hạn hoặc chưa đến thời gian áp dụng.',
  PROMO_MIN_ORDER_NOT_MET: 'Đơn hàng chưa đạt giá trị tối thiểu để dùng mã này.',
  PROMO_EXHAUSTED: 'Mã khuyến mãi đã hết lượt sử dụng.',
};

// Lỗi kiểm tra dữ liệu của ValidationPipe không có code nên phải khớp theo nội dung.
const VALIDATION_MESSAGES: Array<[RegExp, string]> = [
  [/^email\b/i, 'Email không hợp lệ.'],
  [/^name\b/i, 'Tên phải có từ 2 đến 80 ký tự.'],
  [/^password\b/i, 'Mật khẩu phải có ít nhất 8 ký tự, gồm cả chữ và số.'],
  [/^newPassword\b/i, 'Mật khẩu mới phải có ít nhất 8 ký tự, gồm cả chữ và số.'],
  [/^currentPassword\b/i, 'Vui lòng nhập mật khẩu hiện tại.'],
];

const VIETNAMESE_TEXT = /[À-ỹ]/;

function fallbackMessage(status: number): string {
  if (status === 401) return 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.';
  if (status === 403) return 'Bạn không có quyền thực hiện thao tác này.';
  if (status === 404) return 'Không tìm thấy dữ liệu yêu cầu.';
  if (status === 400) return 'Dữ liệu gửi lên không hợp lệ.';
  if (status >= 500) return 'Lỗi máy chủ. Vui lòng thử lại sau.';
  return `Có lỗi xảy ra (mã ${status}). Vui lòng thử lại.`;
}

export function getApiErrorMessage(status: number, body: unknown): string {
  const data = (typeof body === 'object' && body !== null ? body : {}) as {
    code?: unknown;
    message?: unknown;
  };

  if (typeof data.code === 'string' && MESSAGES_BY_CODE[data.code]) {
    return MESSAGES_BY_CODE[data.code];
  }

  const messages = (Array.isArray(data.message) ? data.message : [data.message]).filter(
    (message): message is string => typeof message === 'string',
  );

  const translated = messages.flatMap((message) => {
    if (VIETNAMESE_TEXT.test(message)) return [message];
    const match = VALIDATION_MESSAGES.find(([pattern]) => pattern.test(message));
    return match ? [match[1]] : [];
  });

  return translated.length > 0 ? [...new Set(translated)].join(' ') : fallbackMessage(status);
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** fetch báo lỗi mạng bằng tiếng Anh ("Failed to fetch"), nên đổi sang thông báo tiếng Việt. */
export async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng và thử lại.');
    }
    throw error;
  }
}
