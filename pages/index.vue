<script setup lang="ts">
definePageMeta({
  layout: false
})

const { data: prizes } = await useFetch<any[]>('/api/prizes')
const { data: spinData } = await useFetch<{ spun: boolean, result: any }>('/api/spin-result')

const lang = useLang()
const showLangDropdown = ref(false)
const translatedPrizes = ref<any[]>([])

function selectLang(l: typeof lang.value) {
  lang.value = l
  showLangDropdown.value = false
}

const t = computed(() => i18nData[lang.value])

async function translateText(text: string, targetLang: string) {
  if (!text) return ''
  if (targetLang === 'vi') return text
  try {
    const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=vi&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`)
    const data = await res.json()
    return data[0].map((x: any) => x[0]).join('')
  } catch {
    return text
  }
}

watch([lang, prizes], async () => {
  if (!prizes.value) return

  if (lang.value === 'vi') {
    translatedPrizes.value = JSON.parse(JSON.stringify(prizes.value))
    return
  }

  const translatedList = []
  for (const p of prizes.value) {
    const translatedName = await translateText(p.name, lang.value)
    const translatedDesc = p.description ? await translateText(p.description, lang.value) : ''
    translatedList.push({ ...p, name: translatedName, description: translatedDesc })
  }
  translatedPrizes.value = translatedList
}, { immediate: true })

const COLORS = [
  '#25be07',
  '#ff9d18',
  '#39cb09',
  '#ffd21a',
  '#a9d100',
  '#ff7b12',
  '#cde000',
  '#ffb31e'
]

const canvasRef = ref<HTMLCanvasElement | null>(null)
const spinning = ref(false)
const result = ref<any>(spinData.value?.spun ? spinData.value.result : null)
const showResult = ref(false)
const alreadySpun = ref(spinData.value?.spun ?? false)
let currentAngle = 0

const segments = computed(() => {
  const list = translatedPrizes.value ?? []
  if (!list.length) return []
  const sweep = (Math.PI * 2) / list.length
  // Bắt đầu từ trục dọc trên cùng (-90 độ), lùi về một nửa sweep để đặt đúng tâm giải đầu tiên vào múi chỉ
  let start = -Math.PI / 2 - sweep / 2
  return list.map((p: any, i: number) => {
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
  
  const R_out = cx - 1 // Draw to the very edge of the canvas to avoid transparent gaps
  const R_mid = R_out - 6 // Thick dark rim starts here
  const R_in = R_mid - 26 // Inner ring
  
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Rims
  ctx.save()
  ctx.translate(cx, cy)
  
  // Layer 1: Outermost thin gradient rim
  ctx.beginPath()
  ctx.arc(0, 0, R_out, 0, Math.PI * 2)
  const gradOut = ctx.createLinearGradient(0, -R_out, 0, R_out)
  gradOut.addColorStop(0, '#cff222') // Bright yellow-green top
  gradOut.addColorStop(1, '#1fa80d') // Deep green bottom
  ctx.fillStyle = gradOut
  ctx.fill()

  // Layer 2: Thick dark green rim
  ctx.beginPath()
  ctx.arc(0, 0, R_mid, 0, Math.PI * 2)
  ctx.fillStyle = '#005b22'
  ctx.fill()
  
  // Inner gradient shadow overlay for the thick dark green rim (for 3D depth)
  ctx.beginPath()
  ctx.arc(0, 0, R_mid, 0, Math.PI * 2)
  const thickRimShadow = ctx.createRadialGradient(0, 0, R_in, 0, 0, R_mid)
  thickRimShadow.addColorStop(0, 'rgba(0,0,0,0.3)') // Giảm nửa độ đậm
  thickRimShadow.addColorStop(0.5, 'rgba(0,0,0,0)')
  ctx.fillStyle = thickRimShadow
  ctx.fill()

  // Layer 3: Thin inner yellow/gold edge bounding the slices
  ctx.beginPath()
  ctx.arc(0, 0, R_in + 3, 0, Math.PI * 2)
  ctx.fillStyle = '#ffcc00'
  ctx.fill()
  
  ctx.restore()

  // Slices
  ctx.save()
  ctx.translate(cx, cy)
  ctx.beginPath()
  ctx.arc(0, 0, R_in, 0, Math.PI * 2)
  ctx.clip()

  const sliceColors = [
    { baseL: '#fecf19', baseD: '#f3aa16', kiteL: '#ffb515', kiteD: '#ec8c05' }, // Gold/Yellow (nhẹ hơn)
    { baseL: '#8aea2b', baseD: '#6bc700', kiteL: '#70cb0e', kiteD: '#55bb0b' }, // Light Green (nhẹ hơn)
    { baseL: '#ffbb28', baseD: '#f09020', kiteL: '#f09020', kiteD: '#d96403' }, // Orange (nhẹ hơn)
    { baseL: '#4cc90c', baseD: '#14a818', kiteL: '#46b20a', kiteD: '#119114' }  // Dark Green (nhẹ hơn)
  ]

  segments.value.forEach((seg, idx) => {
    const c = sliceColors[idx % sliceColors.length]

    ctx.save()
    ctx.rotate(angle)

    // Base slice background (Lighter Gradient)
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.arc(0, 0, R_in, seg.start, seg.start + seg.sweep)
    ctx.closePath()
    const baseGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, R_in)
    baseGrad.addColorStop(0, c.baseL)
    baseGrad.addColorStop(1, c.baseD)
    ctx.fillStyle = baseGrad
    ctx.fill()

    // Kite shape extending from the center (Darker Gradient)
    const mid = seg.start + seg.sweep / 2
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(Math.cos(seg.start) * R_in * 0.333, Math.sin(seg.start) * R_in * 0.333) // Mở rộng đáy bắt đầu từ 1/3 bán kính
    ctx.lineTo(Math.cos(mid) * R_in * 0.95, Math.sin(mid) * R_in * 0.95) // Đỉnh tam giác thu lại một chút (0.95) để không quá sát
    ctx.lineTo(Math.cos(seg.start + seg.sweep) * R_in * 0.333, Math.sin(seg.start + seg.sweep) * R_in * 0.333)
    ctx.closePath()
    const kiteGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, R_in)
    kiteGrad.addColorStop(0, c.kiteL)
    kiteGrad.addColorStop(1, c.kiteD)
    ctx.fillStyle = kiteGrad
    ctx.fill()
    ctx.restore()
  })

  // Shadow inside the slices overlapping from the rim to create inset depth
  ctx.beginPath()
  ctx.arc(0, 0, R_in, 0, Math.PI * 2)
  const sliceShadow = ctx.createRadialGradient(0, 0, R_in * 0.94, 0, 0, R_in)
  sliceShadow.addColorStop(0, 'rgba(0,0,0,0)')
  sliceShadow.addColorStop(1, 'rgba(0,0,0,0.25)') // Giảm mạnh độ bóng đen
  ctx.fillStyle = sliceShadow
  ctx.fill()

  // Stroke lines between slices
  segments.value.forEach((seg) => {
    ctx.save()
    ctx.rotate(angle)
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(Math.cos(seg.start) * R_in, Math.sin(seg.start) * R_in)
    ctx.lineWidth = 1.0
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.stroke()
    ctx.restore()
  })
  
  ctx.restore() // End clip for slices

  // Draw Text
  segments.value.forEach((seg, idx) => {
    const mid = angle + seg.start + seg.sweep / 2

    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(mid)
    
    ctx.textAlign = 'right'
    ctx.fillStyle = '#ffffff'
    ctx.shadowColor = 'rgba(0,0,0,0.85)'
    ctx.shadowBlur = 5
    ctx.shadowOffsetX = 1
    ctx.shadowOffsetY = 1

    const fontSize = seg.sweep > 0.35 ? 16 : 14
    ctx.font = `bold ${fontSize}px sans-serif`

    const words = (seg.name || '').split(' ')
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

    const lineHeight = fontSize * 1.3
    const startY = -((lines.length - 1) * lineHeight) / 2 + (fontSize / 3)

    lines.forEach((line, lineIdx) => {
      ctx.fillText(line, R_in - 15, startY + lineIdx * lineHeight, 140)
    })
    ctx.restore()
  })

  // Center hub
  ctx.save()
  ctx.translate(cx, cy)
  
  // Center shadow
  ctx.shadowColor = 'rgba(0,0,0,0.6)'
  ctx.shadowBlur = 12
  ctx.shadowOffsetY = 4

  // Outer dark rim of button
  ctx.beginPath()
  ctx.arc(0, 0, 36, 0, Math.PI * 2)
  const centerGrad = ctx.createLinearGradient(0, -36, 0, 36)
  centerGrad.addColorStop(0, '#005b26')
  centerGrad.addColorStop(1, '#001a07')
  ctx.fillStyle = centerGrad
  ctx.fill()
  
  // Clear shadow
  ctx.shadowColor = 'transparent'

  // Inner button face
  ctx.beginPath()
  ctx.arc(0, 0, 30, 0, Math.PI * 2)
  ctx.fillStyle = '#005928'
  ctx.fill()

  ctx.fillStyle = '#ffde00'
  ctx.font = 'bold 16px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = 'rgba(0,0,0,0.5)'
  ctx.shadowBlur = 2
  ctx.shadowOffsetY = 1
  ctx.fillText(t.value.spin, 0, 0)
  ctx.restore()
}

async function spin() {
  if (spinning.value || alreadySpun.value || !segments.value.length) return

  const availablePrizes = segments.value.filter(seg => seg.quantity > 0)
  if (!availablePrizes.length) {
    alert(t.value.out_of_prizes)
    return
  }

  spinning.value = true
  showResult.value = false

  const total = availablePrizes.reduce((s, seg) => s + seg.quantity, 0)
  let rand = Math.random() * total
  let winner = availablePrizes[0]
  for (const seg of availablePrizes) {
    rand -= seg.quantity
    if (rand <= 0) {
      winner = seg
      break
    }
  }

  const winMid = winner.start + winner.sweep / 2
  const targetOffset = -Math.PI / 2 - winMid
  const fullSpins = (Math.PI * 2) * (5 + Math.floor(Math.random() * 4))
  const targetAngle = currentAngle + fullSpins + ((targetOffset - currentAngle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2)

  const duration = 4500
  const startTime = performance.now()
  const startAngle = currentAngle

  await new Promise<void>(resolve => {
    function animate(now: number) {
      const progress = Math.min((now - startTime) / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 4)
      currentAngle = startAngle + (targetAngle - startAngle) * ease
      drawWheel(currentAngle)
      if (progress < 1) requestAnimationFrame(animate)
      else resolve()
    }
    requestAnimationFrame(animate)
  })

  currentAngle = targetAngle % (Math.PI * 2)
  spinning.value = false
  result.value = winner
  showResult.value = true
  alreadySpun.value = true

  $fetch('/api/spin', { method: 'POST', body: { prize_id: winner.id } })
    .catch((e: any) => {
      if (e?.statusCode === 401 || e?.data?.statusCode === 401) {
        navigateTo('/access')
      } else if (e?.data?.statusCode === 409) {
        // Ma da quay roi.
      }
    })
}

onMounted(() => {
  drawWheel(currentAngle)
  if (alreadySpun.value && result.value) {
    showResult.value = true
  }
})

watch(() => segments.value, () => {
  drawWheel(currentAngle)
}, { deep: true })

async function enterNewCode() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  window.location.href = '/access'
}

watch(segments, () => {
  nextTick(() => drawWheel(currentAngle))
}, { deep: true })
</script>

<template>
  <div class="wheel-page">
    <div class="lang-switcher" @click.stop="showLangDropdown = !showLangDropdown">
      <div class="current-lang">
        <div class="flag-circle">
          <img :src="flags[lang]" alt="Language" class="flag-icon" />
        </div>
        <svg class="chevron" :class="{ 'rotate': showLangDropdown }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
      </div>
      <Transition name="fade">
        <div v-if="showLangDropdown" class="lang-dropdown">
          <div class="lang-option" :class="{ active: lang === 'ja' }" @click="selectLang('ja')">
            <div class="flag-circle"><img src="/nhat.png" alt="JP" class="flag-icon" /></div>
            <span class="lang-text">日本語</span>
          </div>
          <div class="lang-option" :class="{ active: lang === 'en' }" @click="selectLang('en')">
            <div class="flag-circle"><img src="/anh.png" alt="EN" class="flag-icon" /></div>
            <span class="lang-text">English</span>
          </div>
          <div class="lang-option" :class="{ active: lang === 'vi' }" @click="selectLang('vi')">
            <div class="flag-circle"><img src="/viet.png" alt="VI" class="flag-icon" /></div>
            <span class="lang-text">Tiếng Việt</span>
          </div>
          <div class="lang-option" :class="{ active: lang === 'my' }" @click="selectLang('my')">
            <div class="flag-circle"><img src="/myanma.png" alt="MY" class="flag-icon" /></div>
            <span class="lang-text">မြန်မာ</span>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Banner kết quả nếu đã quay rồi -->
    <div v-if="alreadySpun && result" class="won-banner">
      <div class="won-icon">🎊</div>
      <div class="won-title">{{ t.won }}</div>
      <div class="won-prize-name">{{ result.prize_name ?? result.name }}</div>
      <div v-if="result.description" class="won-note">{{ result.description }}</div>
      <div class="won-sub">{{ t.note }}</div>
      <button class="new-code-btn" @click="enterNewCode">{{ t.enter_new_code }}</button>
    </div>

    <!-- Vòng quay (chỉ hiện khi chưa quay) -->
    <div v-else-if="translatedPrizes && translatedPrizes.length" class="wheel-wrap">
      <div class="pointer"></div>
        <canvas ref="canvasRef" width="500" height="500" class="canvas" @click="spin" />
      <button class="spin-btn" :disabled="spinning" @click="spin">
        {{ spinning ? t.spinning : t.spin_now }}
      </button>
    </div>

    <div v-else class="empty">{{ t.empty }}</div>

    <!-- Result Modal -->
    <Transition name="pop">
      <div v-if="showResult && result" class="overlay" @click="showResult = false">
        <div class="modal" @click.stop>
          <div class="confetti">🎊</div>
          <h2>{{ t.congrats }}</h2>
          <p class="prize-name">{{ result.prize_name ?? result.name }}</p>
          <p v-if="result.description" class="prize-note">{{ result.description }}</p>
          <button class="close-btn" @click="showResult = false">{{ t.close }}</button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style>
* {
  box-sizing: border-box;
}
html,
body {
  margin: 0;
  padding: 0;
  min-height: 100%;
  background-color: #1e293b;
  background-image: url('/Backgroundmobile.png');
  background-size: 100vw 100dvh;
  background-position: top center;
  background-repeat: no-repeat;
}

@media (min-width: 768px) {
  html,
  body {
    background-image: url('/BackgroundPC.png');
    background-size: 100vw 100vh;
    background-position: center center;
  }
}
</style>

<style scoped>
.wheel-page {
  position: relative;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  justify-content: center; /* helps centering vertically on mobile */
  align-items: center;
  padding: 2rem 1rem;
  background: transparent;
}
.lang-switcher {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 10;
  user-select: none;
}
.current-lang {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  background: transparent;
  padding: 0.35rem 0.6rem 0.35rem 0.4rem;
  border-radius: 50px;
  cursor: pointer;
  border: 2px solid #f59e0b; /* Viền cam sáng hơn xíu */
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);
  transition: transform 0.2s, background 0.2s;
}
.current-lang:hover {
  transform: scale(1.05);
  background: rgba(255,255,255,0.05);
}
.flag-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 2px 5px rgba(0,0,0,0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}
.flag-icon {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scale(1.2); /* Zoom nhẹ để lấp đầy viền cong */
}
.chevron {
  width: 18px;
  height: 18px;
  color: #10b981; /* Xanh ngọc lục bảo để nổi bật trên nền xanh đen */
  transition: transform 0.3s ease;
  margin-right: 0.2rem;
}
.chevron.rotate {
  transform: rotate(180deg);
}
.lang-dropdown {
  position: absolute;
  top: calc(100% + 0.6rem);
  right: 0;
  background: #f8fafc;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0,0,0,0.3);
  display: flex;
  flex-direction: column;
  min-width: 160px;
  border: 1px solid #e2e8f0;
}
.lang-option {
  padding: 0.7rem 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  transition: background 0.2s;
}
.lang-option:hover {
  background: #e2e8f0;
}
.lang-option.active {
  background: #cbd5e1;
}
.lang-option.active .lang-text {
  color: #064e3b;
  font-weight: 700;
}
.lang-text {
  color: #334155;
  font-weight: 600;
  font-size: 1rem;
}
.wheel-wrap {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}
.pointer {
  width: 36px;
  height: 90px; /* Dài thêm về phía trong mũi */
  position: relative;
  z-index: 2;
  margin-bottom: -4rem; /* Cho phép kim ăn sâu hơn vào diện tích vòng quay */
  top: 48px; /* Ép đỉnh kim thụt xuống, nằm ngang bằng với mép viền ngoài cùng */
  background: linear-gradient(180deg, #6ced2a 0%, #007a33 100%);
  border-radius: 4px 4px 0 0;
  clip-path: polygon(0 0, 100% 0, 100% 75%, 50% 100%, 0 75%); /* Giữ độ tù mũi kim / bớt nhọn */
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.4));
}
/* Xóa bỏ ::before và ::after vì đã dùng clip-path trên thẻ .pointer */
.canvas {
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 10px 20px rgba(0,0,0,0.3);
  max-width: 96vw;
  max-height: 80vh; /* Ngăn không cho vượt quá chiều cao màn hình PC */
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
.new-code-btn {
  margin-top: 1rem;
  background: transparent;
  color: #fbbf24;
  border: 1px solid #fbbf24;
  padding: 0.6rem 1.5rem;
  border-radius: 50px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}
.new-code-btn:hover {
  background: rgba(251,191,36,0.1);
}

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
