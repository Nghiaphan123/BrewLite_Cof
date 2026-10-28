// apps/web/src/app/login/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams?.get('redirect') || '/menu';

  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isRegister) {
        await apiClient.register({ name, email, password });
      }
      const res = await apiClient.login({ email, password });

      setAuth(res.accessToken, res.user);
      router.push(redirectUrl);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Xác thực thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-sm px-4 py-10">
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-black">
          {isRegister ? 'Đăng ký tài khoản' : 'Đăng nhập BrewLite'}
        </h1>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {isRegister && (
            <div>
              <label htmlFor="auth-name" className="block text-sm font-bold uppercase text-black">
                Họ và tên
              </label>
              <input
                id="auth-name"
                type="text"
                required
                minLength={2}
                maxLength={80}
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-testid="auth-name"
                autoComplete="name"
                className="mt-1 w-full rounded-lg border border-stone-400 bg-white px-3 py-2.5 text-sm font-medium text-black placeholder:text-stone-500 focus:border-black focus:outline-none focus:ring-2 focus:ring-stone-300"
                placeholder="Nguyễn Văn A"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-bold uppercase text-black">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              data-testid="auth-email"
              className="mt-1 w-full rounded-lg border border-stone-400 bg-white px-3 py-2.5 text-sm font-medium text-black placeholder:text-stone-500 focus:border-black focus:outline-none focus:ring-2 focus:ring-stone-300"
              placeholder="ban@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-bold uppercase text-black">Mật khẩu</label>
            <input
              type="password"
              required
              minLength={isRegister ? 8 : undefined}
              pattern={
                isRegister ? '^(?=.*[A-Za-z])(?=.*\\d).{8,}$' : undefined
              }
              title={
                isRegister
                  ? 'Mật khẩu cần ít nhất 8 ký tự, gồm chữ cái và chữ số.'
                  : undefined
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              data-testid="auth-password"
              className="mt-1 w-full rounded-lg border border-stone-400 bg-white px-3 py-2.5 text-sm font-medium text-black placeholder:text-stone-500 focus:border-black focus:outline-none focus:ring-2 focus:ring-stone-300"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p data-testid="auth-error" className="text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            data-testid="auth-submit-btn"
            className="w-full rounded-xl bg-black py-3 font-bold text-white transition hover:bg-stone-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:opacity-60"
          >
            {loading ? 'Đang xử lý...' : isRegister ? 'Đăng ký' : 'Đăng nhập'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setIsRegister(!isRegister)}
          className="mt-4 w-full rounded-lg py-2 text-center text-sm font-bold text-black underline-offset-4 hover:text-stone-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
        >
          {isRegister ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký ngay'}
        </button>
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