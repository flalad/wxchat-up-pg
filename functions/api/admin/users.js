// 管理后台用户管理
export async function onRequestGet(context) {
  try {
    const { env, request } = context
    const { DB } = env
    const url = new URL(request.url)
    
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

    const page = parseInt(url.searchParams.get('page')) || 1
    const limit = parseInt(url.searchParams.get('limit')) || 20
    const search = url.searchParams.get('search')
    const role = url.searchParams.get('role')
    const isActive = url.searchParams.get('isActive')
    const offset = (page - 1) * limit

    // 构建查询条件
    let whereConditions = []
    let params = []

    if (search) {
      whereConditions.push('(u.username LIKE ? OR u.email LIKE ?)')
      const searchPattern = `%${search}%`
      params.push(searchPattern, searchPattern)
    }

    if (role && ['admin', 'user'].includes(role)) {
      whereConditions.push('u.role = ?')
      params.push(role)
    }

    if (isActive !== null && isActive !== undefined) {
      whereConditions.push('u.is_active = ?')
      params.push(isActive === 'true' ? 1 : 0)
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : ''

    // 获取用户列表及统计信息
    const usersStmt = DB.prepare(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.role,
        u.is_active,
        u.created_at,
        u.last_login,
        COUNT(DISTINCT m.id) as message_count,
        COUNT(DISTINCT f.id) as file_count,
        COALESCE(SUM(f.file_size), 0) as total_file_size,
        COUNT(DISTINCT d.id) as device_count
      FROM users u
      LEFT JOIN messages m ON u.id = m.user_id
      LEFT JOIN files f ON u.id = f.user_id
      LEFT JOIN devices d ON u.id = d.user_id
      ${whereClause}
      GROUP BY u.id, u.username, u.email, u.role, u.is_active, u.created_at, u.last_login
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `)

    const users = await usersStmt.bind(...params, limit, offset).all()

    // 获取总数
    const countStmt = DB.prepare(`
      SELECT COUNT(*) as total
      FROM users u
      ${whereClause}
    `)
    const countResult = await countStmt.bind(...params).first()

    // 获取用户统计概览
    const statsStmt = DB.prepare(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
        COUNT(CASE WHEN role = 'user' THEN 1 END) as user_count,
        COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_count,
        COUNT(CASE WHEN last_login >= DATE('now', '-7 days') THEN 1 END) as recent_active
      FROM users
    `)
    const stats = await statsStmt.first()

    return new Response(JSON.stringify({
      success: true,
      data: {
        users: users.results,
        pagination: {
          page,
          limit,
          total: countResult.total,
          totalPages: Math.ceil(countResult.total / limit)
        },
        stats: {
          totalUsers: stats.total_users,
          adminCount: stats.admin_count,
          userCount: stats.user_count,
          activeCount: stats.active_count,
          recentActiveCount: stats.recent_active
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

// 更新用户状态
export async function onRequestPut(context) {
  try {
    const { env, request } = context
    const { DB } = env
    const url = new URL(request.url)
    const userId = url.pathname.split('/').pop()
    const { isActive, role } = await request.json()

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

    // 检查用户是否存在
    const userStmt = DB.prepare('SELECT * FROM users WHERE id = ?')
    const user = await userStmt.bind(userId).first()

    if (!user) {
      return new Response(JSON.stringify({
        success: false,
        error: '用户不存在'
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    // 防止管理员禁用自己
    if (userId == authResult.user.user_id && isActive === false) {
      return new Response(JSON.stringify({
        success: false,
        error: '不能禁用自己的账户'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    // 构建更新语句
    let updateFields = []
    let params = []

    if (typeof isActive === 'boolean') {
      updateFields.push('is_active = ?')
      params.push(isActive ? 1 : 0)
    }

    if (role && ['admin', 'user'].includes(role)) {
      updateFields.push('role = ?')
      params.push(role)
    }

    if (updateFields.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: '没有提供有效的更新字段'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP')
    params.push(userId)

    const updateStmt = DB.prepare(`
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `)
    await updateStmt.bind(...params).run()

    // 如果禁用用户，删除其所有会话
    if (isActive === false) {
      const deleteSessionsStmt = DB.prepare('DELETE FROM sessions WHERE user_id = ?')
      await deleteSessionsStmt.bind(userId).run()
    }

    // 记录操作日志
    const logStmt = DB.prepare(`
      INSERT INTO admin_logs (user_id, action, target_type, target_id, details)
      VALUES (?, 'update_user', 'user', ?, ?)
    `)
    const details = []
    if (typeof isActive === 'boolean') {
      details.push(`状态: ${isActive ? '启用' : '禁用'}`)
    }
    if (role) {
      details.push(`角色: ${role}`)
    }
    await logStmt.bind(
      authResult.user.user_id,
      userId,
      `更新用户 ${user.username}: ${details.join(', ')}`
    ).run()

    return new Response(JSON.stringify({
      success: true,
      message: '用户更新成功'
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

// 删除用户
export async function onRequestDelete(context) {
  try {
    const { env, request } = context
    const { DB, R2 } = env
    const url = new URL(request.url)
    const userId = url.pathname.split('/').pop()

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

    // 检查用户是否存在
    const userStmt = DB.prepare('SELECT * FROM users WHERE id = ?')
    const user = await userStmt.bind(userId).first()

    if (!user) {
      return new Response(JSON.stringify({
        success: false,
        error: '用户不存在'
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    // 防止删除自己
    if (userId == authResult.user.user_id) {
      return new Response(JSON.stringify({
        success: false,
        error: '不能删除自己的账户'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    // 获取用户的所有文件，准备删除R2中的文件
    const filesStmt = DB.prepare('SELECT r2_key FROM files WHERE user_id = ?')
    const files = await filesStmt.bind(userId).all()

    // 删除R2中的文件
    for (const file of files.results) {
      try {
        await R2.delete(file.r2_key)
      } catch (error) {
        console.error(`删除R2文件失败 ${file.r2_key}:`, error)
      }
    }

    // 删除用户相关的所有数据（级联删除）
    const deleteQueries = [
      'DELETE FROM sessions WHERE user_id = ?',
      'DELETE FROM messages WHERE user_id = ?',
      'DELETE FROM files WHERE user_id = ?',
      'DELETE FROM devices WHERE user_id = ?',
      'DELETE FROM admin_logs WHERE user_id = ?',
      'DELETE FROM users WHERE id = ?'
    ]

    for (const query of deleteQueries) {
      const stmt = DB.prepare(query)
      await stmt.bind(userId).run()
    }

    // 记录操作日志
    const logStmt = DB.prepare(`
      INSERT INTO admin_logs (user_id, action, target_type, target_id, details)
      VALUES (?, 'delete_user', 'user', ?, ?)
    `)
    await logStmt.bind(
      authResult.user.user_id,
      userId,
      `删除用户: ${user.username}`
    ).run()

    return new Response(JSON.stringify({
      success: true,
      message: '用户删除成功'
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