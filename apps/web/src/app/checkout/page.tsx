// apps/web/src/app/checkout/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';
import { apiClient } from '@/lib/api';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, promoCode, getTotalPrice, clearCart } = useCartStore();
  const addLoyaltyPoints = useAuthStore((state) => state.addLoyaltyPoints);

  const [method, setMethod] = useState<'WALLET' | 'CARD'>('WALLET');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = getTotalPrice();

  const handleConfirmPayment = async () => {
    if (items.length === 0) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Tạo đơn hàng ở trạng thái PENDING (POST /orders kèm JWT)
      const order = await apiClient.createOrder({
        items: items.map((i) => ({
          productId: i.product.id,
          size: i.size,
          qty: i.qty,
          toppings: i.toppings.map((t) => t.id),
        })),
        promoCode: promoCode || undefined,
      });

      // 2. Gọi POST /payments kèm Idempotency-Key
      const idempotencyKey = `idem_${order.id}_${ method }`;
      const paymentResult = await apiClient.payOrder(
        {
          orderId: order.id,
          method,
          amount: total,
        },
        idempotencyKey
      );

      if (paymentResult.status === 'PAYMENT_FAILED') {
        // US-05: Nếu thanh toán lỗi, giữ nguyên giỏ hàng
        setError('Thanh toán thất bại (PAYMENT_FAILED). Giỏ hàng của bạn vẫn được giữ nguyên.');
        return;
      }

      // 3. Cộng điểm thưởng Loyalty sau khi đơn PAID [Task 10]
      const earnedPoints = paymentResult.loyaltyPointsEarned ?? Math.floor(total / 10000);
      addLoyaltyPoints(earnedPoints);

      // 4. Xóa giỏ hàng và chuyển tới màn hình Xác nhận đơn (Wireframe 5)
      clearCart();
      router.push(`/orders/${order.id}?status=${paymentResult.status || 'PAID'}`);
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi thanh toán. Giỏ hàng được giữ nguyên.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-stone-900">Thanh toán</h1>
        <p className="mt-2 text-lg font-bold text-emerald-800" data-testid="checkout-total">
          Tổng: {total.toLocaleString('vi-VN')}₫
        </p>

        <div className="mt-6">
          <h2 className="text-sm font-semibold text-stone-700">Phương thức (Không dùng tiền mặt)</h2>
          <div className="mt-3 space-y-2">
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-stone-200 p-3.5 hover:bg-stone-50">
              <input
                type="radio"
                name="paymentMethod"
                value="WALLET"
                checked={method === 'WALLET'}
                onChange={() => setMethod('WALLET')}
                data-testid="method-wallet"
                className="h-4 w-4 accent-emerald-700"
              />
              <span className="font-medium text-stone-800">Ví điện tử (MoMo / VNPay)</span>
            </label>

            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-stone-200 p-3.5 hover:bg-stone-50">
              <input
                type="radio"
                name="paymentMethod"
                value="CARD"
                checked={method === 'CARD'}
                onChange={() => setMethod('CARD')}
                data-testid="method-card"
                className="h-4 w-4 accent-emerald-700"
              />
              <span className="font-medium text-stone-800">Thẻ ngân hàng</span>
            </label>
          </div>
        </div>

        {error && (
          <div
            data-testid="checkout-error"
            className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <button
          type="button"
          disabled={loading || items.length === 0}
          data-testid="confirm-payment-btn"
          onClick={handleConfirmPayment}
          className="mt-6 w-full rounded-xl bg-emerald-700 py-3 font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
        >
          {loading ? 'Đang xử lý...' : 'Xác nhận trả'}
        </button>
      </div>
    </main>
  );
}