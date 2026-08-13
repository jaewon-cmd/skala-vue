<script setup>
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useWeatherStore } from '@/stores/weatherStore.js'
import { useConfigStore } from '@/stores/configStore.js'
import { findRegion } from '@/constants/regions.js'

const route = useRoute()
const router = useRouter()

const weatherStore = useWeatherStore()
const configStore = useConfigStore()

const { regionCache, isRegionLoading, regionError, airkoreaByRegion, isAirkoreaLoading, airkoreaError } = storeToRefs(weatherStore)

// URL 파라미터로 넘어온 지역 id.
// 상세에서 다른 상세로 이동하면 컴포넌트가 재사용되므로, 한 번 읽고 끝내면
// 주소만 바뀌고 내용은 이전 지역 그대로 남는다. 그래서 반응형으로 둔다.
const regionId = computed(() => route.params.cityId)

const region = computed(() => findRegion(regionId.value))

// 캐시에 담긴 조회 결과를 꺼내 쓴다 (홈에서 이미 본 지역이면 즉시 표시된다)
const entry = computed(() => regionCache.value[regionId.value] ?? null)
const current = computed(() => entry.value?.current ?? null)
const air = computed(() => entry.value?.air ?? null)
const hourly = computed(() => entry.value?.hourly ?? [])
const daily = computed(() => entry.value?.daily ?? [])

// 에어코리아는 시도 단위로 값을 주므로 지역이 속한 시도로 찾는다
const airkorea = computed(() => {
  const sido = region.value?.sido
  return sido ? (airkoreaByRegion.value[sido] ?? null) : null
})

// 섭씨 값을 현재 표시 단위로 변환
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

const gradeTagType = (grade) => {
  const map = { 좋음: 'success', 보통: 'primary', 나쁨: 'warning', '매우 나쁨': 'danger' }
  return map[grade] ?? 'info'
}

// 2026-08-13 -> 8/13 (목)
const dayLabel = (date) => {
  const d = new Date(`${date}T00:00:00+09:00`)
  const names = ['일', '월', '화', '수', '목', '금', '토']
  return `${d.getMonth() + 1}/${d.getDate()} (${names[d.getDay()]})`
}

const goBack = () => {
  router.push('/')
}

// 처음 진입할 때와 다른 지역으로 바뀔 때 모두 데이터를 맞춘다.
// 캐시가 비어 있으면(주소 직접 입력·새로고침) 그때 받아온다.
watch(
  regionId,
  (id) => {
    if (!findRegion(id)) {
      return
    }
    if (!regionCache.value[id]) {
      weatherStore.fetchRegion(id)
    }
    // 관측소 실측값은 별도 API라 따로 받아온다
    weatherStore.fetchAirkorea(id)
  },
  { immediate: true },
)
</script>

<template>
  <div class="wd-detail">
    <el-button class="wd-back" text @click="goBack">← 대시보드로</el-button>

    <p v-if="isRegionLoading" class="wd-status">불러오는 중입니다...</p>

    <p v-else-if="!region" class="wd-status">해당 지역을 찾을 수 없습니다.</p>

    <p v-else-if="regionError" class="wd-status wd-error">{{ regionError }}</p>

    <template v-else-if="current">
      <h2 class="wd-title">{{ current.name }} 상세 날씨</h2>

      <section class="wd-hero glass-card">
        <span class="wd-icon">{{ statusIcon(current.status) }}</span>
        <div>
          <p class="wd-temp">{{ toDisplay(current.temp) }}{{ configStore.unitSymbol }}</p>
          <p class="wd-desc">{{ current.description }}</p>
        </div>
      </section>

      <section class="wd-section glass-card">
        <h3 class="wd-section-title">관측 정보</h3>
        <el-descriptions :column="2" border class="wd-desc-table">
          <el-descriptions-item label="날씨">{{ current.status }}</el-descriptions-item>
          <el-descriptions-item label="체감온도"> {{ toDisplay(current.feelsLike) }}{{ configStore.unitSymbol }} </el-descriptions-item>
          <el-descriptions-item label="습도">{{ current.humidity }}%</el-descriptions-item>
          <el-descriptions-item label="바람">{{ current.wind }}m/s</el-descriptions-item>
        </el-descriptions>
      </section>

      <section class="wd-section glass-card">
        <h3 class="wd-section-title">미세먼지</h3>
        <p class="wd-source-lead">같은 항목을 예측 모델과 관측소 실측, 두 출처로 비교합니다.</p>

        <div class="wd-sources">
          <!-- 출처 1: OpenWeather (모델 예측값, 좌표 기반) -->
          <div class="wd-source">
            <div class="wd-source-head">
              <span class="wd-source-name">OpenWeather</span>
              <el-tag size="small" effect="plain" type="info">모델 예측</el-tag>
            </div>
            <div v-if="air" class="wd-air">
              <el-tag :type="gradeTagType(air.pm10Grade)" effect="light"> PM10 {{ air.pm10 }} · {{ air.pm10Grade }} </el-tag>
              <el-tag :type="gradeTagType(air.pm25Grade)" effect="light"> PM2.5 {{ air.pm25 }} · {{ air.pm25Grade }} </el-tag>
            </div>
            <p v-else class="wd-empty">불러오지 못했습니다.</p>
            <p class="wd-source-note">{{ region.name }} 좌표 기준</p>
          </div>

          <!-- 출처 2: 에어코리아 (관측소 실측값, 시도 단위) -->
          <div class="wd-source">
            <div class="wd-source-head">
              <span class="wd-source-name">에어코리아</span>
              <el-tag size="small" effect="plain" type="success">관측소 실측</el-tag>
            </div>
            <p v-if="isAirkoreaLoading" class="wd-empty">불러오는 중입니다...</p>
            <div v-else-if="airkorea" class="wd-air">
              <el-tag v-if="airkorea.pm10 != null" :type="gradeTagType(airkorea.pm10Grade)" effect="light">
                PM10 {{ airkorea.pm10 }} · {{ airkorea.pm10Grade }}
              </el-tag>
              <el-tag v-if="airkorea.pm25 != null" :type="gradeTagType(airkorea.pm25Grade)" effect="light">
                PM2.5 {{ airkorea.pm25 }} · {{ airkorea.pm25Grade }}
              </el-tag>
            </div>
            <p v-else class="wd-empty">{{ airkoreaError ?? '실측값이 없습니다.' }}</p>
            <p v-if="airkorea" class="wd-source-note">
              {{ airkorea.sido }} 지역 측정소 {{ airkorea.stationCount }}곳 평균
              <span v-if="airkorea.measuredAt"> · {{ airkorea.measuredAt }} 기준</span>
            </p>
          </div>
        </div>

        <p class="wd-source-caveat">
          에어코리아는 시 단위가 아닌 시도 단위로만 값을 제공하므로, {{ region.name }}의 실측값은 {{ region.sido }} 전체 측정소의 평균입니다. 두
          수치가 다른 것은 측정 방식과 범위가 다르기 때문입니다.
        </p>
      </section>

      <section class="wd-section glass-card">
        <h3 class="wd-section-title">시간별 예보</h3>
        <ul class="wd-hourly">
          <li v-for="slot in hourly" :key="slot.date + slot.time">
            <span class="wd-h-time">{{ slot.time }}</span>
            <span class="wd-h-icon">{{ statusIcon(slot.status) }}</span>
            <span class="wd-h-temp">{{ toDisplay(slot.temp) }}{{ configStore.unitSymbol }}</span>
            <span class="wd-h-pop">💧{{ slot.pop }}%</span>
          </li>
        </ul>
      </section>

      <section class="wd-section glass-card">
        <h3 class="wd-section-title">주간 예보</h3>
        <ul class="wd-forecast">
          <li v-for="day in daily" :key="day.date">
            <span class="wd-d-date">{{ dayLabel(day.date) }}</span>
            <span class="wd-d-icon">{{ statusIcon(day.status) }}</span>
            <span class="wd-d-status">{{ day.status }}</span>
            <span class="wd-d-temp">
              <span class="wd-d-min">{{ toDisplay(day.min) }}°</span>
              <span class="wd-d-sep">/</span>
              <span class="wd-d-max">{{ toDisplay(day.max) }}°</span>
            </span>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>

<style scoped>
.wd-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 720px;
  margin: 0 auto;
  padding: 0;
}
.wd-back {
  align-self: flex-start;
  margin: 0;
  color: #ffffff;
  text-shadow: 0 1px 5px rgba(0, 0, 0, 0.3);
}
.wd-status {
  padding: 40px 0;
  text-align: center;
  color: #ffffff;
  text-shadow: 0 1px 5px rgba(0, 0, 0, 0.3);
}
.wd-error {
  color: #f56c6c;
}
.wd-title {
  margin: 0 0 0 4px;
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
}
/* 간격은 부모의 flex gap이 담당한다 */
.wd-section {
  margin: 0;
}

.wd-hero {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: linear-gradient(160deg, #e8f2ff, #f6f9ff);
}
.wd-icon {
  font-size: 52px;
  line-height: 1;
}
.wd-temp {
  margin: 0;
  font-size: 44px;
  font-weight: 800;
  line-height: 1.1;
  color: #1f2d3d;
}
.wd-desc {
  margin: 4px 0 0;
  font-size: 14px;
  color: #606266;
}
.wd-desc-table {
  margin-bottom: 8px;
}

.wd-section-title {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 700;
  color: #606266;
}
.wd-air {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.wd-empty {
  margin: 0;
  font-size: 13px;
  color: #c0c4cc;
}

.wd-source-lead {
  margin: 0 0 12px;
  font-size: 13px;
  color: #606266;
}
.wd-sources {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
}
.wd-source {
  padding: 14px;
  background: #f5f7fa;
  border-radius: 12px;
}
.wd-source-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.wd-source-name {
  font-size: 14px;
  font-weight: 700;
  color: #1f2d3d;
}
.wd-source-note {
  margin: 10px 0 0;
  font-size: 12px;
  color: #909399;
}
.wd-source-caveat {
  margin: 14px 0 0;
  padding: 10px 12px;
  background: #fdf6ec;
  border-radius: 8px;
  font-size: 12px;
  line-height: 1.6;
  color: #b88230;
}

.wd-hourly {
  display: flex;
  gap: 8px;
  list-style: none;
  margin: 0;
  padding: 0 0 6px;
  overflow-x: auto;
}
.wd-hourly li {
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
.wd-h-time {
  font-size: 12px;
  color: #909399;
}
.wd-h-icon {
  font-size: 24px;
  line-height: 1;
}
.wd-h-temp {
  font-size: 15px;
  font-weight: 700;
  color: #1f2d3d;
}
.wd-h-pop {
  font-size: 11px;
  color: #409eff;
}

.wd-forecast {
  list-style: none;
  padding: 0;
  margin: 0;
}
.wd-forecast li {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 4px;
  border-bottom: 1px solid #ebeef5;
}
.wd-forecast li:last-child {
  border-bottom: none;
}
.wd-d-date {
  flex: 0 0 90px;
  font-size: 14px;
  color: #606266;
}
.wd-d-icon {
  font-size: 20px;
  line-height: 1;
}
.wd-d-status {
  flex: 1;
  font-size: 13px;
  color: #909399;
}
.wd-d-temp {
  display: flex;
  align-items: baseline;
  gap: 4px;
  font-size: 14px;
  font-weight: 700;
}
.wd-d-min {
  color: #409eff;
}
.wd-d-sep {
  color: #dcdfe6;
  font-weight: 400;
}
.wd-d-max {
  color: #f56c6c;
}
</style>
