import { sheetsAddCodes } from '~/server/utils/sheets'

// POST /api/admin/codes/generate - Tạo 10 mã ngẫu nhiên theo format T{month}{year2digit}{6random}
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const session = await useSession(event, { password: config.sessionSecret })
  if (!session.data?.admin) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const { DB } = event.context.cloudflare.env

  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear().toString().slice(-2)
  const prefix = `T${month}${year}`

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const generated: string[] = []
  let attempts = 0

  while (generated.length < 10 && attempts < 100) {
    attempts++
    let random = ''
    for (let i = 0; i < 6; i++) {
      random += chars[Math.floor(Math.random() * chars.length)]
    }
    const code = `${prefix}${random}`
    if (generated.includes(code)) continue

    const existing = await DB.prepare(
      'SELECT id FROM access_codes WHERE code = ?'
    ).bind(code).first()

    if (!existing) generated.push(code)
  }

  for (const code of generated) {
    await DB.prepare(
      'INSERT INTO access_codes (code) VALUES (?)'
    ).bind(code).run()
  }

  // Đồng bộ sang Google Sheets (fire-and-forget)
  sheetsAddCodes(config.sheetsWebhookUrl, generated)

  return { codes: generated }
})
