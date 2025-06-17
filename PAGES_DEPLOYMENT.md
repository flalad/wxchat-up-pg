# Cloudflare Pages 部署指南

本项目已经从 Cloudflare Workers 迁移到 Cloudflare Pages，支持两种部署方式。

## 项目结构变化

```
wxchat-main/
├── functions/              # Pages Functions (替代 worker/index.js)
│   └── api/
│       ├── messages.js      # 消息相关 API
│       ├── sync.js          # 设备同步 API
│       ├── clear-all.js     # 数据清理 API
│       └── files/
│           ├── upload.js    # 文件上传 API
│           └── download/
│               └── [r2Key].js # 文件下载 API
├── public/                  # 静态文件目录
├── database/               # 数据库 schema
├── wrangler.toml          # Workers 配置（保留）
├── wrangler-pages.toml    # Pages 配置
└── package.json           # 更新了 Pages 相关脚本
```

## 部署方式

### 方式一：使用 Wrangler CLI 部署

1. **创建 Pages 项目**
   ```bash
   npm run pages:create
   ```

2. **本地开发**
   ```bash
   npm run pages:dev
   ```

3. **部署到 Pages**
   ```bash
   npm run pages:deploy
   ```

### 方式二：通过 Cloudflare Dashboard 部署

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 Pages 页面
3. 点击 "Create a project"
4. 连接你的 Git 仓库
5. 配置构建设置：
   - **Build command**: `npm run build`
   - **Build output directory**: `public`
   - **Root directory**: `/`

## 环境绑定配置

在 Cloudflare Dashboard 的 Pages 项目设置中，需要配置以下绑定：

### D1 数据库绑定
- **Variable name**: `DB`
- **D1 database**: `wxchat`

### R2 存储桶绑定
- **Variable name**: `R2`
- **R2 bucket**: `wxchat`

### 管理员环境变量（v2.2.0+）
在 Settings > Environment variables 中添加：
- **ADMIN_USERNAME**: 管理员用户名
- **ADMIN_PASSWORD**: 管理员密码

> ⚠️ **重要**: 从 v2.2.0 开始，必须设置管理员环境变量才能访问管理后台

## API 路由映射

Pages Functions 会自动映射以下路由：

- `GET /api/messages` → `functions/api/messages.js`
- `POST /api/messages` → `functions/api/messages.js`
- `POST /api/files/upload` → `functions/api/files/upload.js`
- `GET /api/files/download/:r2Key` → `functions/api/files/download/[r2Key].js`
- `POST /api/sync` → `functions/api/sync.js`
- `POST /api/clear-all` → `functions/api/clear-all.js`

## 数据库初始化

无论使用哪种部署方式，都需要先初始化数据库：

```bash
npm run db:init
```

## 主要变化说明

1. **架构变化**: 从单一的 Worker 文件改为多个 Pages Functions
2. **路由处理**: 使用文件系统路由替代 Hono 路由
3. **静态文件**: 直接由 Pages 提供，无需 `@cloudflare/kv-asset-handler`
4. **CORS 处理**: 在每个 Function 中单独处理
5. **配置文件**: 新增 `wrangler-pages.toml` 专用配置

## 兼容性

- 原有的 Workers 部署方式仍然可用
- API 接口保持完全兼容
- 前端代码无需修改
- 数据库和 R2 存储可以共用

## 优势

1. **更好的静态文件处理**: Pages 原生支持静态文件托管
2. **更简单的部署**: 支持 Git 集成自动部署
3. **更好的性能**: 静态文件通过 CDN 分发
4. **更灵活的路由**: 基于文件系统的路由更直观
5. **更好的开发体验**: 本地开发更接近生产环境