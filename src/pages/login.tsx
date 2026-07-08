import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '@/lib/auth/store';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, isAuthenticated, isInitialized, initializeFromStorage } = useAuthStore();
  const { register, handleSubmit, formState: { errors }, watch } = useForm<LoginFormData>({
    defaultValues: {
      email: 'admin@ipackauto.com',
      password: 'demo123',
      rememberMe: false,
    },
  });

  const [showPassword, setShowPassword] = useState(false);
  const password = watch('password');

  useEffect(() => {
    initializeFromStorage();
  }, [initializeFromStorage]);

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isInitialized, isAuthenticated, router]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password, data.rememberMe);
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-md">
        {/* 登录卡片 */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Logo & 标题 */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">
              iPackAutoparts
            </h1>
            <p className="text-slate-600">Admin Center</p>
            <p className="text-xs text-slate-500 mt-2">后台管理系统 v1.0</p>
          </div>

          {/* 错误信息 */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* 登录表单 */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* 邮箱字段 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                邮箱地址
              </label>
              <input
                type="email"
                placeholder="admin@ipackauto.com"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                  errors.email
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-slate-300 focus:ring-blue-500'
                }`}
                {...register('email', {
                  required: '邮箱必填',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: '邮箱格式不正确',
                  },
                })}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* 密码字段 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                密码
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors pr-10 ${
                    errors.password
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-slate-300 focus:ring-blue-500'
                  }`}
                  {...register('password', {
                    required: '密码必填',
                    minLength: { value: 6, message: '密码至少6位' },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-900"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* 记住我 */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                {...register('rememberMe')}
              />
              <span className="text-sm text-slate-700">记住我 (30天内)</span>
            </label>

            {/* 登录按钮 */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '登录中...' : '立即登录'}
            </button>
          </form>

          {/* 分隔线 */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white text-slate-500">或</span>
            </div>
          </div>

          {/* 底部链接 */}
          <div className="space-y-2 text-center text-sm">
            <button className="text-blue-600 hover:text-blue-700 font-medium">
              忘记密码？
            </button>
            <p className="text-slate-600">
              还没有账号？{' '}
              <button className="text-blue-600 hover:text-blue-700 font-medium">
                联系管理员申请
              </button>
            </p>
          </div>
        </div>

        {/* 页脚 */}
        <div className="text-center text-xs text-slate-600 mt-6">
          <p>© 2026 iPackAutoparts | 隐私政策 | 服务条款</p>
        </div>

        {/* 演示提示 */}
        <div className="mt-4 p-4 bg-blue-50 rounded-lg text-center">
          <p className="text-xs text-slate-700">
            <strong>演示账号：</strong> admin@ipackauto.com / demo123
          </p>
        </div>
      </div>
    </div>
  );
}
