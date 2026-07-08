# ipack-admin Vercel 部署指南

## 快速部署步骤

### 1. 确保代码已推送到 GitHub

```bash
# 验证 Git 远程
git remote -v

# 如果尚未推送，执行以下命令
git push -u origin main
```

### 2. 在 Vercel 导入项目

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "Add New..." → "Project"
3. 选择 GitHub 账户和 `ipack-admin` 仓库
4. 点击 "Import"

### 3. 配置环境变量

在 Vercel 项目设置中，添加以下环境变量：

```
NEXT_PUBLIC_API_URL = https://ipack-admin.vercel.app
JWT_SECRET = ipack-super-secret-key-2026-change-in-production
JWT_REFRESH_SECRET = ipack-refresh-secret-key-2026-change-in-production
```

### 4. 部署

点击 "Deploy" 按钮。Vercel 将自动：
- 检测 Next.js 项目
- 安装依赖 (`npm install`)
- 构建项目 (`npm run build`)
- 部署到生产环境

### 5. 验证部署

- 访问分配的 Vercel URL（例如 `https://ipack-admin.vercel.app`）
- 使用演示账号登录：
  - 邮箱: `admin@ipackauto.com`
  - 密码: `demo123`
- 验证登录成功并跳转到仪表板

## 预期的部署 URL

生产环境：`https://ipack-admin.vercel.app`
自定义域名（可选）：`admin.ipackautoparts.com`

## 本地开发命令

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start

# 类型检查
npm run type-check

# 代码质量检查
npm run lint
```

## 故障排除

### 部署失败？

1. **检查构建日志**：查看 Vercel 项目的 "Deployments" 选项卡
2. **验证环境变量**：确保所有必需的环境变量已设置
3. **检查 Node.js 版本**：Vercel 默认使用 Node.js 18+，但可在项目设置中配置

### 登录页面显示 404？

确保 `.env.local` 中的 `NEXT_PUBLIC_API_URL` 指向正确的域名。

### 刷新页面后用户状态丢失？

这是预期行为（当前为演示）。生产环境应使用：
- 数据库保存用户会话
- HTTP-only Cookie 存储令牌
- 令牌刷新逻辑

## 下一步

1. **集成真实数据库**（Supabase PostgreSQL）
2. **实现真实认证**（替换 mock 用户数据）
3. **添加权限检查中间件**
4. **实现产品管理模块**（Phase 2）
5. **实现内容管理模块**（Phase 3）

## 支持

如有问题，请检查：
- [Next.js 文档](https://nextjs.org/docs)
- [Vercel 文档](https://vercel.com/docs)
- [TypeScript 文档](https://www.typescriptlang.org/docs/)
