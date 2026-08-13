import { createRouter, createWebHistory } from 'vue-router'
import WeatherHomeView from '../views/WeatherHomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      // 메인 대시보드 (정적 import)
      path: '/',
      name: 'home',
      component: WeatherHomeView,
    },
    {
      // 도시별 상세 페이지 (동적 경로, 지연 로딩)
      path: '/weather/:cityId',
      name: 'weather-detail',
      component: () => import('../views/WeatherDetailView.vue'),
    },
    {
      // 서비스 소개 (지연 로딩)
      path: '/about',
      name: 'about',
      component: () => import('../views/WeatherAboutView.vue'),
    },
    {
      // 날씨 통계 페이지 (지연 로딩)
      path: '/stats',
      name: 'stats',
      component: () => import('../views/WeatherStatsView.vue'),
    },
    {
      // 날짜별 조회 페이지 (지연 로딩)
      path: '/range',
      name: 'range',
      component: () => import('../views/WeatherRangeView.vue'),
    },
    {
      // 정의되지 않은 모든 경로 처리 (Catch-all, 반드시 마지막)
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFoundView.vue'),
    },
  ],
})

export default router
