export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const session = await useSession(event, { password: config.sessionSecret })
  if (!session.data?.admin) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const { DB } = event.context.cloudflare.env
  const id = getRouterParam(event, 'id')
  await DB.prepare('DELETE FROM prizes WHERE id = ?').bind(id).run()
  return { success: true }
})
