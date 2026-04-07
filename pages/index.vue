<script setup lang="ts">
definePageMeta({
  layout: false
})

const { data: prizes } = await useFetch<any[]>('/api/prizes')
const { data: spinData } = await useFetch<{ spun: boolean, result: any }>('/api/spin-result')

const route = useRoute()

const COLORS = [
  '#f97316','#eab308','#22c55e','#06b6d4','#6366f1',
  '#ec4899','#ef4444','#84cc16','#14b8a6','#a855f7',
  '#f59e0b','#10b981','#3b82f6','#e11d48','#8b5cf6'
]

const canvasRef = ref<HTMLCanvasElement | null>(null)
const spinning = ref(false)
const result = ref<any>(spinData.value?.spun ? spinData.value.result : null)
const showResult = ref(false)
const alreadySpun = ref(spinData.value?.spun ?? false)
let currentAngle = 0

const segments = computed(() => {
  const list = prizes.value ?? []
  if (!list.length) return []
  const sweep = (Math.PI * 2) / list.length
  let start = 0
  return list.map((p: any, i: number) => {
    // Luôn hiện đủ tất cả giải thưởng, chia độ rộng bằng nhau
    const seg = { ...p, start, sweep, color: COLORS[i % COLORS.length] }
    start += sweep
    return seg
  })
})

function drawWheel(angle = 0) {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')!
  const cx = canvas.width / 2
  const cy = canvas.height / 2
  const r = cx - 20 // Make room for outer rim
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Outer decorative rim with lights
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, r + 16, 0, Math.PI * 2)
  ctx.fillStyle = '#0f172a'
  ctx.fill()
  
  ctx.lineWidth = 4
  ctx.strokeStyle = '#fbbf24'
  ctx.stroke()

  // Draw 24 lights
  for (let i = 0; i < 24; i++) {
    const dotA = (i * Math.PI * 2) / 24
    const dx = cx + (r + 8) * Math.cos(dotA)
    const dy = cy + (r + 8) * Math.sin(dotA)
    ctx.beginPath()
    ctx.arc(dx, dy, 4.5, 0, Math.PI * 2)
    // Make them blink based on rotation angle!
    const isLit = (Math.floor((angle * 8) + i) % 2) === 0
    ctx.fillStyle = isLit ? '#ffffff' : '#f59e0b'
    ctx.shadowColor = isLit ? '#ffffff' : 'transparent'
    ctx.shadowBlur = isLit ? 6 : 0
    ctx.fill()
  }
  ctx.restore()

  // Inner white circle base
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.4)'
  ctx.shadowBlur = 12
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill()
  ctx.restore()

  segments.value.forEach(seg => {
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, r, angle + seg.start, angle + seg.start + seg.sweep)
    ctx.closePath()
    ctx.fillStyle = seg.color
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(angle + seg.start + seg.sweep / 2)
    ctx.textAlign = 'right'
    ctx.fillStyle = '#fff'
    ctx.shadowColor = 'rgba(0,0,0,0.5)'
    ctx.shadowBlur = 4
    
    // Dynamic text sizing & wrapping
    const fontSize = seg.sweep > 0.35 ? 13 : 11
    ctx.font = `bold ${fontSize}px sans-serif`
    
    // Split full name into multiple lines if too long
    const words = seg.name.split(' ')
    const lines = []
    let currentLine = words[0] || ''
    
    for (let j = 1; j < words.length; j++) {
      const testLine = currentLine + ' ' + words[j]
      if (ctx.measureText(testLine).width > 110) {
        lines.push(currentLine)
        currentLine = words[j]
      } else {
        currentLine = testLine
      }
    }
    lines.push(currentLine)
    
    const lineHeight = fontSize * 1.4
    const startY = 0 - ((lines.length - 1) * lineHeight) / 2 + (fontSize / 3)
    
    lines.forEach((line, idx) => {
      // maxWidth=135 fits nicely inside the radius
      ctx.fillText(line, r - 15, startY + idx * lineHeight, 135)
    })
    ctx.restore()
  })

  // Center button overlay
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, 32, 0, Math.PI * 2)
  ctx.fillStyle = '#ffffff'
  ctx.shadowColor = 'rgba(0,0,0,0.5)'
  ctx.shadowBlur = 8
  ctx.fill()

  ctx.beginPath()
  ctx.arc(cx, cy, 26, 0, Math.PI * 2)
  ctx.fillStyle = '#1e293b'
  ctx.fill()
  
  ctx.fillStyle = '#fbbf24'
  ctx.font = 'bold 14px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('QUAY', cx, cy)
  ctx.restore()
}

async function spin() {
  if (spinning.value || alreadySpun.value || !segments.value.length) return
  
  // Xác định danh sách các giải thưởng còn suất (số lượng > 0)
  const availablePrizes = segments.value.filter(seg => seg.quantity > 0)
  if (!availablePrizes.length) {
    alert('Đã hết giải thưởng tặng kèm!')
    return
  }

  spinning.value = true
  showResult.value = false

  // Weighted random pick (Dựa theo số lượng suất còn lại của availablePrizes)
  const total = availablePrizes.reduce((s, seg) => s + seg.quantity, 0)
  let rand = Math.random() * total
  let winner = availablePrizes[0]
  for (const seg of availablePrizes) {
    rand -= seg.quantity
    if (rand <= 0) { winner = seg; break }
  }

  // Animate wheel to winner
  const winMid = winner.start + winner.sweep / 2
  const targetOffset = -Math.PI / 2 - winMid
  const fullSpins = (Math.PI * 2) * (5 + Math.floor(Math.random() * 4))
  const targetAngle = currentAngle + fullSpins + ((targetOffset - currentAngle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2)

  const duration = 4500
  const startTime = performance.now()
  const startAngle = currentAngle

  await new Promise<void>(resolve => {
    function animate(now: number) {
      const t = Math.min((now - startTime) / duration, 1)
      const ease = 1 - Math.pow(1 - t, 4)
      currentAngle = startAngle + (targetAngle - startAngle) * ease
      drawWheel(currentAngle)
      if (t < 1) requestAnimationFrame(animate)
      else resolve()
    }
    requestAnimationFrame(animate)
  })

  currentAngle = targetAngle % (Math.PI * 2)
  spinning.value = false

  // Lưu kết quả vào DB
  try {
    await $fetch('/api/spin', { method: 'POST', body: { prize_id: winner.id } })
    alreadySpun.value = true
    result.value = winner
    showResult.value = true
  } catch (e: any) {
    if (e?.statusCode === 401 || e?.data?.statusCode === 401) {
      await navigateTo('/access')
    } else if (e?.data?.statusCode === 409) {
      alreadySpun.value = true
    } else {
      alert('Có lỗi xảy ra, vui lòng thử lại!')
    }
  }
}

onMounted(() => {
  drawWheel(currentAngle)
  // Tự hiển popup nếu đã quay rồi
  if (alreadySpun.value && result.value) {
    showResult.value = true
  }
})

watch(segments, () => {
  nextTick(() => drawWheel(currentAngle))
}, { deep: true })
</script>

<template>
  <div class="wheel-page">
    <h1 class="title">🎡 Vòng Quay May Mắn</h1>
    <p class="subtitle">Sunshine Telecom 2026</p>

    <!-- Banner kết quả nếu đã quay rồi -->
    <div v-if="alreadySpun && result" class="won-banner">
      <div class="won-icon">🎊</div>
      <div class="won-title">Bạn đã trúng giải!</div>
      <div class="won-prize-name">{{ result.prize_name ?? result.name }}</div>
      <div v-if="result.description" class="won-note">{{ result.description }}</div>
      <div class="won-sub">Mỗi mã chỉ được quay 1 lần. Liên hệ BTC để nhận giải.</div>
    </div>

    <!-- Vòng quay (chỉ hiện khi chưa quay) -->
    <div v-else-if="prizes && prizes.length" class="wheel-wrap">
      <div class="pointer">▼</div>
      <canvas ref="canvasRef" width="420" height="420" class="canvas" @click="spin" />
      <button class="spin-btn" :disabled="spinning" @click="spin">
        {{ spinning ? 'Đang quay...' : '🎰 QUAY NGAY' }}
      </button>
    </div>

    <div v-else class="empty">Chưa có giải thưởng nào được cấu hình.</div>

    <!-- Result Modal -->
    <Transition name="pop">
      <div v-if="showResult && result" class="overlay" @click="showResult = false">
        <div class="modal" @click.stop>
          <div class="confetti">🎊</div>
          <h2>Chúc mừng!</h2>
          <p class="prize-name">{{ result.prize_name ?? result.name }}</p>
          <p v-if="result.description" class="prize-note">{{ result.description }}</p>
          <button class="close-btn" @click="showResult = false">Đóng</button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style>
* {
  box-sizing: border-box;
}
body {
  margin: 0;
  padding: 0;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background-color: #1e293b; /* Fallback for safe areas on mobile devices */
}
</style>

<style scoped>
.wheel-page {
  min-height: 100vh; /* changed from 80vh to 100vh for full screen */
  display: flex;
  flex-direction: column;
  justify-content: center; /* helps centering vertically on mobile */
  align-items: center;
  padding: 2rem 1rem;
  background: linear-gradient(160deg, #1e293b 0%, #312e81 100%);
}
.title {
  font-size: clamp(1.8rem, 6vw, 2.8rem);
  font-weight: 800;
  color: #fbbf24;
  margin: 0;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-shadow: 0 4px 12px rgba(0,0,0,0.5);
}
.subtitle {
  color: #cbd5e1;
  margin: 0.5rem 0 2.5rem;
  font-size: clamp(0.9rem, 3.5vw, 1.1rem);
  text-align: center;
  font-weight: 500;
  letter-spacing: 0.02em;
}
.wheel-wrap {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}
.pointer {
  font-size: 2.5rem;
  color: #ef4444;
  filter: drop-shadow(0 4px 6px rgba(0,0,0,0.6));
  line-height: 1;
  z-index: 2;
  margin-bottom: -1.7rem;
  position: relative;
  top: 8px;
}
.canvas {
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 0 45px rgba(251,191,36,0.4), 0 12px 30px rgba(0,0,0,0.7);
  max-width: 96vw;
  height: auto;
  aspect-ratio: 1 / 1;
  touch-action: none;
  -webkit-tap-highlight-color: transparent;
}
.spin-btn {
  background: linear-gradient(135deg, #f97316, #eab308);
  color: white;
  border: none;
  padding: 1rem 3rem;
  border-radius: 50px;
  font-size: 1.25rem;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 6px 25px rgba(249,115,22,0.5);
  letter-spacing: 0.05em;
  transition: transform 0.15s, box-shadow 0.15s;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  margin-top: 1rem;
}
.spin-btn:active:not(:disabled) { transform: scale(0.96) translateY(2px); box-shadow: 0 3px 15px rgba(249,115,22,0.4); }
.spin-btn:hover:not(:disabled) { transform: translateY(-3px); box-shadow: 0 8px 30px rgba(249,115,22,0.6); }
.spin-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.won-banner {
  display: flex; flex-direction: column; align-items: center; gap: 0.6rem;
  background: rgba(255,255,255,0.08); border: 2px solid rgba(251,191,36,0.5);
  border-radius: 20px; padding: 2.5rem 2rem; max-width: 380px; width: 90%; text-align: center;
}
.won-icon { font-size: 3rem; }
.won-title { color: #fbbf24; font-size: 1.1rem; font-weight: 700; }
.won-prize-name { color: white; font-size: 1.8rem; font-weight: 800; }
.won-note { color: #94a3b8; font-size: 0.9rem; }
.won-sub { color: #475569; font-size: 0.78rem; margin-top: 0.5rem; }
.empty { color: #64748b; }

/* Modal */
.overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.65);
  display: flex; align-items: center; justify-content: center;
  z-index: 100;
}
.modal {
  background: white;
  border-radius: 20px;
  padding: 2.5rem 2rem;
  text-align: center;
  max-width: 340px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}
.confetti { font-size: 3rem; }
.modal h2 { font-size: 1.5rem; color: #1e293b; margin: 0.5rem 0; }
.prize-name {
  font-size: 1.4rem;
  font-weight: 800;
  color: #f97316;
  margin: 0.5rem 0;
}
.prize-note { color: #64748b; font-size: 0.9rem; margin-bottom: 1rem; }
.close-btn {
  background: #1e293b; color: white; border: none;
  padding: 0.6rem 2rem; border-radius: 50px;
  cursor: pointer; font-size: 0.95rem; margin-top: 0.5rem;
}
.close-btn:hover { background: #334155; }

/* Transition */
.pop-enter-active { animation: pop-in 0.3s ease; }
.pop-leave-active { animation: pop-in 0.2s ease reverse; }
@keyframes pop-in {
  from { opacity: 0; transform: scale(0.8); }
  to   { opacity: 1; transform: scale(1); }
}
</style>
