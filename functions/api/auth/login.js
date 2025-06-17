// 用户登录
export async function onRequestPost(context) {
  try {
    const { env, request } = context
    const { DB } = env
    const { username, password } = await request.json()

    if (!username || !password) {
      return new Response(JSON.stringify({
        success: false,
        error: '用户名和密码不能为空'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    // 查找用户
    const userStmt = DB.prepare(`
      SELECT id, username, password_hash, role, is_active 
      FROM users 
      WHERE username = ? AND is_active = 1
    `)
    const user = await userStmt.bind(username).first()

    if (!user) {
      return new Response(JSON.stringify({
        success: false,
        error: '用户名或密码错误'
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    // 验证密码（简化版本，实际应使用bcrypt）
    const isValidPassword = await verifyPassword(password, user.password_hash)
    if (!isValidPassword) {
      return new Response(JSON.stringify({
        success: false,
        error: '用户名或密码错误'
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    // 生成会话ID
    const sessionId = generateSessionId()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24小时后过期

    // 保存会话
    const sessionStmt = DB.prepare(`
      INSERT INTO sessions (id, user_id, expires_at)
      VALUES (?, ?, ?)
    `)
    await sessionStmt.bind(sessionId, user.id, expiresAt.toISOString()).run()

    // 更新最后登录时间
    const updateLoginStmt = DB.prepare(`
      UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?
    `)
    await updateLoginStmt.bind(user.id).run()

    return new Response(JSON.stringify({
      success: true,
      data: {
        sessionId,
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        },
        expiresAt: expiresAt.toISOString()
      }
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Set-Cookie': `sessionId=${sessionId}; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`
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

// 密码验证函数
async function verifyPassword(password, hash) {
  // 使用相同的哈希算法验证密码
  const encoder = new TextEncoder()
  const data = encoder.encode(password + 'salt_wxchat_2025')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const computedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return computedHash === hash
}

// 生成会话ID
function generateSessionId() {
  return 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36)
}