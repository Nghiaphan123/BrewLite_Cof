// apps/web/src/app/orders/[id]/page.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';

function OrderConfirmationContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const orderId = String(params?.id || '1042');
  const status = searchParams?.get('status') || 'PAID';

  return (
    <main className="mx-auto max-w-md px-4 py-12 text-center">
      <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-700">
          ✓
        </div>
        <h1 className="mt-4 text-2xl font-bold text-stone-900">Đặt hàng thành công</h1>

        <div className="mt-6 space-y-2 rounded-xl bg-stone-50 p-4 text-sm">
          <p className="font-semibold text-stone-800" data-testid="confirm-order-id">
            Mã đơn: #{orderId}
          </p>
          <p className="font-semibold text-emerald-700" data-testid="confirm-order-status">
            Trạng thái: {status}
          </p>
        </div>

        <p className="mt-4 text-sm text-stone-600">Mời tới quầy lấy nước ☕</p>

        <Link
          href="/menu"
          className="mt-6 inline-block w-full rounded-xl bg-emerald-700 py-3 font-semibold text-white hover:bg-emerald-800"
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