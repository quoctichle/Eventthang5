// POST /api/admin/codes/bulk-delete - Xóa nhiều mã cùng lúc (bỏ qua mã đã quay)
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const session = await useSession(event, { password: config.sessionSecret })
  if (!session.data?.admin) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const { DB } = event.context.cloudflare.env
  const { ids } = await readBody<{ ids: number[] }>(event)

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    throw createError({ statusCode: 400, message: 'Không có mã nào được chọn' })
  }

  // Dùng D1 batch để tránh vấn đề với IN clause + spread
  const selectStmts = ids.map((id: number) =>
    DB.prepare(
      `SELECT ac.id, ac.code, pw.id as winner_id
       FROM access_codes ac
       LEFT JOIN prize_winners pw ON pw.code = ac.code
       WHERE ac.id = ?`
    ).bind(id)
  )
  const batchResults = await DB.batch(selectStmts)
  const allRows = batchResults.flatMap((r: any) => r.results as any[])

  const deletable = allRows.filter((r: any) => !r.winner_id)
  const skipped = allRows.filter((r: any) => r.winner_id)

  if (deletable.length === 0) {
    throw createError({ statusCode: 400, message: 'Tất cả mã được chọn đều đã được sử dụng để quay' })
  }

  // Xóa bằng batch
  const deleteStmts = deletable.map((r: any) =>
    DB.prepare('DELETE FROM access_codes WHERE id = ?').bind(r.id)
  )
  await DB.batch(deleteStmts)

  // Đồng bộ xóa bên Google Sheets
  const webhookUrl = getSheetsWebhookUrl(event)
  const codeValues = deletable.map((r: any) => r.code as string)
  await sheetsDeleteCodes(webhookUrl, codeValues)

  return {
    success: true,
    deleted: deletable.length,
    skipped: skipped.length,
    skippedCodes: skipped.map((r: any) => r.code as string)
  }
})
