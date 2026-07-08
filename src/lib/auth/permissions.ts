import { RoleType, PermissionLevel, PermissionCategory, Permission, Role } from '@/types';

// 权限定义（真实场景中应从数据库加载）
export const PERMISSIONS: Record<string, Permission> = {
  // 账号管理权限
  'ACCOUNT_READ': {
    id: 'perm_account_read',
    name: 'ACCOUNT_READ',
    description: '查看账号信息',
    category: PermissionCategory.ACCOUNT,
    level: PermissionLevel.READ,
  },
  'ACCOUNT_WRITE': {
    id: 'perm_account_write',
    name: 'ACCOUNT_WRITE',
    description: '编辑账号信息',
    category: PermissionCategory.ACCOUNT,
    level: PermissionLevel.WRITE,
  },
  'ACCOUNT_INVITE': {
    id: 'perm_account_invite',
    name: 'ACCOUNT_INVITE',
    description: '邀请新成员',
    category: PermissionCategory.ACCOUNT,
    level: PermissionLevel.WRITE,
  },
  'PERMISSION_MANAGE': {
    id: 'perm_permission_manage',
    name: 'PERMISSION_MANAGE',
    description: '管理权限',
    category: PermissionCategory.ACCOUNT,
    level: PermissionLevel.ADMIN,
  },

  // 产品管理权限
  'PRODUCT_READ': {
    id: 'perm_product_read',
    name: 'PRODUCT_READ',
    description: '查看产品',
    category: PermissionCategory.PRODUCT,
    level: PermissionLevel.READ,
  },
  'PRODUCT_WRITE': {
    id: 'perm_product_write',
    name: 'PRODUCT_WRITE',
    description: '编辑产品',
    category: PermissionCategory.PRODUCT,
    level: PermissionLevel.WRITE,
  },
  'PRODUCT_PUBLISH': {
    id: 'perm_product_publish',
    name: 'PRODUCT_PUBLISH',
    description: '发布产品',
    category: PermissionCategory.PRODUCT,
    level: PermissionLevel.PUBLISH,
  },

  // 内容管理权限
  'CONTENT_READ': {
    id: 'perm_content_read',
    name: 'CONTENT_READ',
    description: '查看内容',
    category: PermissionCategory.CONTENT,
    level: PermissionLevel.READ,
  },
  'CONTENT_WRITE': {
    id: 'perm_content_write',
    name: 'CONTENT_WRITE',
    description: '编辑内容',
    category: PermissionCategory.CONTENT,
    level: PermissionLevel.WRITE,
  },
  'CONTENT_PUBLISH': {
    id: 'perm_content_publish',
    name: 'CONTENT_PUBLISH',
    description: '发布内容',
    category: PermissionCategory.CONTENT,
    level: PermissionLevel.PUBLISH,
  },

  // 社媒管理权限
  'SOCIAL_READ': {
    id: 'perm_social_read',
    name: 'SOCIAL_READ',
    description: '查看社媒',
    category: PermissionCategory.SOCIAL,
    level: PermissionLevel.READ,
  },
  'SOCIAL_WRITE': {
    id: 'perm_social_write',
    name: 'SOCIAL_WRITE',
    description: '编辑社媒',
    category: PermissionCategory.SOCIAL,
    level: PermissionLevel.WRITE,
  },
  'SOCIAL_PUBLISH': {
    id: 'perm_social_publish',
    name: 'SOCIAL_PUBLISH',
    description: '发布社媒',
    category: PermissionCategory.SOCIAL,
    level: PermissionLevel.PUBLISH,
  },

  // 分析权限
  'ANALYTICS_READ': {
    id: 'perm_analytics_read',
    name: 'ANALYTICS_READ',
    description: '查看数据分析',
    category: PermissionCategory.ANALYTICS,
    level: PermissionLevel.READ,
  },

  // 系统权限
  'SYSTEM_ADMIN': {
    id: 'perm_system_admin',
    name: 'SYSTEM_ADMIN',
    description: '系统管理员权限',
    category: PermissionCategory.SYSTEM,
    level: PermissionLevel.SYSTEM,
  },
  'AUDIT_LOG_READ': {
    id: 'perm_audit_log_read',
    name: 'AUDIT_LOG_READ',
    description: '查看审计日志',
    category: PermissionCategory.SYSTEM,
    level: PermissionLevel.READ,
  },
};

// 角色定义（真实场景中应从数据库加载）
export const ROLES: Record<RoleType, Role> = {
  [RoleType.SUPER_ADMIN]: {
    id: 'role_super_admin',
    name: RoleType.SUPER_ADMIN,
    description: '拥有系统所有权限',
    permissions: Object.values(PERMISSIONS),
    isCustom: false,
  },
  [RoleType.PRODUCT_MANAGER]: {
    id: 'role_product_manager',
    name: RoleType.PRODUCT_MANAGER,
    description: '产品管理权限',
    permissions: [
      PERMISSIONS['PRODUCT_READ'],
      PERMISSIONS['PRODUCT_WRITE'],
      PERMISSIONS['PRODUCT_PUBLISH'],
      PERMISSIONS['ANALYTICS_READ'],
    ],
    isCustom: false,
  },
  [RoleType.EDITOR]: {
    id: 'role_editor',
    name: RoleType.EDITOR,
    description: '内容编辑权限',
    permissions: [
      PERMISSIONS['CONTENT_READ'],
      PERMISSIONS['CONTENT_WRITE'],
      PERMISSIONS['CONTENT_PUBLISH'],
    ],
    isCustom: false,
  },
  [RoleType.SOCIAL_ADMIN]: {
    id: 'role_social_admin',
    name: RoleType.SOCIAL_ADMIN,
    description: '社交媒体管理',
    permissions: [
      PERMISSIONS['SOCIAL_READ'],
      PERMISSIONS['SOCIAL_WRITE'],
      PERMISSIONS['SOCIAL_PUBLISH'],
      PERMISSIONS['ANALYTICS_READ'],
    ],
    isCustom: false,
  },
  [RoleType.VIEWER]: {
    id: 'role_viewer',
    name: RoleType.VIEWER,
    description: '仅查看权限',
    permissions: [
      PERMISSIONS['PRODUCT_READ'],
      PERMISSIONS['CONTENT_READ'],
      PERMISSIONS['SOCIAL_READ'],
      PERMISSIONS['ANALYTICS_READ'],
    ],
    isCustom: false,
  },
};

// 检查用户是否有特定权限
export function hasPermission(
  userRole: RoleType | null | undefined,
  requiredPermission: string
): boolean {
  if (!userRole || !ROLES[userRole]) {
    return false;
  }

  const role = ROLES[userRole];
  return role.permissions.some((p) => p.name === requiredPermission);
}

// 获取角色的所有权限名称
export function getRolePermissions(roleType: RoleType): string[] {
  const role = ROLES[roleType];
  return role.permissions.map((p) => p.name);
}
