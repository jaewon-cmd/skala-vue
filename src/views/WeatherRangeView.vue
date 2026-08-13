<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useWeatherStore } from '@/stores/weatherStore.js'
import { useConfigStore } from '@/stores/configStore.js'
import { searchRegions, findRegion } from '@/constants/regions.js'

const weatherStore = useWeatherStore()
const configStore = useConfigStore()
const { rangeDates, rangeTimesByDate, isRangeLoading, recentIds } = storeToRefs(weatherStore)

const selectedDate = ref('')
const selectedTime = ref('')

// 비교할 지역 목록 (홈에서 본 지역을 이어받는다)
const selectedRegionIds = ref([])

// 지역 선택 드롭다운 검색어
const keyword = ref('')

const groupedOptions = computed(() => {
  const matched = searchRegions(keyword.value)

  // 이미 고른 지역은 검색어에 걸리지 않아도 목록에 남겨둔다.
  // el-select는 화면에 그려진 el-option에서 칩 이름을 찾기 때문에,
  // 검색으로 걸러져 사라지면 고른 지역의 칩이 이름 없이 비어 보인다.
  const shown = [...matched]
  selectedRegionIds.value.forEach((id) => {
    if (!shown.some((region) => region.id === id)) {
      const region = findRegion(id)
      if (region) {
        shown.push(region)
      }
    }
  })

  const groups = []
  shown.forEach((region) => {
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

// 지역을 추가하면 그 지역만 새로 받아온다 (이미 받은 지역은 다시 부르지 않는다)
const handleRegionsChange = async (ids) => {
  // 고른 뒤에는 검색어를 비워 전체 목록이 다시 보이게 한다
  keyword.value = ''
  await weatherStore.fetchRangeRegions(ids)
  if (!selectedDate.value && rangeDates.value.length > 0) {
    selectedDate.value = rangeDates.value[0]
  }
}

// 섭씨 값을 현재 표시 단위로 변환
const toDisplay = (celsius) => {
  if (celsius == null) {
    return null
  }
  if (configStore.unit === 'fahrenheit') {
    return Math.round((celsius * 9) / 5 + 32)
  }
  return Math.round(celsius * 10) / 10
}

const statusIcon = (status) => {
  const map = { 맑음: '☀️', 비: '🌧️', 구름: '☁️', 바람: '💨', 눈: '❄️', 안개: '🌫️' }
  return map[status] ?? '🌡️'
}

// 선택한 날짜에 고를 수 있는 시간 목록
const timeOptions = computed(() => {
  if (!selectedDate.value) {
    return []
  }
  return rangeTimesByDate.value[selectedDate.value] ?? []
})

// 표에 뿌릴 지역별 데이터
const rows = computed(() => {
  if (!selectedDate.value || !selectedTime.value || selectedRegionIds.value.length === 0) {
    return []
  }
  return weatherStore.getRangeRows(selectedDate.value, selectedTime.value, selectedRegionIds.value)
})

// 값이 있는 행만 모아 요약을 만든다
const valid = computed(() => rows.value.filter((row) => row.temp != null))

const summary = computed(() => {
  if (valid.value.length === 0) {
    return null
  }
  const temps = valid.value.map((row) => row.temp)
  const sum = temps.reduce((acc, t) => acc + t, 0)
  const hottest = valid.value.reduce((max, row) => (row.temp > max.temp ? row : max))
  const coldest = valid.value.reduce((min, row) => (row.temp < min.temp ? row : min))
  return {
    average: toDisplay(sum / temps.length),
    hottest,
    coldest,
    rainy: valid.value.filter((row) => row.status === '비' || row.status === '눈').length,
  }
})

// 2026-08-13 -> 8월 13일 (목)
const dateLabel = (date) => {
  if (!date) {
    return ''
  }
  const d = new Date(`${date}T00:00:00+09:00`)
  const names = ['일', '월', '화', '수', '목', '금', '토']
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${names[d.getDay()]})`
}

// 예보 범위 밖 날짜는 선택하지 못하게 막는다
const disabledDate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const str = `${year}-${month}-${day}`
  return !rangeDates.value.includes(str)
}

// 미세먼지 등급에 따른 태그 색상
const airTagType = (grade) => {
  if (grade === '좋음') {
    return 'success'
  }
  if (grade === '보통') {
    return 'warning'
  }
  if (grade === '나쁨' || grade === '매우 나쁨') {
    return 'danger'
  }
  return 'info'
}

// 날짜가 바뀌면 그 날짜의 첫 시간으로 맞춘다
watch(selectedDate, () => {
  const times = timeOptions.value
  selectedTime.value = times.length > 0 ? times[0] : ''
})

onMounted(async () => {
  // 홈에서 검색해 본 지역을 그대로 이어받고, 없으면 서울로 시작한다
  const start = recentIds.value.length > 0 ? recentIds.value.slice(0, 3) : ['seoul']
  selectedRegionIds.value = start
  await handleRegionsChange(start)
})
</script>

<template>
  <div class="wr-range">
    <header class="wr-head">
      <h2 class="wr-title">📅 날짜별 지역 날씨 조회</h2>
      <p class="wr-sub">예보 기간 안에서 날짜와 시간을 골라 지역별 날씨를 비교합니다</p>
    </header>

    <p v-if="isRangeLoading" class="wr-loading glass-card">데이터를 불러오는 중입니다...</p>

    <template v-else>
      <!-- 날짜 / 시간 선택 -->
      <div class="wr-controls glass-card">
        <div class="wr-field">
          <label class="wr-label">날짜</label>
          <el-date-picker
            v-model="selectedDate"
            type="date"
            placeholder="날짜 선택"
            value-format="YYYY-MM-DD"
            :disabled-date="disabledDate"
            :clearable="false"
          />
        </div>
        <div class="wr-field wr-field-grow">
          <label class="wr-label">비교할 지역</label>
          <el-select
            v-model="selectedRegionIds"
            multiple
            filterable
            collapse-tags
            collapse-tags-tooltip
            :filter-method="handleFilter"
            :max-collapse-tags="4"
            placeholder="지역을 골라주세요"
            class="wr-region-select"
            @change="handleRegionsChange"
            @visible-change="handleVisibleChange"
          >
            <el-option-group v-for="group in groupedOptions" :key="group.label" :label="group.label">
              <el-option v-for="region in group.items" :key="region.id" :label="region.name" :value="region.id" />
            </el-option-group>
          </el-select>
        </div>
        <div class="wr-field">
          <label class="wr-label">시간</label>
          <el-select v-model="selectedTime" placeholder="시간 선택" style="width: 130px">
            <el-option v-for="t in timeOptions" :key="t" :label="t" :value="t" />
          </el-select>
        </div>
        <p class="wr-range-note">조회 가능 기간 · {{ dateLabel(rangeDates[0]) }} ~ {{ dateLabel(rangeDates[rangeDates.length - 1]) }}</p>
      </div>

      <!-- 선택한 시점 요약 -->
      <section v-if="summary" class="wr-summary glass-card">
        <p class="wr-summary-when">{{ dateLabel(selectedDate) }} {{ selectedTime }} 기준</p>
        <div class="wr-summary-grid">
          <div class="wr-stat">
            <span class="wr-stat-label">평균 기온</span>
            <span class="wr-stat-value">{{ summary.average }}{{ configStore.unitSymbol }}</span>
          </div>
          <div class="wr-stat">
            <span class="wr-stat-label">가장 더운 곳</span>
            <span class="wr-stat-value">{{ toDisplay(summary.hottest.temp) }}{{ configStore.unitSymbol }}</span>
            <span class="wr-stat-note">{{ summary.hottest.name }}</span>
          </div>
          <div class="wr-stat">
            <span class="wr-stat-label">가장 추운 곳</span>
            <span class="wr-stat-value">{{ toDisplay(summary.coldest.temp) }}{{ configStore.unitSymbol }}</span>
            <span class="wr-stat-note">{{ summary.coldest.name }}</span>
          </div>
          <div class="wr-stat">
            <span class="wr-stat-label">비 · 눈</span>
            <span class="wr-stat-value">{{ summary.rainy }}곳</span>
            <span class="wr-stat-note">전체 {{ valid.length }}곳 중</span>
          </div>
        </div>
      </section>

      <!-- 지역별 표 -->
      <section class="wr-table-card glass-card">
        <el-table :data="rows" border stripe style="width: 100%">
          <el-table-column prop="name" label="지역" min-width="90" />
          <el-table-column label="날씨" min-width="110">
            <template #default="scope">
              <span class="wr-cell-status">{{ statusIcon(scope.row.status) }} {{ scope.row.status }}</span>
            </template>
          </el-table-column>
          <el-table-column label="기온" min-width="90" sortable :sort-by="(row) => row.temp ?? -999">
            <template #default="scope">
              <span v-if="scope.row.temp != null" class="wr-cell-temp"> {{ toDisplay(scope.row.temp) }}{{ configStore.unitSymbol }} </span>
              <span v-else class="wr-cell-empty">-</span>
            </template>
          </el-table-column>
          <el-table-column label="미세먼지 (PM10)" min-width="150">
            <template #default="scope">
              <el-tag v-if="scope.row.pm10 != null" :type="airTagType(scope.row.pm10Grade)" effect="light">
                {{ scope.row.pm10 }} · {{ scope.row.pm10Grade }}
              </el-tag>
              <span v-else class="wr-cell-empty">-</span>
            </template>
          </el-table-column>
          <el-table-column label="초미세먼지 (PM2.5)" min-width="160">
            <template #default="scope">
              <el-tag v-if="scope.row.pm25 != null" :type="airTagType(scope.row.pm25Grade)" effect="light">
                {{ scope.row.pm25 }} · {{ scope.row.pm25Grade }}
              </el-tag>
              <span v-else class="wr-cell-empty">-</span>
            </template>
          </el-table-column>
        </el-table>

        <p v-if="selectedRegionIds.length === 0" class="wr-empty">비교할 지역을 한 곳 이상 골라주세요.</p>
        <p v-else-if="rows.length === 0" class="wr-empty">날짜와 시간을 선택하면 지역별 날씨가 표시됩니다.</p>
      </section>
    </template>
  </div>
</template>

<style scoped>
.wr-range {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 0;
}

/* 제목은 카드 밖 하늘 위에 놓이므로 흰 글씨로 대비를 준다 */
.wr-head {
  margin: 0 0 0 4px;
}
.wr-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
}
.wr-sub {
  margin: 4px 0 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.92);
  text-shadow: 0 1px 5px rgba(0, 0, 0, 0.3);
}
.wr-loading {
  padding: 40px 0;
  text-align: center;
  color: #909399;
}

/* 배경/테두리는 glass-card가 담당한다 */
.wr-controls {
  display: flex;
  gap: 16px;
  align-items: flex-end;
  flex-wrap: wrap;
  padding: 16px;
}
.wr-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.wr-field-grow {
  flex: 1;
  min-width: 220px;
}
.wr-region-select {
  width: 100%;
}
.wr-label {
  font-size: 12px;
  font-weight: 600;
  color: #909399;
}
.wr-range-note {
  margin: 0 0 6px auto;
  font-size: 12px;
  color: #a8abb2;
}

/* 선택한 시점 요약 */
.wr-summary-when {
  margin: 0 0 14px;
  font-size: 13px;
  font-weight: 600;
  color: #606266;
}
.wr-summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 12px;
}
.wr-stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.wr-stat-label {
  font-size: 12px;
  color: #909399;
}
.wr-stat-value {
  font-size: 24px;
  font-weight: 800;
  line-height: 1.2;
  color: #1f2d3d;
}
.wr-stat-note {
  font-size: 12px;
  color: #a8abb2;
}

.wr-cell-status {
  white-space: nowrap;
}
.wr-cell-temp {
  font-weight: 700;
  color: #1f2d3d;
}
.wr-cell-empty {
  color: #c0c4cc;
}
.wr-empty {
  margin: 16px 0 0;
  text-align: center;
  font-size: 13px;
  color: #a8abb2;
}
</style>
