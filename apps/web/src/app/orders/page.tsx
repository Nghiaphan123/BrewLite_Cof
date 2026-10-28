// apps/web/src/app/orders/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
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
      <div className="mb-4">
        <Link href="/profile" className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-emerald-900 hover:underline">
          ← Quay lại
        </Link>
        <h1 className="text-2xl font-bold text-stone-900">Lịch sử đơn hàng</h1>
      </div>

      {loading && <p className="mt-6 text-stone-500">Đang tải lịch sử đơn...</p>}
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
            className="flex flex-col gap-3 rounded-xl border border-stone-200 bg-white p-4 transition hover:border-emerald-700 hover:bg-emerald-50/30"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-stone-900">Mã đơn: #{order.id}</p>
                <p className="text-xs text-stone-500">
                  {order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : ''}
                </p>
              </div>
              <div className="text-right">
                <span className="inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                  {order.status}
                </span>
                <p className="mt-1 font-bold text-stone-900">
                  {Number(order.total || 0).toLocaleString('vi-VN')}₫
                </p>
              </div>
            </div>
            {order.items && order.items.length > 0 && (
              <div className="space-y-2 rounded-lg bg-stone-50 p-3">
                <p className="text-xs font-semibold text-stone-700">Sản phẩm đã mua</p>
                {order.items.slice(0, 3).map((item: any, idx) => (
                  <div key={idx} className="flex items-start justify-between gap-2 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-stone-900">{item.productName || item.name || 'Sản phẩm'}</p>
                      <p className="text-xs text-stone-500">Size: {item.size || 'M'} • SL: {item.qty}</p>
                    </div>
                    <p className="shrink-0 font-semibold text-stone-900">{Number(item.lineTotal || item.unitPrice || 0).toLocaleString('vi-VN')}₫</p>
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