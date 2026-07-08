import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/lib/auth/store';
import '@/styles/globals.css';

const protectedRoutes = ['/dashboard', '/admin'];

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const { isAuthenticated, isInitialized, initializeFromStorage } = useAuthStore();

  useEffect(() => {
    // 首次初始化时从 localStorage 恢复认证状态
    initializeFromStorage();
  }, [initializeFromStorage]);

  useEffect(() => {
    if (!isInitialized) return;

    // 路由守卫：保护需要认证的页面
    const isProtectedRoute = protectedRoutes.some((route) =>
      router.pathname.startsWith(route)
    );

    if (isProtectedRoute && !isAuthenticated) {
      router.push('/login');
    } else if (router.pathname === '/login' && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isInitialized, isAuthenticated, router.pathname, router]);

  return <Component {...pageProps} />;
}
