/// <reference types="vite/client" />

// 환경 변수 생성 시 아래에 추가
type ImportMetaEnv = {
  readonly VITE_API_URL: string;
};

type ImportMeta = {
  readonly env: ImportMetaEnv;
};
