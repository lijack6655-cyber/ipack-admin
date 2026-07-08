import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/lib/auth/store';

export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    const router = useRouter();
    const { isAuthenticated, isInitialized, initializeFromStorage } = useAuthStore();

    useEffect(() => {
      initializeFromStorage();
    }, [initializeFromStorage]);

    useEffect(() => {
      if (isInitialized && !isAuthenticated) {
        router.replace('/login');
      }
    }, [isInitialized, isAuthenticated, router]);

    if (!isInitialized || !isAuthenticated) return null;

    return <Component {...props} />;
  };
}
