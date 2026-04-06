// POST /api/admin/winners - Ghi nhận người thắng giải
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const session = await useSession(event, { password: config.sessionSecret })
  if (!session.data?.admin) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const { DB } = event.context.cloudflare.env
  const body = await readBody(event)

  if (!body.prize_id || !body.event_id || !body.winner_name) {
    throw createError({ statusCode: 400, message: 'Thiếu thông tin bắt buộc' })
  }

  const { meta } = await DB.prepare(
    'INSERT INTO prize_winners (prize_id, event_id, winner_name, winner_code, notes) VALUES (?, ?, ?, ?, ?)'
  ).bind(body.prize_id, body.event_id, body.winner_name, body.winner_code ?? null, body.notes ?? null).run()

  return { id: meta.last_row_id, ...body }
})
