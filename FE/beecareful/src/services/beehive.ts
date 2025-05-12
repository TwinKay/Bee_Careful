import { api } from './api';
import { AxiosError } from 'axios';

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
