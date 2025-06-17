# 从 Workers 迁移到 Pages 指南

## 🎯 迁移概述

本项目已成功从 Cloudflare Workers 架构迁移到支持 Cloudflare Pages 部署。现在你可以选择两种部署方式：

- **Workers 部署**：原有方式，单文件全栈架构
- **Pages 部署**：新增方式，基于 Pages Functions 的模块化架构

## 📋 迁移清单

### ✅ 已完成的迁移工作

1. **创建 Pages Functions 架构**
   - ✅ [`functions/api/messages.js`](functions/api/messages.js) - 消息相关 API
   - ✅ [`functions/api/files/upload.js`](functions/api/files/upload.js) - 文件上传 API
   - ✅ [`functions/api/files/download/[r2Key].js`](functions/api/files/download/[r2Key].js) - 文件下载 API
   - ✅ [`functions/api/sync.js`](functions/api/sync.js) - 设备同步 API
   - ✅ [`functions/api/clear-all.js`](functions/api/clear-all.js) - 数据清理 API

2. **配置文件更新**
   - ✅ [`wrangler-pages.toml`](wrangler-pages.toml) - Pages 专用配置
   - ✅ [`package.json`](package.json) - 新增 Pages 相关脚本
   - ✅ [`build-pages.js`](build-pages.js) - Pages 构建脚本

3. **文档更新**
   - ✅ [`PAGES_DEPLOYMENT.md`](PAGES_DEPLOYMENT.md) - Pages 部署详细指南
   - ✅ [`README.md`](README.md) - 更新项目说明
   - ✅ [`MIGRATION_GUIDE.md`](MIGRATION_GUIDE.md) - 本迁移指南

## 🚀 快速开始 Pages 部署

### 1. 构建 Pages 项目
```bash
npm run build:pages
```

### 2. 本地开发测试
```bash
npm run pages:dev
```

### 3. 创建 Pages 项目
```bash
npm run pages:create
```

### 4. 部署到 Pages
```bash
npm run pages:deploy
```

## 🔄 架构对比

### Workers 架构（原有）
```
worker/index.js (单文件)
├── Hono 路由
├── API 处理逻辑
├── 静态文件服务
└── CORS 处理
```

### Pages 架构（新增）
```
functions/api/ (模块化)
├── messages.js          # GET/POST /api/messages
├── sync.js              # POST /api/sync
├── clear-all.js         # POST /api/clear-all
└── files/
    ├── upload.js        # POST /api/files/upload
    └── download/
        └── [r2Key].js   # GET /api/files/download/:r2Key
```

## 📊 功能对比

| 功能 | Workers | Pages | 说明 |
|------|---------|-------|------|
| **API 路由** | ✅ | ✅ | 完全兼容 |
| **静态文件** | ✅ | ✅ | Pages 原生支持更好 |
| **D1 数据库** | ✅ | ✅ | 共享相同数据库 |
| **R2 存储** | ✅ | ✅ | 共享相同存储桶 |
| **CORS 处理** | ✅ | ✅ | 每个 Function 独立处理 |
| **部署方式** | CLI | CLI + Git | Pages 支持 Git 自动部署 |
| **冷启动** | 快 | 更快 | Pages 优化更好 |
| **开发体验** | 好 | 更好 | 文件系统路由更直观 |

## 🛠️ 新增的 npm 脚本

```json
{
  "scripts": {
    "build:pages": "node build-pages.js",
    "pages:dev": "npm run build:pages && wrangler pages dev ./public --compatibility-date=2025-06-17 --d1=DB=wxchat --r2=R2=wxchat",
    "pages:deploy": "npm run build:pages && wrangler pages deploy ./public --project-name=wxchat-pages --compatibility-date=2025-06-17",
    "pages:create": "wrangler pages project create wxchat-pages"
  }
}
```

## 🔧 环境绑定配置

在 Cloudflare Dashboard 的 Pages 项目设置中配置：

### D1 数据库绑定
- **Variable name**: `DB`
- **D1 database**: `wxchat`

### R2 存储桶绑定
- **Variable name**: `R2`
- **R2 bucket**: `wxchat`

## 🌟 Pages 部署的优势

1. **更好的静态文件处理**
   - 原生 CDN 分发
   - 更快的加载速度
   - 自动压缩和优化

2. **Git 集成自动部署**
   - 推送代码自动部署
   - 预览分支支持
   - 回滚功能

3. **更好的开发体验**
   - 文件系统路由
   - 热重载支持
   - 更直观的项目结构

4. **更好的性能**
   - 更快的冷启动
   - 更好的缓存策略
   - 边缘计算优化

## 🔄 数据兼容性

- ✅ **完全兼容**：两种部署方式可以共享相同的 D1 数据库和 R2 存储
- ✅ **API 兼容**：前端代码无需任何修改
- ✅ **数据迁移**：无需数据迁移，直接切换部署方式即可

## 🚨 注意事项

1. **配置文件**：Pages 使用 `wrangler-pages.toml`，Workers 使用 `wrangler.toml`
2. **构建过程**：Pages 需要先运行 `npm run build:pages` 构建
3. **路由配置**：Pages 使用 `_routes.json` 配置路由规则
4. **Functions 位置**：Pages Functions 必须在 `public/_functions` 目录下

## 🎯 推荐使用场景

### 选择 Workers 部署
- 需要单文件部署
- 对启动时间要求极致
- 习惯 Hono 框架开发

### 选择 Pages 部署（推荐）
- 需要 Git 自动部署
- 静态文件较多
- 喜欢模块化架构
- 需要预览分支功能

## 📞 获取帮助

如果在迁移过程中遇到问题：

1. 查看 [`PAGES_DEPLOYMENT.md`](PAGES_DEPLOYMENT.md) 详细部署指南
2. 检查 Cloudflare Dashboard 中的绑定配置
3. 确保 D1 数据库和 R2 存储桶已正确创建
4. 提交 [Issue](https://github.com/flalad/wxchat/issues) 获取支持