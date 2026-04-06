// POST /api/auth/access - User nhập mã để vào site
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const { DB } = event.context.cloudflare.env
  const body = await readBody(event)

  if (!body.code) {
    throw createError({ statusCode: 400, message: 'Vui lòng nhập mã truy cập' })
  }

  const row = await DB.prepare(
    'SELECT id FROM access_codes WHERE code = ? AND active = 1'
  ).bind(body.code.trim()).first()

  if (!row) {
    throw createError({ statusCode: 401, message: 'Mã truy cập không hợp lệ' })
  }

  const session = await useSession(event, { password: config.sessionSecret })
  await session.update({ access: true, code: body.code.trim() })

  return { success: true }
})
