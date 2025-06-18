// 应用仪表板修复脚本
import { createClient } from '@cloudflare/d1';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

// 加载环境变量（如果有.env文件）
config();

async function applyDashboardFix() {
  try {
    console.log('开始应用仪表板修复...');
    
    // 读取SQL脚本
    const sqlScript = readFileSync('./database/fix-dashboard.sql', 'utf8');
    console.log('已读取SQL脚本');
    
    // 连接到数据库
    // 注意：根据你的实际配置可能需要修改
    const client = createClient({
      databaseId: process.env.DATABASE_ID || process.env.DB_ID
    });
    
    // 分割SQL语句并执行
    const statements = sqlScript.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const stmt of statements) {
      console.log(`执行SQL: ${stmt.substring(0, 80)}...`);
      await client.exec(stmt);
    }
    
    console.log('仪表板修复已成功应用！');
    console.log('现在应该可以在管理员仪表板中看到消息统计数据。');
    
    // 查询当前消息统计，用于验证
    const messageCount = await client.prepare(
      "SELECT COUNT(*) as count FROM messages WHERE type = 'text'"
    ).first();
    
    console.log(`系统中共有 ${messageCount.count} 条文本消息`);
    
    // 查询今日消息
    const todayMessages = await client.prepare(
      "SELECT COUNT(*) as count FROM messages WHERE type = 'text' AND DATE(timestamp) = DATE('now')"
    ).first();
    
    console.log(`今日共有 ${todayMessages.count} 条文本消息`);
    
  } catch (error) {
    console.error('应用修复时出错:', error);
    process.exit(1);
  }
}

applyDashboardFix();