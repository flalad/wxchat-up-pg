# 仪表板统计问题修复指南

## 问题描述

管理员账号登录后台后，仪表板界面无法统计到前台发送的消息信息。即使在前台发送了消息，仪表板上的统计数据仍然显示为零。

## 问题原因

通过代码分析，我们发现了以下问题：

1. **字段不一致**：消息表(`messages`)主要使用`timestamp`字段记录消息时间，但仪表板查询和`daily_activity`视图使用的是`created_at`字段进行统计。

2. **视图定义问题**：`daily_activity`视图使用`created_at`字段进行日期分组，导致无法正确统计到使用`timestamp`字段存储的消息时间。

## 修复方案

我们已经进行了以下修改：

1. 更新了仪表板API端点(`functions/api/admin/dashboard.js`)中的今日统计查询，使其使用`timestamp`字段而不是`created_at`。

2. 创建了SQL脚本(`database/fix-dashboard.sql`)来重新定义`daily_activity`视图，使其使用`timestamp`字段进行统计。

3. 提供了应用脚本(`apply-dashboard-fix.js`)来执行SQL修复。

## 应用修复步骤

### 方法一：使用提供的脚本（推荐）

1. 确保已安装必要的依赖：
   ```bash
   npm install @cloudflare/d1 dotenv
   ```

2. 执行修复脚本：
   ```bash
   node apply-dashboard-fix.js
   ```

3. 刷新管理员仪表板页面，验证统计数据是否正确显示。

### 方法二：手动执行SQL脚本

1. 使用Cloudflare D1 控制台或其他数据库管理工具。

2. 执行`database/fix-dashboard.sql`中的SQL语句：
   ```sql
   -- 删除旧视图
   DROP VIEW IF EXISTS daily_activity;

   -- 重新创建视图使用timestamp字段
   CREATE VIEW daily_activity AS
   SELECT 
       DATE(timestamp) as date,
       COUNT(CASE WHEN type = 'text' THEN 1 END) as text_messages,
       COUNT(CASE WHEN type = 'file' THEN 1 END) as file_messages,
       COUNT(*) as total_messages
   FROM messages 
   WHERE timestamp >= DATE('now', '-30 days')
   GROUP BY DATE(timestamp)
   ORDER BY date DESC;
   ```

3. 刷新管理员仪表板页面，验证统计数据是否正确显示。

## 验证修复

应用修复后，您应该能够在管理员仪表板上看到：

1. "今日消息"数量正确反映当天发送的文本消息数量
2. "最近7天活动"图表正确显示每日消息统计
3. "总体统计"中的消息总数正确更新

如果您仍然遇到问题，请检查浏览器控制台是否有任何错误信息，并确保前台发送的消息正确设置了`timestamp`字段。