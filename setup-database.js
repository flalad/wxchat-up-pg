#!/usr/bin/env node

/**
 * 数据库初始化脚本
 * 自动化完成D1数据库和R2存储桶的创建和配置
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 开始初始化数据库和存储...\n');

// 检查是否已登录
try {
    console.log('📋 检查Cloudflare登录状态...');
    const whoami = execSync('npx wrangler whoami', { encoding: 'utf8' });
    console.log('✅ 已登录:', whoami.trim());
} catch (error) {
    console.log('❌ 未登录Cloudflare，请先登录:');
    console.log('   npx wrangler login');
    process.exit(1);
}

// 创建D1数据库
try {
    console.log('\n📊 创建D1数据库...');
    const dbResult = execSync('npx wrangler d1 create wxchat', { encoding: 'utf8' });
    console.log(dbResult);
    
    // 提取database_id
    const dbIdMatch = dbResult.match(/database_id = "([^"]+)"/);
    if (dbIdMatch) {
        const databaseId = dbIdMatch[1];
        console.log(`✅ 数据库ID: ${databaseId}`);
        
        // 更新wrangler.toml
        const wranglerPath = path.join(__dirname, 'wrangler.toml');
        if (fs.existsSync(wranglerPath)) {
            let wranglerContent = fs.readFileSync(wranglerPath, 'utf8');
            
            // 替换或添加database_id
            if (wranglerContent.includes('database_id =')) {
                wranglerContent = wranglerContent.replace(
                    /database_id = "[^"]*"/,
                    `database_id = "${databaseId}"`
                );
            } else {
                // 如果没有找到，在[[d1_databases]]部分添加
                wranglerContent = wranglerContent.replace(
                    /(\[\[d1_databases\]\]\s*\nbinding = "DB"\s*\ndatabase_name = "wxchat")/,
                    `$1\ndatabase_id = "${databaseId}"`
                );
            }
            
            fs.writeFileSync(wranglerPath, wranglerContent);
            console.log('✅ wrangler.toml已更新');
        }
    }
} catch (error) {
    if (error.message.includes('already exists')) {
        console.log('ℹ️  数据库已存在，跳过创建');
    } else {
        console.error('❌ 创建数据库失败:', error.message);
        process.exit(1);
    }
}

// 创建R2存储桶
try {
    console.log('\n📁 创建R2存储桶...');
    const r2Result = execSync('npx wrangler r2 bucket create wxchat', { encoding: 'utf8' });
    console.log(r2Result);
    console.log('✅ R2存储桶创建成功');
} catch (error) {
    if (error.message.includes('already exists')) {
        console.log('ℹ️  R2存储桶已存在，跳过创建');
    } else {
        console.error('❌ 创建R2存储桶失败:', error.message);
        process.exit(1);
    }
}

// 初始化数据库表
try {
    console.log('\n🗄️  初始化数据库表结构...');
    
    // 检查SQL文件是否存在
    const schemaPath = path.join(__dirname, 'database', 'schema.sql');
    const adminSchemaPath = path.join(__dirname, 'database', 'admin-schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
        throw new Error('database/schema.sql 文件不存在');
    }
    
    if (!fs.existsSync(adminSchemaPath)) {
        throw new Error('database/admin-schema.sql 文件不存在');
    }
    
    // 执行基础表结构
    console.log('📋 创建基础表...');
    execSync('npm run db:init', { stdio: 'inherit' });
    
    // 执行管理后台表结构
    console.log('📋 创建管理后台表...');
    execSync('npm run db:init-admin', { stdio: 'inherit' });
    
    console.log('✅ 数据库表创建成功');
} catch (error) {
    console.error('❌ 初始化数据库表失败:', error.message);
    process.exit(1);
}

// 验证表创建
try {
    console.log('\n🔍 验证表创建...');
    const tables = execSync('npx wrangler d1 execute wxchat --command="SELECT name FROM sqlite_master WHERE type=\'table\' ORDER BY name;"', { encoding: 'utf8' });
    console.log('📊 已创建的表:');
    console.log(tables);
    
    // 检查管理员账户
    console.log('👤 检查管理员账户...');
    const adminCheck = execSync('npx wrangler d1 execute wxchat --command="SELECT username, role FROM users WHERE role=\'admin\';"', { encoding: 'utf8' });
    console.log('🔐 管理员账户:');
    console.log(adminCheck);
    
} catch (error) {
    console.error('❌ 验证失败:', error.message);
    process.exit(1);
}

console.log('\n🎉 数据库初始化完成！');
console.log('\n📋 接下来的步骤:');
console.log('1. 运行 npm run build:pages 构建项目');
console.log('2. 运行 npm run pages:deploy 部署到Cloudflare Pages');
console.log('3. 访问管理后台');
console.log('\n🔐 管理员账户信息:');
console.log('   用户名: admin (可通过 ADMIN_USERNAME 环境变量修改)');
console.log('   密码: admin123 (可通过 ADMIN_PASSWORD 环境变量修改)');
console.log('\n⚠️  重要提示:');
console.log('   1. 生产环境中请修改 wrangler.toml 中的环境变量');
console.log('   2. 建议设置强密码和自定义用户名');
console.log('   3. JWT_SECRET 也应该在生产环境中更改');