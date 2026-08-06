import { create } from 'zustand';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import { RoleType, User } from '@/types';
import { ROLES } from '@/lib/auth/permissions';
import { Database } from '@/types/database';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  setError: (error: string | null) => void;
  clearAuth: () => void;
  initializeFromStorage: () => Promise<void>;
}

const roleMap: Record<Profile['role'], RoleType> = {
  super_admin: RoleType.SUPER_ADMIN,
  product_manager: RoleType.PRODUCT_MANAGER,
  editor: RoleType.EDITOR,
  sales: RoleType.SALES,
  viewer: RoleType.VIEWER,
};

function profileToUser(profile: Profile): User {
  const roleType = roleMap[profile.role];
  return {
    id: profile.id,
    email: profile.email,
    firstName: profile.first_name || '待补充',
    lastName: profile.last_name || '',
    avatar: profile.avatar_url || undefined,
    status: profile.is_active ? 'ACTIVE' : 'INACTIVE',
    roleId: profile.role,
    role: ROLES[roleType],
    createdAt: new Date(profile.created_at),
    updatedAt: new Date(profile.updated_at),
    lastLoginAt: profile.last_login_at ? new Date(profile.last_login_at) : undefined,
  };
}

async function loadProfile(userId: string): Promise<User> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) {
    throw new Error('账号资料或权限尚未配置，请联系管理员');
  }
  if (!data.is_active) {
    throw new Error('账号已停用');
  }

  return profileToUser(data);
}

let initializationPromise: Promise<void> | null = null;
let listenerRegistered = false;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isInitialized: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error || !data.user) throw new Error(error?.message || '登录失败');

      const user = await loadProfile(data.user.id);
      await supabase
        .from('profiles')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', data.user.id);
      set({ user, isAuthenticated: true, error: null });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '登录失败，请重试';
      set({ user: null, isAuthenticated: false, error: message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await getSupabaseBrowserClient().auth.signOut();
    } finally {
      set({ user: null, isAuthenticated: false, isLoading: false, error: null });
    }
  },

  setError: (error) => set({ error }),

  clearAuth: () => set({ user: null, isAuthenticated: false, error: null }),

  initializeFromStorage: async () => {
    if (get().isInitialized) return;
    if (initializationPromise) return initializationPromise;

    initializationPromise = (async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          const user = await loadProfile(data.session.user.id);
          set({ user, isAuthenticated: true, error: null });
        } else {
          set({ user: null, isAuthenticated: false });
        }

        if (!listenerRegistered) {
          listenerRegistered = true;
          supabase.auth.onAuthStateChange(async (_event, session) => {
            if (!session?.user) {
              set({ user: null, isAuthenticated: false });
              return;
            }
            try {
              const user = await loadProfile(session.user.id);
              set({ user, isAuthenticated: true, error: null });
            } catch (error: unknown) {
              const message = error instanceof Error ? error.message : '账号权限读取失败';
              set({ user: null, isAuthenticated: false, error: message });
            }
          });
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : '认证服务初始化失败';
        set({ user: null, isAuthenticated: false, error: message });
      } finally {
        set({ isInitialized: true });
        initializationPromise = null;
      }
    })();

    return initializationPromise;
  },
}));
