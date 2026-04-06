<script setup lang="ts">
async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await navigateTo('/admin/login')
}
</script>

<template>
  <div class="admin-layout">
    <aside class="sidebar">
      <div class="logo">⚙️ Admin</div>
      <nav>
        <NuxtLink to="/admin">Dashboard</NuxtLink>
        <NuxtLink to="/admin/codes">🎫 Quản lý mã</NuxtLink>
        <NuxtLink to="/admin/events">📅 Quản lý sự kiện</NuxtLink>
        <NuxtLink to="/admin/prizes">🏆 Quản lý giải thưởng</NuxtLink>
      </nav>
      <button class="logout" @click="logout">Đăng xuất</button>
    </aside>
    <div class="content">
      <header>
        <h1>Trang quản trị</h1>
      </header>
      <main>
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 220px;
  background: #1e293b;
  color: white;
  padding: 1.5rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  flex-shrink: 0;
}

.logo {
  font-size: 1.25rem;
  font-weight: bold;
  padding: 0.5rem;
}

.sidebar nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.sidebar nav a {
  color: #94a3b8;
  text-decoration: none;
  padding: 0.6rem 0.8rem;
  border-radius: 6px;
  transition: background 0.2s;
}

.sidebar nav a:hover,
.sidebar nav a.router-link-active {
  background: #334155;
  color: white;
}

.logout {
  margin-top: auto;
  background: transparent;
  border: 1px solid #475569;
  color: #94a3b8;
  padding: 0.6rem 0.8rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  text-align: left;
  transition: background 0.2s;
}

.logout:hover {
  background: #334155;
  color: white;
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

header {
  background: white;
  border-bottom: 1px solid #e2e8f0;
  padding: 1rem 2rem;
}

header h1 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

main {
  flex: 1;
  padding: 2rem;
  background: #f8fafc;
}
</style>
