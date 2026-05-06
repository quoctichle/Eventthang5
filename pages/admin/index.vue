<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })

const [{ data: events }, { data: codes }, { data: prizes }] = await Promise.all([
  useFetch('/api/events'),
  useFetch('/api/admin/codes'),
  useFetch('/api/admin/prizes'),
])

const now = new Date()
const currentPrefix = `T${now.getMonth() + 1}${now.getFullYear().toString().slice(-2)}`
</script>

<template>
  <div>
    <h1 class="page-title">Dashboard</h1>

    <div class="grid">
      <NuxtLink to="/admin/codes" class="stat-card codes">
        <div class="icon">🎫</div>
        <div class="info">
          <div class="count">{{ codes?.length ?? 0 }}</div>
          <div class="label">Mã tham gia</div>
          <div class="sub">Tháng này: {{ currentPrefix }}XXXXXX</div>
        </div>
      </NuxtLink>

      <NuxtLink to="/admin/events" class="stat-card events">
        <div class="icon">📅</div>
        <div class="info">
          <div class="count">{{ events?.length ?? 0 }}</div>
          <div class="label">Sự kiện</div>
          <div class="sub">Quản lý danh sách sự kiện</div>
        </div>
      </NuxtLink>

      <NuxtLink to="/admin/prizes" class="stat-card prizes">
        <div class="icon">🏆</div>
        <div class="info">
          <div class="count">{{ prizes?.length ?? 0 }}</div>
          <div class="label">Giải thưởng</div>
          <div class="sub">Quản lý giải thưởng</div>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.page-title { font-size: 1.3rem; font-weight: 700; color: #1e293b; margin-bottom: 1.5rem; }

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid #e2e8f0;
  text-decoration: none;
  transition: box-shadow 0.2s, transform 0.15s;
}

.stat-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
  transform: translateY(-2px);
}

.icon { font-size: 2.5rem; }

.count { font-size: 2rem; font-weight: 700; color: #1e293b; line-height: 1; }
.label { font-size: 0.9rem; font-weight: 600; color: #475569; margin-top: 0.25rem; }
.sub { font-size: 0.78rem; color: #94a3b8; margin-top: 0.25rem; }

.stat-card.codes { border-left: 4px solid #2563eb; }
.stat-card.events { border-left: 4px solid #16a34a; }
.stat-card.prizes { border-left: 4px solid #d97706; }
</style>

