# ✅ Vercel 部署核对清单

**部署日期**: _______________  
**部署者**: _______________  
**部署链接**: https://ipack-admin.vercel.app

---

## 📋 部署前检查

### Git 和代码
- [ ] 所有改动已 commit
- [ ] 本地 `git status` 显示 "working tree clean"
- [ ] 所有提交已 push 到 GitHub 的 `main` 分支
- [ ] GitHub 仓库: https://github.com/lijack6655-cyber/ipack-admin
- [ ] 项目有 `package.json` 和 `next.config.js`

### 本地验证
- [ ] 本地 `npm install` 成功
- [ ] 本地 `npm run build` 成功
- [ ] 本地 `npm run type-check` 无错误
- [ ] 没有 `node_modules` 等大文件未忽略（检查 `.gitignore`）

### 环境配置
- [ ] `.env.local` 文件已创建（本地开发用）
- [ ] 环境变量已列在 `VERCEL_SETUP_GUIDE.md` 中
- [ ] 没有将 `.env.local` 推送到 GitHub（检查 `.gitignore`）

---

## 🚀 Vercel 部署步骤

### Step 1: 登录 Vercel
- [ ] 访问 https://vercel.com/dashboard
- [ ] 用 GitHub 账号登录
- [ ] 确认登录账户是 `lijack6655`

### Step 2: 导入项目
- [ ] 点击 "Add New" → "Project"
- [ ] 选择 GitHub 账户
- [ ] 搜索并选择 `ipack-admin` 仓库
- [ ] 点击 "Select"

### Step 3: 配置项目设置
- [ ] **Project Name**: `ipack-admin` （或自定义）
- [ ] **Framework Preset**: `Next.js` （自动选中）
- [ ] **Root Directory**: `.` （保持默认）
- [ ] **Build Command**: `npm run build` （自动填充）
- [ ] **Output Directory**: `.next` （自动填充）
- [ ] **Install Command**: `npm install` （自动填充）

### Step 4: 配置环境变量 ⚠️ **重要**

添加以下 **3 个** 环境变量：

#### 环境变量 1
```
Name:   NEXT_PUBLIC_API_URL
Value:  https://ipack-admin.vercel.app
```
- [ ] 已输入
- [ ] 作用域: 所有环境

#### 环境变量 2
```
Name:   JWT_SECRET
Value:  ipack-super-secret-key-2026-change-in-production-now
```
- [ ] 已输入
- [ ] 作用域: 所有环境
- [ ] ⚠️ 生产环境后续应更换为更强的密钥

#### 环境变量 3
```
Name:   JWT_REFRESH_SECRET
Value:  ipack-refresh-secret-key-2026-change-in-production-now
```
- [ ] 已输入
- [ ] 作用域: 所有环境
- [ ] ⚠️ 生产环境后续应更换为更强的密钥

### Step 5: 开始部署
- [ ] 所有设置已确认
- [ ] 环境变量已添加完整
- [ ] 点击 **"Deploy"** 按钮

### Step 6: 等待部署完成
- [ ] Vercel 开始克隆仓库
- [ ] 开始安装依赖 (~2 分钟)
- [ ] 开始构建项目 (~1 分钟)
- [ ] 开始部署 (~1 分钟)
- [ ] 看到 "Deployment successful" 消息
- [ ] 获得生产 URL: `https://ipack-admin.vercel.app`

---

## ✅ 部署后验证

### 访问和加载
- [ ] 访问 https://ipack-admin.vercel.app 成功
- [ ] 页面在 3 秒内加载完成
- [ ] 没有 404 错误
- [ ] 浏览器地址栏显示 HTTPS（绿色锁标志）

### 功能测试
- [ ] 看到登录页面
- [ ] 登录表单可以输入
- [ ] 邮箱字段有验证提示
- [ ] 密码字段可显示/隐藏
- [ ] 记住我复选框可点击

### 演示账号登录
- [ ] 输入邮箱: `admin@ipackauto.com`
- [ ] 输入密码: `demo123`
- [ ] 点击登录按钮
- [ ] 跳转到仪表板页面
- [ ] 仪表板显示欢迎信息
- [ ] 显示 4 个统计卡片
- [ ] 显示快速操作按钮
- [ ] 显示最近活动列表

### 导航测试
- [ ] 侧边栏正常显示
- [ ] 汉堡菜单可点击
- [ ] 导航菜单项可展开/折叠
- [ ] 可以点击不同的菜单项
- [ ] 用户信息卡片显示正确

### 响应式设计
- [ ] 桌面版 (1920x1080) 正常显示
- [ ] 平板版 (768x1024) 正常显示
- [ ] 手机版 (375x667) 正常显示
- [ ] 侧边栏在手机上可折叠

### 浏览器控制台
- [ ] F12 打开开发者工具
- [ ] Console 标签页没有红色错误
- [ ] Network 标签页没有 404 请求
- [ ] Performance 标签页显示快速加载

### Vercel Dashboard
- [ ] 项目显示在 Vercel Dashboard 中
- [ ] 部署历史显示最新部署
- [ ] 构建日志显示无错误
- [ ] 环境变量显示已配置

---

## 🔒 安全检查

### 环境变量安全
- [ ] JWT_SECRET 没有暴露在客户端代码中
- [ ] 没有在 HTML 源代码中显示密钥
- [ ] .env.local 文件在 .gitignore 中
- [ ] 没有在 GitHub README 中暴露密钥

### 认证测试
- [ ] 登录成功后显示用户信息
- [ ] 登出功能正常工作
- [ ] 刷新页面后用户仍然登录
- [ ] 访问 /login 时已登录用户自动跳转到仪表板

### 路由保护
- [ ] 未登录状态无法访问 /dashboard
- [ ] 未登录状态无法访问 /admin 路由
- [ ] 自动重定向到 /login

---

## 📊 性能检查

### 加载速度
- [ ] 首次加载 < 3 秒
- [ ] 登录页面加载 < 2 秒
- [ ] 仪表板加载 < 2 秒
- [ ] 页面切换 < 1 秒

### Lighthouse 评分（可选）
- [ ] 运行 Chrome Lighthouse 审计
- [ ] Performance 评分 > 80
- [ ] Accessibility 评分 > 85
- [ ] Best Practices 评分 > 85
- [ ] SEO 评分 > 85

### Vercel Analytics（自动启用）
- [ ] Dashboard 显示 Analytics 数据
- [ ] Core Web Vitals 数据可见
- [ ] 地理位置分布数据可见

---

## 📝 部署完成记录

### 部署信息
- **Vercel URL**: https://ipack-admin.vercel.app
- **项目名称**: ipack-admin
- **部署时间**: _______________
- **部署者**: _______________
- **部署版本**: main / _______________ (branch)

### 部署统计
- **构建时间**: ~5 分钟
- **部署状态**: ✅ 成功
- **构建大小**: ~2-5 MB
- **初始页面加载**: ~1-2 秒

### 环境信息
```
Node.js 版本: 18+（Vercel 自动选择）
npm 版本: 8+（自动）
操作系统: Linux（Vercel 部署环境）
```

---

## 🎯 部署后任务

### 立即（今天）
- [ ] 测试所有基本功能
- [ ] 获取部署 URL
- [ ] 记录部署完成时间

### 今天内
- [ ] 分享链接给团队
- [ ] 收集初步反馈
- [ ] 验证演示账号登录

### 本周
- [ ] 配置自定义域名（可选）：admin.ipackautoparts.com
- [ ] 设置部署通知（失败告警）
- [ ] 备份部署配置

### 下周
- [ ] 启动 Phase 2：产品管理模块
- [ ] 集成 Supabase 数据库
- [ ] 实现真实用户管理

---

## 🔗 重要链接

| 项目 | 链接 |
|------|------|
| **部署 URL** | https://ipack-admin.vercel.app |
| **GitHub 仓库** | https://github.com/lijack6655-cyber/ipack-admin |
| **Vercel Dashboard** | https://vercel.com/dashboard/ipack-admin |
| **部署历史** | https://vercel.com/dashboard/ipack-admin/deployments |
| **环境变量设置** | https://vercel.com/dashboard/ipack-admin/settings/environment-variables |

---

## 📞 常见问题快速解答

### 部署失败？
1. 查看 Vercel 构建日志 → 找出具体错误
2. 检查环境变量是否完整（必须 3 个）
3. 本地验证 `npm run build` 是否成功

### 显示 404 错误？
1. 清除浏览器缓存
2. 等待 5 分钟后重新访问（DNS 传播延迟）
3. 尝试无痕窗口访问

### 登录失败？
1. 确认邮箱: `admin@ipackauto.com` (无空格)
2. 确认密码: `demo123` (无空格)
3. 检查浏览器 Cookie 是否启用

### 需要重新部署？
1. 点击 Vercel Dashboard 中最近的部署
2. 右上角点击 "Redeploy"
3. 或推送新代码到 GitHub，自动触发部署

---

## 签名确认

```
部署完成日期: _______________
部署者签名:  _______________
验证者签名:  _______________
```

---

**✅ 检查完成！你的 ipack-admin 已成功部署到 Vercel！**

🎉 **现在可以分享链接给团队了！**

---

*本清单请妥善保管，作为部署记录存档*
