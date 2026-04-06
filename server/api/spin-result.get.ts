// GET /api/spin-result - Kiểm tra mã hiện tại đã quay chưa
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const session = await useSession(event, { password: config.sessionSecret })
  const code = session.data?.code
  if (!code) return { spun: false, result: null }

  const { DB } = event.context.cloudflare.env
  const row = await DB.prepare(
    `SELECT w.id, w.winner_code, w.created_at, p.name as prize_name
     FROM prize_winners w
     JOIN prizes p ON w.prize_id = p.id
     WHERE w.winner_code = ? LIMIT 1`
  ).bind(code).first()

  if (!row) return { spun: false, result: null }
  return { spun: true, result: row }
})
