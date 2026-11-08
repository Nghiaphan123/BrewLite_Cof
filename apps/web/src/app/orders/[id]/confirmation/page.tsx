// apps/web/src/app/orders/[id]/confirmation/page.tsx
// Màn hình 5 — Xác nhận đơn hàng (wireframes.md §8, product-backlog.md Task 9).
// `[id]` nhận mã đơn BL-YYYY-NNNN (trang thanh toán dùng mã) hoặc id của đơn.
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import type { Order } from '@/types';
import { useAuthStore } from '@/store/auth.store';
import { DetailLinesSkeleton } from '@/components/Skeleton';
import { loadOwnOrder } from '@/features/orders/load-order';
import {
  STATUS_LABELS,
  formatVnd,
  getOrderDiscount,
  getOrderSubtotal,
  isPaidStatus,
} from '@/features/orders/order-display';

type Phase =
  | { kind: 'loading' }
  | { kind: 'ready'; order: Order }
  | { kind: 'not-found' }
  | { kind: 'error'; message: string };

function StatusBanner({ status }: { status: Order['status'] }) {
  if (isPaidStatus(status)) {
    return (
      <>
        <div className="mx-auto flex h-14 w-14 animate-pop items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-700">
          ✓
        </div>
        <h1 className="mt-4 text-center text-2xl font-bold text-stone-900">Đặt hàng thành công</h1>
        <p className="mt-2 text-center text-sm text-stone-600">Mời tới quầy lấy nước ☕</p>
      </>
    );
  }
  if (status === 'PAYMENT_FAILED' || status === 'PENDING') {
    return (
      <>
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-3xl text-amber-800">
          !
        </div>
        <h1 className="mt-4 text-center text-2xl font-bold text-stone-900">
          {status === 'PAYMENT_FAILED' ? 'Thanh toán chưa thành công' : 'Đơn hàng chưa được thanh toán'}
        </h1>
        <p className="mt-2 text-center text-sm text-stone-600">
          Giỏ hàng của bạn vẫn được giữ.{' '}
          <Link href="/checkout" className="font-semibold text-emerald-900 underline underline-offset-4">
            Quay lại thanh toán
          </Link>
        </p>
      </>
    );
  }
  return <h1 className="text-center text-2xl font-bold text-stone-900">Đơn hàng đã bị hủy</h1>;
}

function OrderConfirmationContent() {
  const params = useParams();
  const router = useRouter();
  const idOrCode = String(params?.id || '');

  const [phase, setPhase] = useState<Phase>({ kind: 'loading' });
  const [attempt, setAttempt] = useState(0);

  // Wireframe: màn hình này chỉ dành cho người đã đăng nhập.
  useEffect(() => {
    if (!useAuthStore.getState().token) {
      router.replace(`/login?redirect=${encodeURIComponent(`/orders/${idOrCode}/confirmation`)}`);
    }
  }, [idOrCode, router]);

  // Tách khỏi effect chuyển hướng ở trên: effect này chỉ chạy lại khi đổi đơn hoặc bấm "Thử lại",
  // không phụ thuộc `router`, nên không bao giờ gọi API lặp lại ngoài ý muốn.
  useEffect(() => {
    if (!useAuthStore.getState().token) return;

    let active = true;
    // setState chỉ nằm trong callback của Promise (lint react-hooks/set-state-in-effect).
    loadOwnOrder(idOrCode)
      .then((order) => {
        if (active) setPhase(order ? { kind: 'ready', order } : { kind: 'not-found' });
      })
      .catch((error: unknown) => {
        if (active) {
          setPhase({
            kind: 'error',
            message: error instanceof Error ? error.message : 'Không thể tải đơn hàng.',
          });
        }
      });
    return () => {
      active = false;
    };
  }, [idOrCode, attempt]);

  const retry = () => {
    setPhase({ kind: 'loading' });
    setAttempt((value) => value + 1);
  };

  return (
    <main className="mx-auto max-w-md px-4 py-8">
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        {phase.kind === 'loading' && <DetailLinesSkeleton label="Đang tải đơn hàng" />}

        {phase.kind === 'not-found' && (
          <div data-testid="confirmation-not-found" className="py-4 text-center">
            <h1 className="text-xl font-bold text-stone-900">Không tìm thấy đơn hàng</h1>
            <p className="mt-2 text-sm text-stone-600">
              Đơn hàng không tồn tại hoặc không thuộc tài khoản của bạn.
            </p>
          </div>
        )}

        {phase.kind === 'error' && (
          <div role="alert" data-testid="confirmation-error" className="py-4 text-center">
            <h1 className="text-xl font-bold text-stone-900">Không tải được đơn hàng</h1>
            <p className="mt-2 text-sm text-red-700">{phase.message}</p>
            <button
              type="button"
              onClick={retry}
              className="mt-4 rounded-xl border border-emerald-900 px-4 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-50"
            >
              Thử lại
            </button>
          </div>
        )}

        {phase.kind === 'ready' && (
          <ConfirmedOrder order={phase.order} />
        )}

        <Link
          href="/"
          className="mt-6 inline-block w-full rounded-xl bg-emerald-700 py-3 text-center font-semibold text-white hover:bg-emerald-800"
        >
          Về trang chủ
        </Link>
        {phase.kind === 'ready' && (
          <Link
            href="/orders"
            className="mt-3 block text-center text-sm font-semibold text-emerald-900 hover:underline"
          >
            Xem lịch sử đơn
          </Link>
        )}
      </div>
    </main>
  );
}

function ConfirmedOrder({ order }: { order: Order }) {
  const subtotal = getOrderSubtotal(order);
  const discount = getOrderDiscount(order);
  const points = isPaidStatus(order.status) ? order.payment?.loyaltyPointsEarned : undefined;

  return (
    <>
      <StatusBanner status={order.status} />

      <dl className="mt-6 space-y-2 rounded-xl bg-stone-50 p-4 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-stone-600">Mã đơn</dt>
          <dd data-testid="confirm-order-code" className="font-bold text-stone-900">
            #{order.code || order.id}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-stone-600">Trạng thái</dt>
          <dd>
            <span
              data-testid="confirm-order-status"
              className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                isPaidStatus(order.status) ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
              }`}
            >
              {STATUS_LABELS[order.status] ?? order.status}
            </span>
          </dd>
        </div>
        {order.createdAt && (
          <div className="flex justify-between gap-3">
            <dt className="text-stone-600">Thời gian</dt>
            <dd className="text-stone-800">{new Date(order.createdAt).toLocaleString('vi-VN')}</dd>
          </div>
        )}
        <div className="flex justify-between gap-3 border-t border-stone-200 pt-2">
          <dt className="text-stone-600">Tạm tính</dt>
          <dd className="text-stone-800">{formatVnd(subtotal)}</dd>
        </div>
        {discount > 0 && (
          <div className="flex justify-between gap-3 text-emerald-700">
            <dt>Giảm giá</dt>
            <dd data-testid="confirm-discount">−{formatVnd(discount)}</dd>
          </div>
        )}
        <div className="flex justify-between gap-3 text-base font-bold text-stone-900">
          <dt>Tổng tiền</dt>
          <dd data-testid="confirm-total">{formatVnd(order.total)}</dd>
        </div>
      </dl>

      {typeof points === 'number' && (
        <p
          data-testid="confirm-points"
          className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm font-semibold text-amber-900"
        >
          🎉 Bạn nhận được +{points.toLocaleString('vi-VN')} điểm thưởng
        </p>
      )}

      {order.items && order.items.length > 0 && (
        <ul className="mt-4 space-y-2 text-sm">
          {order.items.map((item, idx) => (
            <li key={item.id ?? idx} className="flex items-start justify-between gap-3">
              <span className="min-w-0 text-stone-800">
                {item.qty} × {item.name || item.productName || 'Sản phẩm'}{' '}
                <span className="text-stone-500">(size {item.size})</span>
                {item.toppings && item.toppings.length > 0 && (
                  <span className="block text-xs text-stone-500">
                    Topping: {item.toppings.map((topping) => topping.name).join(', ')}
                  </span>
                )}
              </span>
              <span className="shrink-0 font-semibold text-stone-900">{formatVnd(item.lineTotal)}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default function OrderConfirmationRoute() {
  return (
    <React.Suspense
      fallback={
        <div className="mx-auto max-w-md px-4 py-8">
          <DetailLinesSkeleton label="Đang tải đơn hàng" />
        </div>
      }
    >
      <OrderConfirmationContent />
    </React.Suspense>
  );
}
