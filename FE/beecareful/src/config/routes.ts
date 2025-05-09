/**
 * @description 라우트 정의 상수 추가
 */

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  BEEHIVES: '/beehives',
  BEEHIVE_DETAIL: (id: string) => `/beehives/${id}`,
  DIAGNOSIS_CREATE: '/diagnosis/create',
  DIAGNOSIS_DETAIL: '/diagnosis/detail',
  NOTIFICATIONS: '/notifications',
} as const;

// 라우트 타입 정의
export type RouteType = (typeof ROUTES)[keyof typeof ROUTES];
