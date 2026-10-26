// apps/web/src/app/orders/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { Order } from '@/types';

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
    <main className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-2xl font-bold text-stone-900">Lịch sử đơn hàng</h1>

      {loading && <p className="mt-6 text-stone-500">Đang tải lịch sử đơn...</p>}
      {error && <p className="mt-6 text-red-600">{error}</p>}

      {!loading && !error && orders.length === 0 && (
        <p className="mt-6 text-stone-500">Bạn chưa có đơn hàng nào.</p>
      )}

      <div className="mt-4 space-y-3">
        {orders.map((order) => (
          <div
            key={order.id}
            data-testid={`history-order-${order.id}`}
            className="flex items-center justify-between rounded-xl border border-stone-200 bg-white p-4"
          >
            <div>
              <p className="font-bold text-stone-900">Mã đơn: #{order.id}</p>
              <p className="text-xs text-stone-500">
                {new Date(order.createdAt).toLocaleString('vi-VN')}
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                {order.status}
              </span>
              <p className="mt-1 font-bold text-stone-900">
                {order.total.toLocaleString('vi-VN')}₫
              </p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}