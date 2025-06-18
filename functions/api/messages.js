// 获取消息列表和发送文本消息
export async function onRequestGet(context) {
  try {
    const { env, request } = context
    const { DB } = env
    const url = new URL(request.url)
    const limit = url.searchParams.get('limit') || 50
    const offset = url.searchParams.get('offset') || 0

    const stmt = DB.prepare(`
      SELECT
        m.id,
        m.type,
        m.content,
        m.device_id,
        m.timestamp,
        f.original_name,
        f.file_size,
        f.mime_type,
        f.r2_key
      FROM messages m
      LEFT JOIN files f ON m.file_id = f.id
      ORDER BY m.timestamp ASC
      LIMIT ? OFFSET ?
    `)

    const result = await stmt.bind(limit, offset).all()

    return new Response(JSON.stringify({
      success: true,
      data: result.results,
      total: result.results.length
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
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

export async function onRequestPost(context) {
  try {
    const { env, request } = context
    const { DB } = env
    const { content, deviceId, userId } = await request.json()
 
    if (!content || !deviceId) {
      return new Response(JSON.stringify({
        success: false,
        error: '内容和设备ID不能为空'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }
 
    // 支持写入 user_id 字段（如有）
    let stmt, result;
    if (userId) {
      // 如果提供了userId，直接使用
      stmt = DB.prepare(`
        INSERT INTO messages (type, content, device_id, user_id)
        VALUES (?, ?, ?, ?)
      `)
      result = await stmt.bind('text', content, deviceId, userId).run()
    } else {
      // 如果没有userId，查找或创建一个默认用户
      const defaultUserStmt = DB.prepare(`
        SELECT id FROM users WHERE username = 'default_user' LIMIT 1
      `)
      let defaultUser = await defaultUserStmt.first()
      
      if (!defaultUser) {
        // 创建默认用户
        const createUserStmt = DB.prepare(`
          INSERT INTO users (username, password_hash, role, is_active)
          VALUES ('default_user', 'not_used', 'user', 1)
        `)
        const createResult = await createUserStmt.run()
        defaultUser = { id: createResult.meta.last_row_id }
      }
      
      // 关联到默认用户
      stmt = DB.prepare(`
        INSERT INTO messages (type, content, device_id, user_id)
        VALUES (?, ?, ?, ?)
      `)
      result = await stmt.bind('text', content, deviceId, defaultUser.id).run()
    }
 
    return new Response(JSON.stringify({
      success: true,
      data: { id: result.meta.last_row_id }
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