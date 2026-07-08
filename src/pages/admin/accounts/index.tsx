import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/lib/auth/store';
import AdminLayout from '@/components/layout/AdminLayout';
import { withAuth } from '@/components/auth/withAuth';
import { Plus, Edit2, Shield, UserCheck, UserX, Search } from 'lucide-react';

type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
type RoleName = 'SUPER_ADMIN' | 'PRODUCT_MANAGER' | 'EDITOR' | 'SOCIAL_ADMIN' | 'VIEWER';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: RoleName;
  department: string;
  status: UserStatus;
  lastLogin: string;
  joinedAt: string;
}

const MOCK_MEMBERS: TeamMember[] = [
  { id: '1', name: 'Super Admin', email: 'admin@ipackauto.com', role: 'SUPER_ADMIN', department: '管理层', status: 'ACTIVE', lastLogin: '2026-07-08 09:30', joinedAt: '2026-01-01' },
  { id: '2', name: '李工', email: 'li.gong@ipackauto.com', role: 'PRODUCT_MANAGER', department: '产品部', status: 'ACTIVE', lastLogin: '2026-07-08 08:15', joinedAt: '2026-02-10' },
  { id: '3', name: '王工', email: 'wang.gong@ipackauto.com', role: 'EDITOR', department: '内容部', status: 'ACTIVE', lastLogin: '2026-07-07 17:45', joinedAt: '2026-03-05' },
  { id: '4', name: '编辑A', email: 'editor.a@ipackauto.com', role: 'EDITOR', department: '内容部', status: 'ACTIVE', lastLogin: '2026-07-07 14:20', joinedAt: '2026-04-01' },
  { id: '5', name: '编辑B', email: 'editor.b@ipackauto.com', role: 'SOCIAL_ADMIN', department: '市场部', status: 'INACTIVE', lastLogin: '2026-06-30 10:00', joinedAt: '2026-05-15' },
];

const ROLE_INFO: Record<RoleName, { label: string; cls: string; desc: string }> = {
  SUPER_ADMIN:     { label: '超级管理员', cls: 'bg-purple-100 text-purple-700', desc: '全部权限' },
  PRODUCT_MANAGER: { label: '产品经理',   cls: 'bg-blue-100 text-blue-700',   desc: '管理产品' },
  EDITOR:          { label: '编辑',       cls: 'bg-green-100 text-green-700', desc: '发布内容' },
  SOCIAL_ADMIN:    { label: '社媒管理员', cls: 'bg-orange-100 text-orange-700', desc: '社媒运营' },
  VIEWER:          { label: '只读',       cls: 'bg-slate-100 text-slate-500', desc: '仅查看' },
};

const STATUS_INFO: Record<UserStatus, { label: string; cls: string }> = {
  ACTIVE:    { label: '活跃',   cls: 'bg-green-100 text-green-700' },
  INACTIVE:  { label: '未激活', cls: 'bg-yellow-100 text-yellow-700' },
  SUSPENDED: { label: '已暂停', cls: 'bg-red-100 text-red-600' },
};

function AccountsPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [members, setMembers] = useState(MOCK_MEMBERS);
  const [search, setSearch] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<RoleName>('EDITOR');

  const handleLogout = async () => { await logout(); router.push('/login'); };

  const filtered = members.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase())
  );

  const toggleStatus = (id: string) => {
    setMembers((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, status: m.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' }
          : m
      )
    );
  };

  const handleInvite = () => {
    if (!inviteEmail.trim()) return;
    const newMember: TeamMember = {
      id: String(Date.now()),
      name: inviteEmail.split('@')[0],
      email: inviteEmail,
      role: inviteRole,
      department: '-',
      status: 'INACTIVE',
      lastLogin: '-',
      joinedAt: new Date().toISOString().split('T')[0],
    };
    setMembers((prev) => [...prev, newMember]);
    setInviteEmail('');
    setShowInvite(false);
  };

  if (!user) return null;

  return (
    <AdminLayout user={user} onLogout={handleLogout}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">账号管理</h1>
          <p className="text-sm text-slate-500 mt-1">共 {members.length} 名团队成员</p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> 邀请成员
        </button>
      </div>

      {/* 邀请弹窗 */}
      {showInvite && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-3">邀请新成员</h3>
          <div className="flex gap-3 flex-wrap">
            <input
              type="email"
              className="flex-1 min-w-48 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="输入邮箱地址..."
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
            <select
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as RoleName)}
            >
              {(Object.keys(ROLE_INFO) as RoleName[]).map((r) => (
                <option key={r} value={r}>{ROLE_INFO[r].label}</option>
              ))}
            </select>
            <button
              onClick={handleInvite}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              发送邀请
            </button>
            <button
              onClick={() => setShowInvite(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 角色说明 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {(Object.entries(ROLE_INFO) as [RoleName, typeof ROLE_INFO[RoleName]][]).map(([key, info]) => (
          <div key={key} className="bg-white rounded-lg border border-slate-200 p-3 text-center">
            <Shield className="w-4 h-4 mx-auto mb-1 text-slate-400" />
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${info.cls}`}>{info.label}</span>
            <p className="text-xs text-slate-400 mt-1">{info.desc}</p>
            <p className="text-sm font-bold text-slate-700 mt-1">
              {members.filter((m) => m.role === key).length}
            </p>
          </div>
        ))}
      </div>

      {/* 搜索 */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="搜索姓名或邮箱..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* 成员列表 */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">成员</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">角色</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">部门</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">状态</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">最近登录</th>
              <th className="text-right px-4 py-3 font-medium text-slate-600">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((member) => (
              <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{member.name}</p>
                      <p className="text-xs text-slate-400">{member.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_INFO[member.role].cls}`}>
                    {ROLE_INFO[member.role].label}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">{member.department}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_INFO[member.status].cls}`}>
                    {STATUS_INFO[member.status].label}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-400">{member.lastLogin}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded transition-colors"
                      title="编辑角色"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {member.id !== '1' && (
                      <button
                        onClick={() => toggleStatus(member.id)}
                        className={`p-1.5 rounded transition-colors ${
                          member.status === 'ACTIVE'
                            ? 'hover:bg-red-50 text-slate-400 hover:text-red-600'
                            : 'hover:bg-green-50 text-slate-400 hover:text-green-600'
                        }`}
                        title={member.status === 'ACTIVE' ? '暂停账号' : '激活账号'}
                      >
                        {member.status === 'ACTIVE' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}

export default withAuth(AccountsPage);
