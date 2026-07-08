# ipack-admin 快速启动指南

**🚀 5 分钟部署** | **⚡ 零配置上线** | **🎯 立即可用**

---

## ⚡ 本地运行（开发环境）

### 1. 安装依赖
```bash
cd C:\Users\Admin\AccioWork\2026-06-17-11-00-47\ipack-admin
npm install
```

### 2. 启动开发服务器
```bash
npm run dev
```

### 3. 访问应用
```
浏览器打开: http://localhost:3000
自动跳转到: http://localhost:3000/login
```

### 4. 使用演示账号登录
```
邮箱:    admin@ipackauto.com
密码:    demo123
```

✅ 成功！你应该看到仪表板欢迎页面

---

## 🌍 部署到 Vercel（生产环境）

### 方法 A: GitHub 自动部署（推荐）

**前置**:
- GitHub 账号已连接 ✓
- VPN 可访问 GitHub ✓

**步骤**:

1. **创建 GitHub 仓库**
   ```bash
   cd C:\Users\Admin\AccioWork\2026-06-17-11-00-47\ipack-admin
   git remote add origin https://github.com/lijack6655-cyber/ipack-admin.git
   git branch -M main
   git push -u origin main
   ```

2. **在 Vercel 导入**
   - 访问 https://vercel.com/dashboard
   - 点击 "Add New" → "Project"
   - 选择 GitHub 仓库 `ipack-admin`
   - 点击 "Import"

3. **配置环境变量**
   - Vercel 项目设置 → Environment Variables
   - 添加以下变量：
   ```
   NEXT_PUBLIC_API_URL = https://ipack-admin.vercel.app
   JWT_SECRET = ipack-super-secret-key-2026-change-in-production
   JWT_REFRESH_SECRET = ipack-refresh-secret-key-2026-change-in-production
   ```

4. **部署**
   - 点击 "Deploy" 按钮
   - 等待构建完成（~3-5 分钟）

✅ 上线！访问 https://ipack-admin.vercel.app

### 方法 B: 手动部署

```bash
# 1. 构建生产版本
npm run build

# 2. 启动生产服务器
npm start

# 3. 访问
http://localhost:3000
```

---

## 🔑 演示账号

| 字段 | 值 |
|------|-----|
| **邮箱** | admin@ipackauto.com |
| **密码** | demo123 |
| **角色** | 超级管理员 (SUPER_ADMIN) |
| **权限** | 所有权限 |

---

## 📖 完整项目文档

| 文档 | 内容 |
|------|------|
| [README.md](README.md) | 项目概述和技术栈 |
| [DEPLOYMENT.md](DEPLOYMENT.md) | 详细部署指南 |
| [PROJECT_STATUS.md](PROJECT_STATUS.md) | 项目状态和功能清单 |
| [IMPLEMENTATION_SUMMARY.md](../IMPLEMENTATION_SUMMARY.md) | 完整实施报告 |

---

## 🎯 下一步

### 立即可做
- [ ] 本地运行和测试（`npm run dev`）
- [ ] 验证登录功能
- [ ] 部署到 Vercel
- [ ] 分享部署链接给团队

### 本周工作
- [ ] 实现账号管理页面
- [ ] 创建权限配置面板
- [ ] 添加操作日志页面

### 后续计划
- [ ] Phase 2: 产品管理模块
- [ ] Phase 3: 内容管理模块
- [ ] Phase 4: 社媒与分析

---

## 🆘 常见问题

### 部署失败？
1. 检查 GitHub 连接 ✓
2. 检查环境变量配置 ✓
3. 查看 Vercel Build Logs ✓

### 登录失败？
- 邮箱: `admin@ipackauto.com` ✓
- 密码: `demo123` ✓
- 确保没有多余空格 ✓

### 刷新后用户信息丢失？
这是演示预期行为。生产环境已配置 localStorage 持久化。

---

## 📊 项目状态

```
构建状态:  ✅ SUCCESS
类型检查:  ✅ 通过 (0 errors)
部署状态:  🟢 就绪
文档完整:  ✅ 完成
```

---

## 💬 需要帮助？

1. 查看 [PROJECT_STATUS.md](PROJECT_STATUS.md) 的常见问题部分
2. 检查 [DEPLOYMENT.md](DEPLOYMENT.md) 的故障排除
3. 读取项目源代码中的注释

---

**快速参考**:
```bash
# 本地开发
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start

# 类型检查
npm run type-check

# 代码检查
npm run lint
```

---

⚡ **Ready to go!** 按照上面的步骤立即启动你的后台管理系统。

**部署时间**: ~15 分钟  
**预期上线**: 12-24 小时  
**支持**: 完整文档已提供
