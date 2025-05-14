import { api } from './api';
import { useQuery, useMutation } from '@tanstack/react-query';
import type { CreateBeehiveRequestType, UpdateBeehiveRequestType } from '@/types/beehive';
import type { DiagnosisRequestType } from '@/types/diagnosis';

// 전체 벌통 조회
export function useGetBeehives() {
  return useQuery({
    queryKey: ['beehives'],
    queryFn: () => api.get('/api/v1/beehives').then((res) => res.data),
  });
}

// 벌통 추가
export function useCreateBeehive() {
  return useMutation({
    mutationFn: ({ nickname, xDirection, yDirection }: CreateBeehiveRequestType) =>
      api.post('/api/v1/beehives', { nickname, xDirection, yDirection }).then((res) => res.data),
  });
}

// 벌통 상세 + 진단 기록(페이지네이션, 무한 스크롤)
export function useGetBeehiveRecords(beeHiveId: number, month: number) {
  return useQuery({
    queryKey: ['beehiveRecords', beeHiveId, month],
    queryFn: () =>
      api
        .get(`/api/v1/beehives/${beeHiveId}`, {
          params: { month },
        })
        .then((res) => res.data),
  });
}

// 벌통 정보 수정
export function useUpdateBeehive() {
  return useMutation({
    mutationFn: ({ beeHiveId, nickname, xDirection, yDirection }: UpdateBeehiveRequestType) =>
      api
        .patch(`/api/v1/beehives/${beeHiveId}`, { nickname, xDirection, yDirection })
        .then((res) => res.data),
  });
}

// 벌통 삭제
export function useDeleteBeehive() {
  return useMutation({
    mutationFn: (beeHiveId: number) =>
      api.delete(`/api/v1/beehives/${beeHiveId}`).then((res) => res.data),
  });
}

// 말벌 퇴치 장치 연동
export function useLinkTurret() {
  return useMutation({
    mutationFn: ({ code }: { code: string }) =>
      api.post('/api/v1/beehives/turret', { code }).then((res) => res.data),
  });
}

// 벌통 진단 요청 (pre-signed URL 요청)
export function useRequestDiagnosis() {
  return useMutation({
    mutationFn: ({ beeHiveId, count, photos }: DiagnosisRequestType) =>
      api
        .post(`/api/v1/beehives/${beeHiveId}/diagnosis`, { count, photos })
        .then((res) => res.data),
  });
}

// 진단 결과 이미지 조회
export function useGetDiagnosisImages(beeHiveId: number, recordId: number) {
  return useQuery({
    queryKey: ['diagnosisImages', beeHiveId, recordId],
    queryFn: () =>
      api.get(`/api/v1/beehives/${beeHiveId}/records/${recordId}`).then((res) => res.data),
  });
}
