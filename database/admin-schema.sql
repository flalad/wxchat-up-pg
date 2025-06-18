-- 管理后台扩展数据库结构

-- 用户表
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

-- 会话表（用于管理登录状态）
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 统计表（用于存储每日统计数据）
CREATE TABLE IF NOT EXISTS daily_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE NOT NULL UNIQUE,
    message_count INTEGER DEFAULT 0,
    file_count INTEGER DEFAULT 0,
    total_file_size INTEGER DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 操作日志表
CREATE TABLE IF NOT EXISTS admin_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    target_type TEXT, -- 'message', 'file', 'user'
    target_id TEXT,
    details TEXT,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 扩展现有表结构
-- 为 messages 表添加用户关联（如果列不存在）
-- 注意：SQLite 的 ALTER TABLE ADD COLUMN 在某些情况下可能失败
-- 建议在初始化时检查列是否存在
ALTER TABLE messages ADD COLUMN user_id INTEGER REFERENCES users(id);

-- 为 files 表添加用户关联（如果列不存在）
ALTER TABLE files ADD COLUMN user_id INTEGER REFERENCES users(id);

-- 为 devices 表添加用户关联（如果列不存在）
ALTER TABLE devices ADD COLUMN user_id INTEGER REFERENCES users(id);

-- 如果需要添加这些列，请在数据库初始化脚本中处理
-- 或者重新创建表结构

-- 创建索引
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

-- 注意：默认管理员账户现在通过环境变量配置
-- 在实际部署时，管理员账户将通过 ADMIN_USERNAME 和 ADMIN_PASSWORD 环境变量创建
-- 默认值：用户名 'admin'，密码 'admin123'
-- 生产环境中请修改 wrangler.toml 中的环境变量值

-- 如果需要手动插入管理员账户，请使用以下SQL（密码：admin123）
-- INSERT OR IGNORE INTO users (username, password_hash, role) VALUES
-- ('admin', '$2b$10$rQZ8kHp.TB.It.NuiNdxaOFvAiEKs.Tu/1B3Oa.xtMRZg5cT6/7.2', 'admin');

-- 创建视图用于统计查询
CREATE VIEW IF NOT EXISTS user_stats AS
SELECT 
    u.id,
    u.username,
    u.role,
    u.created_at,
    u.last_login,
    COUNT(DISTINCT m.id) as message_count,
    COUNT(DISTINCT f.id) as file_count,
    COALESCE(SUM(f.file_size), 0) as total_file_size,
    COUNT(DISTINCT d.id) as device_count
FROM users u
LEFT JOIN messages m ON u.id = m.user_id
LEFT JOIN files f ON u.id = f.user_id
LEFT JOIN devices d ON u.id = d.user_id
GROUP BY u.id, u.username, u.role, u.created_at, u.last_login;

-- 创建视图用于每日统计
CREATE VIEW IF NOT EXISTS daily_activity AS
SELECT 
    DATE(created_at) as date,
    COUNT(CASE WHEN type = 'text' THEN 1 END) as text_messages,
    COUNT(CASE WHEN type = 'file' THEN 1 END) as file_messages,
    COUNT(*) as total_messages
FROM messages 
WHERE created_at >= DATE('now', '-30 days')
GROUP BY DATE(created_at)
ORDER BY date DESC;