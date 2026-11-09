'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useLogout } from '@/features/auth/useLogout';
import { Order, OrderStatus, Product, Promotion, Topping, User } from '@/types';
import { Spinner } from '@/components/Skeleton';
import { nextManualStatuses } from '@/features/orders/order-transitions';
import { StockTable } from '@/features/admin/StockTable';

type AdminTab = 'products' | 'toppings' | 'users' | 'promotions' | 'orders';

const ADMIN_TABS: readonly string[] = ['products', 'toppings', 'users', 'promotions', 'orders'];

function isAdminTab(value: string | null | undefined): value is AdminTab {
  return !!value && ADMIN_TABS.includes(value);
}

function formatVND(value: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
}

function formatDate(dateStr?: string | Date): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(dateStr);
  }
}

function AdminDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabFromQuery = searchParams?.get('tab');

  const { token, user } = useAuthStore();
  const logoutWithLoading = useLogout();

  // ?tab= trên URL là nguồn chính của tab đang mở; selectedTab chỉ dùng khi URL không có tab hợp lệ.
  // Tính trực tiếp khi render thay vì chép URL vào state bằng useEffect (lint react-hooks/set-state-in-effect).
  const [selectedTab, setSelectedTab] = useState<AdminTab>('products');
  const activeTab: AdminTab = isAdminTab(tabFromQuery) ? tabFromQuery : selectedTab;
  // `loading` được tính ra, không lưu thành state riêng: đang tải khi tab đang mở chưa tải xong
  // lần nào, hoặc khi admin bấm "Làm mới dữ liệu". Nhờ vậy effect tải dữ liệu không phải gọi
  // setLoading(true) ngay lập tức (lint react-hooks/set-state-in-effect).
  const [loadedTab, setLoadedTab] = useState<AdminTab | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const loading = refreshing || loadedTab !== activeTab;
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Tab Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [toppings, setToppings] = useState<Topping[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Promotion modal / form
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [newPromoCode, setNewPromoCode] = useState('');
  const [newPromoType, setNewPromoType] = useState<'PERCENT' | 'FIXED'>('PERCENT');
  const [newPromoValue, setNewPromoValue] = useState<number>(10);
  const [newPromoMinTotal, setNewPromoMinTotal] = useState<number>(0);
  const [newPromoValidFrom, setNewPromoValidFrom] = useState<string>('');
  const [newPromoValidTo, setNewPromoValidTo] = useState<string>('');
  const [newPromoLimit, setNewPromoLimit] = useState<string>('');
  const [submittingPromo, setSubmittingPromo] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

  // Order status changing
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // Khai báo trước useEffect bên dưới: gọi một hằng số trước khi nó được khai báo
  // (temporal dead zone) là lỗi lint react-hooks/immutability. useCallback giữ hàm ổn định
  // giữa các lần render để có thể đưa vào mảng phụ thuộc của effect.
  // Mọi setState đều nằm trong callback của Promise (.then/.catch/.finally), tức chỉ chạy khi
  // API đã trả kết quả. Đó là cách effect được phép cập nhật state theo react-hooks/set-state-in-effect.
  const fetchTabData = useCallback((tab: AdminTab): Promise<void> => {
    const request: Promise<void> =
      tab === 'products'
        ? apiClient.getAdminProducts().then(setProducts)
        : tab === 'toppings'
        ? apiClient.getAdminToppings().then(setToppings)
        : tab === 'users'
          ? apiClient.getAdminUsers().then(setUsers)
          : tab === 'promotions'
            ? apiClient.getAdminPromotions().then(setPromotions)
            : apiClient.getAdminOrders().then(setOrders);

    return request
      .then(() => setError(null))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu'))
      .finally(() => {
        setLoadedTab(tab);
        setRefreshing(false);
      });
  }, []);

  const refreshTabData = () => {
    setRefreshing(true);
    setError(null);
    void fetchTabData(activeTab);
  };

  // Initial Load & Access Check
  useEffect(() => {
    // Chưa đăng nhập hoặc không phải admin thì trang hiện màn hình chặn ở dưới và không dùng
    // `loading`, nên chỉ cần không tải dữ liệu (không gọi setState ngay trong effect).
    if (!token || (user && user.role !== 'ADMIN')) return;

    void fetchTabData(activeTab);
  }, [token, user, activeTab, fetchTabData]);

  const switchTab = (tab: AdminTab) => {
    setSelectedTab(tab);
    setError(null);
    setSearchTerm('');
    router.replace(`/admin?tab=${tab}`);
  };

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // -------------------------------- Handlers: Product & Topping Stock
  // StockTable gọi các hàm này khi admin bấm "Lưu"; trả về true khi đã lưu được.
  const handleUpdateProductStock = async (id: string, stock: number): Promise<boolean> => {
    try {
      const updated = await apiClient.updateAdminProductStock(id, stock);
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, stock: updated.stock } : p)));
      setError(null);
      showSuccess(`Đã cập nhật tồn kho món "${updated.name}": ${updated.stock} ly`);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cập nhật tồn kho thất bại');
      return false;
    }
  };

  const handleUpdateToppingStock = async (id: string, stock: number): Promise<boolean> => {
    try {
      const updated = await apiClient.updateAdminToppingStock(id, stock);
      setToppings((prev) => prev.map((t) => (t.id === id ? { ...t, stock: updated.stock } : t)));
      setError(null);
      showSuccess(`Đã cập nhật tồn kho topping "${updated.name}": ${updated.stock} phần`);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cập nhật tồn kho thất bại');
      return false;
    }
  };

  // -------------------------------- Handlers: Create Promotion
  const handleCreatePromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError(null);
    setSubmittingPromo(true);

    try {
      const payload = {
        code: newPromoCode.trim().toUpperCase(),
        type: newPromoType,
        value: Number(newPromoValue),
        minOrderTotal: Number(newPromoMinTotal) || 0,
        validFrom: new Date(newPromoValidFrom).toISOString(),
        validTo: new Date(newPromoValidTo).toISOString(),
        usageLimit: newPromoLimit ? Number(newPromoLimit) : null,
        active: true,
      };

      const created = await apiClient.createAdminPromotion(payload);
      setPromotions((prev) => [created, ...prev]);
      setIsPromoModalOpen(false);
      setNewPromoCode('');
      setNewPromoValue(10);
      setNewPromoMinTotal(0);
      setNewPromoLimit('');
      showSuccess(`Đã tạo mã khuyến mãi ${created.code} thành công!`);
    } catch (err) {
      setPromoError(err instanceof Error ? err.message : 'Không thể tạo mã khuyến mãi');
    } finally {
      setSubmittingPromo(false);
    }
  };

  // -------------------------------- Handlers: Update Order Status
  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    setUpdatingOrderId(orderId);
    try {
      await apiClient.updateAdminOrderStatus(orderId, status);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      );
      showSuccess(`Đã đổi trạng thái đơn sang ${status}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể đổi trạng thái đơn');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // -------------------------------- Access Guards
  if (!token) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-[#faf8f3] px-4 py-12">
        <div className="max-w-md rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-2xl text-amber-800">
            🔒
          </div>
          <h1 className="mt-4 text-xl font-bold text-stone-900">Yêu cầu đăng nhập quản trị</h1>
          <p className="mt-2 text-sm text-stone-600">
            Bạn cần đăng nhập bằng tài khoản quản trị (admin) để truy cập trang này.
          </p>
          <button
            onClick={() => router.push('/login?redirect=/admin')}
            className="mt-6 w-full rounded-xl bg-emerald-800 py-2.5 font-bold text-white transition hover:bg-emerald-900"
          >
            Đăng nhập ngay
          </button>
        </div>
      </main>
    );
  }

  if (user && user.role !== 'ADMIN') {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-[#faf8f3] px-4 py-12">
        <div className="max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl text-red-800">
            🚫
          </div>
          <h1 className="mt-4 text-xl font-bold text-stone-900">Không có quyền truy cập</h1>
          <p className="mt-2 text-sm text-stone-600">
            Tài khoản hiện tại ({user.email}) không có quyền quản trị viên. Vui lòng đăng nhập với tài khoản admin.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <button
              onClick={() => {
                useAuthStore.getState().logout();
                router.push('/login?redirect=/admin');
              }}
              className="w-full rounded-xl bg-emerald-800 py-2.5 font-bold text-white hover:bg-emerald-900"
            >
              Đổi sang tài khoản Admin
            </button>
            <button
              onClick={() => router.push('/menu')}
              className="w-full rounded-xl border border-stone-300 py-2.5 font-semibold text-stone-700 hover:bg-stone-50"
            >
              Về trang Menu
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f3] pb-16">
      {/* Header Banner */}
      <section className="border-b border-stone-200 bg-white py-6 shadow-sm">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-md bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                  ADMINISTRATOR
                </span>
                <span className="text-xs text-stone-500">BrewLite Management</span>
              </div>
              <h1 className="mt-1 font-serif text-2xl font-bold tracking-tight text-emerald-950 sm:text-3xl">
                Bảng điều khiển Quản trị viên
              </h1>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={refreshTabData}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 shadow-xs hover:bg-stone-50 disabled:opacity-50"
              >
                {loading ? <Spinner /> : '🔄'} Làm mới dữ liệu
              </button>
              <button
                onClick={() => void logoutWithLoading()}
                className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 shadow-xs hover:bg-stone-50"
              >
                🚪 Đăng xuất
              </button>
            </div>
          </div>

          {/* Tab Navigation: 5 Tabs */}
          <nav className="mt-6 flex gap-2 border-b border-stone-200 pb-px overflow-x-auto text-sm font-semibold">
            <button
              onClick={() => switchTab('products')}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 transition whitespace-nowrap ${
                activeTab === 'products'
                  ? 'border-emerald-800 text-emerald-900'
                  : 'border-transparent text-stone-600 hover:border-stone-300 hover:text-stone-900'
              }`}
            >
              <span>☕</span> Món & Tồn kho
            </button>

            <button
              onClick={() => switchTab('toppings')}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 transition whitespace-nowrap ${
                activeTab === 'toppings'
                  ? 'border-emerald-800 text-emerald-900'
                  : 'border-transparent text-stone-600 hover:border-stone-300 hover:text-stone-900'
              }`}
            >
              <span>🧋</span> Topping & Tồn kho
            </button>

            <button
              onClick={() => switchTab('users')}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 transition whitespace-nowrap ${
                activeTab === 'users'
                  ? 'border-emerald-800 text-emerald-900'
                  : 'border-transparent text-stone-600 hover:border-stone-300 hover:text-stone-900'
              }`}
            >
              <span>👥</span> Người dùng ({users.length || '...'})
            </button>

            <button
              onClick={() => switchTab('promotions')}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 transition whitespace-nowrap ${
                activeTab === 'promotions'
                  ? 'border-emerald-800 text-emerald-900'
                  : 'border-transparent text-stone-600 hover:border-stone-300 hover:text-stone-900'
              }`}
            >
              <span>🏷️</span> Mã khuyến mãi ({promotions.length || '...'})
            </button>

            <button
              onClick={() => switchTab('orders')}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 transition whitespace-nowrap ${
                activeTab === 'orders'
                  ? 'border-emerald-800 text-emerald-900'
                  : 'border-transparent text-stone-600 hover:border-stone-300 hover:text-stone-900'
              }`}
            >
              <span>📋</span> Lịch sử Đơn hàng ({orders.length || '...'})
            </button>
          </nav>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {/* Feedback alerts */}
        {error && (
          <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
            ⚠️ {error}
          </div>
        )}
        {successMessage && (
          <div role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
            ✅ {successMessage}
          </div>
        )}

        {/* =========================================================================
            TAB 1: MÓN & TỒN KHO (admin sửa được số ly còn của từng món)
           ========================================================================= */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-stone-900">Danh sách Món & Tồn kho</h2>
              <p className="text-xs text-stone-500">
                Số ly còn bán được của từng món. Kho chỉ bị trừ khi khách thanh toán thành công.
              </p>
            </div>
            <StockTable
              itemLabel="Món"
              unit="ly"
              searchPlaceholder="Tìm món..."
              emptyText="Chưa có món nào trong hệ thống."
              rows={products}
              loading={loading}
              onSave={handleUpdateProductStock}
            />
          </div>
        )}

        {/* =========================================================================
            TAB 2: TOPPING & TỒN KHO
           ========================================================================= */}
        {activeTab === 'toppings' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-stone-900">Danh sách Topping & Tồn kho</h2>
              <p className="text-xs text-stone-500">
                Mỗi ly có chọn topping dùng 1 phần topping đó, trừ khi khách thanh toán thành công.
              </p>
            </div>
            <StockTable
              itemLabel="Topping"
              unit="phần"
              searchPlaceholder="Tìm topping..."
              emptyText="Chưa có topping nào trong hệ thống."
              rows={toppings}
              loading={loading}
              onSave={handleUpdateToppingStock}
            />
          </div>
        )}

        {/* =========================================================================
            TAB 3: NGƯỜI DÙNG / USERS
           ========================================================================= */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-lg font-bold text-stone-900">Danh sách Người dùng hiện tại</h2>
                <p className="text-xs text-stone-500">
                  Xem tất cả tài khoản khách hàng và quản trị viên trong hệ thống BrewLite.
                </p>
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Tìm theo tên hoặc email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs text-stone-800 placeholder:text-stone-400 focus:border-emerald-700 focus:outline-none"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <Spinner />
              </div>
            ) : users.length === 0 ? (
              <div className="rounded-xl border border-stone-200 bg-white p-8 text-center text-stone-500">
                Chưa có người dùng nào.
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-stone-700">
                    <thead className="border-b border-stone-200 bg-stone-50 text-xs font-bold uppercase tracking-wider text-stone-600">
                      <tr>
                        <th className="px-5 py-3.5">Người dùng</th>
                        <th className="px-5 py-3.5">Email</th>
                        <th className="px-5 py-3.5">Vai trò</th>
                        <th className="px-5 py-3.5">Điểm tích lũy</th>
                        <th className="px-5 py-3.5">Số đơn đã đặt</th>
                        <th className="px-5 py-3.5">Ngày tham gia</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {users
                        .filter(
                          (u) =>
                            (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            u.email.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((u) => (
                          <tr key={u.id} className="hover:bg-stone-50/70 transition">
                            <td className="px-5 py-4 font-semibold text-stone-900">
                              <div className="flex items-center gap-2.5">
                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">
                                  {(u.name || u.email).charAt(0).toUpperCase()}
                                </span>
                                <span>{u.name || 'Khách hàng'}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-stone-600">{u.email}</td>
                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                                  u.role === 'ADMIN'
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                    : 'bg-stone-100 text-stone-700'
                                }`}
                              >
                                {u.role === 'ADMIN' ? '🛡️ Quản trị viên' : 'Khách hàng'}
                              </span>
                            </td>
                            <td className="px-5 py-4 font-medium text-emerald-800">
                              ⭐ {u.loyaltyPoints ?? 0} pts
                            </td>
                            <td className="px-5 py-4 font-medium text-stone-700">
                              {u._count?.orders ?? 0} đơn
                            </td>
                            <td className="px-5 py-4 text-xs text-stone-500">
                              {formatDate(u.createdAt)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 4: KHUYẾN MÃI / PROMOTION
           ========================================================================= */}
        {activeTab === 'promotions' && (
          <div className="space-y-4">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-lg font-bold text-stone-900">Quản lý Mã Khuyến Mãi</h2>
                <p className="text-xs text-stone-500">
                  Xem danh sách các mã giảm giá và tạo thêm mã khuyến mãi mới cho khách hàng.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Tìm mã code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs text-stone-800 placeholder:text-stone-400 focus:border-emerald-700 focus:outline-none"
                />
                <button
                  onClick={() => {
                    setIsPromoModalOpen(true);
                    setPromoError(null);
                    setNewPromoValidFrom(new Date().toISOString().slice(0, 16));
                    setNewPromoValidTo(
                      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
                    );
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-800 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-900"
                >
                  <span>➕</span> Thêm mã khuyến mãi
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <Spinner />
              </div>
            ) : promotions.length === 0 ? (
              <div className="rounded-xl border border-stone-200 bg-white p-8 text-center text-stone-500">
                Chưa có mã khuyến mãi nào.
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-stone-700">
                    <thead className="border-b border-stone-200 bg-stone-50 text-xs font-bold uppercase tracking-wider text-stone-600">
                      <tr>
                        <th className="px-5 py-3.5">Mã Code</th>
                        <th className="px-5 py-3.5">Loại giảm</th>
                        <th className="px-5 py-3.5">Giá trị</th>
                        <th className="px-5 py-3.5">Đơn tối thiểu</th>
                        <th className="px-5 py-3.5">Đã dùng / Giới hạn</th>
                        <th className="px-5 py-3.5">Hiệu lực</th>
                        <th className="px-5 py-3.5">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {promotions
                        .filter((p) => p.code.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map((p) => (
                          <tr key={p.id || p.code} className="hover:bg-stone-50/70 transition">
                            <td className="px-5 py-4 font-mono font-bold text-emerald-900">
                              <span className="rounded bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                                {p.code}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-xs font-semibold text-stone-700">
                              {p.type === 'PERCENT' ? 'Phần trăm (%)' : 'Số tiền cố định (VND)'}
                            </td>
                            <td className="px-5 py-4 font-bold text-stone-900">
                              {p.type === 'PERCENT' ? `${p.value}%` : formatVND(p.value)}
                            </td>
                            <td className="px-5 py-4 text-stone-600">
                              {p.minOrderTotal > 0 ? formatVND(p.minOrderTotal) : 'Không giới hạn'}
                            </td>
                            <td className="px-5 py-4 text-xs font-medium text-stone-700">
                              {p.usedCount ?? 0} / {p.usageLimit ?? '∞ Không giới hạn'}
                            </td>
                            <td className="px-5 py-4 text-xs text-stone-500">
                              <div>Từ: {formatDate(p.validFrom)}</div>
                              <div>Đến: {formatDate(p.validTo)}</div>
                            </td>
                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                                  p.active !== false
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-stone-100 text-stone-500'
                                }`}
                              >
                                {p.active !== false ? 'Hoạt động' : 'Đã tắt'}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Modal: Add New Promotion */}
            {isPromoModalOpen && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                onMouseDown={(e) => {
                  if (e.target === e.currentTarget) setIsPromoModalOpen(false);
                }}
              >
                <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
                  <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                    <h3 className="text-lg font-bold text-stone-900">Thêm Mã Khuyến Mãi Mới</h3>
                    <button
                      onClick={() => setIsPromoModalOpen(false)}
                      className="rounded-md p-1 text-stone-500 hover:bg-stone-100"
                    >
                      ✕
                    </button>
                  </div>

                  {promoError && (
                    <div className="mt-3 rounded-lg bg-red-50 p-3 text-xs font-medium text-red-700">
                      ⚠️ {promoError}
                    </div>
                  )}

                  <form onSubmit={handleCreatePromotion} className="mt-4 space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold uppercase text-stone-700">
                        Mã khuyến mãi (Code)
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="VD: SUMMER2026, BANMOI30K"
                        value={newPromoCode}
                        onChange={(e) => setNewPromoCode(e.target.value.toUpperCase())}
                        className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 font-mono text-sm font-bold uppercase text-stone-900 focus:border-emerald-800 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold uppercase text-stone-700">
                          Loại giảm giá
                        </label>
                        <select
                          value={newPromoType}
                          onChange={(e) => setNewPromoType(e.target.value as 'PERCENT' | 'FIXED')}
                          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-900 focus:border-emerald-800 focus:outline-none"
                        >
                          <option value="PERCENT">Phần trăm (%)</option>
                          <option value="FIXED">Số tiền cố định (VND)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase text-stone-700">
                          {newPromoType === 'PERCENT' ? 'Mức giảm (%)' : 'Số tiền giảm (VND)'}
                        </label>
                        <input
                          type="number"
                          required
                          min={1}
                          max={newPromoType === 'PERCENT' ? 100 : 1000000}
                          value={newPromoValue}
                          onChange={(e) => setNewPromoValue(Number(e.target.value))}
                          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-900 focus:border-emerald-800 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold uppercase text-stone-700">
                          Đơn tối thiểu (VND)
                        </label>
                        <input
                          type="number"
                          min={0}
                          placeholder="0 = Không yêu cầu"
                          value={newPromoMinTotal}
                          onChange={(e) => setNewPromoMinTotal(Number(e.target.value))}
                          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-emerald-800 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase text-stone-700">
                          Giới hạn lượt dùng
                        </label>
                        <input
                          type="number"
                          min={1}
                          placeholder="Để trống = Không giới hạn"
                          value={newPromoLimit}
                          onChange={(e) => setNewPromoLimit(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-emerald-800 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold uppercase text-stone-700">
                          Có hiệu lực từ
                        </label>
                        <input
                          type="datetime-local"
                          required
                          value={newPromoValidFrom}
                          onChange={(e) => setNewPromoValidFrom(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs text-stone-900 focus:border-emerald-800 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase text-stone-700">
                          Có hiệu lực đến
                        </label>
                        <input
                          type="datetime-local"
                          required
                          value={newPromoValidTo}
                          onChange={(e) => setNewPromoValidTo(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs text-stone-900 focus:border-emerald-800 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="mt-5 flex justify-end gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsPromoModalOpen(false)}
                        className="rounded-xl border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={submittingPromo}
                        className="rounded-xl bg-emerald-800 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-900 disabled:opacity-50"
                      >
                        {submittingPromo && <Spinner />}
                        {submittingPromo ? 'Đang tạo...' : 'Tạo mã ngay'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 5: ĐƠN HÀNG / ORDERS
           ========================================================================= */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-lg font-bold text-stone-900">Lịch sử Đơn hàng toàn hệ thống</h2>
                <p className="text-xs text-stone-500">
                  Theo dõi danh sách đơn hàng của khách hàng và cập nhật tiến độ xử lý đơn.
                </p>
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Tìm mã đơn hoặc khách..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs text-stone-800 placeholder:text-stone-400 focus:border-emerald-700 focus:outline-none"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <Spinner />
              </div>
            ) : orders.length === 0 ? (
              <div className="rounded-xl border border-stone-200 bg-white p-8 text-center text-stone-500">
                Chưa có đơn hàng nào trong hệ thống.
              </div>
            ) : (
              <div className="space-y-3">
                {orders
                  .filter(
                    (o) =>
                      (o.code || o.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (o.user?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (o.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((o) => {
                    const isUpdating = updatingOrderId === o.id;

                    const getStatusBadge = (status: OrderStatus) => {
                      switch (status) {
                        case 'PAID':
                          return 'bg-blue-100 text-blue-800 border-blue-200';
                        case 'PREPARING':
                          return 'bg-amber-100 text-amber-800 border-amber-200';
                        case 'READY':
                          return 'bg-teal-100 text-teal-800 border-teal-200';
                        case 'COMPLETED':
                          return 'bg-emerald-100 text-emerald-800 border-emerald-200';
                        case 'CANCELLED':
                        case 'PAYMENT_FAILED':
                          return 'bg-red-100 text-red-800 border-red-200';
                        case 'PENDING':
                        default:
                          return 'bg-stone-100 text-stone-800 border-stone-200';
                      }
                    };

                    return (
                      <div
                        key={o.id}
                        className="rounded-xl border border-stone-200 bg-white p-4 shadow-xs transition hover:border-stone-300"
                      >
                        <div className="flex flex-col justify-between gap-2 border-b border-stone-100 pb-3 sm:flex-row sm:items-center">
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-emerald-950">
                              {o.code || o.id.slice(0, 8)}
                            </span>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-bold border ${getStatusBadge(
                                o.status
                              )}`}
                            >
                              {o.status}
                            </span>
                            <span className="text-xs text-stone-500">
                              {formatDate(o.createdAt)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-stone-500">
                              Chuyển trạng thái:
                            </span>
                            {/* Chỉ cho chọn bước kế tiếp hợp lệ theo sơ đồ PDF §9.1. */}
                            <select
                              value={o.status}
                              disabled={isUpdating || nextManualStatuses(o.status).length === 0}
                              data-testid={`order-status-select-${o.id}`}
                              onChange={(e) =>
                                handleUpdateOrderStatus(o.id, e.target.value as OrderStatus)
                              }
                              className="rounded border border-stone-300 bg-stone-50 px-2 py-1 text-xs font-bold text-stone-800 focus:border-emerald-800 focus:outline-none disabled:opacity-50"
                            >
                              <option value={o.status} disabled>
                                {o.status}
                              </option>
                              {nextManualStatuses(o.status).map((next) => (
                                <option key={next} value={next}>
                                  → {next}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Customer & Items Details */}
                        <div className="mt-3 grid gap-3 sm:grid-cols-3">
                          {/* Col 1: Customer */}
                          <div>
                            <p className="text-[11px] font-bold uppercase text-stone-400">Khách hàng</p>
                            <p className="text-sm font-semibold text-stone-900">
                              {o.user?.name || 'Khách vãng lai'}
                            </p>
                            <p className="text-xs text-stone-500">{o.user?.email || '—'}</p>
                          </div>

                          {/* Col 2: Items Summary */}
                          <div className="sm:col-span-1">
                            <p className="text-[11px] font-bold uppercase text-stone-400">
                              Món đã đặt ({o.items?.length ?? 0})
                            </p>
                            <div className="mt-1 space-y-1">
                              {o.items?.map((item, idx) => (
                                <div key={idx} className="text-xs text-stone-700">
                                  <span className="font-bold">{item.qty}x</span>{' '}
                                  {item.productName || item.name || 'Sản phẩm'} (Size {item.size})
                                  {item.toppings && item.toppings.length > 0 && (
                                    <span className="text-stone-500">
                                      {' '}
                                      + {item.toppings.map((t) => t.name).join(', ')}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Col 3: Totals */}
                          <div className="text-right">
                            <p className="text-[11px] font-bold uppercase text-stone-400">Tổng thanh toán</p>
                            <p className="text-base font-bold text-emerald-900">
                              {formatVND(o.total)}
                            </p>
                            {o.discountAmount && o.discountAmount > 0 ? (
                              <p className="text-xs text-stone-500">
                                Giảm: -{formatVND(o.discountAmount)} (Mã: {o.promoCode || 'PROMO'})
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function AdminPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Spinner />
        </div>
      }
    >
      <AdminDashboard />
    </React.Suspense>
  );
}
