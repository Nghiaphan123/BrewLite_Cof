// apps/web/src/app/login/page.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { getSafeRedirect } from '@/lib/safe-redirect';
import { useAuthStore } from '@/store/auth.store';
import { runWithLoading, useUiStore } from '@/store/ui.store';
import { Spinner } from '@/components/Skeleton';

const REDIRECT_TO_LOGIN_DELAY_MS = 1500;

const INPUT_CLASS =
  'mt-1 w-full rounded-lg border border-stone-400 bg-white px-3 py-2.5 text-sm font-medium text-black placeholder:text-stone-500 focus:border-[#002C22] focus:outline-none focus:ring-2 focus:ring-[#002C22]/20';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = getSafeRedirect(searchParams?.get('redirect'));

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
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
        const isAdmin =
      res.user?.role === 'ADMIN' ||
      email.toLowerCase().trim() === 'admin' ||
      email.toLowerCase().trim().startsWith('admin@');

    if (isAdmin && (redirectUrl === '/' || redirectUrl === '/menu')) {
      router.push('/admin');
    } else {
      router.push(redirectUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      await (isRegister ? handleRegister() : runWithLoading('Đang đăng nhập...', handleLogin));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Xác thực thất bại');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegister(!isRegister);
    setError(null);
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

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label htmlFor="auth-email" className="block text-sm font-bold uppercase text-black">
                  Email hoặc tên đăng nhập
                </label>
                <input
                  id="auth-email"
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-testid="auth-email"
                  className={INPUT_CLASS}
                  placeholder="ban@example.com"
                  autoComplete="email"
                />
              </div>

              <div>
                <label htmlFor="auth-password" className="block text-sm font-bold uppercase text-black">
                  Mật khẩu
                </label>
                <input
                  id="auth-password"
                  type="password"
                  required
                  minLength={isRegister ? 8 : undefined}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="auth-password"
                  className={INPUT_CLASS}
                  placeholder="••••••••"
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                />
                {isRegister && (
                  <p className="mt-1 text-xs text-stone-600">Ít nhất 8 ký tự, gồm cả chữ và số.</p>
                )}
              </div>

              {error && (
                <p role="alert" data-testid="auth-error" className="text-sm text-red-600">
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
