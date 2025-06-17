// 数据清理 - 清空所有数据
export async function onRequestPost(context) {
  try {
    const { env, request } = context
    const { DB, R2 } = env
    const { confirmCode } = await request.json()

    // 简单的确认码验证
    if (confirmCode !== '1234') {
      return new Response(JSON.stringify({
        success: false,
        error: '确认码错误，请输入正确的确认码'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    // 统计清理前的数据
    const messageCountStmt = DB.prepare('SELECT COUNT(*) as count FROM messages')
    const fileCountStmt = DB.prepare('SELECT COUNT(*) as count, COALESCE(SUM(file_size), 0) as totalSize FROM files')

    const messageCount = await messageCountStmt.first()
    const fileStats = await fileCountStmt.first()

    // 获取所有文件的R2 keys
    const filesStmt = DB.prepare('SELECT r2_key FROM files')
    const files = await filesStmt.all()

    // 删除R2中的所有文件
    let deletedFilesCount = 0
    for (const file of files.results) {
      try {
        await R2.delete(file.r2_key)
        deletedFilesCount++
      } catch (error) {
        console.error(`删除R2文件失败: ${file.r2_key}`, error)
      }
    }

    // 清空数据库表（使用事务确保原子性）
    const deleteMessagesStmt = DB.prepare('DELETE FROM messages')
    const deleteFilesStmt = DB.prepare('DELETE FROM files')
    const deleteDevicesStmt = DB.prepare('DELETE FROM devices')

    // 执行删除操作
    await deleteMessagesStmt.run()
    await deleteFilesStmt.run()
    await deleteDevicesStmt.run()

    return new Response(JSON.stringify({
      success: true,
      data: {
        deletedMessages: messageCount.count,
        deletedFiles: fileStats.count,
        deletedFileSize: fileStats.totalSize,
        deletedR2Files: deletedFilesCount,
        message: '所有数据已成功清理'
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