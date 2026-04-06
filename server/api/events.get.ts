export default defineEventHandler(async (event) => {
  const { DB } = event.context.cloudflare.env
  const { results } = await DB.prepare(
    'SELECT * FROM events ORDER BY created_at DESC'
  ).all()
  return results
})
