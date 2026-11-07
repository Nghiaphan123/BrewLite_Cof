/**
 * Idempotency-Key cho một lần thanh toán (ADR 0004 D4).
 *
 * - Bấm lại trong cùng một lần thử (mạng chập chờn, bấm hai lần) phải gửi lại đúng key cũ,
 *   để backend trả lại kết quả đã lưu thay vì trừ tiền lần nữa.
 * - Sau khi một lần thử đã THẤT BẠI, backend đã lưu kết quả FAILED cho key đó. Gửi lại key cũ
 *   chỉ nhận lại đúng kết quả FAILED (replay), nên lần thử lại phải dùng key mới.
 *
 * `failedAttempts` là số lần thanh toán đơn này đã thất bại; lần đầu là 0 và giữ dạng key cũ.
 */
export function buildIdempotencyKey(
  orderId: string,
  method: 'WALLET' | 'CARD',
  failedAttempts = 0,
): string {
  const base = `idem_${orderId}_${method}`;
  return failedAttempts > 0 ? `${base}_retry${failedAttempts}` : base;
}
