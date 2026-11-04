// apps/web/src/app/login/page.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { ApiError } from '@/lib/api-errors';
import { useAuthStore } from '@/store/auth.store';
import { runWithLoading, useUiStore } from '@/store/ui.store';
import { Spinner } from '@/components/Skeleton';

const REDIRECT_TO_LOGIN_DELAY_MS = 1500;

// mt-1 nằm ở wrapper để icon cảnh báo canh giữa đúng ô input.
const INPUT_BASE_CLASS =
  'block w-full rounded-lg border bg-white py-2.5 pl-3 text-sm font-medium text-black placeholder:text-stone-500 transition-colors duration-200 focus:outline-none focus:ring-2';

const INPUT_CLASS = `${INPUT_BASE_CLASS} border-stone-400 pr-3 focus:border-[#002C22] focus:ring-[#002C22]/20`;

// Chỉ đổi màu border/ring và thêm padding phải cho icon: kích thước ô giữ nguyên.
const INPUT_ERROR_CLASS = `${INPUT_BASE_CLASS} border-red-500 pr-9 focus:border-red-600 focus:ring-red-200`;

const REQUIRED_EMAIL_MESSAGE = 'Vui lòng nhập email.';
const REQUIRED_PASSWORD_MESSAGE = 'Vui lòng nhập mật khẩu.';
const INVALID_EMAIL_MESSAGE = 'Email không hợp lệ.';
const REGISTER_PASSWORD_MESSAGE = 'Mật khẩu phải có ít nhất 8 ký tự, gồm cả chữ và số.';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+$/;
const REGISTER_PASSWORD_MIN_LENGTH = 8;

type FieldName = 'email' | 'password';
/** 'credentials': máy chủ báo sai tài khoản/mật khẩu; 'required'/'invalid': kiểm tra ngay trên form. */
type FieldError = 'credentials' | 'required' | 'invalid';
type FieldErrors = Partial<Record<FieldName, FieldError>>;

const FIELD_NAMES: FieldName[] = ['email', 'password'];

const FIELD_MESSAGES: Record<FieldName, Record<Exclude<FieldError, 'credentials'>, string>> = {
  email: { required: REQUIRED_EMAIL_MESSAGE, invalid: INVALID_EMAIL_MESSAGE },
  password: { required: REQUIRED_PASSWORD_MESSAGE, invalid: REGISTER_PASSWORD_MESSAGE },
};

/** Chỉ trả về lỗi khi giá trị còn sai, nhờ vậy border đỏ không tồn tại sau khi người dùng nhập lại hợp lệ. */
function getFieldError(field: FieldName, value: string, isRegister: boolean): FieldError | null {
  if (field === 'email') {
    const trimmed = value.trim();
    if (!trimmed) return 'required';
    return EMAIL_PATTERN.test(trimmed) ? null : 'invalid';
  }

  if (!value.trim()) return 'required';
  if (isRegister && value.length < REGISTER_PASSWORD_MIN_LENGTH) return 'invalid';
  return null;
}

function getFieldErrors(email: string, password: string, isRegister: boolean): FieldErrors {
  const errors: FieldErrors = {};
  const emailError = getFieldError('email', email, isRegister);
  if (emailError) errors.email = emailError;
  const passwordError = getFieldError('password', password, isRegister);
  if (passwordError) errors.password = passwordError;
  return errors;
}

/** Thông báo kiểm tra dữ liệu dùng lại ô lỗi sẵn có của form, không tạo thêm vùng thông báo mới. */
function getValidationMessage(fieldErrors: FieldErrors): string | null {
  const messages = FIELD_NAMES.flatMap((field) => {
    const fieldError = fieldErrors[field];
    return fieldError && fieldError !== 'credentials' ? [FIELD_MESSAGES[field][fieldError]] : [];
  });
  return messages.length > 0 ? messages.join(' ') : null;
}

/**
 * Phân biệt chính xác lỗi theo mã phản hồi từ API:
 * - AUTH_USER_NOT_FOUND: tài khoản không tồn tại -> chỉ đánh dấu lỗi ô Email
 * - AUTH_WRONG_PASSWORD: mật khẩu sai -> chỉ đánh dấu lỗi ô Mật khẩu
 * - 401 chung (fallback): đánh dấu cả hai ô
 */
function getApiFieldErrors(error: unknown): FieldErrors {
  if (error instanceof ApiError) {
    if (error.code === 'AUTH_USER_NOT_FOUND') {
      return { email: 'credentials' };
    }
    if (error.code === 'AUTH_WRONG_PASSWORD') {
      return { password: 'credentials' };
    }
    if (error.status === 401) {
      return { email: 'credentials', password: 'credentials' };
    }
  }
  return {};
}

function FieldWarningIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-red-500"
    >
      <path
        fillRule="evenodd"
        d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 6a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 6Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams?.get('redirect') || '/';

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    return () => {
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
    };
  }, []);

  const handleRegister = async () => {
    await apiClient.register({ email, password });
    setPassword('');
    setRegistered(true);
    // Đăng ký xong chuyển sang màn hình thành công nên không còn trạng thái lỗi nào trên form.
    setFieldErrors({});
    redirectTimer.current = setTimeout(() => {
      setRegistered(false);
      setIsRegister(false);
      setNotice('Tài khoản đã sẵn sàng. Vui lòng đăng nhập.');
    }, REDIRECT_TO_LOGIN_DELAY_MS);
  };

  const handleLogin = async () => {
    const res = await apiClient.login({ email, password });
    if (!res?.accessToken) {
      throw new Error('Không nhận được token xác thực từ máy chủ');
    }
    setAuth(res.accessToken, res.user || { email });
    useUiStore.getState().holdLoadingUntilNavigation();
    router.push(redirectUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = getFieldErrors(email, password, isRegister);
    setFieldErrors(validationErrors);

    // Trường bắt buộc còn trống thì không gọi API; giữ lại thông báo đang có của form.
    if (Object.keys(validationErrors).length > 0) {
      setError(getValidationMessage(validationErrors));
      setNotice(null);
      return;
    }

    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      await (isRegister ? handleRegister() : runWithLoading('Đang đăng nhập...', handleLogin));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Xác thực thất bại');
      setFieldErrors(getApiFieldErrors(err));
    } finally {
      setLoading(false);
    }
  };

  // Người dùng chỉnh lại dữ liệu thì gỡ trạng thái lỗi của đúng ô đó, nhờ vậy border đỏ
  // không tồn tại sau khi đã nhập lại thông tin mới. Lỗi được kiểm tra lại ở lần gửi kế tiếp.
  const handleFieldChange = (field: FieldName, value: string) => {
    if (field === 'email') setEmail(value);
    else setPassword(value);

    if (!fieldErrors.email && !fieldErrors.password) {
      // Chỉ còn thông báo chung (lỗi mạng, lỗi máy chủ) thì cũng gỡ khi người dùng nhập lại.
      if (error) setError(null);
      return;
    }

    const nextFieldErrors: FieldErrors = { ...fieldErrors };
    delete nextFieldErrors[field];

    setFieldErrors(nextFieldErrors);
    // Hết lỗi trường thì thông báo cũng biến mất; nếu còn trường khác thì hiển thị lỗi trường đó.
    if (!nextFieldErrors.email && !nextFieldErrors.password) {
      setError(null);
    } else {
      setError(getValidationMessage(nextFieldErrors));
    }
  };

  const toggleMode = () => {
    setIsRegister(!isRegister);
    setError(null);
    setFieldErrors({});
    setNotice(null);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#faf8f3] px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="relative inline-block overflow-hidden rounded-2xl bg-[#002C22] py-5 pl-6 pr-24 text-white">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-200">
            Pha tươi mỗi ngày
          </p>
          <p className="mt-1 font-serif text-3xl font-semibold tracking-tight">BrewLite</p>
          <span
            aria-hidden="true"
            className="absolute -right-3 -top-3 select-none text-7xl opacity-10"
          >
            ☕
          </span>
        </div>

        {registered ? (
          <div role="status" data-testid="register-success" className="animate-page-in py-10 text-center">
            <p className="text-lg font-bold text-[#002C22]">Đăng ký tài khoản thành công</p>
            <span
              aria-hidden="true"
              className="mx-auto mt-5 block h-8 w-8 animate-spin rounded-full border-4 border-[#002C22]/20 border-t-[#002C22]"
            />
            <p className="mt-3 text-sm text-stone-600">Đang chuyển đến trang đăng nhập...</p>
          </div>
        ) : (
          <>
            <h1 className="mt-6 text-2xl font-bold text-[#002C22]">
              {isRegister ? 'Đăng ký tài khoản' : 'Đăng nhập tài khoản'}
            </h1>

            {notice && (
              <p
                role="status"
                data-testid="auth-notice"
                className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-[#002C22]"
              >
                {notice}
              </p>
            )}

            <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-4">
              <div>
                <label htmlFor="auth-email" className="block text-sm font-bold uppercase text-black">
                  Email
                </label>
                <div className="relative mt-1">
                  <input
                    id="auth-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                    data-testid="auth-email"
                    className={fieldErrors.email ? INPUT_ERROR_CLASS : INPUT_CLASS}
                    placeholder="ban@example.com"
                    autoComplete="email"
                    aria-invalid={fieldErrors.email ? true : undefined}
                    aria-describedby={fieldErrors.email && error ? 'auth-error' : undefined}
                  />
                  {fieldErrors.email && <FieldWarningIcon />}
                </div>
              </div>

              <div>
                <label htmlFor="auth-password" className="block text-sm font-bold uppercase text-black">
                  Mật khẩu
                </label>
                <div className="relative mt-1">
                  <input
                    id="auth-password"
                    type="password"
                    required
                    minLength={isRegister ? 8 : undefined}
                    value={password}
                    onChange={(e) => handleFieldChange('password', e.target.value)}
                    data-testid="auth-password"
                    className={fieldErrors.password ? INPUT_ERROR_CLASS : INPUT_CLASS}
                    placeholder="••••••••"
                    autoComplete={isRegister ? 'new-password' : 'current-password'}
                    aria-invalid={fieldErrors.password ? true : undefined}
                    aria-describedby={fieldErrors.password && error ? 'auth-error' : undefined}
                  />
                  {fieldErrors.password && <FieldWarningIcon />}
                </div>
                {isRegister && (
                  <p className="mt-1 text-xs text-stone-600">Ít nhất 8 ký tự, gồm cả chữ và số.</p>
                )}
              </div>

              {error && (
                <p id="auth-error" role="alert" data-testid="auth-error" className="text-sm text-red-600">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                data-testid="auth-submit-btn"
                className="w-full rounded-xl bg-[#002C22] py-3 font-bold text-white transition hover:bg-[#014034] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#002C22] disabled:opacity-60"
              >
                {loading && <Spinner />}
                {loading ? 'Đang xử lý...' : isRegister ? 'Đăng ký' : 'Đăng nhập'}
              </button>
            </form>

            <button
              type="button"
              onClick={toggleMode}
              className="mt-4 w-full rounded-lg py-2 text-center text-sm font-bold text-[#002C22] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#002C22]"
            >
              {isRegister ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký ngay'}
            </button>
          </>
        )}
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={<div className="mx-auto max-w-sm px-4 py-10 text-center text-stone-500">Đang tải...</div>}>
      <LoginForm />
    </React.Suspense>
  );
}
