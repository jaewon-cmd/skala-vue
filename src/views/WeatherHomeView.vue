<script setup>
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useWeatherStore } from '@/stores/weatherStore.js'
import { useConfigStore } from '@/stores/configStore.js'
import { REGIONS, searchRegions, findRegion } from '@/constants/regions.js'
import WeatherMap from '@/components/layout/WeatherMap.vue'

const weatherStore = useWeatherStore()
const configStore = useConfigStore()

const { selectedRegionId, currentWeather, currentAir, hourly, daily, isRegionLoading, regionError, recentIds, regionCache } =
  storeToRefs(weatherStore)

const keyword = ref('')

// 지도에 넘길 현재 선택 지역 (좌표가 필요해 REGIONS에서 다시 찾는다)
const mapRegion = computed(() => findRegion(selectedRegionId.value))

const groupedOptions = computed(() => {
  const matched = searchRegions(keyword.value)
  const groups = []
  matched.forEach((region) => {
    let group = groups.find((g) => g.label === region.group)
    if (!group) {
      group = { label: region.group, items: [] }
      groups.push(group)
    }
    group.items.push(region)
  })
  return groups
})

const handleFilter = (q) => {
  keyword.value = q
}

const handleVisibleChange = (visible) => {
  if (!visible) {
    keyword.value = ''
  }
}

const handleSelect = (regionId) => {
  weatherStore.fetchRegion(regionId)
}

// 최근 본 지역 (지금 보고 있는 지역은 제외). 캐시에서 이름만 뽑아 쓴다.
const recentNames = computed(() => {
  return recentIds.value
    .filter((id) => id !== selectedRegionId.value)
    .map((id) => regionCache.value[id])
    .filter((entry) => entry != null)
    .map((entry) => ({ id: entry.region.id, name: entry.region.name }))
})

const toDisplay = (celsius) => {
  if (configStore.unit === 'fahrenheit') {
    return Math.round((celsius * 9) / 5 + 32)
  }
  return Math.round(celsius)
}

const statusIcon = (status) => {
  const map = { 맑음: '☀️', 비: '🌧️', 구름: '☁️', 바람: '💨', 눈: '❄️', 안개: '🌫️' }
  return map[status] ?? '🌡️'
}

// 풍향 각도를 8방위 이름으로 바꾼다. 바람이 '불어오는' 방향이라 '북동풍'처럼 읽는다.
const windDirection = (deg) => {
  if (deg == null) {
    return null
  }
  const names = ['북', '북동', '동', '남동', '남', '남서', '서', '북서']
  return names[Math.round(deg / 45) % 8]
}

// 화살표는 바람이 '불어가는' 쪽을 가리켜야 하므로 180도 돌린다
const windArrowAngle = (deg) => (deg == null ? 0 : deg + 180)

// 기상청 풍속 구간에 맞춘 세기 등급
const windLevel = (speed) => {
  if (speed < 3.4) {
    return { label: '약한 바람', type: 'success' }
  }
  if (speed < 8) {
    return { label: '약간 강한 바람', type: 'primary' }
  }
  if (speed < 13.9) {
    return { label: '강한 바람', type: 'warning' }
  }
  return { label: '매우 강한 바람', type: 'danger' }
}

// 습도에 따른 체감 등급
const humidityLevel = (humidity) => {
  if (humidity < 30) {
    return { label: '매우 건조', type: 'warning' }
  }
  if (humidity < 40) {
    return { label: '건조', type: 'warning' }
  }
  if (humidity <= 60) {
    return { label: '쾌적', type: 'success' }
  }
  if (humidity <= 80) {
    return { label: '다소 습함', type: 'primary' }
  }
  return { label: '매우 습함', type: 'danger' }
}

// 지금 내리는 비 또는 눈의 양 (mm/h). 안 내리면 0.
const precipitation = computed(() => {
  const w = currentWeather.value
  if (!w) {
    return { amount: 0, kind: '비' }
  }
  if (w.snow1h != null) {
    return { amount: w.snow1h, kind: '눈' }
  }
  return { amount: w.rain1h ?? 0, kind: '비' }
})

// 기상청 시간당 강수량 구간
const precipitationLevel = (mm) => {
  if (mm === 0) {
    return { label: '내리지 않음', type: 'info' }
  }
  if (mm < 3) {
    return { label: '약한 비', type: 'success' }
  }
  if (mm < 15) {
    return { label: '보통 비', type: 'primary' }
  }
  if (mm < 30) {
    return { label: '강한 비', type: 'warning' }
  }
  return { label: '매우 강한 비', type: 'danger' }
}

// 앞으로 24시간(시간별 예보 8칸)의 최저 / 최고 기온과 그 차이.
// 기압이나 가시거리와 달리 지역마다 뚜렷하게 갈리는 값이라 카드로 둘 값어치가 있다.
const tempRange = computed(() => {
  if (hourly.value.length === 0) {
    return null
  }
  const temps = hourly.value.map((slot) => slot.temp)
  const min = Math.min(...temps)
  const max = Math.max(...temps)
  return { min, max, gap: Math.round((max - min) * 10) / 10 }
})

// 일교차가 크면 옷차림을 챙겨야 하므로 그 기준으로 나눈다
const tempGapLevel = (gap) => {
  if (gap < 5) {
    return { label: '일교차 작음', type: 'success', advice: '하루 종일 비슷한 기온이에요' }
  }
  if (gap < 10) {
    return { label: '일교차 보통', type: 'primary', advice: '아침저녁으로 선선해져요' }
  }
  return { label: '일교차 큼', type: 'warning', advice: '겉옷을 챙기는 게 좋아요' }
}

// 유닉스 시각(UTC)을 그 지역 시간대의 HH:MM으로 바꾼다.
// 오프셋만큼 더한 뒤 UTC로 읽으면 그 지역의 벽시계 시각이 된다.
const formatSunTime = (unix, offsetSeconds) => {
  if (unix == null) {
    return '-'
  }
  return new Date((unix + offsetSeconds) * 1000).toISOString().slice(11, 16)
}

// 일출부터 일몰까지의 길이
const dayLength = computed(() => {
  const w = currentWeather.value
  if (!w?.sunrise || !w?.sunset) {
    return null
  }
  const seconds = w.sunset - w.sunrise
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.round((seconds % 3600) / 60)
  return `${hours}시간 ${minutes}분`
})

// 지금이 낮의 어디쯤인지 (0~100). 해가 지면 100, 뜨기 전이면 0.
const dayProgress = computed(() => {
  const w = currentWeather.value
  if (!w?.sunrise || !w?.sunset) {
    return 0
  }
  const now = Date.now() / 1000
  const ratio = ((now - w.sunrise) / (w.sunset - w.sunrise)) * 100
  return Math.min(100, Math.max(0, Math.round(ratio)))
})

const gradeTagType = (grade) => {
  const map = { 좋음: 'success', 보통: 'primary', 나쁨: 'warning', '매우 나쁨': 'danger' }
  return map[grade] ?? 'info'
}

const dayLabel = (date) => {
  const d = new Date(`${date}T00:00:00+09:00`)
  const names = ['일', '월', '화', '수', '목', '금', '토']
  return `${d.getMonth() + 1}/${d.getDate()} (${names[d.getDay()]})`
}

onMounted(() => {
  weatherStore.fetchRegion(selectedRegionId.value)
})
</script>

<template>
  <div class="wh-home">
    <!-- 지역 검색 -->
    <div class="wh-search glass-card">
      <el-select
        :model-value="selectedRegionId"
        filterable
        :filter-method="handleFilter"
        placeholder="지역명을 검색하세요 (예: 강릉, 여수, Busan)"
        size="large"
        class="wh-select"
        @change="handleSelect"
        @visible-change="handleVisibleChange"
      >
        <el-option-group v-for="group in groupedOptions" :key="group.label" :label="group.label">
          <el-option v-for="region in group.items" :key="region.id" :label="region.name" :value="region.id" />
        </el-option-group>
        <el-option v-if="groupedOptions.length === 0" disabled label="검색 결과가 없습니다" value="" />
      </el-select>
      <p class="wh-hint">전국 {{ REGIONS.length }}개 주요 지역</p>
    </div>

    <p v-if="isRegionLoading" class="wh-status glass-card">날씨 정보를 불러오는 중입니다...</p>

    <p v-else-if="regionError" class="wh-status wh-error glass-card">{{ regionError }}</p>

    <template v-else-if="currentWeather">
      <div class="wh-grid">
        <!-- 왼쪽: 현재 날씨 · 미세먼지 · 지도 -->
        <div class="wh-col">
          <section class="wh-hero glass-card">
            <h2 class="wh-region">{{ currentWeather.name }}</h2>
            <div class="wh-now">
              <span class="wh-icon">{{ statusIcon(currentWeather.status) }}</span>
              <span class="wh-temp">{{ toDisplay(currentWeather.temp) }}{{ configStore.unitSymbol }}</span>
            </div>
            <p class="wh-desc">{{ currentWeather.description }} · 체감 {{ toDisplay(currentWeather.feelsLike) }}{{ configStore.unitSymbol }}</p>

            <div class="wh-metrics">
              <div class="wh-metric">
                <span class="wh-metric-label">습도</span>
                <span class="wh-metric-value">{{ currentWeather.humidity }}%</span>
              </div>
              <div class="wh-metric">
                <span class="wh-metric-label">바람</span>
                <span class="wh-metric-value">{{ currentWeather.wind }}m/s</span>
              </div>
              <div class="wh-metric">
                <span class="wh-metric-label">미세먼지</span>
                <span class="wh-metric-value">{{ currentAir ? currentAir.pm10Grade : '-' }}</span>
              </div>
            </div>
          </section>

          <section v-if="currentAir" class="wh-section glass-card">
            <h3 class="wh-section-title">미세먼지</h3>
            <div class="wh-air">
              <el-tag :type="gradeTagType(currentAir.pm10Grade)" size="large" effect="light">
                미세먼지 {{ currentAir.pm10 }}㎍/㎥ · {{ currentAir.pm10Grade }}
              </el-tag>
              <el-tag :type="gradeTagType(currentAir.pm25Grade)" size="large" effect="light">
                초미세먼지 {{ currentAir.pm25 }}㎍/㎥ · {{ currentAir.pm25Grade }}
              </el-tag>
            </div>
          </section>

          <!-- 날씨 지도 (강수 · 구름 · 기온 레이어) -->
          <section class="wh-section glass-card">
            <WeatherMap :region="mapRegion" />
          </section>
        </div>

        <!-- 오른쪽: 시간별 · 주간 예보 · 일출일몰 -->
        <div class="wh-col">
          <section class="wh-section glass-card">
            <h3 class="wh-section-title">시간별 예보</h3>
            <ul class="wh-hourly">
              <li v-for="slot in hourly" :key="slot.date + slot.time">
                <span class="wh-h-time">{{ slot.time }}</span>
                <span class="wh-h-icon">{{ statusIcon(slot.status) }}</span>
                <span class="wh-h-temp">{{ toDisplay(slot.temp) }}{{ configStore.unitSymbol }}</span>
                <span class="wh-h-pop">💧{{ slot.pop }}%</span>
              </li>
            </ul>
          </section>

          <section class="wh-section glass-card">
            <h3 class="wh-section-title">주간 예보</h3>
            <ul class="wh-daily">
              <li v-for="day in daily" :key="day.date">
                <span class="wh-d-date">{{ dayLabel(day.date) }}</span>
                <span class="wh-d-icon">{{ statusIcon(day.status) }}</span>
                <span class="wh-d-status">{{ day.status }}</span>
                <span class="wh-d-temp">
                  <span class="wh-d-min">{{ toDisplay(day.min) }}°</span>
                  <span class="wh-d-sep">/</span>
                  <span class="wh-d-max">{{ toDisplay(day.max) }}°</span>
                </span>
              </li>
            </ul>
          </section>

          <!-- 일출 · 일몰과 낮의 진행 정도 -->
          <section v-if="currentWeather.sunrise" class="wh-section glass-card">
            <h3 class="wh-section-title">일출 · 일몰</h3>
            <div class="wh-sun">
              <div class="wh-sun-item">
                <!-- 지평선 위로 떠오르는 해 -->
                <svg class="wh-sun-icon wh-sun-icon-rise" viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="15" r="3.5" />
                  <path d="M4 20h16" />
                  <path d="M12 3v5M9.5 5.5 12 3l2.5 2.5" />
                </svg>
                <span class="wh-sun-label">일출</span>
                <span class="wh-sun-time">{{ formatSunTime(currentWeather.sunrise, currentWeather.timezone) }}</span>
              </div>
              <div class="wh-sun-item">
                <!-- 지평선 아래로 지는 해 -->
                <svg class="wh-sun-icon wh-sun-icon-set" viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="15" r="3.5" />
                  <path d="M4 20h16" />
                  <path d="M12 8V3M9.5 5.5 12 8l2.5-2.5" />
                </svg>
                <span class="wh-sun-label">일몰</span>
                <span class="wh-sun-time">{{ formatSunTime(currentWeather.sunset, currentWeather.timezone) }}</span>
              </div>
            </div>
            <!-- 지금이 낮의 어디쯤인지 -->
            <div class="wh-sun-track">
              <span class="wh-sun-fill" :style="{ width: dayProgress + '%' }"></span>
              <span class="wh-sun-now" :style="{ left: dayProgress + '%' }"></span>
            </div>
            <p class="wh-sun-note">낮 길이 {{ dayLength }}</p>
          </section>
        </div>
      </div>

      <!-- 바람 / 습도 / 강수량 / 기온 범위 -->
      <div class="wh-grid-4">
        <section class="wh-section glass-card wh-mini">
          <h3 class="wh-section-title">바람</h3>
          <div class="wh-mini-main">
            <span class="wh-compass" :style="{ transform: `rotate(${windArrowAngle(currentWeather.windDeg)}deg)` }">↑</span>
            <p class="wh-mini-value">{{ currentWeather.wind }}<span class="wh-mini-unit">m/s</span></p>
          </div>
          <el-tag :type="windLevel(currentWeather.wind).type" size="small" effect="light" round>
            {{ windLevel(currentWeather.wind).label }}
          </el-tag>
          <p class="wh-mini-note">
            <span v-if="windDirection(currentWeather.windDeg)">{{ windDirection(currentWeather.windDeg) }}풍 · </span>
            돌풍 {{ currentWeather.windGust != null ? currentWeather.windGust + 'm/s' : '없음' }}
          </p>
        </section>

        <section class="wh-section glass-card wh-mini">
          <h3 class="wh-section-title">습도</h3>
          <div class="wh-mini-main">
            <span class="wh-mini-icon">💧</span>
            <p class="wh-mini-value">{{ currentWeather.humidity }}<span class="wh-mini-unit">%</span></p>
          </div>
          <div class="wh-meter">
            <span class="wh-meter-fill" :style="{ width: currentWeather.humidity + '%' }"></span>
          </div>
          <p class="wh-mini-note">
            {{ humidityLevel(currentWeather.humidity).label }} · 기압
            {{ currentWeather.pressure != null ? currentWeather.pressure + 'hPa' : '-' }}
          </p>
        </section>

        <section class="wh-section glass-card wh-mini">
          <h3 class="wh-section-title">강수량</h3>
          <div class="wh-mini-main">
            <span class="wh-mini-icon">{{ precipitation.kind === '눈' ? '🌨️' : '🌧️' }}</span>
            <p class="wh-mini-value">{{ precipitation.amount }}<span class="wh-mini-unit">mm</span></p>
          </div>
          <el-tag :type="precipitationLevel(precipitation.amount).type" size="small" effect="light" round>
            {{ precipitationLevel(precipitation.amount).label }}
          </el-tag>
          <p class="wh-mini-note">최근 1시간 · 구름 {{ currentWeather.clouds != null ? currentWeather.clouds + '%' : '-' }}</p>
        </section>

        <section v-if="tempRange" class="wh-section glass-card wh-mini">
          <h3 class="wh-section-title">기온 범위</h3>
          <div class="wh-mini-main">
            <span class="wh-mini-icon">🌡️</span>
            <p class="wh-mini-value">{{ tempRange.gap }}<span class="wh-mini-unit">°</span></p>
          </div>
          <el-tag :type="tempGapLevel(tempRange.gap).type" size="small" effect="light" round>
            {{ tempGapLevel(tempRange.gap).label }}
          </el-tag>
          <p class="wh-mini-note">
            최저 {{ toDisplay(tempRange.min) }}{{ configStore.unitSymbol }} · 최고 {{ toDisplay(tempRange.max) }}{{ configStore.unitSymbol }}
          </p>
        </section>
      </div>

      <!-- 최근 본 지역 (누르면 그 지역으로 전환) -->
      <section v-if="recentNames.length > 0" class="wh-section glass-card">
        <h3 class="wh-section-title">최근 본 지역</h3>
        <div class="wh-recent-names">
          <el-tag v-for="region in recentNames" :key="region.id" class="wh-recent-chip" effect="plain" size="large" @click="handleSelect(region.id)">
            {{ region.name }}
          </el-tag>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
/* 카드들을 세로로 쌓고, 카드 사이 간격으로 배경이 비쳐 보이게 한다 */
.wh-home {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: none;
  margin: 0;
  padding: 0;
}
.wh-select {
  width: 100%;
}
.wh-hint {
  margin: 6px 2px 0;
  font-size: 12px;
  color: #a8abb2;
}

.wh-status {
  padding: 40px 0;
  text-align: center;
  color: #909399;
}
.wh-error {
  color: #f56c6c;
}

/* 좌우 2단 배치. 768px 아래에서는 1단으로 접힌다 */
.wh-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  align-items: start;
}
.wh-col {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}
@media (max-width: 768px) {
  .wh-grid {
    grid-template-columns: 1fr;
  }
}

.wh-hero {
  padding: 24px 20px;
  text-align: center;
  background: linear-gradient(160deg, #e8f2ff, #f6f9ff);
  border-radius: 16px;
}
.wh-region {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #1f2d3d;
}
.wh-now {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin: 8px 0 4px;
}
.wh-icon {
  font-size: 56px;
  line-height: 1;
}
.wh-temp {
  font-size: 56px;
  font-weight: 800;
  color: #1f2d3d;
  line-height: 1;
}
.wh-desc {
  margin: 0;
  font-size: 14px;
  color: #606266;
}
.wh-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid rgba(64, 158, 255, 0.15);
}
.wh-metric {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.wh-metric-label {
  font-size: 12px;
  color: #909399;
}
.wh-metric-value {
  font-size: 16px;
  font-weight: 700;
  color: #1f2d3d;
}

/* 간격은 부모의 flex gap이 담당하므로 여백을 따로 주지 않는다 */
.wh-section {
  margin: 0;
}
.wh-section-title {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 700;
  color: #606266;
}

.wh-air {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* 일출 · 일몰 */
.wh-sun {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}
.wh-sun-item {
  display: flex;
  align-items: center;
  gap: 8px;
}
/* 이모지 대신 선으로 그린 아이콘 — 크기와 색을 화면에 맞춰 조절할 수 있다 */
.wh-sun-icon {
  width: 26px;
  height: 26px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.wh-sun-icon-rise {
  color: #fa8c16;
}
.wh-sun-icon-set {
  color: #c2410c;
}
.wh-sun-label {
  font-size: 13px;
  color: #909399;
}
.wh-sun-time {
  font-size: 18px;
  font-weight: 800;
  color: #1f2d3d;
}
.wh-sun-track {
  position: relative;
  height: 6px;
  margin: 16px 0 8px;
  border-radius: 999px;
  background: #ebeef5;
}
.wh-sun-fill {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #ffd591, #ffa940);
}
/* 지금 시각을 나타내는 점 */
.wh-sun-now {
  position: absolute;
  top: 50%;
  width: 10px;
  height: 10px;
  margin-left: -5px;
  border-radius: 50%;
  background: #fa8c16;
  box-shadow: 0 0 0 2px #ffffff;
  transform: translateY(-50%);
}
.wh-sun-note {
  margin: 0;
  font-size: 12px;
  color: #909399;
  text-align: right;
}

/* 바람 / 습도 / 강수량 / 기온 범위 — 한 줄에 4장 들어가는 작은 카드 */
.wh-grid-4 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(195px, 1fr));
  gap: 16px;
  align-items: start;
}
.wh-mini {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  padding: 16px;
}
.wh-mini-main {
  display: flex;
  align-items: center;
  gap: 10px;
}
.wh-mini-icon {
  font-size: 26px;
  line-height: 1;
}
.wh-mini-value {
  margin: 0;
  font-size: 26px;
  font-weight: 800;
  line-height: 1.1;
  color: #1f2d3d;
}
.wh-mini-unit {
  margin-left: 2px;
  font-size: 13px;
  font-weight: 600;
  color: #909399;
}
.wh-mini-note {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: #909399;
}
.wh-compass {
  display: inline-block;
  font-size: 28px;
  line-height: 1;
  color: #409eff;
  /* 풍향에 맞춰 회전하므로 회전축을 정중앙으로 고정한다 */
  transform-origin: 50% 50%;
}

/* 습도 막대 */
.wh-meter {
  width: 100%;
  height: 8px;
  margin: 2px 0;
  border-radius: 999px;
  background: #ebeef5;
  overflow: hidden;
}
.wh-meter-fill {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: #2a78d6;
  transition: width 0.3s;
}

.wh-hourly {
  display: flex;
  gap: 8px;
  list-style: none;
  margin: 0;
  padding: 0 0 6px;
  overflow-x: auto;
}
.wh-hourly li {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  min-width: 64px;
  padding: 12px 8px;
  background: #f5f7fa;
  border-radius: 12px;
}
.wh-h-time {
  font-size: 12px;
  color: #909399;
}
.wh-h-icon {
  font-size: 24px;
  line-height: 1;
}
.wh-h-temp {
  font-size: 15px;
  font-weight: 700;
  color: #1f2d3d;
}
.wh-h-pop {
  font-size: 11px;
  color: #409eff;
}

.wh-daily {
  list-style: none;
  margin: 0;
  padding: 0;
}
.wh-daily li {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 4px;
  border-bottom: 1px solid #ebeef5;
}
.wh-daily li:last-child {
  border-bottom: none;
}
.wh-d-date {
  flex: 0 0 90px;
  font-size: 14px;
  color: #606266;
}
.wh-d-icon {
  font-size: 20px;
  line-height: 1;
}
.wh-d-status {
  flex: 1;
  font-size: 13px;
  color: #909399;
}
.wh-d-temp {
  display: flex;
  align-items: baseline;
  gap: 4px;
  font-size: 14px;
  font-weight: 700;
}
.wh-d-min {
  color: #409eff;
}
.wh-d-sep {
  color: #dcdfe6;
  font-weight: 400;
}
.wh-d-max {
  color: #f56c6c;
}

/* 최근 본 지역: 이름 칩 */
.wh-recent-names {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.wh-recent-chip {
  cursor: pointer;
}
</style>
