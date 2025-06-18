// 仪表板诊断API - 用于排查问题

export async function onRequestGet(context) {
  try {
    const { env, request } = context
    const { DB } = env
    
    // 验证管理员权限
    const authResult = await verifyAdminAuth(request, DB)
    if (!authResult.success) {
      return new Response(JSON.stringify(authResult), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    // 开始诊断
    const diagnosticResults = {}
    
    // 1. 检查数据库连接
    diagnosticResults.db_binding = !!DB
    diagnosticResults.env_keys = Object.keys(env)
    
    // 2. 检查基本表数据
    try {
      // 查询用户表
      const usersStmt = DB.prepare(`SELECT COUNT(*) as count FROM users`)
      const usersResult = await usersStmt.first()
      diagnosticResults.users_count = usersResult?.count || 0
      
      // 查询消息表
      const messagesStmt = DB.prepare(`SELECT COUNT(*) as count FROM messages`)
      const messagesResult = await messagesStmt.first()
      diagnosticResults.messages_count = messagesResult?.count || 0
      
      // 查询文件表
      const filesStmt = DB.prepare(`SELECT COUNT(*) as count FROM files`)
      const filesResult = await filesStmt.first()
      diagnosticResults.files_count = filesResult?.count || 0
      
      // 查询设备表
      const devicesStmt = DB.prepare(`SELECT COUNT(*) as count FROM devices`)
      const devicesResult = await devicesStmt.first()
      diagnosticResults.devices_count = devicesResult?.count || 0
    } catch (error) {
      diagnosticResults.basic_tables_error = error.message
    }
    
    // 3. 检查视图
    try {
      // 检查视图是否存在
      const viewsStmt = DB.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='view' AND name IN ('daily_activity', 'user_stats')
      `)
      const viewsResult = await viewsStmt.all()
      diagnosticResults.views = viewsResult.results || []
      
      // 检查daily_activity视图
      try {
        const activityStmt = DB.prepare(`SELECT COUNT(*) as count FROM daily_activity`)
        const activityResult = await activityStmt.first()
        diagnosticResults.daily_activity_count = activityResult?.count || 0
      } catch (error) {
        diagnosticResults.daily_activity_error = error.message
      }
      
      // 检查user_stats视图
      try {
        const userStatsStmt = DB.prepare(`SELECT COUNT(*) as count FROM user_stats`)
        const userStatsResult = await userStatsStmt.first()
        diagnosticResults.user_stats_count = userStatsResult?.count || 0
      } catch (error) {
        diagnosticResults.user_stats_error = error.message
      }
    } catch (error) {
      diagnosticResults.views_error = error.message
    }
    
    // 4. 检查消息中的用户关联
    try {
      const userAssocStmt = DB.prepare(`
        SELECT 
          CASE WHEN user_id IS NULL THEN 'no_user' ELSE 'has_user' END as status,
          COUNT(*) as count
        FROM messages
        GROUP BY status
      `)
      const userAssocResult = await userAssocStmt.all()
      diagnosticResults.message_user_association = userAssocResult.results || []
    } catch (error) {
      diagnosticResults.message_user_error = error.message
    }
    
    // 5. 直接执行仪表板查询
    try {
      // 总体统计
      const totalStatsStmt = DB.prepare(`
        SELECT
          (SELECT COUNT(*) FROM users WHERE is_active = 1) as total_users,
          (SELECT COUNT(*) FROM messages WHERE type = 'text') as total_messages,
          (SELECT COUNT(*) FROM files) as total_files,
          (SELECT COALESCE(SUM(file_size), 0) FROM files) as total_file_size,
          (SELECT COUNT(DISTINCT device_id) FROM messages) as active_devices
      `)
      const totalStats = await totalStatsStmt.first()
      diagnosticResults.total_stats = totalStats
      
      // 今日统计
      const todayStatsStmt = DB.prepare(`
        SELECT
          (SELECT COUNT(*) FROM messages WHERE type = 'text' AND DATE(timestamp) = DATE('now')) as today_messages,
          (SELECT COUNT(*) FROM files WHERE DATE(created_at) = DATE('now')) as today_files
      `)
      const todayStats = await todayStatsStmt.first()
      diagnosticResults.today_stats = todayStats
      
      // 检查日期格式和日期相关查询
      const dateCheckStmt = DB.prepare(`
        SELECT 
          DATE('now') as current_date,
          CURRENT_TIMESTAMP as current_timestamp
      `)
      const dateCheck = await dateCheckStmt.first()
      diagnosticResults.date_check = dateCheck
    } catch (error) {
      diagnosticResults.dashboard_query_error = error.message
    }
    
    // 6. 检查消息样本
    try {
      const messageSampleStmt = DB.prepare(`
        SELECT id, type, content, device_id, timestamp, created_at, user_id
        FROM messages
        LIMIT 5
      `)
      const messageSampleResult = await messageSampleStmt.all()
      diagnosticResults.message_samples = messageSampleResult.results || []
    } catch (error) {
      diagnosticResults.message_sample_error = error.message
    }

    return new Response(JSON.stringify({
      success: true,
      diagnostics: diagnosticResults,
      timestamp: new Date().toISOString()
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack || ''
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
}

// 验证管理员权限
async function verifyAdminAuth(request, DB) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { success: false, error: '未提供认证信息' }
  }

  const sessionId = authHeader.substring(7)
  
  const sessionStmt = DB.prepare(`
    SELECT s.user_id, u.username, u.role
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.id = ? AND s.expires_at > CURRENT_TIMESTAMP AND u.is_active = 1
  `)
  const session = await sessionStmt.bind(sessionId).first()

  if (!session) {
    return { success: false, error: '会话已过期或无效' }
  }

  if (session.role !== 'admin') {
    return { success: false, error: '权限不足' }
  }

  return { success: true, user: session }
}