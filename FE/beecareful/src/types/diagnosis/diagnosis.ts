export type DiagnosisLarvaType = {
  varroaCount: number;
  varroaRatio: number;
  foulBroodCount: number;
  foulBroodRatio: number;
  chalkBroodCount: number;
  chalkBroodRatio: number;
};

export type DiagnosisImagoType = {
  varroaCount: number;
  varroaRatio: number;
  dwvCount: number;
  dwvRatio: number;
};

export type DiagnosisDataType = {
  diagnosisId: number;
  createdAt: string;
  imagoCount: number;
  larvaCount: number;
  diagnosis: {
    larva: DiagnosisLarvaType;
    imago: DiagnosisImagoType;
  };
};
