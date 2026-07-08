// 权限系统核心类型定义

export enum RoleType {
  SUPER_ADMIN = 'SUPER_ADMIN',
  PRODUCT_MANAGER = 'PRODUCT_MANAGER',
  EDITOR = 'EDITOR',
  SOCIAL_ADMIN = 'SOCIAL_ADMIN',
  VIEWER = 'VIEWER',
}

export enum PermissionLevel {
  READ = 'READ',
  WRITE = 'WRITE',
  PUBLISH = 'PUBLISH',
  ADMIN = 'ADMIN',
  SYSTEM = 'SYSTEM',
}

export enum PermissionCategory {
  ACCOUNT = 'ACCOUNT',
  PRODUCT = 'PRODUCT',
  CONTENT = 'CONTENT',
  SOCIAL = 'SOCIAL',
  ANALYTICS = 'ANALYTICS',
  SYSTEM = 'SYSTEM',
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: PermissionCategory;
  level: PermissionLevel;
}

export interface Role {
  id: string;
  name: RoleType;
  description: string;
  permissions: Permission[];
  isCustom: boolean;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  roleId: string;
  role?: Role;
  department?: string;
  jobTitle?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: Omit<User, 'password'>;
    tokens: AuthToken;
  };
  error?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resourceType: 'PRODUCT' | 'ARTICLE' | 'VIDEO' | 'USER' | 'ROLE';
  resourceId: string;
  oldValue?: Record<string, any>;
  newValue?: Record<string, any>;
  ipAddress: string;
  status: 'SUCCESS' | 'FAILURE';
  errorMessage?: string;
  createdAt: Date;
}
