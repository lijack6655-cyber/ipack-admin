import React, { useState } from 'react';
import Link from 'next/link';
import { User } from '@/types';
import {
  Menu,
  X,
  LogOut,
  Users,
  Package,
  FileText,
  Share2,
  BarChart3,
  Settings,
  Home,
  ChevronDown,
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
}

export default function AdminLayout({ children, user, onLogout }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['']);

  const toggleMenu = (key: string) => {
    setExpandedMenus((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

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
        { label: '视频管理', href: '/admin/content/videos' },
        { label: '媒体库', href: '/admin/content/media' },
      ],
    },
    {
      key: 'social',
      label: '社媒管理',
      icon: Share2,
      submenu: [
        { label: '发布日历', href: '/admin/social/calendar' },
        { label: '草稿箱', href: '/admin/social/drafts' },
        { label: '分析数据', href: '/admin/social/analytics' },
      ],
    },
    {
      key: 'analytics',
      label: '数据分析',
      icon: BarChart3,
      submenu: [
        { label: '流量分析', href: '/admin/analytics/traffic' },
        { label: 'GSC 数据', href: '/admin/analytics/gsc' },
        { label: '转化报表', href: '/admin/analytics/conversion' },
      ],
    },
    {
      key: 'accounts',
      label: '账号管理',
      icon: Users,
      href: '/admin/accounts',
    },
  ];

  const isRoleSuperAdmin = user.roleId === 'role_001';

  return (
    <div className="flex h-screen bg-slate-50">
      {/* 侧边栏 */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 bg-slate-900 text-white transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-0'
        }`}
      >
        <div className="h-full flex flex-col overflow-hidden">
          {/* Logo */}
          <div className="p-4 border-b border-slate-800">
            <Link href="/dashboard" className="flex items-center gap-2 font-bold">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                IP
              </div>
              <span className="text-lg">iPackAdmin</span>
            </Link>
          </div>

          {/* 菜单 */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {menuItems.map((item) => (
              <div key={item.key}>
                {item.submenu ? (
                  <>
                    <button
                      onClick={() => toggleMenu(item.key)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium"
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          expandedMenus.includes(item.key) ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {expandedMenus.includes(item.key) && (
                      <div className="ml-3 space-y-1 border-l border-slate-700 pl-3">
                        {item.submenu.map((subitem) => (
                          <Link
                            key={subitem.href}
                            href={subitem.href}
                            className="block px-3 py-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors text-sm"
                          >
                            {subitem.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href || '#'}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium"
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                )}
              </div>
            ))}
          </nav>

          {/* 用户菜单 */}
          <div className="p-4 border-t border-slate-800 space-y-2">
            <Link
              href="/admin/settings"
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors text-sm"
            >
              <Settings className="w-5 h-5" />
              <span>设置</span>
            </Link>
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm"
            >
              <LogOut className="w-5 h-5" />
              <span>登出</span>
            </button>
          </div>
        </div>
      </aside>

      {/* 主内容区 */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarOpen ? 'ml-64' : 'ml-0'
        }`}
      >
        {/* 顶部栏 */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {sidebarOpen ? (
              <X className="w-6 h-6 text-slate-700" />
            ) : (
              <Menu className="w-6 h-6 text-slate-700" />
            )}
          </button>

          <div className="flex items-center gap-4">
            {/* 用户信息 */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                {user.firstName?.charAt(0)}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-slate-900">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-slate-500">
                  {user.role?.name === 'SUPER_ADMIN' ? '超级管理员' : '编辑'}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* 主内容 */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
