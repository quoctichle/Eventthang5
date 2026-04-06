export default defineEventHandler(async (event) => {
  const { DB } = event.context.cloudflare.env
  const { results } = await DB.prepare(
    'SELECT id, name, quantity, description FROM prizes WHERE event_id = 1 ORDER BY id'
  ).all()
  return results
})
