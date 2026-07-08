import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { User } from '@/types';
import {
  Menu, X, LogOut, Users, Package, FileText,
  Share2, BarChart3, Settings, Home, ChevronDown, ChevronRight,
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
}

const menuItems = [
  {
    key: 'dashboard',
    label: '仪表板',
    icon: Home,
    href: '/dashboard',
  },
  {
    key: 'product',
    label: '产品管理',
    icon: Package,
    submenu: [
      { label: '产品列表', href: '/admin/products' },
      { label: '新建产品', href: '/admin/products/new' },
      { label: '分类管理', href: '/admin/categories' },
    ],
  },
  {
    key: 'content',
    label: '内容管理',
    icon: FileText,
    submenu: [
      { label: '文章列表', href: '/admin/content/articles' },
      { label: '新建文章', href: '/admin/content/articles/new' },
    ],
  },
  {
    key: 'social',
    label: '社媒管理',
    icon: Share2,
    submenu: [
      { label: '发布日历', href: '/admin/social/calendar' },
      { label: '草稿箱', href: '/admin/social/drafts' },
    ],
  },
  {
    key: 'analytics',
    label: '数据分析',
    icon: BarChart3,
    submenu: [
      { label: '流量分析', href: '/admin/analytics/traffic' },
      { label: 'GSC 数据', href: '/admin/analytics/gsc' },
    ],
  },
  {
    key: 'accounts',
    label: '账号管理',
    icon: Users,
    href: '/admin/accounts',
  },
];

export default function AdminLayout({ children, user, onLogout }: AdminLayoutProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // 根据当前路径自动展开对应父菜单
  const getInitialExpanded = () => {
    return menuItems
      .filter((item) => item.submenu?.some((sub) => router.pathname.startsWith(sub.href)))
      .map((item) => item.key);
  };

  const [expandedMenus, setExpandedMenus] = useState<string[]>(getInitialExpanded);

  const toggleMenu = (key: string) => {
    setExpandedMenus((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const isActive = (href: string) => router.pathname === href;
  const isParentActive = (submenu: { href: string }[]) =>
    submenu.some((s) => router.pathname.startsWith(s.href));

  // 面包屑生成
  const breadcrumbs = (() => {
    const crumbs: { label: string; href?: string }[] = [{ label: '首页', href: '/dashboard' }];
    for (const item of menuItems) {
      if (item.href && router.pathname === item.href && item.href !== '/dashboard') {
        crumbs.push({ label: item.label });
      }
      if (item.submenu) {
        const matched = item.submenu.find((s) => router.pathname.startsWith(s.href));
        if (matched) {
          crumbs.push({ label: item.label });
          crumbs.push({ label: matched.label });
        }
      }
    }
    return crumbs;
  })();

  return (
    <div className="flex h-screen bg-slate-50">
      {/* 侧边栏 */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 bg-slate-900 text-white transition-all duration-300 flex flex-col ${
          sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'
        }`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-slate-800 flex-shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-xs font-bold">
              IP
            </div>
            <span className="text-lg">iPackAdmin</span>
          </Link>
        </div>

        {/* 菜单 */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {menuItems.map((item) => (
            <div key={item.key}>
              {item.submenu ? (
                <>
                  <button
                    onClick={() => toggleMenu(item.key)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                      isParentActive(item.submenu)
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        expandedMenus.includes(item.key) ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {expandedMenus.includes(item.key) && (
                    <div className="ml-4 mt-1 space-y-1 border-l border-slate-700 pl-3">
                      {item.submenu.map((sub) => (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                            isActive(sub.href)
                              ? 'bg-slate-700 text-white'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800'
                          }`}
                        >
                          <ChevronRight className="w-3 h-3" />
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={item.href || '#'}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.href || '')
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              )}
            </div>
          ))}
        </nav>

        {/* 用户操作区 */}
        <div className="p-3 border-t border-slate-800 space-y-1 flex-shrink-0">
          <Link
            href="/admin/settings"
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors text-sm text-slate-300"
          >
            <Settings className="w-4 h-4" />
            <span>设置</span>
          </Link>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm text-slate-300 hover:text-white"
          >
            <LogOut className="w-4 h-4" />
            <span>登出</span>
          </button>
        </div>
      </aside>

      {/* 主内容区 */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          sidebarOpen ? 'ml-64' : 'ml-0'
        }`}
      >
        {/* 顶部栏 */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-30 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5 text-slate-600" /> : <Menu className="w-5 h-5 text-slate-600" />}
            </button>
            {/* 面包屑 */}
            <nav className="flex items-center gap-1 text-sm text-slate-500">
              {breadcrumbs.map((crumb, i) => (
                <span key={i} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight className="w-3 h-3" />}
                  {crumb.href && i < breadcrumbs.length - 1 ? (
                    <Link href={crumb.href} className="hover:text-slate-900 transition-colors">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className={i === breadcrumbs.length - 1 ? 'text-slate-900 font-medium' : ''}>
                      {crumb.label}
                    </span>
                  )}
                </span>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {user.firstName?.charAt(0)}
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-xs font-medium text-slate-900">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-slate-500">
                {user.role?.name === 'SUPER_ADMIN' ? '超级管理员' : '编辑'}
              </p>
            </div>
          </div>
        </header>

        {/* 页面内容 */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
