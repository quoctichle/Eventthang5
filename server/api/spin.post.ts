import { sheetsUpdateSpin } from '~/server/utils/sheets'

// POST /api/spin - Ghi nhận kết quả quay (mỗi mã chỉ được quay 1 lần)
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const session = await useSession(event, { password: config.sessionSecret })
  const code = session.data?.code
  if (!code) throw createError({ statusCode: 401, message: 'Chưa nhập mã truy cập' })

  const { DB } = event.context.cloudflare.env

  // Kiểm tra đã quay chưa
  const existing = await DB.prepare(
    'SELECT id FROM prize_winners WHERE winner_code = ? LIMIT 1'
  ).bind(code).first()
  if (existing) throw createError({ statusCode: 409, message: 'Mã này đã được quay rồi' })

  const { prize_id } = await readBody(event)
  if (!prize_id) throw createError({ statusCode: 400, message: 'Thiếu prize_id' })

  await DB.prepare(
    "INSERT INTO prize_winners (prize_id, event_id, winner_name, winner_code) VALUES (?, 1, '', ?)"
  ).bind(prize_id, code).run()

  const prize = await DB.prepare('SELECT name FROM prizes WHERE id = ?').bind(prize_id).first()
  const prizeName = (prize?.name as string) ?? ''

  // Đồng bộ kết quả quay sang Google Sheets (fire-and-forget)
  sheetsUpdateSpin(config.sheetsWebhookUrl, code, prizeName)

  return { success: true, prize_name: prizeName }
})
