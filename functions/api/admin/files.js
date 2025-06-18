// 管理后台文件管理
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
    const mimeType = url.searchParams.get('mimeType')
    const search = url.searchParams.get('search')
    const sortBy = url.searchParams.get('sortBy') || 'created_at'
    const sortOrder = url.searchParams.get('sortOrder') || 'DESC'
    const offset = (page - 1) * limit

    // 构建查询条件
    let whereConditions = []
    let params = []

    if (userId) {
      whereConditions.push('f.user_id = ?')
      params.push(userId)
    }

    if (mimeType) {
      whereConditions.push('f.mime_type LIKE ?')
      params.push(`${mimeType}%`)
    }

    if (search) {
      whereConditions.push('(f.original_name LIKE ? OR u.username LIKE ?)')
      const searchPattern = `%${search}%`
      params.push(searchPattern, searchPattern)
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : ''
    
    // 验证排序字段
    const allowedSortFields = ['created_at', 'file_size', 'original_name', 'download_count']
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at'
    const validSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC'

    // 获取文件列表
    const filesStmt = DB.prepare(`
      SELECT 
        f.id,
        f.original_name,
        f.file_name,
        f.file_size,
        f.mime_type,
        f.r2_key,
        f.upload_device_id,
        f.download_count,
        f.created_at,
        u.username,
        u.id as user_id
      FROM files f
      LEFT JOIN users u ON f.user_id = u.id
      ${whereClause}
      ORDER BY f.${validSortBy} ${validSortOrder}
      LIMIT ? OFFSET ?
    `)

    const filesResult = await filesStmt.bind(...params, limit, offset).all()
    const files = filesResult.results || []

    // 获取总数和统计信息
    const statsStmt = DB.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(f.file_size) as total_size,
        AVG(f.file_size) as avg_size,
        MAX(f.file_size) as max_size
      FROM files f
      LEFT JOIN users u ON f.user_id = u.id
      ${whereClause}
    `)
    const stats = await statsStmt.bind(...params).first()

    // 获取文件类型分布
    const typeDistributionStmt = DB.prepare(`
      SELECT 
        CASE 
          WHEN f.mime_type LIKE 'image/%' THEN '图片'
          WHEN f.mime_type LIKE 'video/%' THEN '视频'
          WHEN f.mime_type LIKE 'audio/%' THEN '音频'
          WHEN f.mime_type LIKE 'application/pdf' THEN 'PDF'
          WHEN f.mime_type LIKE 'text/%' THEN '文本'
          ELSE '其他'
        END as file_type,
        COUNT(*) as count
      FROM files f
      LEFT JOIN users u ON f.user_id = u.id
      ${whereClause}
      GROUP BY file_type
      ORDER BY count DESC
    `)
    const typeDistributionResult = await typeDistributionStmt.bind(...params).all()
    const typeDistribution = typeDistributionResult.results || []

    return new Response(JSON.stringify({
      success: true,
      data: {
        files: files,
        pagination: {
          page,
          limit,
          total: stats.total || 0,
          totalPages: Math.ceil((stats.total || 0) / limit)
        },
        stats: {
          totalFiles: stats.total || 0,
          totalSize: stats.total_size || 0,
          avgSize: stats.avg_size || 0,
          maxSize: stats.max_size || 0
        },
        typeDistribution: typeDistribution
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

// 删除文件
export async function onRequestDelete(context) {
  try {
    const { env, request } = context
    const { DB, R2 } = env
    const url = new URL(request.url)
    const fileId = url.searchParams.get('fileId')

    if (!fileId) {
      return new Response(JSON.stringify({
        success: false,
        error: '缺少文件ID参数'
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

    // 获取文件信息
    const fileStmt = DB.prepare(`
      SELECT * FROM files WHERE id = ?
    `)
    const file = await fileStmt.bind(fileId).first()

    if (!file) {
      return new Response(JSON.stringify({
        success: false,
        error: '文件不存在'
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    // 删除R2中的文件
    try {
      await R2.delete(file.r2_key)
    } catch (error) {
      console.error('删除R2文件失败:', error)
    }

    // 删除相关的消息记录
    const deleteMessagesStmt = DB.prepare('DELETE FROM messages WHERE file_id = ?')
    await deleteMessagesStmt.bind(fileId).run()

    // 删除文件记录
    const deleteFileStmt = DB.prepare('DELETE FROM files WHERE id = ?')
    await deleteFileStmt.bind(fileId).run()

    // 记录操作日志
    const logStmt = DB.prepare(`
      INSERT INTO admin_logs (user_id, action, target_type, target_id, details)
      VALUES (?, 'delete_file', 'file', ?, ?)
    `)
    await logStmt.bind(
      authResult.user.user_id,
      fileId,
      `删除文件: ${file.original_name} (${formatFileSize(file.file_size)})`
    ).run()

    return new Response(JSON.stringify({
      success: true,
      message: '文件删除成功'
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

// 批量删除文件
export async function onRequestPost(context) {
  try {
    const { env, request } = context
    const { DB, R2 } = env
    const { fileIds } = await request.json()

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

    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: '请提供要删除的文件ID列表'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    let deletedCount = 0
    let errors = []

    for (const fileId of fileIds) {
      try {
        // 获取文件信息
        const fileStmt = DB.prepare('SELECT * FROM files WHERE id = ?')
        const file = await fileStmt.bind(fileId).first()

        if (file) {
          // 删除R2中的文件
          try {
            await R2.delete(file.r2_key)
          } catch (error) {
            console.error(`删除R2文件失败 ${file.r2_key}:`, error)
          }

          // 删除相关消息
          const deleteMessagesStmt = DB.prepare('DELETE FROM messages WHERE file_id = ?')
          await deleteMessagesStmt.bind(fileId).run()

          // 删除文件记录
          const deleteFileStmt = DB.prepare('DELETE FROM files WHERE id = ?')
          await deleteFileStmt.bind(fileId).run()

          deletedCount++
        }
      } catch (error) {
        errors.push(`文件ID ${fileId}: ${error.message}`)
      }
    }

    // 记录操作日志
    const logStmt = DB.prepare(`
      INSERT INTO admin_logs (user_id, action, target_type, target_id, details)
      VALUES (?, 'batch_delete_files', 'file', ?, ?)
    `)
    await logStmt.bind(
      authResult.user.user_id,
      fileIds.join(','),
      `批量删除文件: 成功${deletedCount}个, 失败${errors.length}个`
    ).run()

    return new Response(JSON.stringify({
      success: true,
      data: {
        deletedCount,
        errors,
        message: `成功删除 ${deletedCount} 个文件${errors.length > 0 ? `, ${errors.length} 个失败` : ''}`
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

// 格式化文件大小
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}