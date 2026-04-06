export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path.startsWith('/admin') || to.path === '/access') return

  const { data: me } = await useFetch('/api/auth/me')
  if (me.value?.admin) return

  const { data: accessData } = await useFetch('/api/auth/access-check')
  if (!accessData.value?.access || !accessData.value?.code) {
    return navigateTo('/access')
  }
})
