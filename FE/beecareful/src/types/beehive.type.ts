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
