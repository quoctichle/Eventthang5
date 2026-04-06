// GET /api/admin/winners - Danh sách người thắng giải
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const session = await useSession(event, { password: config.sessionSecret })
  if (!session.data?.admin) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const { DB } = event.context.cloudflare.env
  const { results } = await DB.prepare(`
    SELECT pw.*, p.name as prize_name, p.quantity, e.title as event_title
    FROM prize_winners pw
    LEFT JOIN prizes p ON pw.prize_id = p.id
    LEFT JOIN events e ON pw.event_id = e.id
    ORDER BY pw.created_at DESC
  `).all()

  return results
})
