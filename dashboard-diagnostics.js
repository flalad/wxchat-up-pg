#!/usr/bin/env node

/**
 * 仪表板诊断脚本
 * 用于诊断仪表板统计问题并生成详细报告
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 仪表板诊断工具\n');

// 输出分隔线
function printDivider() {
  console.log('='.repeat(60));
}

// 将结果写入日志文件
let diagnosticLog = '# 仪表板诊断报告\n\n';
function log(message) {
  console.log(message);
  diagnosticLog += message + '\n';
}

printDivider();
log('## 1. 数据库表状态检查');

// 检查表结构和数据
try {
  log('\n### 表存在性检查');
  const tables = execSync(
    'npx wrangler d1 execute wxchat --command="SELECT name FROM sqlite_master WHERE type=\'table\'"', 
    { encoding: 'utf8' }
  );
  log('数据库表:');
  log('```');
  log(tables);
  log('```');
  
  log('\n### 基本数据统计');
  const counts = execSync(
    `npx wrangler d1 execute wxchat --command="
    SELECT 'users' as table_name, COUNT(*) as count FROM users
    UNION ALL SELECT 'messages', COUNT(*) FROM messages
    UNION ALL SELECT 'files', COUNT(*) FROM files
    UNION ALL SELECT 'devices', COUNT(*) FROM devices
    UNION ALL SELECT 'sessions', COUNT(*) FROM sessions;"`,
    { encoding: 'utf8' }
  );
  log('表数据计数:');
  log('```');
  log(counts);
  log('```');
  
  log('\n### 消息类型分布');
  const messageTypes = execSync(
    `npx wrangler d1 execute wxchat --command="
    SELECT type, COUNT(*) as count FROM messages GROUP BY type;"`,
    { encoding: 'utf8' }
  );
  log('消息类型:');
  log('```');
  log(messageTypes);
  log('```');
} catch (error) {
  log('❌ 表结构检查失败: ' + error.message);
}

printDivider();
log('\n## 2. 视图检查');

// 检查视图定义
try {
  log('\n### 视图存在性检查');
  const views = execSync(
    'npx wrangler d1 execute wxchat --command="SELECT name FROM sqlite_master WHERE type=\'view\'"', 
    { encoding: 'utf8' }
  );
  log('数据库视图:');
  log('```');
  log(views);
  log('```');
  
  log('\n### daily_activity视图定义');
  const viewDef = execSync(
    'npx wrangler d1 execute wxchat --command="SELECT sql FROM sqlite_master WHERE name=\'daily_activity\'"', 
    { encoding: 'utf8' }
  );
  log('视图定义:');
  log('```');
  log(viewDef);
  log('```');
  
  log('\n### daily_activity数据样本');
  const viewData = execSync(
    'npx wrangler d1 execute wxchat --command="SELECT * FROM daily_activity LIMIT 5"', 
    { encoding: 'utf8' }
  );
  log('数据样本:');
  log('```');
  log(viewData);
  log('```');
} catch (error) {
  log('❌ 视图检查失败: ' + error.message);
}

printDivider();
log('\n## 3. 用户关联检查');

// 检查消息用户关联
try {
  log('\n### 消息-用户关联状态');
  const userAssoc = execSync(
    `npx wrangler d1 execute wxchat --command="
    SELECT 
      CASE WHEN user_id IS NULL THEN '无用户关联' ELSE '已关联用户' END as status,
      COUNT(*) as count 
    FROM messages 
    GROUP BY status;"`,
    { encoding: 'utf8' }
  );
  log('用户关联状态:');
  log('```');
  log(userAssoc);
  log('```');
  
  log('\n### 今日消息计数(基于timestamp)');
  const todayMsgs = execSync(
    `npx wrangler d1 execute wxchat --command="
    SELECT COUNT(*) as count FROM messages 
    WHERE type = 'text' AND DATE(timestamp) = DATE('now');"`,
    { encoding: 'utf8' }
  );
  log('今日消息:');
  log('```');
  log(todayMsgs);
  log('```');
  
  log('\n### 今日消息计数(基于created_at)');
  const todayMsgsCreated = execSync(
    `npx wrangler d1 execute wxchat --command="
    SELECT COUNT(*) as count FROM messages 
    WHERE type = 'text' AND DATE(created_at) = DATE('now');"`,
    { encoding: 'utf8' }
  );
  log('今日消息(created_at):');
  log('```');
  log(todayMsgsCreated);
  log('```');
} catch (error) {
  log('❌ 用户关联检查失败: ' + error.message);
}

printDivider();
log('\n## 4. 消息样本检查');

// 检查消息样本
try {
  log('\n### 最近消息样本');
  const recentMsgs = execSync(
    `npx wrangler d1 execute wxchat --command="
    SELECT id, type, content, device_id, user_id, timestamp, created_at
    FROM messages 
    ORDER BY timestamp DESC LIMIT 5;"`,
    { encoding: 'utf8' }
  );
  log('最近消息:');
  log('```');
  log(recentMsgs);
  log('```');
} catch (error) {
  log('❌ 消息样本检查失败: ' + error.message);
}

printDivider();
log('\n## 5. 诊断结论');

log(`
### 可能的问题:

1. 如果"无用户关联"消息数量大于0，这可能是仪表板无法统计的原因
2. 如果今日消息计数(timestamp)与今日消息计数(created_at)不同，视图定义可能有问题
3. 如果daily_activity视图定义中使用的是created_at而不是timestamp，需要更新视图
4. 如果users表为空，仪表板会显示用户数为0

### 建议操作:

1. 执行 \`node fix-dashboard-issues.js\` 应用完整修复
2. 确保daily_activity视图使用timestamp字段
3. 确保所有消息都关联到用户
4. 重新部署应用后刷新仪表板页面
`);

// 保存诊断报告
const reportPath = path.join(__dirname, 'dashboard-diagnostic-report.md');
fs.writeFileSync(reportPath, diagnosticLog);

console.log(`\n✅ 诊断完成! 报告已保存至: ${reportPath}`);