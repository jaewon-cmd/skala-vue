import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'
import { findRegion } from '@/constants/regions.js'

// 이 스토어에는 지역 데이터가 두 갈래로 들어있다.
//
//  1) REGIONS (constants/regions.js) - 전국 39개, 좌표로 조회.
//     홈 검색 / 상세 / 날짜별 조회가 쓰는 현재 방식이다.
//
//  2) CITY_LIST (아래) - 고정 6개 도시, 영문 도시명으로 조회.
//     홈이 검색 방식으로 바뀌기 전의 이전 버전 코드이며,
//     지금은 통계 화면만 이 목록을 쓴다.

const API_KEY = import.meta.env.VITE_OWM_KEY

// 에어코리아 대기오염정보 서비스키.
// 미세먼지를 좌표 기반(OpenWeather)으로 옮기면서 지금은 호출되지 않는다.
const AIR_KEY = import.meta.env.VITE_AIR_KEY

// 이전 버전에서 쓰던 고정 도시 목록 (통계 화면 전용)
const CITY_LIST = [
  { id: 'seoul', name: '서울', query: 'Seoul', lat: 37.5665, lon: 126.978 },
  { id: 'busan', name: '부산', query: 'Busan', lat: 35.1796, lon: 129.0756 },
  { id: 'incheon', name: '인천', query: 'Incheon', lat: 37.4563, lon: 126.7052 },
  { id: 'daegu', name: '대구', query: 'Daegu', lat: 35.8714, lon: 128.6014 },
  { id: 'gwangju', name: '광주', query: 'Gwangju', lat: 35.1595, lon: 126.8526 },
  { id: 'jeju', name: '제주', query: 'Jeju', lat: 33.4996, lon: 126.5312 },
]

// 도시 id -> 에어코리아 시도명.
// 에어코리아는 시 단위가 아닌 시도 단위로만 조회할 수 있어 이 변환이 필요했다.
const SIDO_MAP = {
  seoul: '서울',
  busan: '부산',
  incheon: '인천',
  daegu: '대구',
  gwangju: '광주',
  jeju: '제주',
}

// OpenWeather 영문 상태 -> 한글 변환
const statusMap = {
  Clear: '맑음',
  Clouds: '구름',
  Rain: '비',
  Drizzle: '비',
  Snow: '눈',
  Thunderstorm: '비',
  Mist: '안개',
  Fog: '안개',
  Haze: '안개',
}

// 미세먼지(PM10) 등급 계산
const pm10Grade = (v) => {
  if (v <= 30) return '좋음'
  if (v <= 80) return '보통'
  if (v <= 150) return '나쁨'
  return '매우 나쁨'
}

// 초미세먼지(PM2.5) 등급 계산
const pm25Grade = (v) => {
  if (v <= 15) return '좋음'
  if (v <= 35) return '보통'
  if (v <= 75) return '나쁨'
  return '매우 나쁨'
}

// 유닉스 시간을 한국시간(KST) 날짜/시간 문자열로 변환
const toKst = (unixSeconds) => {
  const d = new Date(unixSeconds * 1000)
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const parts = fmt.formatToParts(d)
  const get = (type) => parts.find((p) => p.type === type).value
  const date = `${get('year')}-${get('month')}-${get('day')}`
  let hour = get('hour')
  if (hour === '24') {
    hour = '00'
  }
  const time = `${hour}:${get('minute')}`
  return { date, time, key: `${date} ${time}` }
}

export const useWeatherStore = defineStore('weather', () => {
  const cities = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  // 도시 id -> 예보 배열 (이전 버전 경로)
  const forecastByCity = ref({})
  const isForecastLoading = ref(false)

  // 도시 id -> 미세먼지 객체 (이전 버전 경로)
  const airByCity = ref({})
  const isAirLoading = ref(false)

  const isDetailsLoading = ref(false)

  // ===== 지역 검색 (홈 · 상세 화면) =====
  // 좌표 기반으로 조회하므로 REGIONS에 있는 지역이면 어디든 동작한다
  const selectedRegionId = ref('seoul')
  const currentWeather = ref(null)
  const currentAir = ref(null)
  const hourly = ref([])
  const daily = ref([])
  const isRegionLoading = ref(false)
  const regionError = ref(null)
  const recentIds = ref(['seoul'])

  // 한 번 조회한 지역은 캐시해 둔다.
  // 최근 본 지역을 카드로 다시 그릴 때 API를 다시 부르지 않기 위한 것.
  const regionCache = ref({})

  const selectedRegion = computed(() => findRegion(selectedRegionId.value))

  // ===== 날짜별 조회 =====
  // 지역 id -> ('날짜 시간' -> 그 시각의 날씨) 형태로 쌓아둔다
  const rangeByCity = ref({})
  const rangeDates = ref([])
  const rangeTimesByDate = ref({})
  const isRangeLoading = ref(false)

  // 고정 6개 도시의 현재 날씨를 병렬로 받아온다 (통계 화면에서 사용)
  const fetchAllWeather = async () => {
    isLoading.value = true
    error.value = null
    try {
      const requests = CITY_LIST.map((city) =>
        axios.get('https://api.openweathermap.org/data/2.5/weather', {
          params: { q: city.query, appid: API_KEY, units: 'metric', lang: 'kr' },
        }),
      )
      const responses = await Promise.all(requests)
      cities.value = responses.map((res, i) => {
        const d = res.data
        return {
          id: CITY_LIST[i].id,
          name: CITY_LIST[i].name,
          temp: Math.round(d.main.temp * 10) / 10,
          status: statusMap[d.weather[0].main] ?? d.weather[0].description,
          humidity: d.main.humidity,
          wind: d.wind.speed,
          feelsLike: Math.round(d.main.feels_like),
        }
      })
    } catch (e) {
      error.value = '날씨 데이터를 불러오지 못했습니다.'
      console.error('날씨 API 에러:', e)
    } finally {
      isLoading.value = false
    }
  }

  // ===== 이전 버전 경로 (현재 어느 화면에서도 호출하지 않음) =====
  // 홈이 지역 검색으로, 미세먼지가 좌표 기반으로 바뀌면서 쓰이지 않게 되었다.
  // 과제 제출물이라 남겨 두었을 뿐, 지우더라도 동작에는 영향이 없다.

  // 특정 도시의 5일/3시간 예보를 받아 forecastByCity에 저장한다
  const loadForecast = async (cityId) => {
    const target = CITY_LIST.find((city) => city.id === cityId)
    if (!target) {
      return
    }
    const res = await axios.get('https://api.openweathermap.org/data/2.5/forecast', {
      params: { q: target.query, appid: API_KEY, units: 'metric', lang: 'kr' },
    })
    forecastByCity.value[cityId] = res.data.list
      .filter((item) => item.dt_txt.includes('12:00:00'))
      .map((item) => {
        return {
          date: item.dt_txt.split(' ')[0],
          temp: Math.round(item.main.temp * 10) / 10,
          status: statusMap[item.weather[0].main] ?? item.weather[0].description,
        }
      })
  }

  // 특정 도시의 미세먼지 정보를 에어코리아 API에서 받아 airByCity에 저장한다
  const loadAirQuality = async (cityId) => {
    const sido = SIDO_MAP[cityId]
    if (!sido) {
      return
    }
    const res = await axios.get('/airkorea/B552584/ArpltnInforInqireSvc/getCtprvnRltmMesureDnsty', {
      params: {
        serviceKey: AIR_KEY,
        returnType: 'json',
        numOfRows: 100,
        pageNo: 1,
        sidoName: sido,
        ver: '1.0',
      },
    })
    const items = res.data.response.body.items
    const pm10List = items.map((it) => Number(it.pm10Value)).filter((n) => !Number.isNaN(n))
    const pm25List = items.map((it) => Number(it.pm25Value)).filter((n) => !Number.isNaN(n))
    if (pm10List.length === 0 && pm25List.length === 0) {
      return
    }
    const avg = (arr) => Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
    const pm10 = avg(pm10List)
    const pm25 = avg(pm25List)
    airByCity.value[cityId] = {
      pm10,
      pm25,
      pm10Grade: pm10Grade(pm10),
      pm25Grade: pm25Grade(pm25),
    }
  }

  // loadForecast에 로딩 상태만 덧씌운 것
  const fetchForecast = async (cityId) => {
    isForecastLoading.value = true
    try {
      await loadForecast(cityId)
    } catch (e) {
      console.error('예보 API 에러:', e)
    } finally {
      isForecastLoading.value = false
    }
  }

  // loadAirQuality에 로딩 상태만 덧씌운 것
  const fetchAirQuality = async (cityId) => {
    isAirLoading.value = true
    try {
      await loadAirQuality(cityId)
    } catch (e) {
      console.error('미세먼지 API 에러:', e)
    } finally {
      isAirLoading.value = false
    }
  }

  // 6개 도시의 예보 + 미세먼지를 한 번에 받아온다.
  // 도시 하나가 실패해도 나머지는 채워지도록 개별로 catch 한다.
  const fetchAllDetails = async () => {
    isDetailsLoading.value = true
    try {
      await Promise.all(
        CITY_LIST.flatMap((c) => [
          loadForecast(c.id).catch((e) => console.error('예보 API 에러:', c.id, e)),
          loadAirQuality(c.id).catch((e) => console.error('미세먼지 API 에러:', c.id, e)),
        ]),
      )
    } finally {
      isDetailsLoading.value = false
    }
  }

  // ===== 현재 사용 중인 경로 =====

  // 선택한 지역의 현재 날씨 / 미세먼지 / 예보를 좌표 기준으로 한 번에 받아온다.
  // 세 가지를 병렬로 요청하므로 가장 느린 응답 하나만큼만 기다린다.
  const fetchRegion = async (regionId) => {
    const region = findRegion(regionId)
    if (!region) {
      regionError.value = '알 수 없는 지역입니다.'
      return
    }

    selectedRegionId.value = regionId
    isRegionLoading.value = true
    regionError.value = null

    const coord = { lat: region.lat, lon: region.lon, appid: API_KEY }
    try {
      const [weatherRes, airRes, forecastRes] = await Promise.all([
        axios.get('https://api.openweathermap.org/data/2.5/weather', {
          params: { ...coord, units: 'metric', lang: 'kr' },
        }),
        axios.get('https://api.openweathermap.org/data/2.5/air_pollution', { params: coord }),
        axios.get('https://api.openweathermap.org/data/2.5/forecast', {
          params: { ...coord, units: 'metric', lang: 'kr' },
        }),
      ])

      const w = weatherRes.data
      currentWeather.value = {
        // 좌표로 조회하면 w.name이 '남향동'처럼 동 단위로 나오므로 지역 목록의 이름을 쓴다
        name: region.name,
        temp: Math.round(w.main.temp * 10) / 10,
        feelsLike: Math.round(w.main.feels_like * 10) / 10,
        humidity: w.main.humidity,
        wind: w.wind.speed,
        // 풍향은 '바람이 불어오는 방향'을 각도로 준다 (기상 관례)
        windDeg: w.wind.deg ?? null,
        windGust: w.wind.gust ?? null,
        pressure: w.main.pressure,
        // 일출/일몰은 UTC 유닉스 시각, timezone은 그 지역의 UTC 오프셋(초)
        sunrise: w.sys?.sunrise ?? null,
        sunset: w.sys?.sunset ?? null,
        timezone: w.timezone ?? 0,
        // 강수량은 비가 올 때만 응답에 들어온다 (mm/h)
        rain1h: w.rain?.['1h'] ?? null,
        snow1h: w.snow?.['1h'] ?? null,
        clouds: w.clouds?.all ?? null,
        status: statusMap[w.weather[0].main] ?? w.weather[0].description,
        description: w.weather[0].description,
      }

      const c = airRes.data.list[0].components
      const pm10 = Math.round(c.pm10)
      const pm25 = Math.round(c.pm2_5)
      currentAir.value = {
        pm10,
        pm25,
        pm10Grade: pm10Grade(pm10),
        pm25Grade: pm25Grade(pm25),
      }

      const slots = forecastRes.data.list.map((item) => {
        const { date, time } = toKst(item.dt)
        return {
          date,
          time,
          temp: Math.round(item.main.temp * 10) / 10,
          status: statusMap[item.weather[0].main] ?? item.weather[0].description,
          pop: Math.round((item.pop ?? 0) * 100),
        }
      })

      // 시간별은 앞의 8칸(24시간), 주간은 날짜별 최고/최저로 묶는다
      hourly.value = slots.slice(0, 8)

      const byDate = {}
      slots.forEach((s) => {
        if (!byDate[s.date]) {
          byDate[s.date] = { date: s.date, min: s.temp, max: s.temp, noon: null }
        }
        const d = byDate[s.date]
        d.min = Math.min(d.min, s.temp)
        d.max = Math.max(d.max, s.temp)
        // 그 날을 대표하는 날씨로 정오 값을 쓰고, 없으면 첫 칸을 쓴다
        if (s.time === '12:00' || d.noon === null) {
          d.noon = s.status
        }
      })
      daily.value = Object.values(byDate).map((d) => ({ ...d, status: d.noon }))

      // 최근 본 지역 목록 갱신 (중복 제거 후 맨 앞으로, 최대 8개)
      recentIds.value = [regionId, ...recentIds.value.filter((id) => id !== regionId)].slice(0, 8)

      // 카드/상세 페이지에서 다시 쓸 수 있게 캐시에 담아둔다
      regionCache.value[regionId] = {
        region,
        current: currentWeather.value,
        air: currentAir.value,
        hourly: hourly.value,
        daily: daily.value,
      }
    } catch (e) {
      regionError.value = '날씨 정보를 불러오지 못했습니다.'
      console.error('지역 날씨 API 에러:', e)
    } finally {
      isRegionLoading.value = false
    }
  }

  // 고른 지역들의 5일 예보와 시간별 미세먼지를 받아 날짜/시간별로 정리한다.
  // 고정 목록을 한꺼번에 받지 않고 필요한 지역만 받으므로, 지역을 늘려도 호출량이 함께 늘지 않는다.
  // 이미 받아둔 지역은 건너뛴다.
  const fetchRangeRegions = async (regionIds) => {
    const targets = regionIds
      .map((id) => findRegion(id))
      .filter((region) => region !== null)
      .filter((region) => !rangeByCity.value[region.id])

    if (targets.length === 0) {
      return
    }

    isRangeLoading.value = true
    try {
      const weatherReqs = targets.map((c) =>
        axios.get('https://api.openweathermap.org/data/2.5/forecast', {
          params: { lat: c.lat, lon: c.lon, appid: API_KEY, units: 'metric', lang: 'kr' },
        }),
      )
      const airReqs = targets.map((c) =>
        axios.get('https://api.openweathermap.org/data/2.5/air_pollution/forecast', {
          params: { lat: c.lat, lon: c.lon, appid: API_KEY },
        }),
      )
      const [weatherRes, airRes] = await Promise.all([Promise.all(weatherReqs), Promise.all(airReqs)])

      // 기존에 받아둔 지역을 유지한 채 새로 받은 지역만 더한다
      const byCity = { ...rangeByCity.value }
      const dateSet = new Set(rangeDates.value)
      const timesByDate = {}
      Object.keys(rangeTimesByDate.value).forEach((d) => {
        timesByDate[d] = new Set(rangeTimesByDate.value[d])
      })

      targets.forEach((c, i) => {
        const slotMap = {}
        weatherRes[i].data.list.forEach((item) => {
          const { date, time, key } = toKst(item.dt)
          slotMap[key] = {
            temp: Math.round(item.main.temp * 10) / 10,
            status: statusMap[item.weather[0].main] ?? item.weather[0].description,
            pm10: null,
            pm25: null,
          }
          dateSet.add(date)
          if (!timesByDate[date]) {
            timesByDate[date] = new Set()
          }
          timesByDate[date].add(time)
        })
        airRes[i].data.list.forEach((item) => {
          const { key } = toKst(item.dt)
          if (slotMap[key]) {
            slotMap[key].pm10 = Math.round(item.components.pm10)
            slotMap[key].pm25 = Math.round(item.components.pm2_5)
          }
        })
        byCity[c.id] = slotMap
      })

      rangeByCity.value = byCity
      rangeDates.value = Array.from(dateSet).sort()
      const timesObj = {}
      Object.keys(timesByDate).forEach((d) => {
        timesObj[d] = Array.from(timesByDate[d]).sort()
      })
      rangeTimesByDate.value = timesObj
    } catch (e) {
      console.error('기간 조회 API 에러:', e)
    } finally {
      isRangeLoading.value = false
    }
  }

  // 특정 날짜/시간에 대해 고른 지역들의 데이터를 표로 만들어 돌려준다
  const getRangeRows = (date, time, regionIds) => {
    const key = `${date} ${time}`
    return regionIds
      .map((id) => findRegion(id))
      .filter((region) => region !== null)
      .map((region) => {
        const slot = rangeByCity.value[region.id] ? rangeByCity.value[region.id][key] : null
        return {
          id: region.id,
          name: region.name,
          temp: slot ? slot.temp : null,
          status: slot ? slot.status : '-',
          pm10: slot && slot.pm10 != null ? slot.pm10 : null,
          pm25: slot && slot.pm25 != null ? slot.pm25 : null,
          pm10Grade: slot && slot.pm10 != null ? pm10Grade(slot.pm10) : '-',
          pm25Grade: slot && slot.pm25 != null ? pm25Grade(slot.pm25) : '-',
        }
      })
  }

  return {
    cities,
    isLoading,
    error,
    forecastByCity,
    isForecastLoading,
    airByCity,
    isAirLoading,
    isDetailsLoading,
    selectedRegionId,
    selectedRegion,
    currentWeather,
    currentAir,
    hourly,
    daily,
    isRegionLoading,
    regionError,
    recentIds,
    regionCache,
    fetchRegion,
    rangeByCity,
    rangeDates,
    rangeTimesByDate,
    isRangeLoading,
    fetchAllWeather,
    fetchForecast,
    fetchAirQuality,
    fetchAllDetails,
    fetchRangeRegions,
    getRangeRows,
  }
})
