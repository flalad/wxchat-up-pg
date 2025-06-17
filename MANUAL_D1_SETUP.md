# D1数据库手动创建完整指南

## 📋 概述

本指南详细介绍如何手动创建和配置Cloudflare D1数据库，包括控制台操作和命令行操作两种方式。

## 🌐 方式一：Cloudflare Dashboard控制台操作

### 步骤1：登录Cloudflare Dashboard

1. 打开浏览器，访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 使用你的Cloudflare账户登录
3. 如果没有账户，点击"Sign Up"免费注册

### 步骤2：进入D1数据库管理页面

1. 在左侧导航栏中找到 **"Workers & Pages"**
2. 点击 **"D1 SQL Database"** 或直接访问 [D1管理页面](https://dash.cloudflare.com/d1)
3. 你会看到D1数据库的管理界面

### 步骤3：创建新的D1数据库

1. 点击右上角的 **"Create database"** 按钮
2. 在弹出的对话框中：
   - **Database name**: 输入 `wxchat`
   - **Location**: 选择离你最近的区域（推荐 Asia Pacific 或 Auto）
3. 点击 **"Create"** 按钮

### 步骤4：获取数据库信息

创建成功后，你会看到数据库详情页面：

1. **Database ID**: 复制这个ID（格式类似：`xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`）
2. **Database name**: 确认为 `wxchat`
3. **Region**: 显示数据库所在区域

### 步骤5：在控制台中执行SQL

1. 在数据库详情页面，点击 **"Console"** 标签
2. 你会看到一个SQL查询界面
3. 在查询框中输入以下命令来创建基础表：

```sql
-- 创建消息表
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK (type IN ('text', 'file')),
    content TEXT,
    file_id INTEGER,
    device_id TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (file_id) REFERENCES files(id)
);
```

4. 点击 **"Execute"** 按钮执行
5. 重复执行以下SQL语句创建其他表：

```sql
-- 创建文件表
CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    original_name TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    r2_key TEXT NOT NULL UNIQUE,
    upload_device_id TEXT NOT NULL,
    download_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

```sql
-- 创建设备表
CREATE TABLE IF NOT EXISTS devices (
    id TEXT PRIMARY KEY,
    name TEXT,
    last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 步骤6：创建管理后台表

继续在控制台中执行以下SQL创建管理后台相关表：

```sql
-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    email TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
);
```

```sql
-- 创建会话表
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

```sql
-- 创建统计表
CREATE TABLE IF NOT EXISTS daily_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE NOT NULL UNIQUE,
    message_count INTEGER DEFAULT 0,
    file_count INTEGER DEFAULT 0,
    total_file_size INTEGER DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

```sql
-- 创建操作日志表
CREATE TABLE IF NOT EXISTS admin_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT,
    details TEXT,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 步骤7：扩展原有表结构

```sql
-- 为原有表添加用户关联字段
ALTER TABLE messages ADD COLUMN user_id INTEGER REFERENCES users(id);
ALTER TABLE files ADD COLUMN user_id INTEGER REFERENCES users(id);
ALTER TABLE devices ADD COLUMN user_id INTEGER REFERENCES users(id);
```

### 步骤8：创建索引

```sql
-- 创建性能优化索引
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_messages_device_id ON messages(device_id);
CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(type);
CREATE INDEX IF NOT EXISTS idx_files_r2_key ON files(r2_key);
CREATE INDEX IF NOT EXISTS idx_files_upload_device ON files(upload_device_id);
CREATE INDEX IF NOT EXISTS idx_devices_last_active ON devices(last_active DESC);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(date DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_user_id ON admin_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);
CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices(user_id);
```

### 步骤9：插入默认数据

```sql
-- 插入默认设备
INSERT OR IGNORE INTO devices (id, name) VALUES 
('web-default', 'Web浏览器'),
('mobile-default', '移动设备');
```

```sql
-- 注意：从 v2.2.0 开始，不再插入默认管理员账户
-- 管理员账户将通过环境变量在首次访问时自动创建
-- 请确保在部署前设置 ADMIN_USERNAME 和 ADMIN_PASSWORD 环境变量
```

### 步骤10：验证表创建

```sql
-- 查看所有创建的表
SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;
```

应该看到以下表：
- admin_logs
- daily_stats
- devices
- files
- messages
- sessions
- users

## 🌐 方式二：命令行操作

### 前置要求

确保已安装Node.js和wrangler CLI：

```bash
# 安装wrangler CLI
npm install -g wrangler

# 或者使用npx（推荐）
npx wrangler --version
```

### 步骤1：登录Cloudflare

```bash
# 登录Cloudflare账户
npx wrangler login
```

这会打开浏览器进行OAuth认证。

### 步骤2：创建D1数据库

```bash
# 创建名为wxchat的D1数据库
npx wrangler d1 create wxchat
```

执行后会显示类似输出：
```
✅ Successfully created DB 'wxchat' in region APAC
Created your database using D1's new storage backend.

[[d1_databases]]
binding = "DB"
database_name = "wxchat"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**重要：复制显示的database_id！**

### 步骤3：更新项目配置

将获取的database_id添加到你的`wrangler.toml`文件中：

```toml
[[d1_databases]]
binding = "DB"
database_name = "wxchat"
database_id = "你复制的实际database_id"
```

### 步骤4：执行SQL文件初始化表

```bash
# 执行基础表结构
npx wrangler d1 execute wxchat --file=./database/schema.sql

# 执行管理后台表结构
npx wrangler d1 execute wxchat --file=./database/admin-schema.sql
```

### 步骤5：验证表创建

```bash
# 查看所有表
npx wrangler d1 execute wxchat --command="SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"

# 查看用户表数据
npx wrangler d1 execute wxchat --command="SELECT username, role FROM users;"
```

## 🔧 常用数据库操作命令

### 查询操作

```bash
# 查看表结构
npx wrangler d1 execute wxchat --command="PRAGMA table_info(users);"

# 查看消息数量
npx wrangler d1 execute wxchat --command="SELECT COUNT(*) as total_messages FROM messages;"

# 查看文件统计
npx wrangler d1 execute wxchat --command="SELECT COUNT(*) as total_files, SUM(file_size) as total_size FROM files;"

# 查看最近的消息
npx wrangler d1 execute wxchat --command="SELECT * FROM messages ORDER BY timestamp DESC LIMIT 10;"
```

### 管理操作

```bash
# 重置管理员密码（密码：newpassword123）
npx wrangler d1 execute wxchat --command="UPDATE users SET password_hash = '\$2b\$10\$example_hash_here' WHERE username = 'admin';"

# 清理过期会话
npx wrangler d1 execute wxchat --command="DELETE FROM sessions WHERE expires_at < datetime('now');"

# 查看数据库大小
npx wrangler d1 info wxchat
```

## 🛠️ 故障排除

### 问题1：权限不足

```bash
# 检查登录状态
npx wrangler whoami

# 重新登录
npx wrangler logout
npx wrangler login
```

### 问题2：数据库已存在

如果看到"already exists"错误：
```bash
# 查看现有数据库
npx wrangler d1 list

# 删除现有数据库（谨慎操作）
npx wrangler d1 delete wxchat
```

### 问题3：SQL执行失败

```bash
# 检查SQL文件是否存在
ls -la database/

# 手动执行单个SQL语句
npx wrangler d1 execute wxchat --command="CREATE TABLE test (id INTEGER);"
```

### 问题4：表结构问题

```bash
# 查看具体错误信息
npx wrangler d1 execute wxchat --command="PRAGMA integrity_check;"

# 重新创建表（会丢失数据）
npx wrangler d1 execute wxchat --command="DROP TABLE IF EXISTS table_name;"
```

## 📊 数据库监控

### 使用情况查看

```bash
# 查看数据库信息
npx wrangler d1 info wxchat

# 导出数据库备份
npx wrangler d1 export wxchat --output=backup.sql

# 从备份恢复
npx wrangler d1 execute wxchat --file=backup.sql
```

### 性能监控

在Cloudflare Dashboard中：
1. 进入D1数据库管理页面
2. 选择你的wxchat数据库
3. 查看"Metrics"标签页
4. 监控查询次数、响应时间等指标

## 🎯 最佳实践

1. **定期备份**：每周导出数据库备份
2. **监控使用量**：关注查询次数和存储大小
3. **索引优化**：根据查询模式调整索引
4. **安全管理**：定期更新管理员密码
5. **日志清理**：定期清理过期的会话和日志

## 📋 验证清单

完成手动创建后，请确认：

- [ ] D1数据库已创建并获取database_id
- [ ] wrangler.toml配置已更新
- [ ] 所有基础表已创建（messages, files, devices）
- [ ] 所有管理后台表已创建（users, sessions, daily_stats, admin_logs）
- [ ] 表扩展已完成（user_id字段已添加）
- [ ] 索引已创建
- [ ] 默认数据已插入
- [ ] 管理员账户可以正常登录

完成以上步骤后，你的D1数据库就可以支持完整的微信文件传输助手功能了！