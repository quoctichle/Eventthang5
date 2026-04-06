// GET /api/admin/codes-won - Danh sách mã + giải thưởng đã trúng
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const session = await useSession(event, { password: config.sessionSecret })
  if (!session.data?.admin) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }
  const { DB } = event.context.cloudflare.env
  const { results } = await DB.prepare(`
    SELECT
      a.id,
      a.code,
      a.label,
      a.active,
      a.created_at,
      p.name as prize_name,
      w.created_at as won_at
    FROM access_codes a
    LEFT JOIN prize_winners w ON w.winner_code = a.code
    LEFT JOIN prizes p ON p.id = w.prize_id
    ORDER BY a.created_at DESC
  `).all()
  return results
})
