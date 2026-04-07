// DELETE /api/admin/codes/[id] - Xóa mã
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const session = await useSession(event, { password: config.sessionSecret })
  if (!session.data?.admin) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const { DB } = event.context.cloudflare.env
  const id = getRouterParam(event, 'id')

  // Lấy code value và kiểm tra đã quay chưa
  const row = await DB.prepare('SELECT code FROM access_codes WHERE id = ?').bind(id).first()
  if (!row) throw createError({ statusCode: 404, message: 'Mã không tồn tại' })

  const winner = await DB.prepare('SELECT id FROM prize_winners WHERE code = ?').bind(row.code).first()
  if (winner) {
    throw createError({ statusCode: 400, message: 'Mã này đã được sử dụng để quay, không thể xóa' })
  }

  await DB.prepare('DELETE FROM access_codes WHERE id = ?').bind(id).run()

  // Đồng bộ xóa bên Google Sheets
  const webhookUrl = getSheetsWebhookUrl(event)
  await sheetsDeleteCodes(webhookUrl, [row.code as string])

  return { success: true }
})
