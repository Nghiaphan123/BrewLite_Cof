'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

export default function AccountPage() {
  const router = useRouter();
  const { token, user } = useAuthStore();

  useEffect(() => {
    if (!token) {
      router.replace('/login');
    }
  }, [token, router]);

  if (!user) {
    return (
      <main className="mx-auto max-w-md px-4 py-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:underline"
        >
          ← Quay lại
        </button>
        <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <p className="text-stone-500">Đang tải thông tin tài khoản...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:underline"
      >
        ← Quay lại
      </button>

      <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-stone-900">Thông tin tài khoản</h1>

        <dl className="mt-6 space-y-4">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Họ và tên
            </dt>
            <dd className="mt-1 text-base font-medium text-stone-900">
              {user.name || 'Chưa cập nhật'}
            </dd>
          </div>

          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Email
            </dt>
            <dd className="mt-1 text-base font-medium text-stone-900">{user.email}</dd>
          </div>

          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Điểm thành viên
            </dt>
            <dd className="mt-1 text-base font-medium text-stone-900">
              {user.loyaltyPoints ?? 0} điểm
            </dd>
          </div>

          {user.createdAt && (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Ngày tham gia
              </dt>
              <dd className="mt-1 text-base font-medium text-stone-900">
                {new Date(user.createdAt).toLocaleDateString('vi-VN')}
              </dd>
            </div>
          )}
        </dl>
      </div>
    </main>
  );
}
