// POST /api/admin/codes - Tạo mã mới
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const session = await useSession(event, { password: config.sessionSecret })
  if (!session.data?.admin) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const { DB } = event.context.cloudflare.env
  const body = await readBody(event)

  if (!body.code) {
    throw createError({ statusCode: 400, message: 'Mã không được để trống' })
  }

  const { meta } = await DB.prepare(
    'INSERT INTO access_codes (code, label) VALUES (?, ?)'
  ).bind(body.code.trim(), body.label ?? null).run()

  return { id: meta.last_row_id, code: body.code.trim(), label: body.label ?? null, active: 1 }
})
