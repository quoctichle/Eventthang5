<script setup lang="ts">
definePageMeta({
  layout: false
})

const { data: prizes } = await useFetch<any[]>('/api/prizes')
const { data: spinData } = await useFetch<{ spun: boolean, result: any }>('/api/spin-result')

const route = useRoute()

// --- Multi-language Support ---
const lang = ref('ja') // Mặc định tiếng Nhật
const showLangDropdown = ref(false)
const translatedPrizes = ref<any[]>([])

const flags: Record<string, string> = {
  ja: '/nhat.png',
  en: '/anh.png',
  vi: '/viet.png',
  my: '/myanma.png'
}

function selectLang(l: string) {
  lang.value = l
  showLangDropdown.value = false
}

const i18n = {
  ja: {
    title: "ラッキールーレット",
    won: "当選しました！",
    note: "コードごとに1回のみ抽選可能です。賞品の受け取りについては主催者にお問い合わせください。",
    spin: "回す",
    spinning: "回転中...",
    spin_now: "🎰 今すぐ回す",
    empty: "賞品が設定されていません。",
    congrats: "おめでとうございます！",
    close: "閉じる",
    out_of_prizes: "賞品がありません！",
    error: "エラーが発生しました。もう一度お試しください！",
    enter_new_code: "別のコードを入力"
  },
  vi: {
    title: "Vòng Quay May Mắn",
    won: "Bạn đã trúng giải!",
    note: "Mỗi mã chỉ được quay 1 lần. Liên hệ BTC để nhận giải.",
    spin: "QUAY",
    spinning: "Đang quay...",
    spin_now: "🎰 QUAY NGAY",
    empty: "Chưa có giải thưởng nào được cấu hình.",
    congrats: "Chúc mừng!",
    close: "Đóng",
    out_of_prizes: "Đã hết giải thưởng tặng kèm!",
    error: "Có lỗi xảy ra, vui lòng thử lại!",
    enter_new_code: "Nhập mã khác"
  },
  en: {
    title: "Lucky Spin Wheel",
    won: "You've won a prize!",
    note: "Each code can only be spun once. Contact the organizer to claim your prize.",
    spin: "SPIN",
    spinning: "Spinning...",
    spin_now: "🎰 SPIN NOW",
    empty: "No prizes have been configured.",
    congrats: "Congratulations!",
    close: "Close",
    out_of_prizes: "No prizes left!",
    error: "An error occurred, please try again!",
    enter_new_code: "Enter another code"
  },
  my: {
    title: "ကံစမ်းမဲဘီး",
    won: "သင်ဆုရသွားပါပြီ!",
    note: "ကုဒ်တစ်ခုလျှင်တစ်ကြိမ်သာလှည့်နိုင်သည်။ ဆုထုတ်ယူရန် စီစဉ်သူအား ဆက်သွယ်ပါ။",
    spin: "လှည့်မည်",
    spinning: "လှည့်နေသည်...",
    spin_now: "🎰 ယခုလှည့်မည်",
    empty: "ဆုများကို သတ်မှတ်ထားခြင်းမရှိပါ။",
    congrats: "ဂုဏ်ယူပါတယ်!",
    close: "ပိတ်မည်",
    out_of_prizes: "ဆုများကုန်သွားပါပြီ!",
    error: "အမှားအယွင်းတစ်ခုဖြစ်ပွားခဲ့သည်၊ ကျေးဇူးပြု၍ ပြန်လည်ကြိုးစားပါ!",
    enter_new_code: "အခြားကုဒ်ရိုက်ထည့်ပါ"
  }
}
const t = computed(() => i18n[lang.value as keyof typeof i18n] || i18n.ja)

// Translation API for dynamic text (Prizes from DB)
async function translateText(text: string, targetLang: string) {
  if (!text) return ''
  if (targetLang === 'vi') return text // Source is vi
  try {
    const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=vi&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`)
    const data = await res.json()
    return data[0].map((x: any) => x[0]).join('')
  } catch (e) {
    return text // Fallback to original
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
// -----------------------------

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
  const list = translatedPrizes.value ?? []
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
  ctx.fillText(t.value.spin, cx, cy)
  ctx.restore()
}

async function spin() {
  if (spinning.value || alreadySpun.value || !segments.value.length) return
  
  // Xác định danh sách các giải thưởng còn suất (số lượng > 0)
  const availablePrizes = segments.value.filter(seg => seg.quantity > 0)
  if (!availablePrizes.length) {
    alert(t.value.out_of_prizes)
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

    // Hiển thị kết quả NGAY sau khi animation kết thúc, không chờ API
    result.value = winner
    showResult.value = true
    alreadySpun.value = true

    // Lưu kết quả vào DB + Sheets ở background (không block UI)
    $fetch('/api/spin', { method: 'POST', body: { prize_id: winner.id } })
      .catch((e: any) => {
        if (e?.statusCode === 401 || e?.data?.statusCode === 401) {
          navigateTo('/access')
        } else if (e?.data?.statusCode === 409) {
          // Mã đã quay rồi - không làm gì thêm
        }
        // Các lỗi khác bỏ qua vì kết quả đã hiển thị
      })
}

onMounted(() => {
  drawWheel(currentAngle)
  // Tự hiển popup nếu đã quay rồi
  if (alreadySpun.value && result.value) {
    showResult.value = true
  }
})

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

    <h1 class="title">🎡 {{ t.title }}</h1>
    <p class="subtitle">Sunshine Telecom 2026</p>

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
      <div class="pointer">▼</div>
      <canvas ref="canvasRef" width="420" height="420" class="canvas" @click="spin" />
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
body {
  margin: 0;
  padding: 0;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background-color: #1e293b; /* Fallback for safe areas on mobile devices */
}
</style>

<style scoped>
.wheel-page {
  position: relative;
  min-height: 100vh; /* changed from 80vh to 100vh for full screen */
  display: flex;
  flex-direction: column;
  justify-content: center; /* helps centering vertically on mobile */
  align-items: center;
  padding: 2rem 1rem;
  background: linear-gradient(160deg, #1e293b 0%, #312e81 100%);
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
