// 管理员账户初始化（备用方案）
// 注意：从 v2.2.0 开始，系统会在登录时自动创建管理员账户
// 此接口仅作为备用方案，正常情况下不需要手动调用
export async function onRequestPost(context) {
  try {
    const { env } = context
    const { DB, ADMIN_USERNAME, ADMIN_PASSWORD } = env

    // 检查环境变量是否设置
    if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
      return new Response(JSON.stringify({
        success: false,
        error: '请在环境变量中设置 ADMIN_USERNAME 和 ADMIN_PASSWORD，然后直接登录即可自动创建管理员账户'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    // 使用与登录相同的逻辑确保管理员账户存在
    const adminUser = await ensureAdminUser(DB, ADMIN_USERNAME, ADMIN_PASSWORD)

    return new Response(JSON.stringify({
      success: true,
      data: {
        message: '管理员账户已确保存在',
        username: adminUser.username,
        note: '现在可以直接使用环境变量中的凭据登录管理后台'
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

// 确保管理员用户存在（与登录逻辑保持一致）
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
      VALUES ('admin_manual_init', 'user', ?, ?)
    `)
    await logStmt.bind(result.meta.last_row_id.toString(), `管理员账户 ${adminUsername} 手动初始化成功`).run()
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