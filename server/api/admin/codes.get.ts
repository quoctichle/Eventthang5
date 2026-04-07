// GET /api/admin/codes - Lấy danh sách mã
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const session = await useSession(event, { password: config.sessionSecret })
  if (!session.data?.admin) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const { DB } = event.context.cloudflare.env
  const { results } = await DB.prepare(`
    SELECT a.*, CASE WHEN w.id IS NOT NULL THEN 1 ELSE 0 END as is_spun
    FROM access_codes a
    LEFT JOIN prize_winners w ON a.code = w.winner_code
    ORDER BY a.created_at DESC
  `).all()

  return results
})
