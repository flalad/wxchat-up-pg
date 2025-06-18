#!/usr/bin/env node

/**
 * 统计计数器初始化脚本
 * 从数据库导入初始计数数据
 */

const { execSync } = require('child_process');
const fetch = require('node-fetch');

console.log('🔢 开始初始化统计计数器...\n');

// 获取部署URL
const getDeployUrl = () => {
  const input = process.argv[2] || '';
  if (input.startsWith('http')) {
    return input;
  }
  
  console.log('请提供部署URL作为参数，例如: node init-counters.js https://your-app.pages.dev');
  process.exit(1);
};

// 从数据库获取统计数据
async function getStatsFromDatabase() {
  try {
    // 查询用户数量
    console.log('📊 从数据库获取统计数据...');
    
    const usersCount = execSync(
      'npx wrangler d1 execute wxchat --command="SELECT COUNT(*) as count FROM users WHERE is_active = 1;"',
      { encoding: 'utf8' }
    );
    console.log('用户查询结果:', usersCount);
    
    const messagesCount = execSync(
      'npx wrangler d1 execute wxchat --command="SELECT COUNT(*) as count FROM messages WHERE type = \'text\';"',
      { encoding: 'utf8' }
    );
    console.log('消息查询结果:', messagesCount);
    
    const filesCount = execSync(
      'npx wrangler d1 execute wxchat --command="SELECT COUNT(*) as count FROM files;"',
      { encoding: 'utf8' }
    );
    console.log('文件查询结果:', filesCount);
    
    const filesSize = execSync(
      'npx wrangler d1 execute wxchat --command="SELECT COALESCE(SUM(file_size), 0) as total FROM files;"',
      { encoding: 'utf8' }
    );
    console.log('文件大小查询结果:', filesSize);
    
    const devicesCount = execSync(
      'npx wrangler d1 execute wxchat --command="SELECT COUNT(DISTINCT device_id) as count FROM messages;"',
      { encoding: 'utf8' }
    );
    console.log('设备查询结果:', devicesCount);
    
    const todayMessages = execSync(
      'npx wrangler d1 execute wxchat --command="SELECT COUNT(*) as count FROM messages WHERE type = \'text\' AND DATE(timestamp) = DATE(\'now\');"',
      { encoding: 'utf8' }
    );
    console.log('今日消息查询结果:', todayMessages);
    
    const todayFiles = execSync(
      'npx wrangler d1 execute wxchat --command="SELECT COUNT(*) as count FROM files WHERE DATE(created_at) = DATE(\'now\');"',
      { encoding: 'utf8' }
    );
    console.log('今日文件查询结果:', todayFiles);
    
    // 从输出中提取数值
    const extractCount = (output) => {
      const match = output.match(/\|\s*(\d+)\s*\|/);
      return match ? parseInt(match[1], 10) : 0;
    };
    
    return {
      total_users: extractCount(usersCount),
      total_messages: extractCount(messagesCount),
      total_files: extractCount(filesCount),
      total_file_size: extractCount(filesSize),
      active_devices: extractCount(devicesCount),
      today_messages: extractCount(todayMessages),
      today_files: extractCount(todayFiles)
    };
  } catch (error) {
    console.error('获取统计数据失败:', error);
    process.exit(1);
  }
}

// 更新计数器服务
async function updateCounters(deployUrl, stats, adminSession) {
  try {
    console.log('\n📝 更新计数器服务...');
    
    // 为每个计数器创建请求
    for (const [key, value] of Object.entries(stats)) {
      if (value > 0) {
        console.log(`更新 ${key}: ${value}`);
        
        const response = await fetch(`${deployUrl}/api/admin/stats-counter`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminSession}`
          },
          body: JSON.stringify({
            type: key,
            count: value,
            mode: 'set'  // 设置绝对值，而不是增量
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`更新 ${key} 失败: ${response.status} ${errorText}`);
        } else {
          console.log(`✅ ${key} 更新成功`);
        }
      }
    }
    
    console.log('\n📊 验证计数器状态...');
    const verifyResponse = await fetch(`${deployUrl}/api/admin/stats-counter`, {
      headers: {
        'Authorization': `Bearer ${adminSession}`
      }
    });
    
    if (verifyResponse.ok) {
      const data = await verifyResponse.json();
      console.log('当前计数器状态:', data.data);
    } else {
      console.error('无法验证计数器状态');
    }
  } catch (error) {
    console.error('更新计数器失败:', error);
  }
}

// 获取管理员会话
async function getAdminSession(deployUrl) {
  try {
    console.log('\n🔐 获取管理员会话...');
    
    // 从环境变量或命令行参数获取凭据
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    
    const response = await fetch(`${deployUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username,
        password
      })
    });
    
    if (!response.ok) {
      throw new Error(`登录失败: ${response.status}`);
    }
    
    const data = await response.json();
    if (!data.success || !data.data || !data.data.sessionId) {
      throw new Error('获取会话ID失败');
    }
    
    console.log('✅ 管理员登录成功');
    return data.data.sessionId;
  } catch (error) {
    console.error('获取管理员会话失败:', error);
    process.exit(1);
  }
}

// 主函数
async function main() {
  const deployUrl = getDeployUrl();
  console.log(`🌐 部署URL: ${deployUrl}`);
  
  // 1. 获取管理员会话
  const adminSession = await getAdminSession(deployUrl);
  
  // 2. 从数据库获取统计数据
  const stats = await getStatsFromDatabase();
  console.log('\n📊 数据库统计结果:', stats);
  
  // 3. 更新计数器服务
  await updateCounters(deployUrl, stats, adminSession);
  
  console.log('\n🎉 统计计数器初始化完成！');
  console.log('\n现在您可以访问管理员仪表板，查看统计数据。');
}

// 执行主函数
main().catch(error => {
  console.error('初始化失败:', error);
  process.exit(1);
});