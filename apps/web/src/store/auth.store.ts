import { create } from 'zustand';
import { User } from '@/types';

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user?: Partial<User>) => void;
  addLoyaltyPoints: (points: number) => void;
  logout: () => void;
}

const getStoredUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('brewlite_user');
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,

  setAuth: (token, user) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('brewlite_token', token);
    }

    const email = user?.email || 'customer@brewlite.vn';
    const nameFromEmail = email.includes('@') ? email.split('@')[0] : email;
    const resolvedName = user?.name?.trim() || nameFromEmail;

    const isUserAdmin =
      user?.role === 'ADMIN' ||
      resolvedName.toLowerCase() === 'admin' ||
      email.toLowerCase().startsWith('admin@') ||
      email.toLowerCase() === 'admin';

    const resolvedUser: User = {
      id: user?.id || 'user-1',
      email,
      name: resolvedName,
      role: isUserAdmin ? 'ADMIN' : (user?.role || 'CUSTOMER'),
      loyaltyPoints: user?.loyaltyPoints ?? 0,
    };

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('brewlite_user', JSON.stringify(resolvedUser));
      } catch {}
    }

    set({
      token,
      user: resolvedUser,
    });
  },

  addLoyaltyPoints: (points) =>
    set((state) => {
      const updatedUser = state.user
        ? { ...state.user, loyaltyPoints: (state.user.loyaltyPoints ?? 0) + points }
        : null;
      if (typeof window !== 'undefined' && updatedUser) {
        try {
          localStorage.setItem('brewlite_user', JSON.stringify(updatedUser));
        } catch {}
      }
      return { user: updatedUser };
    }),

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('brewlite_token');
      localStorage.removeItem('brewlite_user');
    }
    set({ token: null, user: null });
  },
}));

// Trạng thái ban đầu giữ null để lần render hydrate khớp HTML của server (server không có localStorage);
// React render lại ngay sau đó với phiên thật. Vì lần commit đầu vẫn thấy null, effect chuyển hướng phải
// đọc useAuthStore.getState().token thay vì giá trị token từ hook.
if (typeof window !== 'undefined') {
  useAuthStore.setState({ token: localStorage.getItem('brewlite_token'), user: getStoredUser() });
}
