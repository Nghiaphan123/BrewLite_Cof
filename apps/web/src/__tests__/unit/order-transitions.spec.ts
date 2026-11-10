import { describe, expect, it } from 'vitest';
import { nextManualStatuses } from '@/features/orders/order-transitions';

describe('nextManualStatuses (ô chọn trạng thái ở trang admin)', () => {
  it('đi đúng luồng pha chế PAID → PREPARING → READY → COMPLETED', () => {
    expect(nextManualStatuses('PAID')).toEqual(['PREPARING', 'CANCELLED']);
    expect(nextManualStatuses('PREPARING')).toEqual(['READY']);
    expect(nextManualStatuses('READY')).toEqual(['COMPLETED']);
  });

  it('đơn chưa trả tiền chỉ có thể bị hủy, không được đánh dấu PAID bằng tay', () => {
    expect(nextManualStatuses('PENDING')).toEqual(['CANCELLED']);
    expect(nextManualStatuses('PAYMENT_FAILED')).toEqual(['CANCELLED']);
  });

  it('COMPLETED và CANCELLED là trạng thái kết thúc', () => {
    expect(nextManualStatuses('COMPLETED')).toEqual([]);
    expect(nextManualStatuses('CANCELLED')).toEqual([]);
  });
});
