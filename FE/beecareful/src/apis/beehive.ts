import { api } from './api';
import { useQuery, useMutation } from '@tanstack/react-query';
import type { CreateBeehiveRequestType, UpdateBeehiveRequestType } from '@/types/beehive';
import type { DiagnosisRequestType } from '@/types/diagnosis';
import useBeehiveStore from '@/store/beehiveStore';

// 전체 벌통 조회
export function useGetBeehives() {
  const setBeehives = useBeehiveStore((state) => state.setBeehives);
  return useQuery({
    queryKey: ['beehives'],
    queryFn: async () => {
      const response = await api.get('/api/v1/beehives');
      const data = response.data;
      // API 호출 결과를 스토어에 저장
      setBeehives(data);
      return data;
    },
  });
}

// 벌통 추가
export function useCreateBeehive() {
  return useMutation({
    mutationFn: ({ nickname, xDirection, yDirection }: CreateBeehiveRequestType) =>
      api.post('/api/v1/beehives', { nickname, xDirection, yDirection }).then((res) => {
        return { beehiveId: res.data.beehiveId };
      }),
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
    mutationFn: ({ beehiveId, serial }: { beehiveId: string | number; serial: string }) =>
      api.post(`/api/v1/beehives/${beehiveId}/turret`, { serial }).then((res) => res.data),
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
export function useGetDiagnosisImages(beeHiveId: number, diagnosisId: number) {
  return useQuery({
    queryKey: ['diagnosisImages', beeHiveId, diagnosisId],
    queryFn: () =>
      api
        .get(`/api/v1/beehives/${beeHiveId}/diagnoses/${diagnosisId}/annotated-images`)
        .then((res) => res.data),
    staleTime: 1000 * 60 * 60 * 24, // 1일
    gcTime: 1000 * 60 * 60 * 24 * 30, // 30일
  });
}
