# Cloudflare Pages 手动部署指南

## 🎯 手动部署流程概述

手动部署到 Cloudflare Pages 主要有两种方式：
1. **通过 Cloudflare Dashboard 网页界面部署**
2. **通过 Wrangler CLI 手动部署**

## 🌐 方式一：通过 Cloudflare Dashboard 部署

### 步骤 1：准备项目文件

```bash
# 1. 构建 Pages 项目
npm run build:pages

# 2. 确认 public 目录结构
# public/
# ├── index.html
# ├── css/
# ├── js/
# ├── _functions/
# └── _routes.json
```

### 步骤 2：登录 Cloudflare Dashboard

1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 登录你的 Cloudflare 账户
3. 在左侧菜单中选择 **"Pages"**

### 步骤 3：创建 Pages 项目

#### 选项 A：连接 Git 仓库（推荐）

1. 点击 **"Create a project"**
2. 选择 **"Connect to Git"**
3. 选择你的 Git 提供商（GitHub、GitLab 等）
4. 授权 Cloudflare 访问你的仓库
5. 选择 `wxchat` 仓库

#### 选项 B：直接上传文件

1. 点击 **"Create a project"**
2. 选择 **"Upload assets"**
3. 将整个 `public` 目录拖拽到上传区域
4. 或者选择 `public` 目录下的所有文件上传

### 步骤 4：配置构建设置

如果选择了 Git 连接，需要配置构建设置：

```
项目名称: wxchat-pages
生产分支: main
框架预设: None
构建命令: npm run build:pages
构建输出目录: public
根目录: /
```

### 步骤 5：配置环境绑定

在项目创建完成后，进入项目设置：

1. 点击项目名称进入项目详情
2. 选择 **"Settings"** 标签
3. 选择 **"Functions"** 子标签

#### 配置 D1 数据库绑定

1. 在 **"D1 database bindings"** 部分点击 **"Add binding"**
2. 填写配置：
   ```
   Variable name: DB
   D1 database: wxchat
   ```

#### 配置 R2 存储桶绑定

1. 在 **"R2 bucket bindings"** 部分点击 **"Add binding"**
2. 填写配置：
   ```
   Variable name: R2
   R2 bucket: wxchat
   ```

#### 配置管理员环境变量（v2.2.0+）

1. 在 **"Environment variables"** 部分点击 **"Add variable"**
2. 添加以下变量：
   ```
   ADMIN_USERNAME = your_admin_username
   ADMIN_PASSWORD = your_secure_password
   ```

> ⚠️ **重要**: 从 v2.2.0 开始，必须设置这些环境变量才能访问管理后台

### 步骤 6：部署项目

1. 如果是 Git 连接：推送代码到仓库会自动触发部署
2. 如果是文件上传：上传完成后会自动开始部署

### 步骤 7：验证部署

1. 部署完成后，Cloudflare 会提供一个 `.pages.dev` 域名
2. 访问该域名验证应用是否正常运行
3. 测试 API 功能：
   - 发送文本消息
   - 上传文件
   - 下载文件

## ⚡ 方式二：通过 Wrangler CLI 手动部署

### 步骤 1：安装和登录

```bash
# 确保已安装 wrangler
npm install -g wrangler

# 登录 Cloudflare
wrangler login
```

### 步骤 2：构建项目

```bash
# 构建 Pages 项目
npm run build:pages
```

### 步骤 3：创建 Pages 项目

```bash
# 创建 Pages 项目
wrangler pages project create wxchat-pages
```

### 步骤 4：配置绑定

```bash
# 配置 D1 数据库绑定
wrangler pages secret put DB --project-name=wxchat-pages

# 配置 R2 存储桶绑定
wrangler pages secret put R2 --project-name=wxchat-pages
```

### 步骤 5：部署项目

```bash
# 部署到 Pages
wrangler pages deploy ./public --project-name=wxchat-pages --compatibility-date=2025-06-17
```

### 步骤 6：配置绑定（通过 Dashboard）

由于 CLI 配置绑定较复杂，建议通过 Dashboard 配置：

1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 Pages → wxchat-pages → Settings → Functions
3. 按照方式一的步骤 5 配置 D1 和 R2 绑定

## 🔧 配置自定义域名（可选）

### 步骤 1：添加域名

1. 在项目设置中选择 **"Custom domains"**
2. 点击 **"Set up a custom domain"**
3. 输入你的域名（如：`wxchat.yourdomain.com`）

### 步骤 2：配置 DNS

1. 在你的域名提供商处添加 CNAME 记录：
   ```
   名称: wxchat
   类型: CNAME
   值: wxchat-pages.pages.dev
   ```

### 步骤 3：验证域名

1. 等待 DNS 传播（通常几分钟到几小时）
2. Cloudflare 会自动验证域名并颁发 SSL 证书

## 📋 部署检查清单

### 部署前检查

- [ ] 已运行 `npm run build:pages`
- [ ] `public` 目录包含所有必要文件
- [ ] `public/_functions` 目录存在且包含 API 文件
- [ ] `public/_routes.json` 文件存在
- [ ] D1 数据库已创建并初始化
- [ ] R2 存储桶已创建

### 部署后检查

- [ ] 网站可以正常访问
- [ ] 静态文件（CSS、JS）加载正常
- [ ] API 接口响应正常
- [ ] 文件上传功能正常
- [ ] 文件下载功能正常
- [ ] 跨设备同步功能正常

## 🚨 常见问题和解决方案

### 问题 1：Functions 不工作

**症状**：API 请求返回 404 错误

**解决方案**：
1. 检查 `_routes.json` 配置是否正确
2. 确认 `_functions` 目录结构正确
3. 验证 D1 和 R2 绑定配置

### 问题 2：静态文件 404

**症状**：CSS、JS 文件无法加载

**解决方案**：
1. 检查 `_routes.json` 中的 exclude 规则
2. 确认文件路径正确
3. 检查文件是否存在于 `public` 目录

### 问题 3：数据库连接失败

**症状**：API 返回数据库错误

**解决方案**：
1. 确认 D1 数据库绑定配置正确
2. 检查数据库是否已初始化
3. 验证数据库 ID 是否正确

### 问题 4：文件上传失败

**症状**：文件上传返回错误

**解决方案**：
1. 确认 R2 存储桶绑定配置正确
2. 检查存储桶权限设置
3. 验证文件大小限制

## 📞 获取帮助

如果遇到部署问题：

1. 查看 Cloudflare Pages 部署日志
2. 检查浏览器开发者工具的网络和控制台
3. 参考 [Cloudflare Pages 官方文档](https://developers.cloudflare.com/pages/)
4. 提交 [Issue](https://github.com/flalad/wxchat/issues) 获取支持

## 🎯 推荐部署方式

对于不同场景的推荐：

- **开发测试**：使用 CLI 部署，快速迭代
- **生产环境**：使用 Git 连接，自动化部署
- **一次性部署**：使用文件上传，简单直接

选择最适合你需求的部署方式即可！