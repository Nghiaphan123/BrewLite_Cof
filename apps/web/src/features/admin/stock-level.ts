/** Số tồn kho lớn nhất admin được nhập, giống giới hạn của API (`@Max(100000)` trong DTO món). */
export const MAX_ADMIN_STOCK = 100000;

/** Mức tồn kho hiển thị trên trang admin. */
export type StockLevel = 'out' | 'low' | 'ok';

/** Sắp hết khi còn từ 1 đến 10 (ly hoặc phần). */
export const LOW_STOCK_THRESHOLD = 10;

export function stockLevel(stock: number): StockLevel {
  if (stock <= 0) return 'out';
  if (stock <= LOW_STOCK_THRESHOLD) return 'low';
  return 'ok';
}
