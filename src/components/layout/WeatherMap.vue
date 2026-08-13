<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const props = defineProps({
  // 지도 중심으로 잡을 지역 { name, lat, lon }
  region: {
    type: Object,
    default: null,
  },
})

const API_KEY = import.meta.env.VITE_OWM_KEY
const DEFAULT_REGION = { name: '서울', lat: 37.5667, lon: 126.9783 }

// 지도에 겹칠 수 있는 날씨 레이어.
// legend는 타일 색상에 맞춘 근사 그라데이션으로, 색의 의미를 설명하는 용도다.
const layers = [
  {
    key: 'precipitation_new',
    label: '강수',
    hint: '비·눈이 내리는 구역',
    legend: 'linear-gradient(90deg, #e8eef5, #9ec9f5, #4b8ee8, #6b3fbf)',
    from: '없음',
    to: '강함',
  },
  {
    key: 'clouds_new',
    label: '구름',
    hint: '구름이 덮인 정도',
    legend: 'linear-gradient(90deg, #eef2f6, #c7d2dd, #94a3b3, #5b6875)',
    from: '0%',
    to: '100%',
  },
  {
    key: 'temp_new',
    label: '기온',
    hint: '지역별 기온 분포',
    legend: 'linear-gradient(90deg, #4b6ee8, #64c8e0, #8ee0a1, #ffe14b, #ff7a45, #d9342b)',
    from: '-20°C',
    to: '40°C',
  },
]

const activeLayer = ref('precipitation_new')

const mapEl = ref(null)
let map = null
let overlay = null
let marker = null

const currentLayer = () => layers.find((l) => l.key === activeLayer.value) ?? layers[0]

const overlayUrl = (layerKey) => `https://tile.openweathermap.org/map/${layerKey}/{z}/{x}/{y}.png?appid=${API_KEY}`

// 날씨 타일을 지도 위에 덮는다.
// 불투명도를 높게 준 이유: 0.6에서는 베이스맵에 묻혀 레이어를 바꿔도 티가 잘 안 났다.
const applyOverlay = (layerKey) => {
  if (!map) {
    return
  }
  if (overlay) {
    map.removeLayer(overlay)
  }
  overlay = L.tileLayer(overlayUrl(layerKey), { opacity: 0.85 })
  overlay.addTo(map)
}

const handleLayerChange = (layerKey) => {
  activeLayer.value = layerKey
  applyOverlay(layerKey)
}

onMounted(() => {
  const region = props.region ?? DEFAULT_REGION

  map = L.map(mapEl.value, {
    center: [region.lat, region.lon],
    zoom: 7,
    // 카드 안 지도라 휠 확대는 끈다. 켜두면 페이지를 스크롤할 때 지도만 확대돼 답답하다.
    scrollWheelZoom: false,
  })

  // 색이 옅은 베이스맵을 쓴다.
  // 일반 OSM 지도는 도로·녹지 색이 강해서 그 위에 얹은 날씨 오버레이가 묻힌다.
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap, &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 19,
  }).addTo(map)

  applyOverlay(activeLayer.value)

  marker = L.marker([region.lat, region.lon]).addTo(map)
  marker.bindTooltip(region.name, { permanent: true, direction: 'top', offset: [-15, -10] })
})

// 다른 지역을 선택하면 지도를 그쪽으로 옮긴다
watch(
  () => props.region,
  (region) => {
    if (!map || !region) {
      return
    }
    map.setView([region.lat, region.lon], map.getZoom())
    if (marker) {
      marker.setLatLng([region.lat, region.lon])
      marker.setTooltipContent(region.name)
    }
  },
)

onUnmounted(() => {
  if (map) {
    map.remove()
    map = null
  }
})
</script>

<template>
  <div class="wm-wrap">
    <div class="wm-head">
      <h3 class="wm-title">날씨 지도</h3>
      <div class="wm-tabs">
        <button
          v-for="layer in layers"
          :key="layer.key"
          type="button"
          class="wm-tab"
          :class="{ 'wm-tab-active': activeLayer === layer.key }"
          @click="handleLayerChange(layer.key)"
        >
          {{ layer.label }}
        </button>
      </div>
    </div>

    <div ref="mapEl" class="wm-map"></div>

    <!-- 색이 무엇을 뜻하는지 알려주는 범례 -->
    <div class="wm-legend">
      <span class="wm-legend-hint">{{ currentLayer().hint }}</span>
      <div class="wm-legend-scale">
        <span class="wm-legend-end">{{ currentLayer().from }}</span>
        <span class="wm-legend-bar" :style="{ background: currentLayer().legend }"></span>
        <span class="wm-legend-end">{{ currentLayer().to }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wm-wrap {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.wm-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.wm-title {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #606266;
}
.wm-tabs {
  display: flex;
  gap: 4px;
}
.wm-tab {
  padding: 4px 10px;
  border: 1px solid #dcdfe6;
  border-radius: 999px;
  background: #ffffff;
  color: #606266;
  font-size: 12px;
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s,
    border-color 0.15s;
}
.wm-tab:hover {
  border-color: #409eff;
  color: #409eff;
}
.wm-tab-active {
  background: #ecf5ff;
  border-color: #409eff;
  color: #409eff;
  font-weight: 700;
}

.wm-map {
  height: 260px;
  border-radius: 12px;
  /* 지도 타일이 둥근 모서리를 넘지 않게 잘라낸다 */
  overflow: hidden;
  /* Leaflet 내부 z-index가 카드 위로 튀어나오지 않게 눌러둔다 */
  z-index: 0;
}

/* 범례 */
.wm-legend {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.wm-legend-hint {
  font-size: 12px;
  color: #909399;
}
.wm-legend-scale {
  display: flex;
  align-items: center;
  gap: 6px;
}
.wm-legend-end {
  font-size: 11px;
  color: #a8abb2;
  white-space: nowrap;
}
.wm-legend-bar {
  width: 110px;
  height: 8px;
  border-radius: 999px;
  border: 1px solid rgba(0, 0, 0, 0.06);
}
</style>
