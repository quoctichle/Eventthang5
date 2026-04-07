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

  // Lấy thông tin và kiểm tra đã quay
  const placeholders = ids.map(() => '?').join(',')
  const rows = await DB.prepare(
    `SELECT ac.id, ac.code, pw.id as winner_id
     FROM access_codes ac
     LEFT JOIN prize_winners pw ON pw.code = ac.code
     WHERE ac.id IN (${placeholders})`
  ).bind(...ids).all()

  const deletable = (rows.results as any[]).filter(r => !r.winner_id)
  const skipped = (rows.results as any[]).filter(r => r.winner_id)

  if (deletable.length === 0) {
    throw createError({ statusCode: 400, message: 'Tất cả mã được chọn đều đã được sử dụng để quay' })
  }

  const deletableIds = deletable.map((r: any) => r.id)
  const delPlaceholders = deletableIds.map(() => '?').join(',')
  await DB.prepare(`DELETE FROM access_codes WHERE id IN (${delPlaceholders})`).bind(...deletableIds).run()

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
