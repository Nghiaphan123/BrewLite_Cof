// apps/web/src/app/orders/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { Order } from '@/types';
import { OrderListSkeleton } from '@/components/Skeleton';

const STATUS_LABELS: Record<Order['status'], string> = {
  PENDING: 'Chờ xử lý',
  PAID: 'Đã thanh toán',
  PAYMENT_FAILED: 'Thanh toán thất bại',
  PREPARING: 'Đang pha chế',
  READY: 'Sẵn sàng lấy',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .getMyOrders()
      .then(setOrders)
      .catch((err) => setError(err.message || 'Không thể tải lịch sử đơn'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-full bg-[#faf8f3] px-3 pb-10 pt-5 sm:mx-auto sm:max-w-2xl sm:px-6 sm:py-8">
      <div className="mb-5">
        <Link href="/profile" className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-emerald-900 hover:underline">
          ← Quay lại
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">Lịch sử đơn hàng</h1>
        <p className="mt-1 text-sm text-stone-600">Xem lại các món bạn đã đặt</p>
      </div>

      {loading && (
        <div className="mt-6">
          <OrderListSkeleton />
        </div>
      )}
      {error && <p className="mt-6 text-red-600">{error}</p>}

      {!loading && !error && orders.length === 0 && (
        <p className="mt-6 text-stone-500">Bạn chưa có đơn hàng nào.</p>
      )}

      <div className="mt-4 space-y-3">
        {orders.map((order) => (
          <Link
            key={order.id}
            href={`/orders/${order.id}`}
            data-testid={`history-order-${order.id}`}
            className="flex animate-rise-in flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-3 shadow-sm transition hover:border-emerald-700 hover:bg-emerald-50/30 sm:p-4"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="break-all font-bold text-stone-900">Mã đơn: #{order.id}</p>
                <p className="mt-0.5 text-xs text-stone-500">
                  {order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : ''}
                </p>
              </div>
              <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end sm:text-right">
                <span className="inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                  {STATUS_LABELS[order.status] ?? order.status}
                </span>
                <p className="font-bold text-stone-900">
                  {Number(order.total || 0).toLocaleString('vi-VN')}₫
                </p>
              </div>
            </div>
            {order.items && order.items.length > 0 && (
              <div className="space-y-3 rounded-xl bg-stone-50 p-3">
                <p className="text-xs font-semibold text-stone-700">Sản phẩm đã mua</p>
                {order.items.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="flex items-start justify-between gap-3 text-sm">
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
    </main>
  );
}