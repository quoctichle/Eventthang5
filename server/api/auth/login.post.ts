export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const body = await readBody(event)

  if (!body.email || !body.password) {
    throw createError({ statusCode: 400, message: 'Vui lòng nhập đầy đủ thông tin' })
  }

  if (body.email !== config.adminEmail || body.password !== config.adminPassword) {
    throw createError({ statusCode: 401, message: 'Email hoặc mật khẩu không đúng' })
  }

  const session = await useSession(event, { password: config.sessionSecret })
  await session.update({ admin: true })

  return { success: true }
})
