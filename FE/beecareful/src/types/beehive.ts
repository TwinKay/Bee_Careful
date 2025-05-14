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
