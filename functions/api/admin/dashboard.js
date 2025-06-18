// 管理后台仪表板数据
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

    // 获取总体统计数据
    const totalStatsStmt = DB.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE is_active = 1) as total_users,
        (SELECT COUNT(*) FROM messages) as total_messages,
        (SELECT COUNT(*) FROM files) as total_files,
        (SELECT COALESCE(SUM(file_size), 0) FROM files) as total_file_size,
        (SELECT COUNT(DISTINCT device_id) FROM messages) as active_devices
    `)
    const totalStats = await totalStatsStmt.first()

    // 获取今日统计
    const todayStatsStmt = DB.prepare(`
      SELECT 
        COUNT(CASE WHEN type = 'text' THEN 1 END) as today_messages,
        COUNT(CASE WHEN type = 'file' THEN 1 END) as today_files
      FROM messages 
      WHERE DATE(created_at) = DATE('now')
    `)
    const todayStats = await todayStatsStmt.first()

    // 获取最近7天的活动数据
    const weeklyActivityStmt = DB.prepare(`
      SELECT 
        DATE(created_at) as date,
        COUNT(CASE WHEN type = 'text' THEN 1 END) as messages,
        COUNT(CASE WHEN type = 'file' THEN 1 END) as files
      FROM messages 
      WHERE created_at >= DATE('now', '-7 days')
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `)
    const weeklyActivity = await weeklyActivityStmt.all()

    // 获取最近注册的用户
    const recentUsersStmt = DB.prepare(`
      SELECT username, created_at, last_login
      FROM users 
      WHERE is_active = 1
      ORDER BY created_at DESC 
      LIMIT 5
    `)
    const recentUsers = await recentUsersStmt.all()

    // 获取文件类型统计
    const fileTypesStmt = DB.prepare(`
      SELECT 
        CASE 
          WHEN mime_type LIKE 'image/%' THEN '图片'
          WHEN mime_type LIKE 'video/%' THEN '视频'
          WHEN mime_type LIKE 'audio/%' THEN '音频'
          WHEN mime_type LIKE 'application/pdf' THEN 'PDF'
          WHEN mime_type LIKE 'text/%' THEN '文本'
          ELSE '其他'
        END as file_type,
        COUNT(*) as count,
        SUM(file_size) as total_size
      FROM files
      GROUP BY file_type
      ORDER BY count DESC
    `)
    const fileTypes = await fileTypesStmt.all()

    // 获取存储使用情况
    const storageStmt = DB.prepare(`
      SELECT 
        COUNT(*) as file_count,
        SUM(file_size) as used_space,
        AVG(file_size) as avg_file_size,
        MAX(file_size) as max_file_size
      FROM files
    `)
    const storageInfo = await storageStmt.first()

    return new Response(JSON.stringify({
      success: true,
      data: {
        totalStats: {
          users: totalStats.total_users,
          messages: totalStats.total_messages,
          files: totalStats.total_files,
          fileSize: totalStats.total_file_size,
          devices: totalStats.active_devices
        },
        todayStats: {
          messages: todayStats.today_messages,
          files: todayStats.today_files
        },
        weeklyActivity: weeklyActivity.results || [],
        recentUsers: recentUsers.results || [],
        fileTypes: fileTypes.results || [],
        storage: {
          fileCount: storageInfo.file_count,
          usedSpace: storageInfo.used_space,
          avgFileSize: storageInfo.avg_file_size,
          maxFileSize: storageInfo.max_file_size,
          // 假设总容量为10GB
          totalSpace: 10 * 1024 * 1024 * 1024,
          usagePercent: (storageInfo.used_space / (10 * 1024 * 1024 * 1024)) * 100
        }
      }
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
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