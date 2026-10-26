import { create } from 'zustand';
import { User } from '@/types';

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user?: User) => void;
  addLoyaltyPoints: (points: number) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: typeof window !== 'undefined' ? localStorage.getItem('brewlite_token') : null,
  user: null,

  setAuth: (token, user) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('brewlite_token', token);
    }
    set({
      token,
      user: user ?? { id: 'user-1', email: 'customer@brewlite.vn', loyaltyPoints: 0 },
    });
  },

  addLoyaltyPoints: (points) =>
    set((state) => ({
      user: state.user
        ? { ...state.user, loyaltyPoints: (state.user.loyaltyPoints ?? 0) + points }
        : null,
    })),

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('brewlite_token');
    }
    set({ token: null, user: null });
  },
}));