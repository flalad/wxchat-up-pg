// 管理后台消息管理
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
    const userId = url.searchParams.get('userId')
    const type = url.searchParams.get('type')
    const search = url.searchParams.get('search')
    const offset = (page - 1) * limit

    // 构建查询条件
    let whereConditions = []
    let params = []

    if (userId) {
      whereConditions.push('m.user_id = ?')
      params.push(userId)
    }

    if (type && ['text', 'file'].includes(type)) {
      whereConditions.push('m.type = ?')
      params.push(type)
    }

    if (search) {
      whereConditions.push('(m.content LIKE ? OR u.username LIKE ? OR m.device_id LIKE ?)')
      const searchPattern = `%${search}%`
      params.push(searchPattern, searchPattern, searchPattern)
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : ''

    // 获取消息列表
    const messagesStmt = DB.prepare(`
      SELECT 
        m.id,
        m.type,
        m.content,
        m.device_id,
        m.timestamp,
        m.created_at,
        u.username,
        u.id as user_id,
        f.original_name,
        f.file_size,
        f.mime_type,
        f.r2_key
      FROM messages m
      LEFT JOIN users u ON m.user_id = u.id
      LEFT JOIN files f ON m.file_id = f.id
      ${whereClause}
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `)

    const messagesResult = await messagesStmt.bind(...params, limit, offset).all()
    const messages = messagesResult.results || []

    // 获取总数
    const countStmt = DB.prepare(`
      SELECT COUNT(*) as total
      FROM messages m
      LEFT JOIN users u ON m.user_id = u.id
      ${whereClause}
    `)
    const countResult = await countStmt.bind(...params).first()
    const totalCount = countResult?.total || 0

    return new Response(JSON.stringify({
      success: true,
      data: {
        messages: messages,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit)
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

// 删除消息
export async function onRequestDelete(context) {
  try {
    const { env, request } = context
    const { DB } = env
    const url = new URL(request.url)
    const messageId = url.searchParams.get('messageId')

    if (!messageId) {
      return new Response(JSON.stringify({
        success: false,
        error: '缺少消息ID参数'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

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

    // 获取消息信息
    const messageStmt = DB.prepare(`
      SELECT m.*, f.r2_key
      FROM messages m
      LEFT JOIN files f ON m.file_id = f.id
      WHERE m.id = ?
    `)
    const message = await messageStmt.bind(messageId).first()

    if (!message) {
      return new Response(JSON.stringify({
        success: false,
        error: '消息不存在'
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    // 如果是文件消息，需要删除R2中的文件
    if (message.type === 'file' && message.r2_key) {
      try {
        await env.R2.delete(message.r2_key)
      } catch (error) {
        console.error('删除R2文件失败:', error)
      }

      // 删除文件记录
      const deleteFileStmt = DB.prepare('DELETE FROM files WHERE id = ?')
      await deleteFileStmt.bind(message.file_id).run()
    }

    // 删除消息
    const deleteMessageStmt = DB.prepare('DELETE FROM messages WHERE id = ?')
    await deleteMessageStmt.bind(messageId).run()

    // 记录操作日志
    const logStmt = DB.prepare(`
      INSERT INTO admin_logs (user_id, action, target_type, target_id, details)
      VALUES (?, 'delete_message', 'message', ?, ?)
    `)
    await logStmt.bind(
      authResult.user.user_id,
      messageId,
      `删除${message.type === 'text' ? '文本' : '文件'}消息: ${message.content || message.r2_key}`
    ).run()

    return new Response(JSON.stringify({
      success: true,
      message: '消息删除成功'
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