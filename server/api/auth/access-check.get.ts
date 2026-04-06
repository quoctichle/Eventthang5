// GET /api/auth/access-check - Kiểm tra user đã nhập mã chưa
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const session = await useSession(event, { password: config.sessionSecret })
  const isAdmin = session.data?.admin === true
  const hasAccess = session.data?.access === true
  const hasCode = !!session.data?.code
  return { access: isAdmin || (hasAccess && hasCode), code: session.data?.code ?? null }
})

