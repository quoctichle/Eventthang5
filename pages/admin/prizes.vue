<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })

const { data: rows, refresh } = await useFetch<any[]>('/api/admin/codes-won')

const total = computed(() => rows.value?.length ?? 0)
const spun = computed(() => rows.value?.filter((r: any) => r.prize_name).length ?? 0)
const notSpun = computed(() => total.value - spun.value)

const search = ref('')
const filter = ref('all')

const filtered = computed(() => {
  let list = rows.value ?? []
  if (filter.value === 'spun') list = list.filter((r: any) => r.prize_name)
  if (filter.value === 'notspun') list = list.filter((r: any) => !r.prize_name)
  if (search.value.trim()) {
    const q = search.value.trim().toLowerCase()
    list = list.filter((r: any) =>
      r.code.toLowerCase().includes(q) || (r.prize_name ?? '').toLowerCase().includes(q)
    )
  }
  return list
})

async function resetWinner(code: string) {
  if (!confirm(`Xóa kết quả quay của mã ${code}? Người dùng sẽ có thể quay lại!`)) return
  await $fetch('/api/admin/winners/by-code', { method: 'DELETE', body: { code } })
  await refresh()
}
</script>

<template>
  <div>
    <h1 class="page-title">🏆 Quản lý giải thưởng</h1>

    <div class="stats">
      <div class="stat"><span class="num">{{ total }}</span><span class="lbl">Tổng mã</span></div>
      <div class="stat green"><span class="num">{{ spun }}</span><span class="lbl">Đã quay</span></div>
      <div class="stat gray"><span class="num">{{ notSpun }}</span><span class="lbl">Chưa quay</span></div>
    </div>

    <section class="card">
      <div class="toolbar">
        <input v-model="search" placeholder="Tìm mã hoặc giải thưởng..." class="search" />
        <div class="filters">
          <button :class="{ active: filter === 'all' }" @click="filter = 'all'">Tất cả</button>
          <button :class="{ active: filter === 'spun' }" @click="filter = 'spun'">Đã quay</button>
          <button :class="{ active: filter === 'notspun' }" @click="filter = 'notspun'">Chưa quay</button>
        </div>
      </div>

      <table v-if="filtered.length">
        <thead>
          <tr>
            <th>Mã truy cập</th>
            <th>Giải trúng</th>
            <th>Thời gian quay</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in filtered" :key="r.id">
            <td><span class="code-chip">{{ r.code }}</span></td>
            <td>
              <span v-if="r.prize_name" class="prize-chip">{{ r.prize_name }}</span>
              <span v-else class="not-spun">Chưa quay</span>
            </td>
            <td class="meta">{{ r.won_at ? new Date(r.won_at).toLocaleString('vi-VN') : '—' }}</td>
            <td>
              <button v-if="r.prize_name" class="btn-reset" @click="resetWinner(r.code)">
                ↺ Đặt lại
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-else class="empty">Không có bản ghi nào.</p>
    </section>
  </div>
</template>

<style scoped>
.page-title { font-size: 1.3rem; font-weight: 700; color: #1e293b; margin-bottom: 1.5rem; }
.stats { display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
.stat { background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 1rem 1.5rem; display: flex; flex-direction: column; align-items: center; min-width: 100px; }
.stat.green { border-color: #bbf7d0; background: #f0fdf4; }
.stat.gray { border-color: #e2e8f0; background: #f8fafc; }
.num { font-size: 1.8rem; font-weight: 800; color: #1e293b; line-height: 1; }
.stat.green .num { color: #16a34a; }
.lbl { font-size: 0.75rem; color: #64748b; margin-top: 0.2rem; }
.card { background: white; border-radius: 10px; padding: 1.5rem; border: 1px solid #e2e8f0; }
.toolbar { display: flex; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap; align-items: center; }
.search { flex: 1; min-width: 200px; padding: 0.55rem 0.9rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem; }
.search:focus { outline: none; border-color: #2563eb; }
.filters { display: flex; gap: 0.4rem; }
.filters button { background: #f1f5f9; border: 1px solid #e2e8f0; padding: 0.4rem 0.9rem; border-radius: 6px; cursor: pointer; font-size: 0.85rem; color: #475569; }
.filters button.active { background: #2563eb; color: white; border-color: #2563eb; }
table { width: 100%; border-collapse: collapse; }
th, td { text-align: left; padding: 0.75rem; border-bottom: 1px solid #f1f5f9; font-size: 0.88rem; }
th { color: #64748b; font-weight: 600; background: #f8fafc; }
.code-chip { background: #1e293b; color: #fbbf24; padding: 0.2rem 0.7rem; border-radius: 6px; font-family: monospace; font-size: 0.9rem; font-weight: 700; letter-spacing: 0.05em; }
.prize-chip { background: #f0fdf4; color: #16a34a; padding: 0.2rem 0.7rem; border-radius: 20px; font-size: 0.85rem; font-weight: 600; border: 1px solid #bbf7d0; }
.not-spun { color: #94a3b8; font-size: 0.85rem; }
.meta { color: #64748b; font-size: 0.82rem; }
.btn-reset { background: #fef9c3; color: #92400e; border: 1px solid #fde68a; padding: 0.25rem 0.6rem; border-radius: 5px; cursor: pointer; font-size: 0.78rem; }
.btn-reset:hover { background: #fef08a; }
.empty { color: #94a3b8; font-size: 0.9rem; }
</style>
