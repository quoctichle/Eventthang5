export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const session = await useSession(event, { password: config.sessionSecret })
  return {
    admin: session.data?.admin === true,
    superAdmin: session.data?.superAdmin === true,
    adminEmail: session.data?.adminEmail ?? null
  }
})
