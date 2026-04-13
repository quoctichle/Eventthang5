<script setup lang="ts">
import type * as THREE from 'three'
const canvasRef = ref<HTMLCanvasElement | null>(null)
let cleanupFn: (() => void) | null = null

onMounted(async () => {
  const canvas = canvasRef.value
  if (!canvas) return

  const THREE = await import('three')

  // ── Renderer ──────────────────────────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(window.innerWidth, window.innerHeight)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500)
  camera.position.set(0, 15, 52)
  camera.lookAt(0, 0, 0)

  const isMobile = window.innerWidth < 768

  // ── Glow texture factory ──────────────────────────────────────────────
  function makeGlow(r: number, g: number, b: number, ra = 64): THREE.CanvasTexture {
    const size = ra * 2
    const c = document.createElement('canvas')
    c.width = size; c.height = size
    const ctx = c.getContext('2d')!
    const grd = ctx.createRadialGradient(ra, ra, 0, ra, ra, ra)
    grd.addColorStop(0,    `rgba(${r},${g},${b},1)`)
    grd.addColorStop(0.25, `rgba(${r},${g},${b},0.7)`)
    grd.addColorStop(0.55, `rgba(${r},${g},${b},0.2)`)
    grd.addColorStop(1,    `rgba(${r},${g},${b},0)`)
    ctx.fillStyle = grd
    ctx.beginPath(); ctx.arc(ra, ra, ra, 0, Math.PI * 2); ctx.fill()
    return new THREE.CanvasTexture(c)
  }

  const texAmber  = makeGlow(255, 210,  80)
  const texBlue   = makeGlow( 90, 140, 255)
  const texPurple = makeGlow(185, 105, 255)
  const texCyan   = makeGlow( 45, 215, 240)
  const texWhite  = makeGlow(255, 255, 255)
  const texPink   = makeGlow(255, 110, 195)
  const allTextures = [texAmber, texBlue, texPurple, texCyan, texWhite, texPink]

  // ── 1. Background distant star sphere ─────────────────────────────────
  const BG_CNT = isMobile ? 900 : 2000
  const bgPos = new Float32Array(BG_CNT * 3)
  const bgCol = new Float32Array(BG_CNT * 3)
  const bgPal: [number,number,number][] = [
    [1,1,1],[0.75,0.82,1],[0.82,0.72,1],[1,0.95,0.65],[0.55,0.88,1],
  ]
  for (let i = 0; i < BG_CNT; i++) {
    const r = 75 + Math.random() * 90
    const theta = Math.random() * Math.PI * 2
    const phi   = Math.acos(2 * Math.random() - 1)
    bgPos[i*3]   = r * Math.sin(phi) * Math.cos(theta)
    bgPos[i*3+1] = r * Math.sin(phi) * Math.sin(theta)
    bgPos[i*3+2] = r * Math.cos(phi)
    const col = bgPal[Math.floor(Math.random() * bgPal.length)]!
    bgCol[i*3] = col[0]; bgCol[i*3+1] = col[1]; bgCol[i*3+2] = col[2]
  }
  const bgGeo = new THREE.BufferGeometry()
  bgGeo.setAttribute('position', new THREE.BufferAttribute(bgPos, 3))
  bgGeo.setAttribute('color',    new THREE.BufferAttribute(bgCol, 3))
  const bgMat = new THREE.PointsMaterial({
    size: 0.22, vertexColors: true, transparent: true, opacity: 0.8,
    blending: THREE.AdditiveBlending, depthWrite: false,
  })
  const bgStars = new THREE.Points(bgGeo, bgMat)
  scene.add(bgStars)

  // ── 2. Galaxy spiral arms ─────────────────────────────────────────────
  const ARMS     = 4
  const PER_ARM  = isMobile ? 240 : 480
  const DUST_CNT = isMobile ? 280 : 560
  const TURNS    = 1.75

  const armTotal = ARMS * PER_ARM
  const armPos = new Float32Array(armTotal * 3)
  const armCol = new Float32Array(armTotal * 3)

  let ai = 0
  for (let arm = 0; arm < ARMS; arm++) {
    const armOff = (arm / ARMS) * Math.PI * 2
    for (let p = 0; p < PER_ARM; p++) {
      const t = (p + 1) / PER_ARM
      const r = 1.2 + t * 27
      const spin = t * TURNS * Math.PI * 2
      const angle = armOff + spin
      const scatter = t * 2.8
      armPos[ai*3]   = r * Math.cos(angle) + (Math.random()-0.5)*scatter*1.2
      armPos[ai*3+1] = (Math.random()-0.5) * (0.25 + t * 2.8)
      armPos[ai*3+2] = r * Math.sin(angle) + (Math.random()-0.5)*scatter*1.2
      if (t < 0.18) {
        armCol[ai*3] = 1; armCol[ai*3+1] = 0.88; armCol[ai*3+2] = 0.55
      } else if (t < 0.42) {
        armCol[ai*3] = 0.38+Math.random()*0.18; armCol[ai*3+1] = 0.48+Math.random()*0.2; armCol[ai*3+2] = 1
      } else if (t < 0.70) {
        armCol[ai*3] = 0.68+Math.random()*0.2; armCol[ai*3+1] = 0.18+Math.random()*0.15; armCol[ai*3+2] = 0.88+Math.random()*0.12
      } else {
        armCol[ai*3] = 0.08+Math.random()*0.18; armCol[ai*3+1] = 0.72+Math.random()*0.2; armCol[ai*3+2] = 0.85+Math.random()*0.15
      }
      ai++
    }
  }
  const armGeo = new THREE.BufferGeometry()
  armGeo.setAttribute('position', new THREE.BufferAttribute(armPos, 3))
  armGeo.setAttribute('color',    new THREE.BufferAttribute(armCol, 3))
  const armMat = new THREE.PointsMaterial({
    size: 1.15, map: texWhite, vertexColors: true,
    transparent: true, opacity: 0.78,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  })
  const armPoints = new THREE.Points(armGeo, armMat)

  // Dust
  const dustPos = new Float32Array(DUST_CNT * 3)
  const dustCol = new Float32Array(DUST_CNT * 3)
  for (let d = 0; d < DUST_CNT; d++) {
    const r = Math.random() * 30
    const a = Math.random() * Math.PI * 2
    dustPos[d*3]   = r*Math.cos(a)+(Math.random()-0.5)*5
    dustPos[d*3+1] = (Math.random()-0.5)*3.5
    dustPos[d*3+2] = r*Math.sin(a)+(Math.random()-0.5)*5
    dustCol[d*3]   = 0.52+Math.random()*0.28
    dustCol[d*3+1] = 0.55+Math.random()*0.28
    dustCol[d*3+2] = 0.72+Math.random()*0.28
  }
  const dustGeo = new THREE.BufferGeometry()
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3))
  dustGeo.setAttribute('color',    new THREE.BufferAttribute(dustCol, 3))
  const dustMat = new THREE.PointsMaterial({
    size: 0.48, vertexColors: true,
    transparent: true, opacity: 0.38,
    blending: THREE.AdditiveBlending, depthWrite: false,
  })
  const dustPoints = new THREE.Points(dustGeo, dustMat)

  // Bright core cluster
  const CORE_CNT = isMobile ? 40 : 80
  const corePos = new Float32Array(CORE_CNT * 3)
  for (let c = 0; c < CORE_CNT; c++) {
    const r = Math.pow(Math.random(), 1.6) * 3.2
    const a = Math.random() * Math.PI * 2
    corePos[c*3]   = r*Math.cos(a)+(Math.random()-0.5)*0.6
    corePos[c*3+1] = (Math.random()-0.5)*0.55
    corePos[c*3+2] = r*Math.sin(a)+(Math.random()-0.5)*0.6
  }
  const coreGeo = new THREE.BufferGeometry()
  coreGeo.setAttribute('position', new THREE.BufferAttribute(corePos, 3))
  const coreMat = new THREE.PointsMaterial({
    size: 3.8, map: texAmber,
    transparent: true, opacity: 0.95, color: 0xfffbe8,
    blending: THREE.AdditiveBlending, depthWrite: false,
  })
  const corePoints = new THREE.Points(coreGeo, coreMat)

  const galaxyGroup = new THREE.Group()
  galaxyGroup.add(armPoints, dustPoints, corePoints)
  galaxyGroup.rotation.x = Math.PI * 0.14
  scene.add(galaxyGroup)

  // ── 3. Nebula cloud sprites ───────────────────────────────────────────
  type NebulaDef = { tex: THREE.CanvasTexture; x:number; y:number; z:number; s:number; op:number }
  const nebulaDefs: NebulaDef[] = [
    { tex: texPurple, x:-20, y: 6, z:-18, s:24, op:0.085 },
    { tex: texBlue,   x: 18, y:-5, z:-14, s:18, op:0.075 },
    { tex: texCyan,   x:  9, y: 9, z:-20, s:15, op:0.090 },
    { tex: texPink,   x:-13, y:-9, z:-22, s:17, op:0.070 },
    { tex: texAmber,  x:  1, y: 2, z: -9, s:11, op:0.115 },
    { tex: texPurple, x: 22, y:13, z:-28, s:26, op:0.060 },
  ]
  type NebSprite = { sprite: THREE.Sprite; vx:number; vy:number; phase:number; baseOp:number }
  const nebulaSprites: NebSprite[] = []
  for (const def of isMobile ? nebulaDefs.slice(0,4) : nebulaDefs) {
    const mat = new THREE.SpriteMaterial({
      map: def.tex, transparent: true, opacity: def.op,
      blending: THREE.AdditiveBlending, depthWrite: false,
    })
    const sprite = new THREE.Sprite(mat)
    sprite.position.set(def.x, def.y, def.z)
    sprite.scale.setScalar(def.s)
    scene.add(sprite)
    nebulaSprites.push({ sprite, vx:(Math.random()-0.5)*0.004, vy:(Math.random()-0.5)*0.003, phase:Math.random()*Math.PI*2, baseOp:def.op })
  }

  // ── 4. Shooting comets pool ───────────────────────────────────────────
  type Comet = {
    hx:number; hy:number; hz:number
    dx:number; dy:number; dz:number
    speed:number; life:number; len:number
    line:THREE.Line; lineGeo:THREE.BufferGeometry; lineMat:THREE.LineBasicMaterial; active:boolean
  }
  const cometColors = [0x22d3ee, 0xa78bfa, 0xfbbf24, 0xf0abfc, 0x67e8f9]
  function spawnComet(c: Comet) {
    const ang = Math.random()*Math.PI*2; const dist = 28+Math.random()*8
    c.hx = dist*Math.cos(ang); c.hy = (Math.random()-0.5)*18; c.hz = dist*Math.sin(ang)-10
    const ln = Math.sqrt(c.hx**2+c.hy**2+(c.hz+10)**2)
    c.dx = -c.hx/ln+(Math.random()-0.5)*0.25; c.dy = -c.hy/ln+(Math.random()-0.5)*0.2; c.dz = -(c.hz+10)/ln+(Math.random()-0.5)*0.25
    c.speed = 0.32+Math.random()*0.28; c.life = 1; c.len = 5+Math.random()*8; c.active = true
  }
  const COMET_POOL = isMobile ? 3 : 6
  const comets: Comet[] = []
  for (let k = 0; k < COMET_POOL; k++) {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3))
    const mat = new THREE.LineBasicMaterial({ color: cometColors[k % cometColors.length], transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })
    const line = new THREE.Line(geo, mat)
    scene.add(line)
    comets.push({ hx:0,hy:0,hz:0,dx:0,dy:0,dz:0,speed:0,life:0,len:0,line,lineGeo:geo,lineMat:mat,active:false })
  }
  let cometTimer = 0

  // ── 5. Floating wireframe shapes ──────────────────────────────────────
  const geoFacs = [
    () => new THREE.IcosahedronGeometry(1, 1),
    () => new THREE.OctahedronGeometry(1.5, 0),
    () => new THREE.TorusGeometry(1.4, 0.32, 8, 16),
    () => new THREE.TetrahedronGeometry(2, 0),
    () => new THREE.IcosahedronGeometry(2.5, 0),
  ]
  const shapeColors = [0x6366f1, 0xa855f7, 0x22d3ee, 0xfbbf24, 0xec4899]
  const SHAPE_CNT = isMobile ? 6 : 10
  type Floater = {
    mesh:THREE.Mesh; rx:number; ry:number; rz:number
    flOff:number; flSpd:number; baseY:number; orbR:number; orbSpd:number; orbA:number
  }
  const disposables: THREE.BufferGeometry[] = []
  const floaters: Floater[] = []
  for (let i = 0; i < SHAPE_CNT; i++) {
    const geo = geoFacs[i % geoFacs.length]!()
    const mat = new THREE.MeshBasicMaterial({ color: shapeColors[i % shapeColors.length], wireframe: true, transparent: true, opacity: 0.09+Math.random()*0.13 })
    const mesh = new THREE.Mesh(geo, mat)
    const orbR = 14+Math.random()*22; const orbA = (i/SHAPE_CNT)*Math.PI*2; const bY = (Math.random()-0.5)*28
    mesh.position.set(orbR*Math.cos(orbA), bY, orbR*Math.sin(orbA)-10)
    mesh.scale.setScalar(0.8+Math.random()*2.5)
    scene.add(mesh); disposables.push(geo)
    floaters.push({ mesh, rx:(Math.random()-0.5)*0.009, ry:(Math.random()-0.5)*0.012, rz:(Math.random()-0.5)*0.007, flOff:Math.random()*Math.PI*2, flSpd:0.3+Math.random()*0.6, baseY:bY, orbR, orbSpd:(0.3+Math.random()*0.7)*0.0005*(Math.random()>0.5?1:-1), orbA })
  }

  // ── 6. Large accent ring ──────────────────────────────────────────────
  const ringGeo = new THREE.TorusGeometry(26, 0.14, 4, 100)
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x6366f1, transparent: true, opacity: 0.07 })
  const ring = new THREE.Mesh(ringGeo, ringMat)
  ring.rotation.x = Math.PI / 3.5
  scene.add(ring); disposables.push(ringGeo)

  // ── Mouse parallax ────────────────────────────────────────────────────
  const mouse = { x:0, y:0 }
  const onMouseMove = (e: MouseEvent) => {
    mouse.x =  (e.clientX/window.innerWidth  - 0.5) * 2
    mouse.y = -(e.clientY/window.innerHeight - 0.5) * 2
  }
  const onTouchMove = (e: TouchEvent) => {
    if (!e.touches.length) return
    mouse.x =  (e.touches[0]!.clientX/window.innerWidth  - 0.5) * 2
    mouse.y = -(e.touches[0]!.clientY/window.innerHeight - 0.5) * 2
  }
  window.addEventListener('mousemove', onMouseMove, { passive: true })
  window.addEventListener('touchmove', onTouchMove, { passive: true })
  const onResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  }
  window.addEventListener('resize', onResize, { passive: true })

  // ── Animation loop ────────────────────────────────────────────────────
  let animId: number
  let t = 0
  const animate = () => {
    animId = requestAnimationFrame(animate)
    t += 0.005
    galaxyGroup.rotation.y += 0.0016
    bgStars.rotation.y += 0.00025
    bgStars.rotation.x += 0.00008
    ring.rotation.z += 0.00045
    ring.rotation.y += 0.00018
    for (const n of nebulaSprites) {
      n.sprite.position.x += n.vx
      n.sprite.position.y += n.vy
      ;(n.sprite.material as THREE.SpriteMaterial).opacity = n.baseOp * (0.65 + Math.sin(t*0.45+n.phase)*0.35)
    }
    cometTimer++
    if (cometTimer >= (isMobile ? 90 : 55)) {
      cometTimer = 0
      const idle = comets.find(c => !c.active)
      if (idle) spawnComet(idle)
    }
    for (const c of comets) {
      if (!c.active) continue
      c.life -= 0.012
      if (c.life <= 0) { c.active = false; c.lineMat.opacity = 0; continue }
      c.hx += c.dx*c.speed; c.hy += c.dy*c.speed; c.hz += c.dz*c.speed
      const tx = c.hx-c.dx*c.len; const ty = c.hy-c.dy*c.len; const tz = c.hz-c.dz*c.len
      const pa = c.lineGeo.attributes.position as THREE.BufferAttribute
      pa.setXYZ(0,c.hx,c.hy,c.hz); pa.setXYZ(1,tx,ty,tz); pa.needsUpdate = true
      c.lineMat.opacity = Math.min(c.life*2, 0.85)
    }
    for (const f of floaters) {
      f.mesh.rotation.x += f.rx; f.mesh.rotation.y += f.ry; f.mesh.rotation.z += f.rz
      f.orbA += f.orbSpd
      f.mesh.position.x = f.orbR*Math.cos(f.orbA)
      f.mesh.position.z = f.orbR*Math.sin(f.orbA)-10
      f.mesh.position.y = f.baseY + Math.sin(t*f.flSpd+f.flOff)*2
    }
    camera.position.x += (mouse.x*4.5  - camera.position.x) * 0.028
    camera.position.y += (15+mouse.y*3 - camera.position.y) * 0.028
    camera.lookAt(0, 0, 0)
    renderer.render(scene, camera)
  }
  animate()

  // ── Cleanup ───────────────────────────────────────────────────────────
  cleanupFn = () => {
    cancelAnimationFrame(animId)
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('touchmove', onTouchMove)
    window.removeEventListener('resize',    onResize)
    allTextures.forEach(tx => tx.dispose())
    bgGeo.dispose(); bgMat.dispose()
    armGeo.dispose(); armMat.dispose()
    dustGeo.dispose(); dustMat.dispose()
    coreGeo.dispose(); coreMat.dispose()
    nebulaSprites.forEach(n => (n.sprite.material as THREE.SpriteMaterial).dispose())
    comets.forEach(c => { c.lineGeo.dispose(); c.lineMat.dispose() })
    floaters.forEach(f => (f.mesh.material as THREE.Material).dispose())
    disposables.forEach(g => g.dispose())
    ringMat.dispose()
    renderer.dispose()
  }
})

onUnmounted(() => cleanupFn?.())
</script>

<template>
  <canvas ref="canvasRef" class="three-bg" />
</template>

<style scoped>
.three-bg {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}
</style>
