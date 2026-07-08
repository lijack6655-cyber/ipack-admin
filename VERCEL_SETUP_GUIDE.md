# Vercel 部署完整指南

**预计部署时间**: 15-20 分钟  
**难度级别**: ⭐ 简单  
**前置条件**: GitHub 账号 + Vercel 账号

---

## 第 1 步: 验证 GitHub 仓库

### 确保代码已推送到 GitHub

```bash
# 检查远程仓库
git remote -v
# 输出应该显示:
# origin  https://github.com/lijack6655-cyber/ipack-admin.git (fetch)
# origin  https://github.com/lijack6655-cyber/ipack-admin.git (push)

# 检查提交历史
git log --oneline -5
# 应该显示 3 个提交

# 确保本地改动已提交
git status
# 应该显示: "working tree clean"
```

**GitHub 仓库 URL**: https://github.com/lijack6655-cyber/ipack-admin

---

## 第 2 步: 登录 Vercel 并导入项目

### 2.1 访问 Vercel Dashboard

1. 打开浏览器，访问: https://vercel.com/dashboard
2. 使用 GitHub 账号登录（如果还未登录）

### 2.2 导入项目

**方式 A: 通过 "Add New" 菜单（推荐）**

1. 在 Vercel Dashboard 主页，点击 **"Add New"** 按钮
   - 或点击右上角 **"Create"** 按钮
   
2. 选择 **"Project"** 选项

3. 在 "Import Git Repository" 页面：
   - 选择 GitHub 账户 (lijack6655)
   - 搜索框输入: `ipack-admin`
   - 在列表中找到: `lijack6655-cyber/ipack-admin`
   - 点击 **"Select"** 或直接点击该仓库

**方式 B: 直接导入链接**

访问: https://vercel.com/new?repo=lijack6655-cyber/ipack-admin

---

## 第 3 步: 配置项目设置

### 3.1 项目名称和其他信息

在 "Configure Project" 页面，确认以下设置：

| 字段 | 值 | 说明 |
|------|-----|------|
| **Project Name** | `ipack-admin` | 项目名称（可自定义） |
| **Framework Preset** | `Next.js` | 自动检测（会自动选中） |
| **Root Directory** | `.` | 根目录，保持默认 |

### 3.2 构建和输出设置

Vercel 会自动检测 Next.js 配置。以下字段应该已自动填充：

| 字段 | 值 | 说明 |
|------|-----|------|
| **Build Command** | `npm run build` | 构建命令 |
| **Output Directory** | `.next` | Next.js 输出目录 |
| **Install Command** | `npm install` | 安装命令 |

✅ **这些都会自动配置，通常无需修改**

---

## 第 4 步: 配置环境变量

### 关键步骤 ⚠️

在 "Environment Variables" 部分，添加以下 **3 个** 环境变量：

### 4.1 添加环境变量

点击 **"Environment Variables"** 部分展开

**变量 1: NEXT_PUBLIC_API_URL**
```
名称:   NEXT_PUBLIC_API_URL
值:     https://ipack-admin.vercel.app
作用:   所有环境
```

**变量 2: JWT_SECRET**
```
名称:   JWT_SECRET
值:     ipack-super-secret-key-2026-change-in-production-now
作用:   所有环境
```

> ⚠️ **安全提示**: 生产环境应该使用更强的密钥。这是演示密钥，部署后建议更换为强随机密钥。

**变量 3: JWT_REFRESH_SECRET**
```
名称:   JWT_REFRESH_SECRET
值:     ipack-refresh-secret-key-2026-change-in-production-now
作用:   所有环境
```

### 4.2 最终检查

确保三个环境变量都已添加：
- ✓ NEXT_PUBLIC_API_URL
- ✓ JWT_SECRET
- ✓ JWT_REFRESH_SECRET

---

## 第 5 步: 开始部署

### 5.1 点击部署按钮

完成所有配置后，点击页面右下方的 **"Deploy"** 按钮

### 5.2 部署进程

Vercel 会自动执行以下步骤（通常 3-5 分钟）：

```
📝 Step 1: Cloning repository from GitHub
✅ Repository cloned

📦 Step 2: Installing dependencies (npm install)
✅ Dependencies installed (415 packages)

🔨 Step 3: Building project (npm run build)
✅ Build successful
  - Compiled TypeScript
  - Generated pages
  - Optimized assets

🚀 Step 4: Deploying to Vercel Edge Network
✅ Deployment successful

🌐 Step 5: Assigning domain
✅ Domain assigned: https://ipack-admin.vercel.app
```

### 5.3 部署完成

部署完成后，你会看到：
- ✅ **Deployment Status**: SUCCESS
- 🌐 **Production URL**: https://ipack-admin.vercel.app
- 📊 **Build Logs**: 可查看完整的构建日志

---

## 第 6 步: 验证部署

### 6.1 访问应用

在浏览器中打开部署 URL：

```
https://ipack-admin.vercel.app
```

### 6.2 测试登录

使用演示账号登录：

| 字段 | 值 |
|------|-----|
| 邮箱 | `admin@ipackauto.com` |
| 密码 | `demo123` |

**预期结果**:
- ✅ 登录表单可正常加载
- ✅ 输入邮箱和密码
- ✅ 点击登录后跳转到仪表板
- ✅ 显示欢迎信息和统计卡片

### 6.3 页面性能检查

使用 Vercel Analytics（自动启用）：

1. 在 Vercel Dashboard 中，选择部署的项目
2. 点击 "Analytics" 标签
3. 查看：
   - 页面加载时间
   - Core Web Vitals
   - 地理位置分布

---

## 第 7 步: 配置自定义域名（可选）

### 7.1 添加自定义域名

如果要使用 `admin.ipackautoparts.com`：

1. 在 Vercel 项目设置中，点击 "Domains"
2. 点击 "Add" 按钮
3. 输入: `admin.ipackautoparts.com`
4. 按照指引配置 DNS 记录

> 需要 ipackautoparts.com 的 DNS 控制权

### 7.2 DNS 配置（示例）

```
记录类型:  CNAME
名称:     admin
值:       cname.vercel-dns.com
TTL:      3600
```

---

## 第 8 步: 持续集成和自动部署

### 自动更新

配置完成后，每当你推送代码到 GitHub `main` 分支时，Vercel 会自动：

1. ✅ 检测新推送
2. ✅ 拉取代码
3. ✅ 运行构建测试
4. ✅ 部署到生产环境

**管理自动部署**:
- Vercel Dashboard → 项目设置 → "Git"
- 可配置自动部署规则

---

## 故障排除

### ❌ 部署失败

**检查清单**:

1. **构建日志**
   - Vercel Dashboard → "Deployments" → 失败的部署
   - 查看 "Build Logs" 找出错误

2. **常见原因**:
   - 环境变量未配置 → 检查步骤 4
   - Node.js 版本不兼容 → 检查 package.json 中的 engines 字段
   - 依赖冲突 → 尝试清除 node_modules 本地重新运行

3. **解决方案**:
   ```bash
   # 本地验证
   npm install
   npm run build
   npm start
   
   # 如果本地可运行，再推送到 GitHub
   git push origin main
   ```

### ❌ 登录失败

**检查**:
- 邮箱: `admin@ipackauto.com` （检查是否有空格）
- 密码: `demo123` （检查是否有空格）
- 浏览器缓存: 清除缓存后重试

### ❌ 页面加载慢

**可能原因**:
- 首次冷启动（无服务器函数预热）
- 地理位置较远 → Vercel 会自动使用最近的 CDN 边缘节点

**优化**:
- 后续访问会快速（~100-500ms）
- Vercel Edge Functions 会自动缓存

### ❌ 环境变量未生效

**解决**:
1. Vercel Dashboard → 项目 → "Settings"
2. 点击 "Environment Variables"
3. 确认所有 3 个变量都已添加
4. 重新部署：点击最近的部署 → 右上角 "Redeploy"

---

## 部署后检查清单

- [ ] Vercel Dashboard 显示 "Production" 部署成功
- [ ] 访问 https://ipack-admin.vercel.app 可访问
- [ ] 使用演示账号可正常登录
- [ ] 仪表板显示正确的欢迎信息
- [ ] 导航菜单可展开/折叠
- [ ] 响应式设计在手机上正常显示
- [ ] 浏览器控制台无错误

---

## 部署后下一步

### 立即可做
1. **分享链接给团队**: https://ipack-admin.vercel.app
2. **配置 GitHub 分支保护**: 防止意外修改 main 分支
3. **设置 Vercel 通知**: 部署成功/失败时收到通知

### 本周工作
1. **收集团队反馈**: 是否需要调整界面
2. **集成真实数据库**: 连接 Supabase
3. **启动 Phase 2**: 产品管理模块

### 长期规划
1. **自定义域名**: 配置 admin.ipackautoparts.com
2. **性能优化**: 监控 Web Vitals
3. **安全加固**: 实现 2FA、审计日志存储

---

## 常用 Vercel 链接

| 功能 | 链接 |
|------|------|
| 主 Dashboard | https://vercel.com/dashboard |
| 项目设置 | https://vercel.com/dashboard/ipack-admin/settings |
| 部署历史 | https://vercel.com/dashboard/ipack-admin/deployments |
| 环境变量 | https://vercel.com/dashboard/ipack-admin/settings/environment-variables |
| 域名管理 | https://vercel.com/dashboard/ipack-admin/settings/domains |
| Analytics | https://vercel.com/dashboard/ipack-admin/analytics |

---

## 支持和文档

- **Vercel 官方文档**: https://vercel.com/docs
- **Next.js 文档**: https://nextjs.org/docs
- **本项目文档**: 
  - QUICK_START.md - 快速启动
  - PROJECT_STATUS.md - 项目状态
  - DEPLOYMENT.md - 部署指南

---

## 部署完成！ 🎉

按照以上步骤，你的 ipack-admin 后台管理系统应该已经成功部署到 Vercel。

**预期结果**:
- ✅ 生产 URL: https://ipack-admin.vercel.app
- ✅ 自动 HTTPS
- ✅ 全球 CDN 加速
- ✅ 自动部署更新

**下一步**: 分享这个链接给团队，收集反馈，为 Phase 2 做准备！

---

*有任何问题，请查看故障排除部分或联系 Vercel 支持团队*
