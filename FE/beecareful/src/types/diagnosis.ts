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
  result: {
    larva: DiagnosisLarvaType;
    imago: DiagnosisImagoType;
  };
};

export type ImageMetadataType = {
  filename: string;
  contentType: string;
  expectedSize: number;
};

export type DiagnosisResponseType = {
  filename: string;
  status: number;
  preSignedUrl: string;
};

export type DiagnosisRequestType = {
  beeHiveId: number | string;
  count: number;
  photos: ImageMetadataType[];
};
