// 统计计数器服务 - 提供仪表板所需的统计数据

// 初始计数器值，Worker重启时会重置，因此需要从KV或D1恢复
const defaultCounters = {
  total_users: 0,
  total_messages: 0,
  total_files: 0,
  total_file_size: 0,
  active_devices: 0,
  today_messages: 0,
  today_files: 0
};

// 保存当前内存中的计数器
let counters = { ...defaultCounters };

// 仅管理员可获取完整统计
export async function onRequestGet(context) {
  try {
    const { env, request } = context;
    
    // 验证管理员权限
    const authResult = await verifyAdminAuth(request, env.DB);
    if (!authResult.success) {
      return new Response(JSON.stringify(authResult), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // 首次访问时从数据库加载计数
    if (!counters.initialized) {
      await initializeCounters(env.DB);
    }
    
    // 返回当前计数
    return new Response(JSON.stringify({
      success: true,
      data: counters
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
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
    });
  }
}

// 更新计数器，支持增量和设置绝对值
export async function onRequestPost(context) {
  try {
    const { env, request } = context;
    const data = await request.json();
    const { type, count = 1, mode = 'increment' } = data;
    
    // 校验请求来源，内部API调用需要秘钥
    const authHeader = request.headers.get('X-Counter-Auth');
    const isInternalCall = authHeader === env.COUNTER_SECRET;
    
    // 外部调用需要管理员权限
    if (!isInternalCall) {
      const authResult = await verifyAdminAuth(request, env.DB);
      if (!authResult.success) {
        return new Response(JSON.stringify(authResult), {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    }
    
    // 首次访问时从数据库加载计数
    if (!counters.initialized) {
      await initializeCounters(env.DB);
    }
    
    // 更新计数器
    if (counters[type] !== undefined) {
      if (mode === 'increment') {
        counters[type] += count;
      } else if (mode === 'set') {
        counters[type] = count;
      }
    }
    
    // 可选：持久化保存计数到KV
    // 注意：如果有KV存储，取消下面的注释
    // if (env.KV) {
    //   await env.KV.put('dashboard_counters', JSON.stringify(counters));
    // }
    
    return new Response(JSON.stringify({
      success: true,
      data: {
        type,
        current: counters[type]
      }
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
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
    });
  }
}

// 重置日活动计数（每日凌晨自动重置）
export async function onRequestPut(context) {
  try {
    const { env, request } = context;
    const { action } = await request.json();
    
    // 验证管理员权限
    const authResult = await verifyAdminAuth(request, env.DB);
    if (!authResult.success) {
      return new Response(JSON.stringify(authResult), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // 执行重置操作
    if (action === 'reset_daily') {
      counters.today_messages = 0;
      counters.today_files = 0;
    } else if (action === 'reload_from_db') {
      await initializeCounters(env.DB, true);
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: action === 'reset_daily' ? '已重置今日统计' : '已重新加载统计数据',
      data: counters
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
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
    });
  }
}

// CORS支持
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Counter-Auth'
    }
  });
}

// 初始化计数器（从数据库加载初始值）
async function initializeCounters(DB, force = false) {
  if (!counters.initialized || force) {
    try {
      // 总体统计
      const totalStatsStmt = DB.prepare(`
        SELECT
          (SELECT COUNT(*) FROM users WHERE is_active = 1) as total_users,
          (SELECT COUNT(*) FROM messages WHERE type = 'text') as total_messages,
          (SELECT COUNT(*) FROM files) as total_files,
          (SELECT COALESCE(SUM(file_size), 0) FROM files) as total_file_size,
          (SELECT COUNT(DISTINCT device_id) FROM messages) as active_devices
      `);
      const totalStats = await totalStatsStmt.first();
      
      // 今日统计
      const todayStatsStmt = DB.prepare(`
        SELECT
          (SELECT COUNT(*) FROM messages WHERE type = 'text' AND DATE(timestamp) = DATE('now')) as today_messages,
          (SELECT COUNT(*) FROM files WHERE DATE(created_at) = DATE('now')) as today_files
      `);
      const todayStats = await todayStatsStmt.first();
      
      // 更新计数器
      counters.total_users = totalStats.total_users || 0;
      counters.total_messages = totalStats.total_messages || 0;
      counters.total_files = totalStats.total_files || 0;
      counters.total_file_size = totalStats.total_file_size || 0;
      counters.active_devices = totalStats.active_devices || 0;
      counters.today_messages = todayStats.today_messages || 0;
      counters.today_files = todayStats.today_files || 0;
      counters.initialized = true;
      
      console.log('已从数据库初始化计数器:', counters);
    } catch (error) {
      console.error('初始化计数器失败:', error);
      // 初始化失败时使用默认值
      counters = { ...defaultCounters, initialized: true };
    }
  }
}

// 验证管理员权限
async function verifyAdminAuth(request, DB) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { success: false, error: '未提供认证信息' };
  }

  const sessionId = authHeader.substring(7);
  
  const sessionStmt = DB.prepare(`
    SELECT s.user_id, u.username, u.role
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.id = ? AND s.expires_at > CURRENT_TIMESTAMP AND u.is_active = 1
  `);
  const session = await sessionStmt.bind(sessionId).first();

  if (!session) {
    return { success: false, error: '会话已过期或无效' };
  }

  if (session.role !== 'admin') {
    return { success: false, error: '权限不足' };
  }

  return { success: true, user: session };
}