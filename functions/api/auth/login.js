// 用户登录
export async function onRequestPost(context) {
  try {
    const { env, request } = context
    const { DB, ADMIN_USERNAME, ADMIN_PASSWORD } = env
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

    // 检查是否为管理员凭据登录
    if (ADMIN_USERNAME && ADMIN_PASSWORD && username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      // 自动创建或更新管理员账户
      const adminUser = await ensureAdminUser(DB, ADMIN_USERNAME, ADMIN_PASSWORD)
      
      // 生成会话ID
      const sessionId = generateSessionId()
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24小时后过期

      // 保存会话
      const sessionStmt = DB.prepare(`
        INSERT INTO sessions (id, user_id, expires_at)
        VALUES (?, ?, ?)
      `)
      await sessionStmt.bind(sessionId, adminUser.id, expiresAt.toISOString()).run()

      // 更新最后登录时间
      const updateLoginStmt = DB.prepare(`
        UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?
      `)
      await updateLoginStmt.bind(adminUser.id).run()

      return new Response(JSON.stringify({
        success: true,
        data: {
          sessionId,
          user: {
            id: adminUser.id,
            username: adminUser.username,
            role: adminUser.role
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
    }

    // 查找普通用户
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

    // 验证密码
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

// 确保管理员用户存在
async function ensureAdminUser(DB, adminUsername, adminPassword) {
  // 检查管理员是否已存在
  const existingAdminStmt = DB.prepare(`
    SELECT id, username, role FROM users WHERE username = ? AND role = 'admin'
  `)
  const existingAdmin = await existingAdminStmt.bind(adminUsername).first()

  if (existingAdmin) {
    // 更新管理员密码（以防环境变量中的密码已更改）
    const passwordHash = await hashPassword(adminPassword)
    const updateStmt = DB.prepare(`
      UPDATE users SET password_hash = ?, is_active = 1 WHERE id = ?
    `)
    await updateStmt.bind(passwordHash, existingAdmin.id).run()
    
    return existingAdmin
  }

  // 创建新的管理员账户
  const passwordHash = await hashPassword(adminPassword)
  const createAdminStmt = DB.prepare(`
    INSERT INTO users (username, password_hash, role, is_active)
    VALUES (?, ?, 'admin', 1)
  `)
  const result = await createAdminStmt.bind(adminUsername, passwordHash).run()

  // 记录操作日志
  try {
    const logStmt = DB.prepare(`
      INSERT INTO admin_logs (action, target_type, target_id, details)
      VALUES ('admin_auto_init', 'user', ?, ?)
    `)
    await logStmt.bind(result.meta.last_row_id.toString(), `管理员账户 ${adminUsername} 自动初始化成功`).run()
  } catch (logError) {
    // 日志记录失败不影响主流程
    console.warn('记录管理员初始化日志失败:', logError)
  }

  return {
    id: result.meta.last_row_id,
    username: adminUsername,
    role: 'admin'
  }
}

// 密码哈希函数
async function hashPassword(password) {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + 'salt_wxchat_2025')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// 生成会话ID
function generateSessionId() {
  return 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36)
}