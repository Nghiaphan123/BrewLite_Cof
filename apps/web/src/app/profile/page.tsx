'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Order } from '@/types';
import { useLogout } from '@/features/auth/useLogout';
import { DetailLinesSkeleton, OrderListSkeleton, Spinner } from '@/components/Skeleton';

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams?.get('tab');
  const { token, user } = useAuthStore();
  const logoutWithLoading = useLogout();

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (!useAuthStore.getState().token) {
      router.push('/login?redirect=/profile');
      return;
    }

    apiClient
      .getMyOrders()
      .then(setOrders)
      .catch((err) => setOrdersError(err.message || 'Không thể tải lịch sử đơn hàng'))
      .finally(() => setOrdersLoading(false));
  }, [token, router]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);
    setPasswordError(null);

    if (newPassword !== confirmPassword) {
      setPasswordError('Mật khẩu xác nhận không khớp');
      return;
    }

    setPasswordLoading(true);
    try {
      await apiClient.changePassword({ currentPassword, newPassword });
      setPasswordMsg('Đổi mật khẩu thành công.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : 'Không thể đổi mật khẩu.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const getStatusLabel = (status: Order['status']) => {
    switch (status) {
      case 'PENDING':
        return 'Chờ xử lý';
      case 'PAID':
        return 'Đã thanh toán';
      case 'PAYMENT_FAILED':
        return 'Thanh toán thất bại';
      case 'PREPARING':
        return 'Đang pha chế';
      case 'READY':
        return 'Sẵn sàng lấy';
      case 'COMPLETED':
        return 'Hoàn thành';
      case 'CANCELLED':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-emerald-100 text-emerald-800';
      case 'PAID':
      case 'READY':
        return 'bg-blue-100 text-blue-800';
      case 'PREPARING':
        return 'bg-amber-100 text-amber-800';
      case 'CANCELLED':
      case 'PAYMENT_FAILED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-stone-100 text-stone-700';
    }
  };

  if (!token) {
    return null;
  }

  return (
    <div className="min-h-full bg-[#faf8f3] text-stone-900">
      <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-[#faf8f3]/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-bold tracking-tight text-emerald-950"
          >
            <span aria-hidden="true" className="text-2xl">☕</span>
            BrewLite
          </Link>
          <Link
            href="/"
            className="ml-auto text-sm font-semibold text-emerald-900 hover:underline"
          >
            Về trang menu
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-3 py-5 sm:px-6 sm:py-8">
        <div className="mb-5 sm:mb-6">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Thông tin tài khoản</h1>
          <p className="mt-1 text-sm text-stone-600 sm:text-base">Quản lý thông tin, đơn hàng và bảo mật</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-1">
            <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl">
                  👤
                </div>
                <div className="min-w-0">
                  <p className="truncate text-lg font-bold text-stone-900">
                    {user?.name?.trim() || (user?.email ? user.email.split('@')[0] : 'Người dùng')}
                  </p>
                  <p className="truncate text-sm text-stone-500">{user?.email}</p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-amber-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-amber-900">Điểm tích lũy</p>
                    <p className="text-xs text-amber-700">Tích điểm khi thanh toán</p>
                  </div>
                  <p className="text-2xl font-bold text-amber-900">⭐ {user?.loyaltyPoints ?? 0}</p>
                </div>
                <div className="rounded-xl bg-stone-50 px-4 py-3">
                  <p className="text-sm font-semibold text-stone-900">ID tài khoản</p>
                  <p className="mt-1 break-all font-mono text-xs text-stone-600">{user?.id || 'user-1'}</p>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => router.push('/profile?tab=password')}
                  className="min-h-11 rounded-xl border border-stone-200 px-4 py-2.5 text-center text-sm font-semibold text-stone-700 hover:bg-stone-50"
                >
                  Đổi mật khẩu
                </button>
                <button
                  type="button"
                  onClick={() => void logoutWithLoading()}
                  className="min-h-11 rounded-xl border border-red-200 px-4 py-2.5 text-center text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  Đăng xuất
                </button>
              </div>
            </section>

            {(tab === 'password') && (
              <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6">
                <h2 className="text-lg font-bold text-stone-900">Đổi mật khẩu</h2>
                <form onSubmit={handleChangePassword} className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-stone-700">Mật khẩu hiện tại</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-stone-700">Mật khẩu mới</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-stone-700">Xác nhận mật khẩu mới</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                  <p className="text-xs text-stone-600">Mật khẩu mới có ít nhất 8 ký tự, gồm cả chữ và số.</p>
                  {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
                  {passwordMsg && <p className="text-sm text-emerald-700">{passwordMsg}</p>}
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="w-full rounded-xl bg-emerald-900 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
                  >
                    {passwordLoading && <Spinner />}
                    {passwordLoading ? 'Đang xử lý...' : 'Cập nhật mật khẩu'}
                  </button>
                </form>
              </section>
            )}
          </div>

          <div className="lg:col-span-2">
            <section className="rounded-2xl border border-stone-200 bg-white shadow-sm">
              <div className="flex flex-col gap-2 border-b border-stone-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                  <h2 className="text-lg font-bold text-stone-900">Đơn hàng đã mua</h2>
                  <p className="text-sm text-stone-500">Lịch sử các đơn hàng của bạn</p>
                </div>
                <Link href="/orders" className="inline-flex min-h-10 items-center text-sm font-semibold text-emerald-900 hover:underline">
                  Xem tất cả
                </Link>
              </div>

              <div className="p-3 sm:p-6">
                {ordersLoading && <OrderListSkeleton count={2} />}
                {ordersError && <p className="text-red-600">{ordersError}</p>}
                {!ordersLoading && !ordersError && orders.length === 0 && (
                  <p className="text-stone-500">Bạn chưa có đơn hàng nào.</p>
                )}

                <div className="space-y-3">
                  {orders.slice(0, 10).map((order) => (
                    <Link
                      key={order.id}
                      href={`/orders/${order.id}`}
                      className="flex flex-col gap-3 rounded-xl border border-stone-200 p-3 transition hover:border-emerald-700 hover:bg-emerald-50/30 sm:p-4"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="break-all font-bold text-stone-900">Mã đơn: #{order.id}</p>
                          <p className="text-xs text-stone-500">
                            {order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : ''}
                          </p>
                        </div>
                        <div className="flex items-center justify-between gap-3 sm:justify-end sm:text-right">
                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${getStatusColor(order.status)}`}>
                            {getStatusLabel(order.status)}
                          </span>
                          <p className="text-lg font-bold text-stone-900">
                            {Number(order.total || 0).toLocaleString('vi-VN')}₫
                          </p>
                        </div>
                      </div>
                      {order.items && order.items.length > 0 && (
                        <div className="space-y-2 rounded-lg bg-stone-50 p-3">
                          <p className="text-xs font-semibold text-stone-700">Sản phẩm đã mua</p>
                      {order.items.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="flex items-start justify-between gap-2 text-sm">
                          <div className="min-w-0 flex-1">
                            <p className="break-words font-medium text-stone-900">{item.name || item.productName || 'Sản phẩm'}</p>
                            <p className="text-xs text-stone-500">Size: {item.size || 'M'} • SL: {item.qty}</p>
                            {item.toppings && item.toppings.length > 0 && (
                              <p data-testid="order-item-toppings" className="text-xs text-stone-500">
                                Topping: {item.toppings.map((topping) => topping.name).join(', ')}
                              </p>
                            )}
                          </div>
                          <p className="shrink-0 font-semibold text-stone-900">{Number(item.lineTotal || 0).toLocaleString('vi-VN')}₫</p>
                        </div>
                      ))}
                          {order.items.length > 3 && (
                            <p className="text-xs text-stone-500">+{order.items.length - 3} sản phẩm khác</p>
                          )}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <React.Suspense
      fallback={
        <div className="mx-auto max-w-5xl px-4 py-10">
          <DetailLinesSkeleton label="Đang tải thông tin tài khoản" />
        </div>
      }
    >
      <ProfileContent />
    </React.Suspense>
  );
}
