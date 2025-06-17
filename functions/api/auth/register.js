// 用户注册
export async function onRequestPost(context) {
  try {
    const { env, request } = context
    const { DB } = env
    const { username, password, email } = await request.json()

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

    // 验证用户名长度
    if (username.length < 3 || username.length > 20) {
      return new Response(JSON.stringify({
        success: false,
        error: '用户名长度必须在3-20个字符之间'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    // 验证密码强度
    if (password.length < 6) {
      return new Response(JSON.stringify({
        success: false,
        error: '密码长度不能少于6个字符'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    // 检查用户名是否已存在
    const existingUserStmt = DB.prepare(`
      SELECT id FROM users WHERE username = ?
    `)
    const existingUser = await existingUserStmt.bind(username).first()

    if (existingUser) {
      return new Response(JSON.stringify({
        success: false,
        error: '用户名已存在'
      }), {
        status: 409,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    // 生成密码哈希（简化版本）
    const passwordHash = await hashPassword(password)

    // 创建用户
    const createUserStmt = DB.prepare(`
      INSERT INTO users (username, password_hash, email, role)
      VALUES (?, ?, ?, 'user')
    `)
    const result = await createUserStmt.bind(username, passwordHash, email || null).run()

    // 记录操作日志
    const logStmt = DB.prepare(`
      INSERT INTO admin_logs (action, target_type, target_id, details)
      VALUES ('user_register', 'user', ?, ?)
    `)
    await logStmt.bind(result.meta.last_row_id.toString(), `用户 ${username} 注册成功`).run()

    return new Response(JSON.stringify({
      success: true,
      data: {
        userId: result.meta.last_row_id,
        username: username,
        message: '注册成功'
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

// 简化的密码哈希函数
async function hashPassword(password) {
  // 这里应该使用bcrypt等安全的密码哈希库
  // 为了演示，使用简单的编码（实际项目中不要这样做）
  const encoder = new TextEncoder()
  const data = encoder.encode(password + 'salt_wxchat_2025')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}