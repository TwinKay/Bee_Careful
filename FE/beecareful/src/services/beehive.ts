import { api } from './api';
import { AxiosError } from 'axios';
import { useQuery, useMutation, useInfiniteQuery } from '@tanstack/react-query';

// 벌통 타입
export type BeehiveType = {
  beehiveId: number;
  nickname: string;
  createdAt: string;
  xDirection: number;
  yDirection: number;
  hornetAppearedAt: string | null;
  isInfected: boolean;
  recordCreatedAt: string;
  lastDiagnosedAt: string;
  lastDiagnosisId: number;
  diagnosisStatus: number;
};

// 벌통 생성 요청 타입
export type CreateBeehiveRequestType = {
  nickname: string;
  xDirection: number;
  yDirection: number;
};

// 벌통 수정 요청 타입
export type UpdateBeehiveRequestType = {
  beeHiveId: number;
  nickname: string;
  xDirection: number;
  yDirection: number;
};

// 전체 벌통 조회
export const getBeehives = async (): Promise<BeehiveType[]> => {
  try {
    const response = await api.get('/api/v1/beehives');
    return response.data;
  } catch (error) {
    // 에러 처리
    if (error instanceof AxiosError && error.response) {
      throw new Error(error.response.data?.message || '벌통 목록을 불러오는데 실패했습니다.');
    }

    // 네트워크 에러 등
    console.error('벌통 목록 조회 에러:', error);
    throw error;
  }
};

// 벌통 추가
export const createBeehive = async (beehiveData: CreateBeehiveRequestType): Promise<void> => {
  try {
    const response = await api.post('/api/v1/beehives', beehiveData);
    // 201: 성공
    if (response.status === 201) {
      return;
    }
  } catch (error) {
    // 에러 처리
    if (error instanceof AxiosError && error.response) {
      throw new Error(error.response.data?.message || '벌통 추가에 실패했습니다.');
    }

    // 네트워크 에러 등
    console.error('벌통 추가 에러:', error);
    throw error;
  }
};

const defaultRecordParams = {
  page: 1,
  size: 10,
};

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
export function useGetBeehiveRecords(
  beeHiveId: number,
  params?: Partial<typeof defaultRecordParams>,
) {
  const paramsWithDefault = { ...defaultRecordParams, ...params };
  return useInfiniteQuery({
    queryKey: ['beehiveRecords', beeHiveId, paramsWithDefault],
    queryFn: ({ pageParam }) =>
      api
        .get(`/api/v1/beehives/${beeHiveId}`, {
          params: { ...paramsWithDefault, page: pageParam },
        })
        .then((res) => res.data),
    getNextPageParam: (lastPage) => (lastPage.pageInfo.hasNext ? lastPage.pageInfo.page + 1 : null),
    initialPageParam: paramsWithDefault.page,
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
    mutationFn: ({
      beeHiveId,
      count,
      photos,
    }: {
      beeHiveId: number;
      count: number;
      photos: any[];
    }) =>
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

// S3 업로드 완료 보고
export function useCompleteS3Upload() {
  return useMutation({
    mutationFn: (s3Key: string) =>
      api.put('/api/v1/s3', null, { params: { s3Key } }).then((res) => res.data),
  });
}
