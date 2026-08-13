<script setup>
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useWeatherStore } from '@/stores/weatherStore.js'
import { useConfigStore } from '@/stores/configStore.js'

const weatherStore = useWeatherStore()
const configStore = useConfigStore()
const { cities, isLoading, error } = storeToRefs(weatherStore)

// 섭씨 값을 현재 표시 단위로 변환
const toDisplay = (celsius) => {
  if (configStore.unit === 'fahrenheit') {
    return Math.round(((celsius * 9) / 5 + 32) * 10) / 10
  }
  return Math.round(celsius * 10) / 10
}

const statusIcon = (status) => {
  const map = { 맑음: '☀️', 비: '🌧️', 구름: '☁️', 바람: '💨', 눈: '❄️', 안개: '🌫️' }
  return map[status] ?? '🌡️'
}

// 기온 내림차순 목록. 표와 점 그래프가 같은 순서를 공유한다.
const ranked = computed(() => {
  return [...cities.value].sort((a, b) => b.temp - a.temp)
})

const averageTemp = computed(() => {
  if (cities.value.length === 0) {
    return 0
  }
  const sum = cities.value.reduce((acc, city) => acc + city.temp, 0)
  return toDisplay(sum / cities.value.length)
})

const hottest = computed(() => (ranked.value.length > 0 ? ranked.value[0] : null))
const coldest = computed(() => (ranked.value.length > 0 ? ranked.value[ranked.value.length - 1] : null))
const rainyCount = computed(() => cities.value.filter((city) => city.status === '비').length)

// 점 그래프의 가로 축 범위. 값 주변으로 여유를 둬서 점이 끝에 붙지 않게 한다.
const scale = computed(() => {
  if (cities.value.length === 0) {
    return { min: 0, max: 1 }
  }
  const temps = cities.value.map((c) => toDisplay(c.temp))
  const min = Math.floor(Math.min(...temps)) - 1
  const max = Math.ceil(Math.max(...temps)) + 1
  return { min, max: max === min ? min + 1 : max }
})

// 기온을 축 위의 위치(%)로 바꾼다
const position = (celsius) => {
  const { min, max } = scale.value
  return ((toDisplay(celsius) - min) / (max - min)) * 100
}

onMounted(() => {
  if (cities.value.length === 0) {
    weatherStore.fetchAllWeather()
  }
})
</script>

<template>
  <div class="ws-stats">
    <header class="ws-head">
      <h2 class="ws-title">📊 날씨 통계</h2>
      <p class="ws-sub">주요 {{ cities.length }}개 도시 실시간 관측 기준</p>
    </header>

    <p v-if="isLoading" class="ws-loading glass-card">불러오는 중입니다...</p>

    <p v-else-if="error" class="ws-loading ws-error glass-card">{{ error }}</p>

    <template v-else-if="cities.length > 0">
      <!-- 요약 지표 -->
      <div class="ws-kpis">
        <div class="ws-kpi glass-card">
          <span class="ws-kpi-label">평균 기온</span>
          <span class="ws-kpi-value">{{ averageTemp }}{{ configStore.unitSymbol }}</span>
          <span class="ws-kpi-note">{{ cities.length }}개 도시 평균</span>
        </div>
        <div class="ws-kpi glass-card">
          <span class="ws-kpi-label">가장 더운 곳</span>
          <span class="ws-kpi-value">{{ toDisplay(hottest.temp) }}{{ configStore.unitSymbol }}</span>
          <span class="ws-kpi-note">{{ hottest.name }}</span>
        </div>
        <div class="ws-kpi glass-card">
          <span class="ws-kpi-label">가장 추운 곳</span>
          <span class="ws-kpi-value">{{ toDisplay(coldest.temp) }}{{ configStore.unitSymbol }}</span>
          <span class="ws-kpi-note">{{ coldest.name }}</span>
        </div>
        <div class="ws-kpi glass-card">
          <span class="ws-kpi-label">비 오는 지역</span>
          <span class="ws-kpi-value">{{ rainyCount }}곳</span>
          <span class="ws-kpi-note">전체 {{ cities.length }}곳 중</span>
        </div>
      </div>

      <!-- 기온 분포: 값의 범위가 좁아 막대 대신 점으로 위치를 표시한다 -->
      <section class="ws-section glass-card">
        <h3 class="ws-section-title">도시별 기온 분포</h3>
        <ul class="ws-plot">
          <li v-for="city in ranked" :key="city.id" class="ws-plot-row">
            <span class="ws-plot-name">{{ city.name }}</span>
            <span class="ws-plot-track">
              <span class="ws-plot-dot" :style="{ left: position(city.temp) + '%' }"></span>
            </span>
            <span class="ws-plot-value">{{ toDisplay(city.temp) }}{{ configStore.unitSymbol }}</span>
          </li>
        </ul>
        <div class="ws-axis">
          <span>{{ scale.min }}{{ configStore.unitSymbol }}</span>
          <span>{{ scale.max }}{{ configStore.unitSymbol }}</span>
        </div>
      </section>

      <!-- 표: 그래프에 없는 값까지 전부 읽을 수 있는 경로 -->
      <section class="ws-section glass-card">
        <h3 class="ws-section-title">지역별 상세</h3>
        <el-table :data="ranked" border stripe style="width: 100%">
          <el-table-column prop="name" label="지역" min-width="90" />
          <el-table-column label="날씨" min-width="100">
            <template #default="scope">
              <span class="ws-cell-status">{{ statusIcon(scope.row.status) }} {{ scope.row.status }}</span>
            </template>
          </el-table-column>
          <el-table-column label="기온" min-width="90">
            <template #default="scope"> {{ toDisplay(scope.row.temp) }}{{ configStore.unitSymbol }} </template>
          </el-table-column>
          <el-table-column label="체감" min-width="90">
            <template #default="scope"> {{ toDisplay(scope.row.feelsLike) }}{{ configStore.unitSymbol }} </template>
          </el-table-column>
          <el-table-column label="습도" min-width="80">
            <template #default="scope">{{ scope.row.humidity }}%</template>
          </el-table-column>
          <el-table-column label="바람" min-width="90">
            <template #default="scope">{{ scope.row.wind }}m/s</template>
          </el-table-column>
        </el-table>
      </section>
    </template>

    <p v-else class="ws-loading glass-card">표시할 데이터가 없습니다.</p>
  </div>
</template>

<style scoped>
.ws-stats {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 0;
}

/* 제목은 카드 밖 하늘 위에 놓이므로 흰 글씨로 대비를 준다 */
.ws-head {
  margin: 0 0 0 4px;
}
.ws-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
}
.ws-sub {
  margin: 4px 0 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.92);
  text-shadow: 0 1px 5px rgba(0, 0, 0, 0.3);
}
.ws-loading {
  padding: 40px 0;
  text-align: center;
  color: #909399;
}
.ws-error {
  color: #f56c6c;
}

/* 요약 지표 */
.ws-kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}
/* 배경/테두리는 glass-card가 담당한다 */
.ws-kpi {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px;
}
.ws-kpi-label {
  font-size: 12px;
  color: #909399;
}
.ws-kpi-value {
  font-size: 28px;
  font-weight: 800;
  line-height: 1.1;
  color: #1f2d3d;
}
.ws-kpi-note {
  font-size: 12px;
  color: #a8abb2;
}

/* 간격은 부모의 flex gap이 담당한다 */
.ws-section {
  margin: 0;
}
.ws-section-title {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 700;
  color: #606266;
}

/* 점 그래프 */
.ws-plot {
  list-style: none;
  margin: 0;
  padding: 0;
}
.ws-plot-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 7px 0;
}
.ws-plot-name {
  flex: 0 0 56px;
  font-size: 13px;
  color: #606266;
}
.ws-plot-track {
  position: relative;
  flex: 1;
  height: 14px;
}
/* 축을 나타내는 얇은 실선 하나. 격자는 두지 않는다.
   색이 옅으면 유리 패널 배경에 묻혀 아예 안 보이므로 대비를 확보한 회색을 쓴다. */
.ws-plot-track::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  height: 1px;
  background: #a3abb5;
  transform: translateY(-50%);
}
/* 축 양 끝 눈금 */
.ws-plot-track::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  height: 7px;
  border-left: 1px solid #a3abb5;
  border-right: 1px solid #a3abb5;
  transform: translateY(-50%);
}
.ws-plot-dot {
  position: absolute;
  top: 50%;
  z-index: 1;
  width: 12px;
  height: 12px;
  margin-left: -6px;
  border-radius: 50%;
  background: #2a78d6;
  /* 점이 축선 위에 얹혀 보이도록 바탕색 링을 두른다 */
  box-shadow: 0 0 0 2px #ffffff;
  transform: translateY(-50%);
}
.ws-plot-value {
  flex: 0 0 64px;
  font-size: 13px;
  font-weight: 700;
  text-align: right;
  color: #1f2d3d;
  font-variant-numeric: tabular-nums;
}
.ws-axis {
  display: flex;
  justify-content: space-between;
  margin: 4px 64px 0 68px;
  font-size: 11px;
  color: #a8abb2;
  font-variant-numeric: tabular-nums;
}

.ws-cell-status {
  white-space: nowrap;
}
</style>
