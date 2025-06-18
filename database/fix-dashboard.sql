-- 修复仪表板统计问题
-- 更新daily_activity视图使用timestamp字段而不是created_at

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

-- 添加一些调试信息以验证数据
SELECT 'DEBUG: 消息总数' as info, COUNT(*) as count FROM messages;
SELECT 'DEBUG: 今日消息' as info, COUNT(*) as count FROM messages WHERE DATE(timestamp) = DATE('now');
SELECT 'DEBUG: 文本消息' as info, COUNT(*) as count FROM messages WHERE type = 'text';
SELECT 'DEBUG: 文件消息' as info, COUNT(*) as count FROM messages WHERE type = 'file';