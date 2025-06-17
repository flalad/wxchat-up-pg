// 文件上传
export async function onRequestPost(context) {
  try {
    const { env, request } = context
    const { DB, R2 } = env
    const formData = await request.formData()
    const file = formData.get('file')
    const deviceId = formData.get('deviceId')

    if (!file || !deviceId) {
      return new Response(JSON.stringify({
        success: false,
        error: '文件和设备ID不能为空'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    // 生成唯一的文件名
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2)
    const fileExtension = file.name.split('.').pop()
    const r2Key = `${timestamp}-${randomStr}.${fileExtension}`

    // 上传到R2
    await R2.put(r2Key, file.stream(), {
      httpMetadata: {
        contentType: file.type,
        contentDisposition: `attachment; filename="${file.name}"`
      }
    })

    // 保存文件信息到数据库
    const fileStmt = DB.prepare(`
      INSERT INTO files (original_name, file_name, file_size, mime_type, r2_key, upload_device_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `)

    const fileResult = await fileStmt.bind(
      file.name,
      r2Key,
      file.size,
      file.type,
      r2Key,
      deviceId
    ).run()

    // 创建文件消息
    const messageStmt = DB.prepare(`
      INSERT INTO messages (type, file_id, device_id)
      VALUES (?, ?, ?)
    `)

    await messageStmt.bind('file', fileResult.meta.last_row_id, deviceId).run()

    return new Response(JSON.stringify({
      success: true,
      data: {
        fileId: fileResult.meta.last_row_id,
        fileName: file.name,
        fileSize: file.size,
        r2Key: r2Key
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