// apps/web/src/app/orders/[id]/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { Order } from '@/types';
import { DetailLinesSkeleton } from '@/components/Skeleton';
import {
  STATUS_LABELS,
  formatVnd,
  getOrderDiscount,
  isOrderStatus,
  isPaidStatus,
} from '@/features/orders/order-display';

function OrderConfirmationContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const orderId = String(params?.id || '');
  const statusParam = searchParams?.get('status');
  // Có ?status= nghĩa là vừa chuyển từ trang thanh toán sang (màn hình xác nhận).
  const fromCheckout = searchParams?.has('status') ?? false;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .getMyOrders()
      .then((orders) => {
        // URL dùng id của đơn; vẫn nhận mã đơn (BL-YYYY-NNNN) để link dạng mã cũng mở được.
        const found = orders.find((o) => String(o.id) === orderId || o.code === orderId);
        setOrder(found ?? null);
      })
      .catch((err: unknown) => {
        setLoadError(err instanceof Error ? err.message : 'Không thể tải đơn hàng.');
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  // Trạng thái lấy từ server là chuẩn. ?status= chỉ dùng khi server chưa trả về,
  // và chỉ khi nó là một trạng thái hợp lệ. Không bao giờ tự đoán là "Đã thanh toán".
  const status: Order['status'] | null =
    order?.status ?? (isOrderStatus(statusParam) ? statusParam : null);
  const notFound = !loading && !loadError && !order;
  const isPaid = isPaidStatus(status);
  const discount = order ? getOrderDiscount(order) : 0;
  const showSuccess = fromCheckout && !notFound && isPaid;
  const showFailure = fromCheckout && !notFound && status === 'PAYMENT_FAILED';
  const displayCode = order?.code || orderId;

  return (
    <main className="mx-auto max-w-md px-4 py-8">
      <div className="mb-4 text-left">
        <Link href="/profile" className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-900 hover:underline">
          ← Quay lại
        </Link>
      </div>
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        {showSuccess && (
          <>
            <div className="mx-auto flex h-14 w-14 animate-pop items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-700">
              ✓
            </div>
            <h1 className="mt-4 text-center text-2xl font-bold text-stone-900">Đặt hàng thành công</h1>
            <p className="mt-2 text-center text-sm text-stone-600">Mời tới quầy lấy nước ☕</p>
          </>
        )}

        {showFailure && (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-3xl text-red-700">
              !
            </div>
            <h1 className="mt-4 text-center text-2xl font-bold text-stone-900">Thanh toán chưa thành công</h1>
            <p className="mt-2 text-center text-sm text-stone-600">
              Giỏ hàng của bạn vẫn được giữ nguyên, bạn có thể thử thanh toán lại.
            </p>
          </>
        )}

        {!showSuccess && !showFailure && (
          <h1 className="text-xl font-bold text-stone-900">Chi tiết đơn hàng</h1>
        )}

        {loading && <DetailLinesSkeleton label="Đang tải chi tiết đơn hàng" />}

        {loadError && (
          <p
            role="alert"
            data-testid="order-load-error"
            className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {loadError}
          </p>
        )}

        {notFound && (
          <div data-testid="order-not-found" className="mt-4 space-y-2 text-center">
            <p className="text-sm text-stone-500">Không tìm thấy đơn hàng này trong lịch sử của bạn.</p>
            <Link href="/orders" className="text-sm font-semibold text-emerald-900 hover:underline">
              Xem lịch sử đơn hàng
            </Link>
          </div>
        )}

        {order && (
          <>
            <div className="mt-6 space-y-2 rounded-xl bg-stone-50 p-4 text-left text-sm">
              <p className="font-semibold text-stone-800" data-testid="confirm-order-id">
                Mã đơn: #{displayCode}
              </p>
              <p className="font-semibold text-emerald-700" data-testid="confirm-order-status">
                Trạng thái: {STATUS_LABELS[order.status] ?? order.status}
              </p>
              {order.createdAt && (
                <p className="text-stone-600">
                  Thời gian: {new Date(order.createdAt).toLocaleString('vi-VN')}
                </p>
              )}
              {discount > 0 && (
                <p data-testid="order-discount" className="text-emerald-700">
                  Giảm giá: −{formatVnd(discount)}
                </p>
              )}
              <p className="text-stone-800">
                Tổng tiền: <span className="font-bold">{formatVnd(order.total)}</span>
              </p>
            </div>

            {order.items && order.items.length > 0 ? (
              <div className="mt-4">
                <h2 className="mb-2 text-sm font-bold text-stone-900">Sản phẩm đã mua</h2>
                <div className="space-y-2">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-start justify-between gap-3 rounded-xl border border-stone-200 p-3 text-sm">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-stone-900">{item.name || item.productName || 'Sản phẩm'}</p>
                        <p className="text-xs text-stone-500">Size: {item.size || 'M'} • Số lượng: {item.qty}</p>
                        {item.toppings && item.toppings.length > 0 && (
                          <p data-testid="order-item-toppings" className="text-xs text-stone-500">
                            Topping: {item.toppings.map((topping) => topping.name).join(', ')}
                          </p>
                        )}
                      </div>
                      <p className="shrink-0 font-bold text-stone-900">{Number(item.lineTotal || 0).toLocaleString('vi-VN')}₫</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="mt-4 text-center text-sm text-stone-500">Không tìm thấy thông tin sản phẩm trong đơn hàng này</p>
            )}
          </>
        )}

        <Link
          href="/"
          className="mt-6 inline-block w-full rounded-xl bg-emerald-700 py-3 text-center font-semibold text-white hover:bg-emerald-800"
        >
          Về trang chủ
        </Link>
      </div>
    </main>
  );
}

export default function OrderConfirmationPage() {
  return (
    <React.Suspense
      fallback={
        <div className="mx-auto max-w-md px-4 py-8">
          <DetailLinesSkeleton label="Đang tải chi tiết đơn hàng" />
        </div>
      }
    >
      <OrderConfirmationContent />
    </React.Suspense>
  );
}
