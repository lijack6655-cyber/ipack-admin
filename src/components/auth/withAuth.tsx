import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/lib/auth/store';
import Link from 'next/link';
import { canAccessPath } from '@/lib/auth/permissions';

export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    const router = useRouter();
    const { user, isAuthenticated, isInitialized, initializeFromStorage } = useAuthStore();

    useEffect(() => {
      initializeFromStorage();
    }, [initializeFromStorage]);

    useEffect(() => {
      if (isInitialized && !isAuthenticated) {
        router.replace('/login');
      }
    }, [isInitialized, isAuthenticated, router]);

    if (!isInitialized || !isAuthenticated) return null;
    if (!canAccessPath(user?.role?.name, router.pathname)) return <main className="p-8"><h1 className="text-xl font-bold">无权访问此页面</h1><p className="my-4">请使用已分配相应权限的内部账号。</p><Link href="/dashboard" className="text-blue-600">返回工作台</Link></main>;

    return <Component {...props} />;
  };
}
