import { create } from 'zustand';
import { User, AuthToken } from '@/types';

interface AuthState {
  user: User | null;
  tokens: AuthToken | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  setTokens: (tokens: AuthToken | null) => void;
  setError: (error: string | null) => void;
  clearAuth: () => void;
  initializeFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isInitialized: false,

  login: async (email: string, password: string, rememberMe = false) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '登录失败');
      }

       const data = await response.json();
       if (data.success && data.data) {
         set({
           user: data.data.user,
           tokens: data.data.tokens,
           isAuthenticated: true,
           error: null,
         });

         // 总是保存到 localStorage（保持会话）
         localStorage.setItem('auth_tokens', JSON.stringify(data.data.tokens));
         localStorage.setItem('auth_user', JSON.stringify(data.data.user));
       }
    } catch (error: any) {
      const errorMessage = error.message || '登录失败，请重试';
      set({ error: errorMessage, isLoading: false });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      set({
        user: null,
        tokens: null,
        isAuthenticated: false,
        error: null,
      });

      // 清除 localStorage
      localStorage.removeItem('auth_tokens');
      localStorage.removeItem('auth_user');
    } catch (error: any) {
      console.error('Logout error:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  setUser: (user: User | null) => {
    set({ user, isAuthenticated: !!user });
  },

  setTokens: (tokens: AuthToken | null) => {
    set({ tokens });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  clearAuth: () => {
    set({
      user: null,
      tokens: null,
      isAuthenticated: false,
      error: null,
    });
    localStorage.removeItem('auth_tokens');
    localStorage.removeItem('auth_user');
  },

  initializeFromStorage: () => {
    if (typeof window === 'undefined') {
      set({ isInitialized: true });
      return;
    }

    try {
      const storedTokens = localStorage.getItem('auth_tokens');
      const storedUser = localStorage.getItem('auth_user');

      if (storedTokens && storedUser) {
        const tokens = JSON.parse(storedTokens) as AuthToken;
        const user = JSON.parse(storedUser) as User;
        set({
          tokens,
          user,
          isAuthenticated: true,
          error: null,
        });
      }
    } catch (error) {
      console.error('Failed to restore auth from storage:', error);
      localStorage.removeItem('auth_tokens');
      localStorage.removeItem('auth_user');
    } finally {
      set({ isInitialized: true });
    }
  },
}));
