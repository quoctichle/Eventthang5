export default defineEventHandler(async (event) => {
  const { DB } = event.context.cloudflare.env
  const id = getRouterParam(event, 'id')

  await DB.prepare('DELETE FROM events WHERE id = ?').bind(id).run()

  return { success: true }
})
