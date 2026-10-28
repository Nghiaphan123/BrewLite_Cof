'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import { useCartStore } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';
import { apiClient } from '@/lib/api';

type PaymentMethod = 'QR' | 'WALLET' | 'CARD';

interface PendingQrPayment {
  orderId: string;
  amount: number;
  image: string;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Có lỗi xảy ra khi thanh toán. Giỏ hàng được giữ nguyên.';
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, promoCode, getTotalPrice, clearCart } = useCartStore();
  const addLoyaltyPoints = useAuthStore((state) => state.addLoyaltyPoints);

  const [method, setMethod] = useState<PaymentMethod>('QR');
  const [pendingQr, setPendingQr] = useState<PendingQrPayment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requiresLogin, setRequiresLogin] = useState(false);
  const logout = useAuthStore((state) => state.logout);

  const total = getTotalPrice();

  const handleConfirmPayment = async () => {
    if (items.length === 0 || loading) return;
    setLoading(true);
    setError(null);
    setRequiresLogin(false);

    try {
      if (method === 'QR' && !pendingQr) {
        const order = await apiClient.createOrder({
          items: items.map((item) => ({
            productId: item.product.id,
            size: item.size,
            qty: item.qty,
            toppings: item.toppings.map((topping) => topping.id),
          })),
          promoCode: promoCode || undefined,
        });
        const amount = order.total;
        const payload = `BREWLITE-DEMO|order=${order.id}|amount=${amount}|currency=VND`;
        const svg = await QRCode.toString(payload, {
          type: 'svg',
          width: 240,
          margin: 2,
          color: { dark: '#064e3b', light: '#ffffff' },
        });

        setPendingQr({
          orderId: order.id,
          amount,
          image: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
        });
        return;
      }

      const order =
        pendingQr ??
        (await apiClient.createOrder({
          items: items.map((item) => ({
            productId: item.product.id,
            size: item.size,
            qty: item.qty,
            toppings: item.toppings.map((topping) => topping.id),
          })),
          promoCode: promoCode || undefined,
        }));
      const orderId = 'orderId' in order ? order.orderId : order.id;
      const amount = 'amount' in order ? order.amount : order.total;
      const paymentMethod = method === 'QR' ? 'WALLET' : method;
      const paymentResult = await apiClient.payOrder(
        {
          orderId,
          method: paymentMethod,
          amount,
        },
        `idem_${orderId}_${paymentMethod}`,
      );

      if (paymentResult.status === 'PAYMENT_FAILED') {
        setError('Thanh toán thất bại (PAYMENT_FAILED). Giỏ hàng của bạn vẫn được giữ nguyên.');
        setPendingQr(null);
        return;
      }

      const earnedPoints = paymentResult.loyaltyPointsEarned ?? Math.floor(amount / 10000);
      addLoyaltyPoints(earnedPoints);
      clearCart();
      router.push(`/orders/${orderId}?status=${paymentResult.status || 'PAID'}`);
    } catch (paymentError: unknown) {
      const message = getErrorMessage(paymentError);
      if (/invalid token|token expired|authentication required/i.test(message)) {
        logout();
        setRequiresLogin(true);
        setError('Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Hãy đăng nhập lại để tiếp tục.');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const isQrReady = method === 'QR' && pendingQr !== null;

  return (
    <main className="min-h-full bg-[#faf8f3] px-4 py-6 sm:py-10">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/cart"
          className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
        >
          <span aria-hidden="true">←</span>
          Quay lại giỏ hàng
        </Link>

        <div className="mt-4 overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
          <div className="bg-emerald-950 px-6 py-6 text-white sm:px-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-200">
              Hoàn tất đơn hàng
            </p>
            <h1 className="mt-1 text-3xl font-bold">Thanh toán</h1>
            <p className="mt-3 text-sm text-emerald-100">
              Chọn phương thức thanh toán cho đơn BrewLite của bạn.
            </p>
          </div>

          <div className="p-5 sm:p-8">
            <div className="flex items-center justify-between rounded-2xl bg-[#faf8f3] px-4 py-4">
              <span className="text-sm font-medium text-stone-600">Tổng thanh toán</span>
              <span className="text-xl font-bold text-emerald-900" data-testid="checkout-total">
                {(pendingQr?.amount ?? total).toLocaleString('vi-VN')}₫
              </span>
            </div>

            <fieldset className="mt-6" disabled={loading || pendingQr !== null}>
              <legend className="text-sm font-semibold text-stone-800">
                Phương thức thanh toán
              </legend>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${method === 'QR' ? 'border-emerald-800 bg-emerald-50 ring-1 ring-emerald-800' : 'border-stone-200 hover:border-emerald-400'}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="QR"
                    checked={method === 'QR'}
                    onChange={() => setMethod('QR')}
                    data-testid="method-qr"
                    className="mt-1 h-4 w-4 accent-emerald-800"
                  />
                  <span>
                    <span className="block font-semibold text-stone-900">Mã QR</span>
                    <span className="mt-1 block text-xs leading-5 text-stone-500">Quét mã demo để xác nhận</span>
                  </span>
                </label>

                <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${method === 'WALLET' ? 'border-emerald-800 bg-emerald-50 ring-1 ring-emerald-800' : 'border-stone-200 hover:border-emerald-400'}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="WALLET"
                    checked={method === 'WALLET'}
                    onChange={() => setMethod('WALLET')}
                    data-testid="method-wallet"
                    className="mt-1 h-4 w-4 accent-emerald-800"
                  />
                  <span>
                    <span className="block font-semibold text-stone-900">Ví điện tử</span>
                    <span className="mt-1 block text-xs leading-5 text-stone-500">Thanh toán mô phỏng</span>
                  </span>
                </label>

                <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${method === 'CARD' ? 'border-emerald-800 bg-emerald-50 ring-1 ring-emerald-800' : 'border-stone-200 hover:border-emerald-400'}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="CARD"
                    checked={method === 'CARD'}
                    onChange={() => setMethod('CARD')}
                    data-testid="method-card"
                    className="mt-1 h-4 w-4 accent-emerald-800"
                  />
                  <span>
                    <span className="block font-semibold text-stone-900">Thẻ ngân hàng</span>
                    <span className="mt-1 block text-xs leading-5 text-stone-500">Thanh toán mô phỏng</span>
                  </span>
                </label>
              </div>
            </fieldset>

            {method === 'QR' && (
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
                Đây là QR demo chứa mã đơn và số tiền. Ứng dụng hiện chưa kết nối ngân hàng hoặc cổng thanh toán thật; việc xác nhận bên dưới chỉ mô phỏng thanh toán.
              </div>
            )}

            {pendingQr && method === 'QR' && (
              <section
                aria-label="Mã QR thanh toán demo"
                data-testid="qr-payment-panel"
                className="mt-6 flex flex-col items-center rounded-2xl border border-stone-200 bg-white p-5 text-center"
              >
                <h2 className="text-lg font-bold text-stone-900">Quét mã QR demo</h2>
                <p className="mt-1 text-sm text-stone-600">
                  Đơn {pendingQr.orderId} · {pendingQr.amount.toLocaleString('vi-VN')}₫
                </p>
                {/* QR payload is generated locally and contains only this demo order's reference and amount. */}
                <Image
                  src={pendingQr.image}
                  alt={`Mã QR demo cho đơn hàng ${pendingQr.orderId}`}
                  data-testid="payment-qr"
                  width={240}
                  height={240}
                  unoptimized
                  className="mt-4 h-60 w-60 rounded-xl border border-stone-200 bg-white p-2"
                />
                <p className="mt-3 max-w-sm text-xs leading-5 text-stone-500">
                  Sau khi quét để xem thông tin đơn, nhấn xác nhận để hoàn tất thanh toán mô phỏng.
                </p>
              </section>
            )}

            {error && (
              <div
                data-testid="checkout-error"
                role="alert"
                className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            {requiresLogin && (
              <Link
                href="/login?redirect=%2Fcheckout"
                className="mt-3 inline-flex min-h-10 items-center font-semibold text-emerald-900 underline underline-offset-4"
              >
                Đăng nhập lại để tạo mã QR
              </Link>
            )}

            <button
              type="button"
              disabled={loading || items.length === 0}
              data-testid="confirm-payment-btn"
              onClick={handleConfirmPayment}
              className="mt-6 min-h-12 w-full rounded-xl bg-emerald-900 px-4 py-3 font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? 'Đang xử lý...'
                : isQrReady
                  ? 'Tôi đã quét mã — xác nhận demo'
                  : method === 'QR'
                    ? 'Tạo mã QR thanh toán'
                    : 'Xác nhận thanh toán'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
