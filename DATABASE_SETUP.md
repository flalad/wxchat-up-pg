# 数据库设置完整指南

## ⚡ 快速开始（推荐）

如果你想要一键完成所有数据库设置，使用我们提供的自动化脚本：

```bash
# 一键完成所有数据库设置
npm run setup
```

这个脚本会自动完成：
- ✅ 检查Cloudflare登录状态
- ✅ 创建D1数据库
- ✅ 创建R2存储桶
- ✅ 更新wrangler.toml配置
- ✅ 初始化所有数据库表
- ✅ 创建默认管理员账户
- ✅ 验证设置结果

**如果自动化脚本执行成功，你可以跳过手动设置步骤，直接进行项目部署！**

> 📖 **详细的手动操作指南**：如果你需要了解每个步骤的详细操作，请查看 [`MANUAL_D1_SETUP.md`](MANUAL_D1_SETUP.md)，其中包含了Cloudflare Dashboard控制台操作和命令行操作的完整指南。

---

## 📊 数据库结构说明

管理后台系统需要在原有数据库基础上添加新的表结构。以下是完整的数据库表说明：

### 原有表结构
- `messages` - 消息表
- `files` - 文件表
- `devices` - 设备表

### 新增表结构（管理后台）
- `users` - 用户表（用于登录认证）
- `sessions` - 会话表（管理登录状态）
- `daily_stats` - 统计表（存储每日数据）
- `admin_logs` - 操作日志表（记录管理操作）

## 🚀 手动设置步骤

**注意：如果你已经使用了上面的快速开始脚本，可以跳过这个部分。**

### 步骤1：登录Cloudflare

```bash
# 首先确保已登录Cloudflare
npx wrangler login
```

### 步骤2：创建D1数据库

```bash
# 创建D1数据库
npx wrangler d1 create wxchat
```

执行后会显示类似信息：
```
✅ Successfully created DB 'wxchat' in region APAC
Created your database using D1's new storage backend.

[[d1_databases]]
binding = "DB"
database_name = "wxchat"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**重要：请复制显示的database_id，下一步需要用到！**

### 步骤3：更新wrangler.toml配置

将上面显示的database_id复制到你的配置文件中：

```toml
# wrangler.toml
[[d1_databases]]
binding = "DB"
database_name = "wxchat"
database_id = "你的实际数据库ID"  # 替换这里
```

### 步骤4：创建R2存储桶

```bash
# 创建R2存储桶
npx wrangler r2 bucket create wxchat
```

### 步骤5：初始化数据库表结构

**⚠️ 重要：必须按顺序执行以下命令来创建数据库表！**

#### 方法一：使用npm脚本（推荐）

```bash
# 一次性初始化所有表（包括基础表和管理后台表）
npm run db:init-all
```

或者分步执行：
```bash
# 1. 先初始化基础表结构
npm run db:init

# 2. 再初始化管理后台表结构
npm run db:init-admin
```

#### 方法二：手动执行SQL文件

```bash
# 1. 执行基础表结构
npx wrangler d1 execute wxchat --file=./database/schema.sql

# 2. 执行管理后台表结构
npx wrangler d1 execute wxchat --file=./database/admin-schema.sql
```

### 步骤6：验证表创建

```bash
# 查看所有创建的表
npx wrangler d1 execute wxchat --command="SELECT name FROM sqlite_master WHERE type='table';"
```

应该看到以下表：
```
┌──────────────┐
│ name         │
├──────────────┤
│ messages     │
│ files        │
│ devices      │
│ users        │
│ sessions     │
│ daily_stats  │
│ admin_logs   │
└──────────────┘
```

## 🔧 数据库表详细说明

### 1. users表（用户表）
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,        -- 用户名
    password_hash TEXT NOT NULL,          -- 密码哈希
    email TEXT,                           -- 邮箱（可选）
    role TEXT DEFAULT 'user',             -- 角色：admin/user
    is_active BOOLEAN DEFAULT 1,          -- 是否活跃
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME                   -- 最后登录时间
);
```

### 2. sessions表（会话表）
```sql
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,                  -- 会话ID
    user_id INTEGER NOT NULL,             -- 用户ID
    expires_at DATETIME NOT NULL,         -- 过期时间
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 3. daily_stats表（统计表）
```sql
CREATE TABLE daily_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE NOT NULL UNIQUE,            -- 日期
    message_count INTEGER DEFAULT 0,      -- 消息数量
    file_count INTEGER DEFAULT 0,         -- 文件数量
    total_file_size INTEGER DEFAULT 0,    -- 总文件大小
    active_users INTEGER DEFAULT 0,       -- 活跃用户数
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 4. admin_logs表（操作日志表）
```sql
CREATE TABLE admin_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,                      -- 操作用户ID
    action TEXT NOT NULL,                 -- 操作类型
    target_type TEXT,                     -- 目标类型：message/file/user
    target_id TEXT,                       -- 目标ID
    details TEXT,                         -- 操作详情
    ip_address TEXT,                      -- IP地址
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## 🔐 管理员账户设置

**从 v2.2.0 开始，系统不再使用默认管理员账户。**

### 环境变量配置

在部署前，您必须设置以下环境变量：

```bash
# 管理员用户名（必需）
ADMIN_USERNAME=your_admin_username

# 管理员密码（必需）
ADMIN_PASSWORD=your_secure_password
```

### 管理员账户初始化

设置环境变量后，系统会在首次访问时自动创建管理员账户。您也可以通过访问以下API手动初始化：

```
POST /api/auth/init-admin
```

> ⚠️ **安全提示**: 请使用强密码，包含大小写字母、数字和特殊字符！

## 🔄 数据库关系扩展

为了支持用户系统，原有表也进行了扩展：

### messages表扩展
```sql
-- 添加用户关联字段
ALTER TABLE messages ADD COLUMN user_id INTEGER REFERENCES users(id);
```

### files表扩展
```sql
-- 添加用户关联字段
ALTER TABLE files ADD COLUMN user_id INTEGER REFERENCES users(id);
```

### devices表扩展
```sql
-- 添加用户关联字段
ALTER TABLE devices ADD COLUMN user_id INTEGER REFERENCES users(id);
```

## 🔧 数据库控制台操作

### 连接到数据库控制台
```bash
# 进入交互式数据库控制台
npx wrangler d1 execute wxchat --command=".help"
```

### 常用控制台命令
```bash
# 查看所有表
npx wrangler d1 execute wxchat --command="SELECT name FROM sqlite_master WHERE type='table';"

# 查看表结构
npx wrangler d1 execute wxchat --command="PRAGMA table_info(users);"

# 查看用户数据
npx wrangler d1 execute wxchat --command="SELECT id, username, role, created_at FROM users;"

# 查看消息统计
npx wrangler d1 execute wxchat --command="SELECT COUNT(*) as total_messages FROM messages;"

# 查看文件统计
npx wrangler d1 execute wxchat --command="SELECT COUNT(*) as total_files, SUM(file_size) as total_size FROM files;"
```

### 重置数据库（谨慎操作）
```bash
# 删除所有表（会丢失所有数据！）
npx wrangler d1 execute wxchat --command="DROP TABLE IF EXISTS admin_logs;"
npx wrangler d1 execute wxchat --command="DROP TABLE IF EXISTS daily_stats;"
npx wrangler d1 execute wxchat --command="DROP TABLE IF EXISTS sessions;"
npx wrangler d1 execute wxchat --command="DROP TABLE IF EXISTS users;"
npx wrangler d1 execute wxchat --command="DROP TABLE IF EXISTS messages;"
npx wrangler d1 execute wxchat --command="DROP TABLE IF EXISTS files;"
npx wrangler d1 execute wxchat --command="DROP TABLE IF EXISTS devices;"

# 然后重新初始化
npm run db:init-all
```

## ️ 故障排除

### 问题1：数据库创建失败
```bash
# 检查是否已登录
npx wrangler whoami

# 重新登录
npx wrangler login

# 检查账户权限
npx wrangler d1 list
```

### 问题2：表创建失败
```bash
# 检查SQL文件是否存在
ls -la database/

# 手动检查SQL语法
cat database/schema.sql
cat database/admin-schema.sql

# 检查数据库是否存在
npx wrangler d1 list
```

### 问题3：ALTER TABLE失败
如果在执行admin-schema.sql时遇到ALTER TABLE错误：
```bash
# 先检查表是否已存在
npx wrangler d1 execute wxchat --command="PRAGMA table_info(messages);"

# 如果表不存在，先执行基础schema
npm run db:init

# 然后再执行管理后台schema
npm run db:init-admin
```

### 问题4：权限问题
确保你的Cloudflare账户有D1数据库的创建权限。

### 问题5：数据库ID不匹配
```bash
# 查看已创建的数据库
npx wrangler d1 list

# 检查wrangler.toml中的database_id是否与实际创建的数据库ID一致
cat wrangler.toml
```

### 问题6：默认管理员账户无法登录
```bash
# 检查用户表是否有数据
npx wrangler d1 execute wxchat --command="SELECT * FROM users;"

# 如果没有数据，手动插入管理员账户
npx wrangler d1 execute wxchat --command="INSERT OR IGNORE INTO users (username, password_hash, role) VALUES ('admin', '\$2b\$10\$rQZ8kHp.TB.It.NuiNdxaOFvAiEKs.Tu/1B3Oa.xtMRZg5cT6/7.2', 'admin');"
```

## 📊 数据库表结构总结

### 新增的管理后台表（4个）

1. **users** - 用户表
   - 存储管理员和用户账户信息
   - 包含用户名、密码哈希、角色等字段
   - 默认创建admin账户（密码：admin123）

2. **sessions** - 会话表
   - 管理用户登录状态
   - 存储会话ID、用户ID、过期时间

3. **daily_stats** - 统计表
   - 存储每日数据统计
   - 包含消息数量、文件数量、活跃用户数等

4. **admin_logs** - 操作日志表
   - 记录管理员操作历史
   - 包含操作类型、目标、详情、IP地址等

### 扩展的原有表（3个）

1. **messages** - 消息表（新增user_id字段）
2. **files** - 文件表（新增user_id字段）
3. **devices** - 设备表（新增user_id字段）

### 创建的视图（2个）

1. **user_stats** - 用户统计视图
2. **daily_activity** - 每日活动视图

##  验证清单

在继续部署之前，请确认：

- [ ] D1数据库已创建
- [ ] R2存储桶已创建
- [ ] wrangler.toml配置正确
- [ ] 基础表已创建（messages, files, devices）
- [ ] 管理后台表已创建（users, sessions, daily_stats, admin_logs）
- [ ] 表扩展已完成（user_id字段已添加）
- [ ] 默认管理员账户已创建
- [ ] 数据库绑定配置正确

### 快速验证命令
```bash
# 检查所有表是否创建成功
npx wrangler d1 execute wxchat --command="SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"

# 检查管理员账户是否创建成功
npx wrangler d1 execute wxchat --command="SELECT username, role FROM users WHERE role='admin';"
```

## 🛠️ 可用的npm脚本

项目提供了多个便捷的npm脚本来管理数据库：

```bash
# 一键完成所有数据库设置（推荐）
npm run setup

# 手动初始化基础表
npm run db:init

# 手动初始化管理后台表
npm run db:init-admin

# 初始化所有表
npm run db:init-all

# 重置数据库（删除所有数据并重新创建表）
npm run db:reset
```

##  下一步

完成数据库设置后，你可以：

1. 运行 `npm run build:pages` 构建项目
2. 运行 `npm run pages:deploy` 部署到Cloudflare Pages
3. 在Cloudflare Dashboard中配置环境绑定
4. 访问管理后台测试功能（用户名：admin，密码：admin123）

## 💡 重要提示

- **安全性**：生产环境中必须修改默认管理员密码
- **备份**：定期备份数据库数据
- **监控**：监控数据库使用量和性能
- **维护**：根据需要调整表结构和索引
- **权限**：合理设置用户角色和权限

## 🔄 数据库维护

### 重置数据库
如果需要完全重置数据库（会删除所有数据）：
```bash
npm run db:reset
```

### 备份数据库
```bash
# 导出所有数据
npx wrangler d1 export wxchat --output=backup.sql
```

### 恢复数据库
```bash
# 从备份文件恢复
npx wrangler d1 execute wxchat --file=backup.sql
```