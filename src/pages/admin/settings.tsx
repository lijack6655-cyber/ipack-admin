import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/lib/auth/store';
import AdminLayout from '@/components/layout/AdminLayout';
import { withAuth } from '@/components/auth/withAuth';
import { User as UserIcon, Bell, Globe, Save } from 'lucide-react';

function SettingsPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [notifyInquiry, setNotifyInquiry] = useState(true);
  const [notifyWeeklyReport, setNotifyWeeklyReport] = useState(true);
  const [siteName, setSiteName] = useState('I-PACK Auto Parts');
  const [siteUrl] = useState('https://www.ipackautoparts.com');
  const [saved, setSaved] = useState(false);

  const handleLogout = async () => { await logout(); router.push('/login'); };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!user) return null;

  return (
    <AdminLayout user={user} onLogout={handleLogout}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">设置</h1>
        <p className="text-sm text-slate-500 mt-1">管理个人资料、通知偏好与站点基础信息</p>
      </div>

      <div className="mb-6 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
        当前设置仅保存在本次会话中，用于展示交互形态；尚未接入后端持久化存储。
      </div>

      <div className="space-y-6 max-w-2xl">
        {/* 个人资料 */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <UserIcon className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-900">个人资料</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">名</label>
              <input
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">姓</label>
              <input
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">邮箱</label>
              <input
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-500"
                value={user.email}
                disabled
              />
            </div>
          </div>
        </div>

        {/* 通知偏好 */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-900">通知偏好</h2>
          </div>
          <div className="space-y-3">
            <label className="flex items-center justify-between text-sm">
              <span className="text-slate-700">有新询盘时邮件通知</span>
              <input
                type="checkbox"
                checked={notifyInquiry}
                onChange={(e) => setNotifyInquiry(e.target.checked)}
                className="w-4 h-4 accent-blue-600"
              />
            </label>
            <label className="flex items-center justify-between text-sm">
              <span className="text-slate-700">每周数据摘要邮件</span>
              <input
                type="checkbox"
                checked={notifyWeeklyReport}
                onChange={(e) => setNotifyWeeklyReport(e.target.checked)}
                className="w-4 h-4 accent-blue-600"
              />
            </label>
          </div>
        </div>

        {/* 站点信息 */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-900">站点信息</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">站点名称</label>
              <input
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">站点地址</label>
              <input
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-500"
                value={siteUrl}
                disabled
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Save className="w-4 h-4" /> 保存设置
          </button>
          {saved && <span className="text-sm text-green-600">已保存（仅本次会话有效）</span>}
        </div>
      </div>
    </AdminLayout>
  );
}

export default withAuth(SettingsPage);
