# 🚀 微信文件传输助手 Web 应用

<div align="center">

![Version](https://img.shields.io/badge/version-2.2.0-blue.svg)
![License](https://img.shields.io/badge/license-CC%20BY--NC--SA%204.0-green.svg)
![Platform](https://img.shields.io/badge/platform-Cloudflare%20Workers%20%7C%20Pages-orange.svg)
![Status](https://img.shields.io/badge/status-Production%20Ready-brightgreen.svg)

**基于 Cloudflare Workers/Pages 的现代化微信文件传输助手**

支持跨设备文件传输、消息同步和专业级管理后台

[🌟 在线演示](#) | [📖 快速开始](#-快速开始) | [🔧 部署指南](#-部署指南) | [📚 文档](#-文档)

</div>

---

## ✨ 功能特性

### 🎯 核心功能
- 📱 **跨设备同步** - 支持多设备间的消息和文件实时同步
- 📄 **文件传输** - 支持各种格式文件上传下载（最大1GB）
- 💬 **文本消息** - 发送和接收文本消息，支持表情符号
- 🖼️ **图片预览** - 自动显示图片文件预览和缩略图
- 📊 **消息历史** - 完整的消息历史记录和搜索功能
- 🔄 **实时更新** - 自动刷新获取最新消息（5秒间隔）

### 🎨 用户界面
- 🌈 **动态背景** - 浅色系粒子动画背景，告别单调白色
- 💫 **现代化设计** - 玻璃态效果和流畅动画
- 📱 **响应式布局** - 完美适配桌面端和移动端
- 🎭 **主题适配** - 自动适配系统暗色/亮色主题
- ⚡ **性能优化** - 智能动画控制和资源管理

### 🔐 管理后台 3.0 - 全新升级
- 🔒 **安全认证** - 强制环境变量配置，移除默认账户
- 🎨 **高级UI设计** - 玻璃态效果，现代化界面设计
- 📊 **数据仪表板** - 实时统计和可视化图表
- 💬 **信息管理** - 查看、搜索、删除用户消息
- 📁 **文件管理** - 批量管理文件，支持下载和删除
- 👥 **用户管理** - 管理用户账户、角色和权限
- 📈 **统计分析** - 活动趋势和数据分布分析
- ⚡ **流畅操作** - 去除繁琐确认弹窗，操作更高效
- 🌈 **动态背景** - 渐变动画背景，视觉体验升级
- 📱 **完全响应式** - 移动端和桌面端完美适配

## 🛠️ 技术栈

### 前端技术
- **核心框架**: 原生 HTML5 + CSS3 + ES6+ JavaScript
- **设计系统**: 模块化 CSS，玻璃态效果，现代化设计语言
- **动画引擎**: CSS3 动画 + JavaScript 控制
- **图表库**: Chart.js 数据可视化
- **响应式**: 移动优先的响应式设计

### 后端技术
- **运行时**: Cloudflare Workers / Pages Functions
- **框架**: Hono (轻量级 Web 框架)
- **数据库**: Cloudflare D1 (SQLite)
- **文件存储**: Cloudflare R2 (S3兼容)
- **认证**: 会话ID + SHA-256 密码加密

### 部署平台
- **Workers 模式**: 全球边缘计算部署
- **Pages 模式**: 静态站点 + 无服务器函数
- **CDN**: Cloudflare 全球 CDN 加速
- **域名**: 支持自定义域名绑定

## 📦 项目结构

```
📁 wxchat/
├── 📄 README.md                    # 📖 项目说明文档
├── 📄 package.json                 # 📦 项目配置和依赖
├── 📄 wrangler.toml                # ⚙️ Workers 配置
├── 📄 wrangler-pages.toml          # ⚙️ Pages 配置
├── 📄 setup-database.js            # 🔧 一键数据库设置脚本
├── 📄 ADMIN_SETUP_GUIDE_V2.md      # 🔐 新版管理后台设置指南
│
├── 📁 database/                    # 🗄️ 数据库相关
│   ├── 📄 schema.sql               # 🏗️ 基础数据库结构
│   └── 📄 admin-schema.sql         # 🔐 管理后台数据库结构
│
├── 📁 public/                      # 🎨 前端资源
│   ├── 📄 index.html               # 🏠 主应用页面
│   ├── 📄 admin.html               # 🔐 管理后台页面
│   ├── 📄 admin-test.html          # 🧪 管理后台测试页面
│   │
│   ├── 📁 css/                     # 🎨 样式文件
│   │   ├── 📄 reset.css            # 🔄 CSS 重置
│   │   ├── 📄 main.css             # 🎯 主应用样式
│   │   ├── 📄 admin.css            # 🔐 管理后台基础样式
│   │   ├── 📄 admin-premium.css    # ✨ 高级管理后台样式（新）
│   │   ├── 📄 admin-enhanced.css   # ✨ 管理后台增强样式
│   │   ├── 📄 animated-background.css # 🌈 动态背景样式
│   │   ├── 📄 components.css       # 🧩 组件样式库
│   │   └── 📄 responsive.css       # 📱 响应式样式
│   │
│   └── 📁 js/                      # ⚡ JavaScript 模块
│       ├── 📄 app.js               # 🚀 主应用入口
│       ├── 📄 background-animation.js # 🌈 背景动画控制
│       ├── 📄 enhanced-background.js # 🌈 增强背景动画
│       ├── 📄 config.js            # ⚙️ 应用配置
│       ├── 📄 utils.js             # 🛠️ 工具函数
│       ├── 📄 api.js               # 🌐 API 接口封装
│       ├── 📄 ui.js                # 🎨 UI 操作管理
│       ├── 📄 fileUpload.js        # 📁 文件上传处理
│       ├── 📄 messageHandler.js    # 💬 消息处理逻辑
│       │
│       └── 📁 admin/               # 🔐 管理后台脚本
│           ├── 📄 app.js           # 🚀 管理后台入口
│           ├── 📄 auth.js          # 🔐 认证管理
│           ├── 📄 api.js           # 🌐 后台 API 封装
│           ├── 📄 dashboard.js     # 📊 仪表板逻辑
│           ├── 📄 messages.js      # 💬 消息管理
│           ├── 📄 files.js         # 📁 文件管理
│           └── 📄 users.js         # 👥 用户管理
│
├── 📁 functions/                   # ⚡ Pages Functions API
│   └── 📁 api/                     # 🌐 API 路由
│       ├── 📄 messages.js          # 💬 消息 API
│       ├── 📄 sync.js              # 🔄 同步 API
│       ├── 📄 clear-all.js         # 🧹 清理 API
│       ├── 📁 auth/                # 🔐 认证 API
│       │   ├── 📄 login.js         # 🔑 登录
│       │   ├── 📄 register.js      # 📝 注册
│       │   └── 📄 init-admin.js    # 🔧 管理员初始化（已更新）
│       ├── 📁 admin/               # 🔐 管理后台 API
│       │   ├── 📄 dashboard.js     # 📊 仪表板数据
│       │   ├── 📄 messages.js      # 💬 消息管理
│       │   ├── 📄 files.js         # 📁 文件管理
│       │   └── 📄 users.js         # 👥 用户管理
│       └── 📁 files/               # 📁 文件 API
│           ├── 📄 upload.js        # ⬆️ 文件上传
│           └── 📁 download/
│               └── 📄 [r2Key].js   # ⬇️ 文件下载
│
├── 📁 worker/                      # ⚡ Workers 模式代码
│   └── 📄 index.js                 # 🔧 Workers 入口
│
└── 📁 docs/                        # 📚 文档
    ├── 📄 DATABASE_SETUP.md        # 🗄️ 数据库设置指南
    ├── 📄 MANUAL_D1_SETUP.md       # 🔧 手动数据库创建指南
    ├── 📄 ADMIN_SETUP_GUIDE.md     # 🔐 旧版管理后台设置指南
    ├── 📄 ADMIN_SETUP_GUIDE_V2.md  # 🔐 新版管理后台设置指南
    └── 📄 MIGRATION_GUIDE.md       # 🔄 迁移指南
```

## 🚀 快速开始

### 📋 前置要求

- ✅ **Cloudflare 账户** - [免费注册](https://dash.cloudflare.com/sign-up)
- ✅ **Node.js 18+** - [下载安装](https://nodejs.org/)
- ✅ **Git** - [下载安装](https://git-scm.com/)

### ⚡ 一键部署

#### 🌟 方式一：Cloudflare Pages（推荐）

```bash
# 1️⃣ 克隆项目
git clone https://github.com/flalad/wxchat.git
cd wxchat

# 2️⃣ 安装依赖
npm install

# 3️⃣ 登录 Cloudflare
npx wrangler login

# 4️⃣ 一键设置数据库和存储
npm run setup

# 5️⃣ 创建 Pages 项目
npm run pages:create

# 6️⃣ 部署到 Pages
npm run pages:deploy

# 7️⃣ 超简单管理员设置（必需）
# 在 Cloudflare Dashboard 中设置环境变量：
# ADMIN_USERNAME=your_admin_username
# ADMIN_PASSWORD=your_secure_password
# 然后重新部署，直接用这些凭据登录即可！
```

#### ⚡ 方式二：Cloudflare Workers

```bash
# 前面步骤 1-4 相同

# 5️⃣ 配置环境变量（必需）
# 编辑 wrangler.toml 中的 ADMIN_USERNAME 和 ADMIN_PASSWORD

# 6️⃣ 部署到 Workers
npm run deploy
```

### 🎯 超简单管理员设置

**🚀 三步搞定管理员设置：**

1. **设置环境变量**: 在 Cloudflare Pages 项目中设置 `ADMIN_USERNAME` 和 `ADMIN_PASSWORD`
2. **重新部署**: 点击重新部署按钮让环境变量生效
3. **直接登录**: 访问 `/admin.html`，用设置的凭据直接登录即可！

> 💡 **就是这么简单！** 系统会在首次登录时自动创建管理员账户，无需复杂的初始化步骤。

**📖 详细指南**: 查看 [`SIMPLE_ADMIN_SETUP.md`](SIMPLE_ADMIN_SETUP.md) 获取完整的三步设置指南。

### 🎯 其他配置

1. **访问应用**: 使用 Cloudflare 提供的域名访问
2. **安全配置**:
   - 使用强密码（建议12位以上，包含大小写字母、数字和特殊字符）
   - 定期更换管理员密码
3. **自定义域名**: 在 Cloudflare Dashboard 中绑定自定义域名

## 🔧 部署指南

### 🗄️ 数据库设置

#### 自动化设置（推荐）
```bash
npm run setup
```

#### 手动设置
```bash
# 创建 D1 数据库
npx wrangler d1 create wxchat

# 创建 R2 存储桶
npx wrangler r2 bucket create wxchat

# 初始化数据库表
npm run db:init-all
```

详细设置指南：
- 📖 [数据库设置完整指南](DATABASE_SETUP.md)
- 🔧 [手动 D1 数据库创建指南](MANUAL_D1_SETUP.md)
- 🔐 [新版管理后台设置指南](ADMIN_SETUP_GUIDE_V2.md)

### ⚙️ 配置文件

#### Workers 配置 (`wrangler.toml`)
```toml
name = "wxchat"
main = "worker/index.js"
compatibility_date = "2025-06-17"

# 环境变量配置（必需）
[vars]
ADMIN_USERNAME = "your_admin_username"    # 管理员用户名
ADMIN_PASSWORD = "your_secure_password"   # 管理员密码

[[d1_databases]]
binding = "DB"
database_name = "wxchat"
database_id = "your-database-id"

[[r2_buckets]]
binding = "R2"
bucket_name = "wxchat"
```

#### Pages 配置 (`wrangler-pages.toml`)
```toml
name = "wxchat-pages"
compatibility_date = "2025-06-17"
pages_build_output_dir = "./public"

# 环境变量配置（必需）
[vars]
ENVIRONMENT = "production"
ADMIN_USERNAME = "your_admin_username"    # 管理员用户名
ADMIN_PASSWORD = "your_secure_password"   # 管理员密码

[[d1_databases]]
binding = "DB"
database_name = "wxchat"
database_id = "your-database-id"

[[r2_buckets]]
binding = "R2"
bucket_name = "wxchat"
```

### 🔐 环境变量说明

| 变量名 | 说明 | 是否必需 | 安全建议 |
|--------|------|----------|----------|
| `ADMIN_USERNAME` | 管理员用户名 | ✅ 必需 | 避免使用常见用户名 |
| `ADMIN_PASSWORD` | 管理员密码 | ✅ 必需 | 12位以上强密码 |
| `ENVIRONMENT` | 运行环境标识 | ❌ 可选 | 用于区分环境 |

> 🔒 **安全要求**:
> - 必须设置 `ADMIN_USERNAME` 和 `ADMIN_PASSWORD` 环境变量
> - 密码建议包含大小写字母、数字和特殊字符
> - 定期更换管理员密码
> - 不要在代码中硬编码凭据

## 📱 使用指南

### 🎮 基础功能

| 功能 | 操作方式 | 说明 |
|------|---------|------|
| 💬 **发送消息** | 输入框输入 → 点击发送 | 支持文本和表情符号 |
| 📁 **上传文件** | 点击📁按钮 或 拖拽文件 | 最大1GB，支持所有格式 |
| ⬇️ **下载文件** | 点击文件消息中的下载按钮 | 保持原始文件名 |
| 🔄 **跨设备同步** | 不同设备访问相同URL | 自动同步所有消息和文件 |

### 🔐 管理后台功能

#### 登录管理后台
1. 访问 `/admin.html`
2. 使用环境变量中配置的管理员凭据登录
3. 系统会自动创建管理员账户（如果不存在）

> 💡 **超简单**: 只需设置环境变量，重新部署，然后直接登录！无需复杂的初始化步骤。

#### 主要功能
- 📊 **仪表板** - 查看系统统计和图表，全新玻璃态设计
- 💬 **信息管理** - 管理所有用户消息，支持高级搜索
- 📁 **文件管理** - 批量管理上传的文件，支持预览
- 👥 **用户管理** - 管理用户账户和权限，实时状态更新

#### 🎨 界面升级亮点
- ✨ **玻璃态设计** - 现代化半透明效果
- 🌈 **动态渐变背景** - 自动变化的渐变动画
- 💫 **流畅动画** - 60fps 平滑过渡效果
- 📱 **完全响应式** - 移动端和桌面端完美适配
- 🎯 **智能交互** - 悬浮效果和智能反馈

#### 🚀 用户体验优化
- ⚡ **一键操作** - 删除、修改等操作无需确认弹窗
- 🎯 **智能反馈** - 操作完成后显示清晰的成功/失败提示
- 🔄 **自动刷新** - 操作后自动更新数据，保持界面同步
- 💨 **流畅交互** - 去除繁琐的确认步骤，提升操作效率

### 🧹 数据清理功能

发送以下指令可以清理所有数据：
```
/clear-all
清空数据
/清空
clear all
```

## 🎨 界面特性

### 🌈 动态背景
- **浮动粒子** - 多彩粒子上升动画
- **几何图形** - 旋转的几何元素
- **光点效果** - 闪烁的星光效果
- **波浪动画** - 底部流动波浪
- **鼠标交互** - 跟随鼠标的渐变变化

### 💫 现代化设计
- **玻璃态效果** - 半透明模糊背景
- **流畅动画** - 60fps 平滑过渡
- **响应式布局** - 完美适配各种设备
- **主题适配** - 自动适配系统主题

### 🎨 管理后台 3.0 设计语言
- **高级玻璃态** - 多层次透明效果
- **渐变动画背景** - 自动变化的色彩
- **现代化组件** - 统一的设计系统
- **智能布局** - 自适应的界面结构

## 🔧 开发指南

### 🛠️ 本地开发

```bash
# 克隆项目
git clone https://github.com/flalad/wxchat.git
cd wxchat

# 安装依赖
npm install

# 配置本地环境变量
# 创建 .dev.vars 文件：
echo "ADMIN_USERNAME=local_admin" > .dev.vars
echo "ADMIN_PASSWORD=LocalDev@2024!" >> .dev.vars

# 本地开发 (Pages 模式)
npm run pages:dev

# 本地开发 (Workers 模式)
npm run dev
```

### 📦 可用脚本

```bash
# 数据库管理
npm run setup           # 一键数据库设置
npm run db:init         # 初始化基础表
npm run db:init-admin   # 初始化管理后台表
npm run db:init-all     # 初始化所有表
npm run db:reset        # 重置数据库

# 构建和部署
npm run build           # 构建 Workers 版本
npm run build:pages     # 构建 Pages 版本
npm run deploy          # 部署到 Workers
npm run pages:deploy    # 部署到 Pages
npm run pages:create    # 创建 Pages 项目

# 开发调试
npm run dev             # Workers 本地开发
npm run pages:dev       # Pages 本地开发
```

## 🗄️ 数据库结构

### 基础表
- **messages** - 消息表（文本和文件消息）
- **files** - 文件表（文件元数据和存储信息）
- **devices** - 设备表（设备标识和活动状态）

### 管理后台表
- **users** - 用户表（管理员和用户账户）
- **sessions** - 会话表（登录状态管理）
- **daily_stats** - 统计表（每日数据统计）
- **admin_logs** - 操作日志表（管理操作记录）

## 🔐 安全特性

- 🔒 **强制环境变量** - 移除默认账户，强制配置
- 🎫 **会话认证** - 安全的会话ID管理
- 🛡️ **CORS 保护** - 跨域请求保护
- 🔍 **输入验证** - 严格的数据验证
- 📝 **操作日志** - 完整的审计日志
- ⚙️ **环境变量配置** - 敏感信息通过环境变量管理
- 🔐 **密码加密** - SHA-256 哈希加密

## 📈 性能优化

- ⚡ **边缘计算** - Cloudflare 全球边缘节点
- 🗜️ **资源压缩** - CSS/JS 自动压缩
- 🎯 **懒加载** - 按需加载资源
- 💾 **智能缓存** - 多层缓存策略
- 📱 **移动优化** - 移动端性能优化
- 🎨 **CSS 优化** - 模块化样式系统

## 🌍 浏览器支持

| 浏览器 | 版本 | 支持状态 |
|--------|------|----------|
| Chrome | 80+ | ✅ 完全支持 |
| Firefox | 75+ | ✅ 完全支持 |
| Safari | 13+ | ✅ 完全支持 |
| Edge | 80+ | ✅ 完全支持 |
| 移动浏览器 | 现代版本 | ✅ 完全支持 |

## 🆕 版本更新

### v2.2.0 - 管理后台 3.0 重大升级 🎉

#### 🔒 安全改进
- ✅ 移除默认管理员账户
- ✅ 强制使用环境变量配置管理员凭据
- ✅ 增强密码安全要求
- ✅ 改进认证流程

#### 🎨 UI/UX 全面升级
- ✅ 全新玻璃态设计语言
- ✅ 动态渐变背景动画
- ✅ 现代化组件系统
- ✅ 流畅的交互动画
- ✅ 完全响应式设计

#### 🐛 问题修复
- ✅ 修复侧边栏布局问题
- ✅ 优化移动端适配
- ✅ 改进性能表现
- ✅ 修复各种UI细节

#### 📚 文档更新
- ✅ 新增 v2.2.0 设置指南
- ✅ 更新部署文档
- ✅ 完善安全配置说明

### v2.1.0
- 新增现代化UI设计
- 改进响应式布局
- 增强数据可视化
- 优化性能表现

## 🤝 贡献指南

### 🔧 开发环境设置

```bash
# Fork 项目并克隆
git clone https://github.com/your-username/wxchat.git
cd wxchat

# 安装依赖
npm install

# 配置本地环境变量
echo "ADMIN_USERNAME=dev_admin" > .dev.vars
echo "ADMIN_PASSWORD=DevPassword@2024!" >> .dev.vars

# 创建功能分支
git checkout -b feature/your-feature-name

# 开发和测试
npm run pages:dev

# 提交更改
git commit -m "feat: add your feature"
git push origin feature/your-feature-name
```

### 📝 提交规范

```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式
refactor: 重构
test: 测试相关
chore: 构建过程或辅助工具的变动
security: 安全相关更新
ui: UI/UX 改进
```

## 📚 文档

- 🚀 [**超简单管理员设置指南**](SIMPLE_ADMIN_SETUP.md) - **推荐阅读**
- 📖 [数据库设置指南](DATABASE_SETUP.md)
- 🔧 [手动 D1 数据库创建](MANUAL_D1_SETUP.md)
- 🔐 [管理后台设置指南 v2.2.0](ADMIN_SETUP_GUIDE_V2.md)
- 🔐 [旧版管理后台设置指南](ADMIN_SETUP_GUIDE.md)
- 🔄 [版本迁移指南](MIGRATION_GUIDE.md)

## 🐛 问题反馈

遇到问题？请通过以下方式反馈：

- 🐛 [提交 Issue](https://github.com/flalad/wxchat/issues)
- 💬 [讨论区](https://github.com/flalad/wxchat/discussions)
- 📧 [邮件联系](mailto:support@example.com)

## 📄 许可证

<div align="center">

**CC BY-NC-SA 4.0 License**

[![License: CC BY-NC-SA 4.0](https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc-sa/4.0/)

Copyright (c) 2025 微信文件传输助手

本项目采用 [Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License](https://creativecommons.org/licenses/by-nc-sa/4.0/) 许可证。

### 🚫 **严格禁止商业用途**

- ✅ **允许**: 个人学习、研究、非营利使用
- ✅ **允许**: 修改和分发（需保持相同许可证）
- ✅ **允许**: 署名使用
- ❌ **禁止**: 任何形式的商业用途
- ❌ **禁止**: 商业销售或盈利

</div>

## 🙏 致谢

感谢以下技术和服务：

- [Cloudflare Workers](https://workers.cloudflare.com/) - 边缘计算平台
- [Cloudflare Pages](https://pages.cloudflare.com/) - 静态站点托管
- [Cloudflare D1](https://developers.cloudflare.com/d1/) - 边缘数据库
- [Cloudflare R2](https://developers.cloudflare.com/r2/) - 对象存储
- [Hono](https://hono.dev/) - 轻量级 Web 框架
- [Chart.js](https://www.chartjs.org/) - 图表库

---

<div align="center">

**🌟 如果这个项目对你有帮助，请给个 Star ⭐**

*Made with ❤️ by flalad*

[回到顶部 ⬆️](#-微信文件传输助手-web-应用)

</div>

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=flalad/wxchat-up-pg&type=Date)](https://www.star-history.com/#flalad/wxchat-up-pg&Date)
