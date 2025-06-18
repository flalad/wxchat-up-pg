// 安全的数据库初始化脚本
// 用于处理表结构更新和数据迁移

const fs = require('fs');
const path = require('path');

// 检查列是否存在的SQL函数
function checkColumnExists(tableName, columnName) {
  return `
    SELECT COUNT(*) as count 
    FROM pragma_table_info('${tableName}') 
    WHERE name = '${columnName}'
  `;
}

// 安全添加列的SQL
function safeAddColumn(tableName, columnName, columnType) {
  return `
    -- 检查并添加 ${columnName} 列到 ${tableName} 表
    -- 只有当列不存在时才添加
    INSERT INTO temp_sql_commands 
    SELECT 'ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnType};'
    WHERE NOT EXISTS (
      SELECT 1 FROM pragma_table_info('${tableName}') 
      WHERE name = '${columnName}'
    );
  `;
}

// 生成安全的数据库更新脚本
function generateSafeUpdateScript() {
  return `
-- 安全的数据库结构更新脚本
-- 此脚本会检查列是否存在，只在需要时添加新列

-- 创建临时表来存储需要执行的SQL命令
CREATE TEMP TABLE IF NOT EXISTS temp_sql_commands (sql_command TEXT);

-- 检查并添加 user_id 列到 messages 表
${safeAddColumn('messages', 'user_id', 'INTEGER REFERENCES users(id)')}

-- 检查并添加 user_id 列到 files 表  
${safeAddColumn('files', 'user_id', 'INTEGER REFERENCES users(id)')}

-- 检查并添加 user_id 列到 devices 表
${safeAddColumn('devices', 'user_id', 'INTEGER REFERENCES users(id)')}

-- 执行收集到的SQL命令
-- 注意：在实际应用中，需要通过应用程序代码来执行这些命令
-- 因为SQLite不支持动态SQL执行

-- 查看需要执行的命令
SELECT sql_command FROM temp_sql_commands;

-- 清理临时表
DROP TABLE IF EXISTS temp_sql_commands;

-- 创建索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);
CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices(user_id);

-- 验证表结构
SELECT 'messages' as table_name, name as column_name, type as column_type 
FROM pragma_table_info('messages')
UNION ALL
SELECT 'files' as table_name, name as column_name, type as column_type 
FROM pragma_table_info('files')
UNION ALL  
SELECT 'devices' as table_name, name as column_name, type as column_type 
FROM pragma_table_info('devices')
ORDER BY table_name, column_name;
  `;
}

// Node.js 脚本部分（用于本地开发）
if (typeof module !== 'undefined' && module.exports) {
  // 数据库连接函数（需要根据实际环境调整）
  async function updateDatabaseSchema(db) {
    try {
      console.log('开始检查数据库结构...');
      
      // 检查 messages 表是否有 user_id 列
      const messagesCheck = await db.prepare(checkColumnExists('messages', 'user_id')).first();
      if (messagesCheck.count === 0) {
        console.log('添加 user_id 列到 messages 表...');
        await db.prepare('ALTER TABLE messages ADD COLUMN user_id INTEGER REFERENCES users(id)').run();
      }
      
      // 检查 files 表是否有 user_id 列
      const filesCheck = await db.prepare(checkColumnExists('files', 'user_id')).first();
      if (filesCheck.count === 0) {
        console.log('添加 user_id 列到 files 表...');
        await db.prepare('ALTER TABLE files ADD COLUMN user_id INTEGER REFERENCES users(id)').run();
      }
      
      // 检查 devices 表是否有 user_id 列
      const devicesCheck = await db.prepare(checkColumnExists('devices', 'user_id')).first();
      if (devicesCheck.count === 0) {
        console.log('添加 user_id 列到 devices 表...');
        await db.prepare('ALTER TABLE devices ADD COLUMN user_id INTEGER REFERENCES users(id)').run();
      }
      
      // 创建索引
      await db.prepare('CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id)').run();
      await db.prepare('CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id)').run();
      await db.prepare('CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices(user_id)').run();
      
      console.log('数据库结构更新完成！');
      
    } catch (error) {
      console.error('数据库结构更新失败:', error);
      throw error;
    }
  }
  
  module.exports = {
    updateDatabaseSchema,
    generateSafeUpdateScript,
    checkColumnExists,
    safeAddColumn
  };
}

// 如果直接运行此脚本，生成SQL文件
if (require.main === module) {
  const sqlScript = generateSafeUpdateScript();
  fs.writeFileSync(path.join(__dirname, 'database', 'safe-update.sql'), sqlScript);
  console.log('安全更新脚本已生成: database/safe-update.sql');
}