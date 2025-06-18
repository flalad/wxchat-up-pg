#!/usr/bin/env node

/**
 * 修复仪表板统计问题的脚本
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 开始修复仪表板统计问题...\n');

// 1. 应用视图修复
try {
  console.log('📊 更新daily_activity视图...');
  const fixSql = fs.readFileSync(path.join(__dirname, 'database', 'fix-dashboard.sql'), 'utf8');
  
  // 将SQL写入临时文件以便执行
  const tempSqlPath = path.join(__dirname, 'temp-fix.sql');
  fs.writeFileSync(tempSqlPath, fixSql);
  
  execSync(`npx wrangler d1 execute wxchat --file=${tempSqlPath}`, { stdio: 'inherit' });
  console.log('✅ daily_activity视图已更新');
  
  // 清理临时文件
  fs.unlinkSync(tempSqlPath);
} catch (error) {
  console.error('❌ 更新视图失败:', error.message);
}

// 2. 修复现有的无用户关联消息
try {
  console.log('\n🔄 修复现有无用户关联的消息...');
  
  // 确保存在默认用户
  const createDefaultUserSql = `
    INSERT OR IGNORE INTO users (username, password_hash, role, is_active, created_at)
    VALUES ('default_user', 'not_used', 'user', 1, CURRENT_TIMESTAMP);
    SELECT id FROM users WHERE username = 'default_user';
  `;
  
  // 将SQL写入临时文件
  const tempUserSqlPath = path.join(__dirname, 'temp-user.sql');
  fs.writeFileSync(tempUserSqlPath, createDefaultUserSql);
  
  // 执行SQL并获取默认用户ID
  const userResult = execSync(`npx wrangler d1 execute wxchat --file=${tempUserSqlPath}`, { encoding: 'utf8' });
  console.log('默认用户查询结果:', userResult);
  
  // 从输出中提取用户ID
  const userIdMatch = userResult.match(/\|\s*(\d+)\s*\|/);
  const defaultUserId = userIdMatch ? userIdMatch[1] : '1';
  
  console.log(`✅ 默认用户ID: ${defaultUserId}`);
  
  // 更新无用户关联的消息
  const updateMessagesSql = `
    UPDATE messages SET user_id = ${defaultUserId} WHERE user_id IS NULL;
    SELECT COUNT(*) as updated FROM messages WHERE user_id = ${defaultUserId};
  `;
  
  // 将SQL写入临时文件
  const tempUpdateSqlPath = path.join(__dirname, 'temp-update.sql');
  fs.writeFileSync(tempUpdateSqlPath, updateMessagesSql);
  
  // 执行SQL
  const updateResult = execSync(`npx wrangler d1 execute wxchat --file=${tempUpdateSqlPath}`, { encoding: 'utf8' });
  console.log('消息更新结果:', updateResult);
  
  // 清理临时文件
  fs.unlinkSync(tempUserSqlPath);
  fs.unlinkSync(tempUpdateSqlPath);
  
  console.log('✅ 已修复无用户关联的消息');
} catch (error) {
  console.error('❌ 修复消息关联失败:', error.message);
}

// 3. 诊断数据状态
try {
  console.log('\n🔍 诊断数据状态...');
  
  const diagnosticSql = `
    SELECT 'users表总数' as name, COUNT(*) as count FROM users;
    SELECT 'messages表总数' as name, COUNT(*) as count FROM messages;
    SELECT 'files表总数' as name, COUNT(*) as count FROM files;
    SELECT 'messages表中文本消息' as name, COUNT(*) as count FROM messages WHERE type = 'text';
    SELECT 'messages表中无user_id的消息' as name, COUNT(*) as count FROM messages WHERE user_id IS NULL;
    SELECT 'daily_activity今日记录' as name, COUNT(*) as count FROM daily_activity WHERE date = DATE('now');
    SELECT 'daily_activity所有记录' as name, COUNT(*) as count FROM daily_activity;
  `;
  
  // 将SQL写入临时文件
  const tempDiagSqlPath = path.join(__dirname, 'temp-diag.sql');
  fs.writeFileSync(tempDiagSqlPath, diagnosticSql);
  
  // 执行SQL
  const diagResult = execSync(`npx wrangler d1 execute wxchat --file=${tempDiagSqlPath}`, { encoding: 'utf8' });
  console.log('诊断结果:');
  console.log(diagResult);
  
  // 清理临时文件
  fs.unlinkSync(tempDiagSqlPath);
} catch (error) {
  console.error('❌ 诊断数据失败:', error.message);
}

console.log('\n🎉 修复完成！');
console.log('\n📋 接下来的步骤:');
console.log('1. 重新登录管理后台');
console.log('2. 刷新仪表板页面');
console.log('3. 验证统计数据是否已正确显示');
console.log('\n⚠️ 如果仍然有问题:');
console.log('1. 可能需要重新部署应用');
console.log('2. 检查浏览器控制台是否有错误');
console.log('3. 查看仪表板API的响应数据 (添加了调试信息)');