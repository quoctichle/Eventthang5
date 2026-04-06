<template>
  <div class="user-layout">
    <header>
      <nav>
        <NuxtLink to="/">Trang chủ</NuxtLink>
        <NuxtLink to="/events">Sự kiện</NuxtLink>
      </nav>
    </header>
    <main>
      <slot />
    </main>
    <footer>
      <p>&copy; 2026 Eventthang5</p>
    </footer>
  </div>
</template>

<style scoped>
.user-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

header {
  background: #2563eb;
  padding: 1rem 2rem;
}

header nav {
  display: flex;
  gap: 1.5rem;
}

header nav a {
  color: white;
  text-decoration: none;
  font-weight: 500;
}

header nav a:hover {
  text-decoration: underline;
}

main {
  flex: 1;
  padding: 2rem;
}

footer {
  background: #1e293b;
  color: #94a3b8;
  text-align: center;
  padding: 1rem;
}
</style>
