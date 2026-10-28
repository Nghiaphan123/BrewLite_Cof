// apps/web/src/app/orders/[id]/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { Order } from '@/types';

function OrderConfirmationContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const orderId = String(params?.id || '');
  const statusParam = searchParams?.get('status');

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .getMyOrders()
      .then((orders) => {
        const found = orders.find((o) => String(o.id) === String(orderId));
        if (found) {
          setOrder(found);
        }
      })
      .catch(() => {
        // ignore
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  const status = order?.status || statusParam || 'PAID';

  const getStatusLabel = (s: Order['status']) => {
    switch (s) {
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
        return s;
    }
  };

  const isConfirmation = searchParams?.has('status') || statusParam === 'PAID' || statusParam === 'PENDING';

  return (
    <main className="mx-auto max-w-md px-4 py-8">
      <div className="mb-4 text-left">
        <Link href="/profile" className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-900 hover:underline">
          ← Quay lại
        </Link>
      </div>
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        {isConfirmation && (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-700">
              ✓
            </div>
            <h1 className="mt-4 text-center text-2xl font-bold text-stone-900">Đặt hàng thành công</h1>
            <p className="mt-2 text-center text-sm text-stone-600">Mời tới quầy lấy nước ☕</p>
          </>
        )}

        {!isConfirmation && (
          <h1 className="text-xl font-bold text-stone-900">Chi tiết đơn hàng</h1>
        )}

        <div className="mt-6 space-y-2 rounded-xl bg-stone-50 p-4 text-sm text-left">
          <p className="font-semibold text-stone-800" data-testid="confirm-order-id">
            Mã đơn: #{orderId}
          </p>
          <p className="font-semibold text-emerald-700" data-testid="confirm-order-status">
            Trạng thái: {getStatusLabel(status)}
          </p>
          {order?.createdAt && (
            <p className="text-stone-600">
              Thời gian: {new Date(order.createdAt).toLocaleString('vi-VN')}
            </p>
          )}
          {order?.total !== undefined && (
            <p className="text-stone-800">
              Tổng tiền: <span className="font-bold">{Number(order.total).toLocaleString('vi-VN')}₫</span>
            </p>
          )}
        </div>

        {order?.items && order.items.length > 0 ? (
          <div className="mt-4">
            <h2 className="mb-2 text-sm font-bold text-stone-900">Sản phẩm đã mua</h2>
            <div className="space-y-2">
              {order.items.map((item: any, idx) => (
                <div key={idx} className="flex items-start justify-between gap-3 rounded-xl border border-stone-200 p-3 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-stone-900">{item.productName || item.name || 'Sản phẩm'}</p>
                    <p className="text-xs text-stone-500">Size: {item.size || 'M'} • Số lượng: {item.qty}</p>
                  </div>
                  <p className="shrink-0 font-bold text-stone-900">{Number(item.lineTotal || item.unitPrice || 0).toLocaleString('vi-VN')}₫</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          !loading && (
            <p className="mt-4 text-center text-sm text-stone-500">Không tìm thấy thông tin sản phẩm trong đơn hàng này</p>
          )
        )}

        {loading && !order && (
          <p className="mt-4 text-center text-sm text-stone-500">Đang tải chi tiết đơn hàng...</p>
        )}

        {!loading && !order && (
          <div className="mt-4 space-y-2 text-center">
            <p className="text-sm text-stone-500">Không tìm thấy đơn hàng trong lịch sử của bạn</p>
            <Link href="/orders" className="text-sm font-semibold text-emerald-900 hover:underline">
              Xem lịch sử đơn hàng
            </Link>
          </div>
        )}

        <Link
<<<<<<< HEAD
          href="/menu"
          className="mt-6 inline-block w-full rounded-xl bg-emerald-700 py-3 font-semibold text-white hover:bg-emerald-800"
=======
          href="/"
          className="mt-6 inline-block w-full rounded-xl bg-emerald-700 py-3 text-center font-semibold text-white hover:bg-emerald-800"
>>>>>>> bb876c0 (feat(web): auth flow, profile, order details)
        >
          Về trang chủ
        </Link>
      </div>
    </main>
  );
}

export default function OrderConfirmationPage() {
  return (
    <React.Suspense fallback={<div className="mx-auto max-w-md px-4 py-12 text-center text-stone-500">Đang tải...</div>}>
      <OrderConfirmationContent />
    </React.Suspense>
  );
}