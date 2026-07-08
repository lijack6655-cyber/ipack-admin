# ipack-admin

> I-Pack 汽车配件后台管理系统

## 项目介绍

这是 ipackautoparts.com 的完整后台管理系统，提供产品管理、内容编辑、权限控制等功能。

## 技术栈

- **框架**: Next.js 14 + React 18
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **表单**: React Hook Form + Zod
- **状态管理**: Zustand
- **认证**: JWT + Refresh Token
- **数据库**: Supabase (PostgreSQL)
- **部署**: Vercel

## 快速开始

### 安装依赖

```bash
npm install
```

### 本地开发

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看结果。

**演示账号**:
- 邮箱: admin@ipackauto.com
- 密码: demo123

### 构建

```bash
npm run build
npm start
```

### 类型检查

```bash
npm run type-check
```

## 项目结构

```
src/
├── pages/           # Next.js 页面和 API 路由
│   ├── api/        # API 端点
│   ├── _app.tsx    # 全局应用包装
│   ├── _document.tsx
│   ├── login.tsx   # 登录页面
│   └── dashboard.tsx
├── components/     # React 组件
│   ├── layout/    # 布局组件
│   ├── auth/      # 认证相关组件
│   └── ui/        # UI 基础组件
├── lib/           # 工具库
│   ├── auth/      # 认证逻辑
│   └── api/       # API 客户端
├── types/         # TypeScript 类型定义
└── styles/        # 全局样式
```

## 功能模块

### Phase 1: 权限系统 ✓
- [x] 登录认证 (JWT + Refresh Token)
- [x] 权限管理 (RBAC)
- [x] 用户认证
- [ ] 账号管理界面
- [ ] 权限配置面板
- [ ] 操作日志审计
- [ ] 双因素认证 (2FA)

### Phase 2: 产品管理
- [ ] 产品列表
- [ ] 产品编辑
- [ ] OE 匹配管理
- [ ] 库存跟踪

### Phase 3: 内容管理
- [ ] 文章编辑
- [ ] 视频上传
- [ ] 媒体库管理
- [ ] 版本控制

### Phase 4: 社媒与分析
- [ ] 社交媒体管理
- [ ] 数据分析仪表板
- [ ] SEO/AEO 工具集成

## 环境变量

复制 `.env.local` 并填入实际值：

```
NEXT_PUBLIC_API_URL=http://localhost:3000
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
```

## 部署

### 部署到 Vercel

1. 推送到 GitHub
2. 在 Vercel 导入项目
3. 配置环境变量
4. 自动部署

## 贡献

请参考 CONTRIBUTING.md

## 许可证

MIT
