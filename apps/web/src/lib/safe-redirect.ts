/**
 * Chỉ cho phép chuyển hướng tới đường dẫn nội bộ của BrewLite.
 *
 * `?redirect=` đến từ URL nên ai cũng sửa được. Nếu đưa thẳng vào router.push,
 * link `/login?redirect=https://trang-gia.com` sẽ đưa người dùng vừa đăng nhập
 * sang trang lạ (lỗi open redirect). Đường dẫn hợp lệ phải bắt đầu bằng một
 * dấu `/` duy nhất: `//host` và `/\host` đều được trình duyệt hiểu là domain khác.
 */
export function getSafeRedirect(value: string | null | undefined, fallback = '/'): string {
  if (!value) return fallback;
  const path = value.trim();
  if (!path.startsWith('/') || path.startsWith('//') || path.startsWith('/\\')) {
    return fallback;
  }
  // Chặn ký tự điều khiển (tab, xuống dòng) mà trình duyệt có thể bỏ qua khi phân tích URL.
  if (/[\u0000-\u001f\u007f]/.test(path)) return fallback;
  return path;
}
