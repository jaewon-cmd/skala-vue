<script setup>
import { computed } from 'vue'
import { useConfigStore } from '@/stores/configStore.js'

const props = defineProps({
  city: {
    type: Object,
    required: true,
  },
  // 해당 도시의 5일 예보 (없으면 예보 영역을 로딩으로 표시)
  forecast: {
    type: Array,
    default: () => [],
  },
  // 해당 도시의 미세먼지 정보 (없으면 미세먼지 영역을 로딩으로 표시)
  air: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['select-card', 'click-detail'])

const configStore = useConfigStore()

// 섭씨 값을 현재 표시 단위로 변환
const toDisplay = (celsius) => {
  if (configStore.unit === 'fahrenheit') {
    return Math.round((celsius * 9) / 5 + 32)
  }
  return celsius
}

// 표시 단위에 맞춘 기온 / 체감온도
const displayTemp = computed(() => toDisplay(props.city.temp))
const displayFeelsLike = computed(() => toDisplay(props.city.feelsLike))

// 날씨 상태에 맞는 아이콘
const statusIcon = (status) => {
  const map = { 맑음: '☀️', 비: '🌧️', 구름: '☁️', 바람: '💨', 눈: '❄️', 안개: '🌫️' }
  return map[status] ?? '🌡️'
}

// 비 또는 눈 여부 판단
const isRainy = (status) => status === '비' || status === '눈'

// 날씨 상태에 따른 태그 색상
const statusTagType = computed(() => {
  const status = props.city.status
  if (status === '비' || status === '눈') return 'primary'
  if (status === '맑음') return 'warning'
  return 'info'
})

// 미세먼지 등급에 따른 태그 색상
const gradeTagType = (grade) => {
  const map = { 좋음: 'success', 보통: 'primary', 나쁨: 'warning', '매우 나쁨': 'danger' }
  return map[grade] ?? 'info'
}

// 카드에는 앞의 4일치만 간단히 보여준다
const shortForecast = computed(() => props.forecast.slice(0, 4))

// 2026-08-13 -> 8/13
const shortDate = (date) => {
  const [, month, day] = date.split('-')
  return `${Number(month)}/${Number(day)}`
}
</script>

<template>
  <el-card class="wc-card" shadow="hover" @click="emit('select-card', city.name)">
    <template #header>
      <div class="wc-header">
        <div class="wc-title">
          <span class="wc-name">{{ city.name }}</span>
          <el-tag :type="statusTagType" size="small" effect="light">
            {{ city.status }}
          </el-tag>
        </div>
        <span class="wc-icon">{{ statusIcon(city.status) }}</span>
      </div>
    </template>

    <p class="wc-temp">{{ displayTemp }}{{ configStore.unitSymbol }}</p>

    <div class="wc-badge">
      <el-tag v-if="isRainy(city.status)" type="primary" effect="dark" round> ☔ 우산 챙기세요 </el-tag>
      <el-tag v-else-if="city.temp >= 25" type="danger" effect="light" round> 🔥 더움 (25도 이상) </el-tag>
      <el-tag v-else type="info" effect="light" round> ❄️ 선선함 (25도 미만) </el-tag>
    </div>

    <!-- 상세 페이지에 있던 체감/습도/바람 지표 -->
    <div class="wc-metrics">
      <div class="wc-metric">
        <span class="wc-metric-label">체감</span>
        <span class="wc-metric-value">{{ displayFeelsLike }}{{ configStore.unitSymbol }}</span>
      </div>
      <div class="wc-metric">
        <span class="wc-metric-label">습도</span>
        <span class="wc-metric-value">{{ city.humidity }}%</span>
      </div>
      <div class="wc-metric">
        <span class="wc-metric-label">바람</span>
        <span class="wc-metric-value">{{ city.wind }}m/s</span>
      </div>
    </div>

    <!-- 상세 페이지에 있던 미세먼지 -->
    <div class="wc-section">
      <p class="wc-section-title">미세먼지</p>
      <div v-if="air" class="wc-air">
        <el-tag :type="gradeTagType(air.pm10Grade)" size="small" effect="light"> PM10 {{ air.pm10 }} · {{ air.pm10Grade }} </el-tag>
        <el-tag :type="gradeTagType(air.pm25Grade)" size="small" effect="light"> PM2.5 {{ air.pm25 }} · {{ air.pm25Grade }} </el-tag>
      </div>
      <p v-else class="wc-empty">불러오는 중...</p>
    </div>

    <!-- 상세 페이지에 있던 5일 예보 (카드에서는 4일치 요약) -->
    <div class="wc-section">
      <p class="wc-section-title">예보</p>
      <ul v-if="shortForecast.length > 0" class="wc-forecast">
        <li v-for="day in shortForecast" :key="day.date">
          <span class="wc-fc-date">{{ shortDate(day.date) }}</span>
          <span class="wc-fc-icon">{{ statusIcon(day.status) }}</span>
          <span class="wc-fc-temp">{{ toDisplay(day.temp) }}{{ configStore.unitSymbol }}</span>
        </li>
      </ul>
      <p v-else class="wc-empty">불러오는 중...</p>
    </div>

    <el-button class="wc-detail-btn" type="primary" plain @click.stop="emit('click-detail', city)"> 상세보기 </el-button>
  </el-card>
</template>

<style scoped>
.wc-card {
  border-radius: 12px;
  cursor: pointer;
}
.wc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.wc-title {
  display: flex;
  align-items: center;
  gap: 8px;
}
.wc-name {
  font-size: 18px;
  font-weight: 700;
}
.wc-icon {
  font-size: 32px;
  line-height: 1;
}
.wc-temp {
  font-size: 40px;
  font-weight: 800;
  margin: 12px 0;
  color: #1f2d3d;
}
.wc-badge {
  margin-bottom: 16px;
}

.wc-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 12px 0;
  border-top: 1px solid #ebeef5;
}
.wc-metric {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.wc-metric-label {
  font-size: 12px;
  color: #909399;
}
.wc-metric-value {
  font-size: 15px;
  font-weight: 700;
  color: #1f2d3d;
}

.wc-section {
  padding: 12px 0;
  border-top: 1px solid #ebeef5;
}
.wc-section-title {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 700;
  color: #909399;
}
.wc-air {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.wc-empty {
  margin: 0;
  font-size: 13px;
  color: #c0c4cc;
}

.wc-forecast {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.wc-forecast li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  color: #606266;
}
.wc-fc-date {
  flex: 1;
}
.wc-fc-icon {
  width: 24px;
  text-align: center;
}
.wc-fc-temp {
  font-weight: 700;
  color: #1f2d3d;
}

.wc-detail-btn {
  width: 100%;
  margin-top: 12px;
}
</style>
