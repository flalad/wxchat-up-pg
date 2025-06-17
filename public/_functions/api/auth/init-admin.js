// 初始化管理员账户
export async function onRequestPost(context) {
  try {
    const { env } = context
    const { DB, ADMIN_USERNAME = 'admin', ADMIN_PASSWORD = 'admin123' } = env

    // 检查是否已有管理员账户
    const existingAdminStmt = DB.prepare(`
      SELECT id FROM users WHERE role = 'admin' LIMIT 1
    `)
    const existingAdmin = await existingAdminStmt.first()

    if (existingAdmin) {
      return new Response(JSON.stringify({
        success: false,
        error: '管理员账户已存在'
      }), {
        status: 409,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    // 生成管理员密码哈希
    const passwordHash = await hashPassword(ADMIN_PASSWORD)

    // 创建管理员账户
    const createAdminStmt = DB.prepare(`
      INSERT INTO users (username, password_hash, role, is_active)
      VALUES (?, ?, 'admin', 1)
    `)
    const result = await createAdminStmt.bind(ADMIN_USERNAME, passwordHash).run()

    // 记录操作日志
    const logStmt = DB.prepare(`
      INSERT INTO admin_logs (action, target_type, target_id, details)
      VALUES ('admin_init', 'user', ?, ?)
    `)
    await logStmt.bind(result.meta.last_row_id.toString(), `管理员账户 ${ADMIN_USERNAME} 初始化成功`).run()

    return new Response(JSON.stringify({
      success: true,
      data: {
        message: '管理员账户初始化成功',
        username: ADMIN_USERNAME,
        note: '请及时修改默认密码'
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

// 检查管理员账户状态
export async function onRequestGet(context) {
  try {
    const { env } = context
    const { DB } = env

    // 检查是否已有管理员账户
    const adminStmt = DB.prepare(`
      SELECT username, created_at FROM users WHERE role = 'admin' LIMIT 1
    `)
    const admin = await adminStmt.first()

    return new Response(JSON.stringify({
      success: true,
      data: {
        hasAdmin: !!admin,
        adminInfo: admin ? {
          username: admin.username,
          createdAt: admin.created_at
        } : null
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
}

// 密码哈希函数
async function hashPassword(password) {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + 'salt_wxchat_2025')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}