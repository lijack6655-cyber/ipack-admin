import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { LoginRequest, AuthResponse } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';

// 模拟用户数据库（Phase 1 使用）
const MOCK_USERS: Record<string, any> = {
  'admin@ipackauto.com': {
    id: 'user_001',
    email: 'admin@ipackauto.com',
    firstName: 'Super',
    lastName: 'Admin',
    password: '$2b$10$dXJ3d0t0c2k1LlFJUkxPcOu8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8', // 模拟 bcrypt hash
    roleId: 'role_001',
    role: {
      id: 'role_001',
      name: 'SUPER_ADMIN',
      description: '超级管理员',
      permissions: [],
      isCustom: false,
    },
    status: 'ACTIVE',
    createdAt: new Date('2026-01-01'),
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AuthResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: '方法不允许',
      error: 'Method Not Allowed',
    });
  }

  try {
    const { email, password, rememberMe } = req.body as LoginRequest;

    // 验证输入
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: '邮箱和密码必填',
        error: 'Missing required fields',
      });
    }

    // 查找用户
    const user = MOCK_USERS[email];
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '邮箱或密码错误',
        error: 'Invalid credentials',
      });
    }

    // Phase 1：跳过密码验证（仅用于演示，生产环境使用 bcrypt.compare）
    // 生产环境应该比较 bcrypt hash
    if (password !== 'demo123') {
      return res.status(401).json({
        success: false,
        message: '邮箱或密码错误',
        error: 'Invalid credentials',
      });
    }

    // 生成 JWT tokens
    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        roleId: user.roleId,
        type: 'access',
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      {
        userId: user.id,
        type: 'refresh',
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 返回成功响应
    res.status(200).json({
      success: true,
      message: '登录成功',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          status: user.status,
          roleId: user.roleId,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.createdAt,
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: 3600,
        },
      },
    });
  } catch (error: any) {
    console.error('[LOGIN_ERROR]', error);
    res.status(500).json({
      success: false,
      message: '登录失败，请稍后重试',
      error: error.message,
    });
  }
}
