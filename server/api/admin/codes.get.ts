// GET /api/admin/codes - Lấy danh sách mã
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const session = await useSession(event, { password: config.sessionSecret })
  if (!session.data?.admin) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const { DB } = event.context.cloudflare.env
  const { results } = await DB.prepare(
    'SELECT * FROM access_codes ORDER BY created_at DESC'
  ).all()

  return results
})
