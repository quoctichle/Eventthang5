// DELETE /api/admin/winners/by-code - Xóa kết quả quay theo mã để cho phép quay lại
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const session = await useSession(event, { password: config.sessionSecret })
  if (!session.data?.admin) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }
  const { code } = await readBody(event)
  if (!code) throw createError({ statusCode: 400, message: 'Thiếu code' })

  const { DB } = event.context.cloudflare.env
  await DB.prepare('DELETE FROM prize_winners WHERE winner_code = ?').bind(code).run()
  return { success: true }
})
