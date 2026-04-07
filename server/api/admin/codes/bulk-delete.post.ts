import { getSheetsWebhookUrl, sheetsDeleteCodes } from '~/server/utils/sheets'

// POST /api/admin/codes/bulk-delete - Xóa nhiều mã cùng lúc (bỏ qua mã đã quay)
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const session = await useSession(event, { password: config.sessionSecret })
  if (!session.data?.admin) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const { DB } = event.context.cloudflare.env
  const body = await readBody<{ ids: number[] }>(event)
  const ids: number[] = body?.ids ?? []

  if (!Array.isArray(ids) || ids.length === 0) {
    throw createError({ statusCode: 400, message: 'Không có mã nào được chọn' })
  }

  const deletable: { id: number; code: string }[] = []
  const skippedCodes: string[] = []

  for (const id of ids) {
    const row = await DB.prepare(
      'SELECT code FROM access_codes WHERE id = ?'
    ).bind(id).first<{ code: string }>()

    if (!row) continue

    const winner = await DB.prepare(
      'SELECT id FROM prize_winners WHERE code = ?'
    ).bind(row.code).first()

    if (winner) {
      skippedCodes.push(row.code)
    } else {
      deletable.push({ id, code: row.code })
    }
  }

  if (deletable.length === 0) {
    throw createError({ statusCode: 400, message: 'Tất cả mã được chọn đều đã được sử dụng để quay' })
  }

  for (const item of deletable) {
    await DB.prepare('DELETE FROM access_codes WHERE id = ?').bind(item.id).run()
  }

  // Đồng bộ xóa bên Google Sheets
  const webhookUrl = getSheetsWebhookUrl(event)
  await sheetsDeleteCodes(webhookUrl, deletable.map(r => r.code))

  return {
    success: true,
    deleted: deletable.length,
    skipped: skippedCodes.length,
    skippedCodes
  }
})
