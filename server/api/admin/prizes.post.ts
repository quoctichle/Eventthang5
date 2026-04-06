export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const session = await useSession(event, { password: config.sessionSecret })
  if (!session.data?.admin) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const { DB } = event.context.cloudflare.env
  const body = await readBody(event)

  if (!body.name) {
    throw createError({ statusCode: 400, message: 'Tên giải thưởng là bắt buộc' })
  }
  if (!body.event_id) {
    throw createError({ statusCode: 400, message: 'event_id là bắt buộc' })
  }

  const { meta } = await DB.prepare(
    'INSERT INTO prizes (event_id, name, description, quantity) VALUES (?, ?, ?, ?)'
  ).bind(body.event_id, body.name, body.description ?? null, body.quantity ?? 1).run()

  return { id: meta.last_row_id, ...body }
})
