export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const session = await useSession(event, { password: config.sessionSecret })
  if (!session.data?.admin) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const { DB } = event.context.cloudflare.env
  const eventId = getQuery(event).event_id

  let query = 'SELECT p.*, e.title as event_title FROM prizes p LEFT JOIN events e ON p.event_id = e.id'
  const bindings: any[] = []
  if (eventId) {
    query += ' WHERE p.event_id = ?'
    bindings.push(eventId)
  }
  query += ' ORDER BY p.created_at DESC'

  const { results } = bindings.length
    ? await DB.prepare(query).bind(...bindings).all()
    : await DB.prepare(query).all()

  return results
})
