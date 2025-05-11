/**
 * @description 라우트 정의 상수 추가
 */

export const ROUTES = {
  BEEHIVES: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  BEEHIVE_DETAIL: (id: string) => `/beehives/${id}`,
  DIAGNOSIS_CREATE: '/diagnosis/create',
  NOTIFICATIONS: '/notifications',
} as const;

// 라우트 타입 정의
export type RouteType = (typeof ROUTES)[keyof typeof ROUTES];
