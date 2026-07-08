import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/lib/auth/store';
import '@/styles/globals.css';

const protectedRoutes = ['/dashboard', '/admin'];

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      try {
        useAuthStore.setState({
          user: JSON.parse(storedUser),
          isAuthenticated: true,
          tokens: {
            accessToken: token,
            refreshToken: localStorage.getItem('refreshToken') || '',
            expiresIn: 3600,
          },
        });
      } catch (error) {
        console.error('Failed to restore auth state:', error);
        localStorage.clear();
      }
    }

    // 路由守卫：保护需要认证的页面
    const isProtectedRoute = protectedRoutes.some((route) =>
      router.pathname.startsWith(route)
    );

    if (isProtectedRoute && !token) {
      router.push('/login');
    }

    if (router.pathname === '/login' && token) {
      router.push('/dashboard');
    }
  }, [router]);

  return <Component {...pageProps} />;
}
