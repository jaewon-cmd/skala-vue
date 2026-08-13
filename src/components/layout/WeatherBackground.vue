<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'

const props = defineProps({
  status: {
    type: String,
    default: '맑음',
  },
})

const canvasRef = ref(null)

let renderer = null
let scene = null
let camera = null
let animationId = null
let particles = null
let particleMaterial = null
let clouds = null
let cloudTexture = null

// 날씨 상태별 하늘 배경색
const skyColors = {
  맑음: '#4aa8ff',
  구름: '#8fa6bd',
  비: '#556575',
  눈: '#aebfce',
  안개: '#9fb0bf',
  바람: '#7fa8cc',
}

// 날씨 상태별 구름 설정.
// count 개수, color 구름색, opacity 투명도, size 크기 범위, speed 흐르는 속도 범위
const cloudSettings = {
  맑음: { count: 4, color: 0xffffff, opacity: 0.55, size: [70, 120], speed: [0.1, 0.25] },
  구름: { count: 11, color: 0xffffff, opacity: 0.8, size: [90, 180], speed: [0.15, 0.35] },
  안개: { count: 14, color: 0xdfe6ec, opacity: 0.4, size: [140, 240], speed: [0.05, 0.15] },
  비: { count: 10, color: 0x9aa7b4, opacity: 0.75, size: [100, 190], speed: [0.2, 0.45] },
  눈: { count: 9, color: 0xe8eef4, opacity: 0.8, size: [100, 180], speed: [0.08, 0.2] },
  바람: { count: 7, color: 0xffffff, opacity: 0.65, size: [80, 150], speed: [0.5, 0.9] },
}

// 구름 모양 텍스처를 캔버스로 그린다.
// 둥근 덩어리 여러 개를 겹쳐 그려서 뭉게구름 실루엣을 만든다.
const makeCloudTexture = () => {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 128
  const ctx = canvas.getContext('2d')

  const lobes = [
    { x: 0.22, y: 0.7, r: 0.15 },
    { x: 0.36, y: 0.58, r: 0.2 },
    { x: 0.52, y: 0.48, r: 0.24 },
    { x: 0.68, y: 0.58, r: 0.19 },
    { x: 0.8, y: 0.7, r: 0.14 },
  ]

  lobes.forEach((lobe) => {
    const cx = lobe.x * canvas.width
    const cy = lobe.y * canvas.height
    const r = lobe.r * canvas.width
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
    gradient.addColorStop(0, 'rgba(255,255,255,1)')
    gradient.addColorStop(0.5, 'rgba(255,255,255,0.9)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  })

  return new THREE.CanvasTexture(canvas)
}

const randomBetween = (min, max) => min + Math.random() * (max - min)

// 화면 밖으로 나간 구름이 반대편에서 다시 들어오는 기준 좌표
const CLOUD_EDGE = 560

// 이전 구름을 지우고 현재 날씨에 맞는 구름을 새로 만든다
const buildClouds = (status) => {
  if (clouds) {
    clouds.children.forEach((sprite) => sprite.material.dispose())
    scene.remove(clouds)
    clouds = null
  }

  const setting = cloudSettings[status] ?? cloudSettings['맑음']
  clouds = new THREE.Group()

  for (let i = 0; i < setting.count; i++) {
    const material = new THREE.SpriteMaterial({
      map: cloudTexture,
      color: setting.color,
      transparent: true,
      // 구름마다 투명도를 조금씩 다르게 줘서 깊이감을 만든다
      opacity: setting.opacity * randomBetween(0.7, 1),
      depthWrite: false,
    })
    const sprite = new THREE.Sprite(material)

    const width = randomBetween(setting.size[0], setting.size[1])
    sprite.scale.set(width, width / 2, 1)
    sprite.position.set(randomBetween(-CLOUD_EDGE, CLOUD_EDGE), randomBetween(-40, 200), randomBetween(-250, 0))
    sprite.userData.speed = randomBetween(setting.speed[0], setting.speed[1])

    clouds.add(sprite)
  }

  scene.add(clouds)
}

// 비/눈일 때 떨어지는 입자를 만든다
const buildParticles = (status) => {
  if (particles) {
    scene.remove(particles)
    particles.geometry.dispose()
    particleMaterial.dispose()
    particles = null
  }

  const isRain = status === '비'
  const isSnow = status === '눈'
  if (!isRain && !isSnow) {
    return
  }

  const count = isRain ? 1500 : 700
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 600
    positions[i * 3 + 1] = Math.random() * 600 - 300
    positions[i * 3 + 2] = (Math.random() - 0.5) * 600
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

  particleMaterial = new THREE.PointsMaterial({
    color: isRain ? 0xbcd6ff : 0xffffff,
    size: isRain ? 2.5 : 4,
    transparent: true,
    opacity: 0.85,
  })
  particles = new THREE.Points(geometry, particleMaterial)
  particles.userData.speed = isRain ? 9 : 2
  scene.add(particles)
}

// 상태에 맞춰 배경색과 구름, 입자를 갱신한다
const applyStatus = (status) => {
  scene.background = new THREE.Color(skyColors[status] ?? '#7fa8cc')
  buildClouds(status)
  buildParticles(status)
}

const animate = () => {
  animationId = requestAnimationFrame(animate)

  // 구름은 옆으로 흘러가고, 끝에 닿으면 반대편에서 다시 들어온다
  if (clouds) {
    clouds.children.forEach((sprite) => {
      sprite.position.x += sprite.userData.speed
      if (sprite.position.x > CLOUD_EDGE) {
        sprite.position.x = -CLOUD_EDGE
      }
    })
  }

  if (particles) {
    const pos = particles.geometry.attributes.position
    const speed = particles.userData.speed
    for (let i = 0; i < pos.count; i++) {
      let y = pos.getY(i) - speed
      if (y < -300) {
        y = 300
      }
      pos.setY(i, y)
    }
    pos.needsUpdate = true
  }

  renderer.render(scene, camera)
}

const handleResize = () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

onMounted(() => {
  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 1000)
  camera.position.z = 300

  renderer = new THREE.WebGLRenderer({ canvas: canvasRef.value, antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(window.devicePixelRatio)

  cloudTexture = makeCloudTexture()

  applyStatus(props.status)
  window.addEventListener('resize', handleResize)
  animate()
})

// 지역이 바뀌어 날씨 상태가 달라지면 배경도 바꾼다
watch(
  () => props.status,
  (newStatus) => {
    if (scene) {
      applyStatus(newStatus)
    }
  },
)

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', handleResize)
  if (clouds) {
    clouds.children.forEach((sprite) => sprite.material.dispose())
  }
  if (cloudTexture) {
    cloudTexture.dispose()
  }
  if (particles) {
    particles.geometry.dispose()
    particleMaterial.dispose()
  }
  if (renderer) {
    renderer.dispose()
  }
})
</script>

<template>
  <canvas ref="canvasRef" class="weather-bg"></canvas>
</template>

<style scoped>
.weather-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: -1;
  display: block;
}
</style>
