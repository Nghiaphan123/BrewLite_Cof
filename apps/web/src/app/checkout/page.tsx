'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import { useCartStore } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';
import { apiClient } from '@/lib/api';
import { PENDING_QR_KEY } from '@/features/cart/cart-sync';
import { buildIdempotencyKey } from '@/features/checkout/idempotency-key';
import { estimateLoyaltyPoints } from '@/features/checkout/loyalty';
import { formatVnd } from '@/features/orders/order-display';
import { ApiError } from '@/lib/api-errors';
import { runWithLoading, useUiStore, wait } from '@/store/ui.store';
import { Spinner } from '@/components/Skeleton';

type PaymentMethod = 'QR' | 'WALLET' | 'CARD';

const MIN_QR_SKELETON_MS = 400;

interface PendingQrPayment {
  orderId: string;
  amount: number;
  image: string;
  /** Giỏ lúc tạo đơn; giỏ đã đổi thì đơn này không còn đúng nữa. */
  cartKey: string;
  /** Số lần thanh toán đơn này đã thất bại; dùng để tạo Idempotency-Key mới cho lần thử lại. */
  failedAttempts?: number;
  /** Mã đơn BL-YYYY-NNNN; trang xác nhận dùng mã này trong URL (GET /orders/:code). */
  orderCode?: string;
}

type CreatedOrder = { id: string; total: number; code?: string };

/** Tạo mã QR demo cho đơn và lưu đơn đang chờ vào sessionStorage (giữ được khi tải lại trang). */
async function buildPendingPayment(
  order: CreatedOrder,
  cartKey: string,
  failedAttempts = 0,
): Promise<PendingQrPayment> {
  const amount = order.total;
  const payload = `BREWLITE-DEMO|order=${order.id}|amount=${amount}|currency=VND`;
  const svg = await QRCode.toString(payload, {
    type: 'svg',
    width: 240,
    margin: 2,
    color: { dark: '#064e3b', light: '#ffffff' },
  });
  const pending: PendingQrPayment = {
    orderId: order.id,
    amount,
    image: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    cartKey,
    failedAttempts,
    orderCode: order.code,
  };
  sessionStorage.setItem(PENDING_QR_KEY, JSON.stringify(pending));
  return pending;
}

function readPendingQr(cartKey: string): PendingQrPayment | null {
  try {
    const pending = JSON.parse(sessionStorage.getItem(PENDING_QR_KEY) ?? 'null') as PendingQrPayment | null;
    return pending?.cartKey === cartKey ? pending : null;
  } catch {
    return null;
  }
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Có lỗi xảy ra khi thanh toán. Giỏ hàng được giữ nguyên.';
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, promoCode, getSubtotal, getDiscount, getTotalPrice, clearCart } = useCartStore();
  const addLoyaltyPoints = useAuthStore((state) => state.addLoyaltyPoints);

  const [method, setMethod] = useState<PaymentMethod>('QR');
  const [createdQr, setCreatedQr] = useState<PendingQrPayment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requiresLogin, setRequiresLogin] = useState(false);
  const logout = useAuthStore((state) => state.logout);
  const qrPanelRef = useRef<HTMLElement>(null);

  // getTotalPrice đọc thẳng store; dựa vào items để lần render hydrate khớp HTML của server.
  const total = items.length > 0 ? getTotalPrice() : 0;
  const subtotal = items.length > 0 ? getSubtotal() : 0;
  const discount = items.length > 0 ? getDiscount() : 0;
  const cartKey = JSON.stringify([items.map((item) => [item.cartItemId, item.qty]), promoCode]);

  // Tải lại trang khi đang chờ quét thì dùng lại đơn cũ, không tạo thêm đơn mới.
  // Giỏ rỗng ở lần render đầu (kể cả trên server) nên không đọc sessionStorage lúc hydrate.
  const pendingQr =
    createdQr?.cartKey === cartKey ? createdQr : items.length > 0 ? readPendingQr(cartKey) : null;
  // Đã tạo đơn thì số tiền phải trả là số server đã tính; chưa tạo thì dùng giá tạm tính trong giỏ.
  const payable = pendingQr?.amount ?? total;
  const expectedPoints = estimateLoyaltyPoints(payable);

  // Mã QR vừa tạo có thể nằm dưới màn hình, nên cuộn tới để người dùng thấy ngay.
  useEffect(() => {
    if (!createdQr) return;
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    qrPanelRef.current?.scrollIntoView?.({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
  }, [createdQr]);

  useEffect(() => {
    if (items.length > 0 && !readPendingQr(cartKey)) {
      sessionStorage.removeItem(PENDING_QR_KEY);
    }
  }, [items.length, cartKey]);

  const createOrderFromCart = () =>
    apiClient.createOrder({
      items: items.map((item) => ({
        productId: item.product.id,
        size: item.size,
        qty: item.qty,
        toppingIds: item.toppings.map((topping) => topping.id),
      })),
      promoCode: getDiscount() > 0 ? promoCode : undefined,
    });

  const createQr = async () => {
    const order = await createOrderFromCart();
    setCreatedQr(await buildPendingPayment(order, cartKey));
  };

  const chooseMethod = (next: PaymentMethod) => {
    setMethod(next);
    setError(null);
  };

  const handleConfirmPayment = async () => {
    if (items.length === 0 || loading) return;
    setLoading(true);
    setError(null);
    setRequiresLogin(false);

    const isCreatingQr = method === 'QR' && !pendingQr;

    try {
      if (isCreatingQr) {
        // Tạo QR ngay trong trang để người dùng vẫn thấy lựa chọn của mình; chỉ thanh toán mới che toàn màn hình.
        await Promise.all([createQr(), wait(MIN_QR_SKELETON_MS)]);
        return;
      }

      await runWithLoading('Đang xử lý thanh toán...', async () => {
        // Có đơn đang chờ (mã QR, hoặc đơn vừa thanh toán thất bại) thì dùng lại đơn đó,
        // để thử lại không sinh thêm đơn PENDING mới bị bỏ rơi trong hệ thống.
        const order = pendingQr ?? (await buildPendingPayment(await createOrderFromCart(), cartKey));
        if (!pendingQr) setCreatedQr(order);
        const { orderId, amount } = order;
        const failedAttempts = order.failedAttempts ?? 0;
        const paymentMethod = method === 'QR' ? 'WALLET' : method;
        const paymentResult = await apiClient.payOrder(
          {
            orderId,
            method: paymentMethod,
            amount,
          },
          buildIdempotencyKey(orderId, paymentMethod, failedAttempts),
        );

        if (paymentResult.status === 'PAYMENT_FAILED') {
          setError('Thanh toán thất bại. Giỏ hàng của bạn vẫn được giữ nguyên, bấm xác nhận để thử lại với cùng đơn hàng.');
          // Giữ đơn để lần sau thanh toán lại chính đơn này (PAYMENT_FAILED → PENDING → PAID, PDF §9.1),
          // và tăng số lần thất bại để lần thử tới dùng Idempotency-Key mới.
          const retry = { ...order, failedAttempts: failedAttempts + 1 };
          sessionStorage.setItem(PENDING_QR_KEY, JSON.stringify(retry));
          setCreatedQr(retry);
          return;
        }

        const earnedPoints = paymentResult.loyaltyPointsEarned ?? estimateLoyaltyPoints(amount);
        addLoyaltyPoints(earnedPoints);
        sessionStorage.removeItem(PENDING_QR_KEY);
        clearCart();
        useUiStore.getState().holdLoadingUntilNavigation();
        // Mục 10: sang màn hình Xác nhận riêng (wireframes.md §8). Trang đó tự đọc trạng thái,
        // giảm giá và điểm thưởng từ server, nên URL không cần (và không nên) mang ?status=.
        router.push(`/orders/${encodeURIComponent(order.orderCode ?? orderId)}/confirmation`);
      });
    } catch (paymentError: unknown) {
      const message = getErrorMessage(paymentError);
      if (paymentError instanceof ApiError && paymentError.status === 401) {
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
  const isCreatingQrNow = loading && method === 'QR' && pendingQr === null;
  const buttonLabel = loading
    ? 'Đang xử lý...'
    : isQrReady
      ? 'Tôi đã quét mã — xác nhận demo'
      : method === 'QR'
        ? 'Tạo mã QR thanh toán'
        : 'Xác nhận thanh toán';

  return (
    <main className="min-h-full bg-[#faf8f3] px-0 pb-6 pt-3 sm:px-4 sm:py-10">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/cart"
          className="mx-3 inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 sm:mx-0"
        >
          <span aria-hidden="true">←</span>
          Quay lại giỏ hàng
        </Link>

        <div className="mt-2 overflow-hidden border-y border-stone-200 bg-white shadow-sm sm:mt-4 sm:rounded-3xl sm:border">
          <div className="bg-emerald-950 px-5 py-5 text-white sm:px-8 sm:py-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-200">
              Hoàn tất đơn hàng
            </p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Thanh toán</h1>
            <p className="mt-2 text-sm leading-5 text-emerald-100 sm:mt-3">
              Chọn phương thức thanh toán cho đơn BrewLite của bạn.
            </p>
          </div>

          <div className="p-4 sm:p-8">
            {/* Mục 8 (backlog Task 10d): cho khách thấy số tiền được giảm và số điểm sẽ nhận. */}
            <div className="rounded-2xl bg-[#faf8f3] px-4 py-4 text-sm">
              <div className="flex items-center justify-between gap-3 text-stone-600">
                <span>Tạm tính</span>
                <span data-testid="checkout-subtotal">{formatVnd(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="mt-1 flex items-center justify-between gap-3 text-emerald-700">
                  <span>Giảm giá ({promoCode.toUpperCase()})</span>
                  <span data-testid="checkout-discount">−{formatVnd(discount)}</span>
                </div>
              )}
              <div className="mt-3 flex items-center justify-between gap-3 border-t border-stone-200 pt-3">
                <span className="font-medium text-stone-600">Tổng thanh toán</span>
                <span className="text-xl font-bold text-emerald-900" data-testid="checkout-total">
                  {formatVnd(payable)}
                </span>
              </div>
              {expectedPoints > 0 && (
                <p data-testid="checkout-points" className="mt-2 text-xs font-medium text-amber-900">
                  Thanh toán thành công, bạn sẽ nhận +{expectedPoints.toLocaleString('vi-VN')} điểm thưởng.
                </p>
              )}
            </div>

            <fieldset className="mt-6" disabled={loading}>
              <legend className="text-sm font-semibold text-stone-800">
                Phương thức thanh toán
              </legend>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
                <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${method === 'QR' ? 'border-emerald-800 bg-emerald-50 ring-1 ring-emerald-800' : 'border-stone-200 hover:border-emerald-400'}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="QR"
                    checked={method === 'QR'}
                    onChange={() => chooseMethod('QR')}
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
                    onChange={() => chooseMethod('WALLET')}
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
                    onChange={() => chooseMethod('CARD')}
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
              <div key="qr-note" className="mt-5 animate-page-in rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
                Đây là QR demo chứa mã đơn và số tiền. Ứng dụng hiện chưa kết nối ngân hàng hoặc cổng thanh toán thật; việc xác nhận bên dưới chỉ mô phỏng thanh toán.
              </div>
            )}

            {method !== 'QR' && (
              <div
                key={method}
                data-testid="method-note"
                className="mt-5 animate-page-in rounded-2xl border border-stone-200 bg-[#faf8f3] p-4 text-sm leading-6 text-stone-700"
              >
                {method === 'WALLET' ? 'Thanh toán bằng ví điện tử mô phỏng.' : 'Thanh toán bằng thẻ ngân hàng mô phỏng.'}
                {pendingQr && ' Đơn bạn vừa tạo sẽ được dùng tiếp, không tạo thêm đơn mới.'}
              </div>
            )}

            {isCreatingQrNow && (
              <div
                role="status"
                aria-label="Đang tạo mã QR"
                data-testid="qr-loading"
                className="mt-5 flex animate-page-in flex-col items-center rounded-2xl border border-stone-200 bg-white p-4 sm:mt-6 sm:p-5"
              >
                <div className="h-5 w-40 animate-pulse rounded bg-stone-200" />
                <div className="mt-2 h-4 w-64 max-w-full animate-pulse rounded bg-stone-200" />
                <div className="mt-4 h-60 w-60 animate-pulse rounded-xl bg-stone-200" />
              </div>
            )}

            {pendingQr && method === 'QR' && (
              <section
                ref={qrPanelRef}
                aria-label="Mã QR thanh toán demo"
                data-testid="qr-payment-panel"
                className="mt-5 flex animate-rise-in flex-col items-center rounded-2xl border border-stone-200 bg-white p-4 text-center sm:mt-6 sm:p-5"
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
                  className="mt-4 size-56 max-w-full rounded-xl border border-stone-200 bg-white p-2 sm:size-60"
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

            <div className="sticky bottom-0 z-20 -mx-4 mt-5 border-t border-stone-200 bg-white/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur sm:static sm:mx-0 sm:mt-6 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
              <button
                type="button"
                disabled={loading || items.length === 0}
                data-testid="confirm-payment-btn"
                onClick={handleConfirmPayment}
                className="min-h-12 w-full rounded-xl bg-emerald-900 px-4 py-3 font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span key={buttonLabel} className="inline-block animate-page-in">
                  {loading && <Spinner />}
                  {buttonLabel}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
