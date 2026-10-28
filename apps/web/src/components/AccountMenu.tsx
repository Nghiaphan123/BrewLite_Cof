'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import type { User } from '@/types';

type AccountDialog = 'profile' | 'password' | null;

export function AccountMenu() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { token, user, logout, setAuth } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dialog, setDialog] = useState<AccountDialog>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (!token || user) return;

    apiClient.getProfile()
      .then((authenticatedUser) => setAuth(token, authenticatedUser))
      .catch((error: unknown) => {
        setProfileError(
          error instanceof Error ? error.message : 'Không thể tải thông tin tài khoản.',
        );
      });
  }, [setAuth, token, user]);

  useEffect(() => {
    if (!menuOpen) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [menuOpen]);

  if (!token) {
    return (
      <Link
        href="/login"
        className="rounded-lg border border-emerald-700 px-3 py-1.5 text-emerald-700 hover:bg-emerald-50"
      >
        Đăng nhập
      </Link>
    );
  }

  const openProfile = () => {
    setMenuOpen(false);
    router.push('/account');
  };

  const openPasswordForm = () => {
    setMenuOpen(false);
    setDialog('password');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError(null);
    setPasswordSuccess(null);
  };

  const closeDialog = () => {
    if (passwordLoading) return;
    setDialog(null);
  };

  const handleChangePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);
    if (newPassword !== confirmPassword) {
      setPasswordError('Mật khẩu mới nhập lại không khớp.');
      return;
    }

    setPasswordLoading(true);
    try {
      await apiClient.changePassword({ currentPassword, newPassword });
      setPasswordSuccess('Đổi mật khẩu thành công.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setPasswordError(
        error instanceof Error ? error.message : 'Không thể đổi mật khẩu.',
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    router.push('/login');
  };

  const displayName = user?.name || user?.email || 'Tài khoản';
  const displayedProfile = profile ?? user;

  return (
    <>
      <div ref={containerRef} className="relative">
        <button
          ref={triggerRef}
          type="button"
          data-testid="account-menu-button"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
          className="flex max-w-36 items-center gap-2 rounded-lg border border-stone-200 bg-white px-2 py-2 text-sm font-semibold text-stone-800 hover:border-emerald-700 hover:text-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 sm:max-w-48 sm:px-3"
        >
          <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-900">
            {displayName.charAt(0).toLocaleUpperCase()}
          </span>
          <span data-testid="account-display-name" className="min-w-0 truncate whitespace-nowrap">
            {displayName}
          </span>
          <span aria-hidden="true" className="text-xs">▼</span>
        </button>

        {menuOpen && (
          <div
            role="menu"
            aria-label="Tùy chọn tài khoản"
            className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border border-stone-200 bg-white py-1 shadow-lg"
          >
            <button
              type="button"
              role="menuitem"
              onClick={openProfile}
              className="block w-full px-4 py-2.5 text-left text-sm text-stone-700 hover:bg-emerald-50"
            >
              Xem thông tin
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={openPasswordForm}
              className="block w-full px-4 py-2.5 text-left text-sm text-stone-700 hover:bg-emerald-50"
            >
              Đổi mật khẩu
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="block w-full border-t border-stone-100 px-4 py-2.5 text-left text-sm text-red-700 hover:bg-red-50"
            >
              Đăng xuất
            </button>
          </div>
        )}
      </div>

      {dialog && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDialog();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="account-dialog-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <h2 id="account-dialog-title" className="text-xl font-bold text-stone-900">
                {dialog === 'profile' ? 'Thông tin tài khoản' : 'Đổi mật khẩu'}
              </h2>
              <button
                type="button"
                aria-label="Đóng"
                onClick={closeDialog}
                className="rounded-md px-2 py-1 text-stone-500 hover:bg-stone-100"
              >
                ✕
              </button>
            </div>

            {dialog === 'profile' ? (
              <div className="mt-5">
                {profileLoading && <p role="status">Đang tải thông tin...</p>}
                {profileError && (
                  <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {profileError}
                  </p>
                )}
                {!profileLoading && !profileError && displayedProfile && (
                  <dl className="space-y-4">
                    <div>
                      <dt className="text-xs font-semibold uppercase text-stone-500">Họ và tên</dt>
                      <dd data-testid="profile-name" className="mt-1 font-medium text-stone-900">
                        {displayedProfile.name || 'Chưa cập nhật'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase text-stone-500">Email</dt>
                      <dd className="mt-1 font-medium text-stone-900">{displayedProfile.email}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase text-stone-500">Điểm thành viên</dt>
                      <dd className="mt-1 font-medium text-stone-900">
                        {displayedProfile.loyaltyPoints ?? 0} điểm
                      </dd>
                    </div>
                    {displayedProfile.createdAt && (
                      <div>
                        <dt className="text-xs font-semibold uppercase text-stone-500">Ngày tham gia</dt>
                        <dd className="mt-1 font-medium text-stone-900">
                          {new Date(displayedProfile.createdAt).toLocaleDateString('vi-VN')}
                        </dd>
                      </div>
                    )}
                  </dl>
                )}
              </div>
            ) : (
              <form className="mt-5 space-y-4" onSubmit={handleChangePassword}>
                <label className="block text-sm font-medium text-stone-700">
                  Mật khẩu hiện tại
                  <input
                    type="password"
                    required
                    minLength={8}
                    autoComplete="current-password"
                    data-testid="current-password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900"
                  />
                </label>
                <label className="block text-sm font-medium text-stone-700">
                  Mật khẩu mới
                  <input
                    type="password"
                    required
                    minLength={8}
                    pattern="^(?=.*[A-Za-z])(?=.*\d).{8,}$"
                    title="Mật khẩu cần ít nhất 8 ký tự, gồm chữ cái và chữ số."
                    autoComplete="new-password"
                    data-testid="new-password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900"
                  />
                </label>
                <label className="block text-sm font-medium text-stone-700">
                  Nhập lại mật khẩu mới
                  <input
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    data-testid="confirm-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900"
                  />
                </label>
                {passwordError && (
                  <p role="alert" data-testid="password-error" className="text-sm text-red-700">
                    {passwordError}
                  </p>
                )}
                {passwordSuccess && (
                  <p role="status" data-testid="password-success" className="text-sm text-emerald-800">
                    {passwordSuccess}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="w-full rounded-xl bg-emerald-900 px-4 py-3 font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
                >
                  {passwordLoading ? 'Đang lưu...' : 'Cập nhật mật khẩu'}
                </button>
              </form>
            )}
          </section>
        </div>
      )}
    </>
  );
}
