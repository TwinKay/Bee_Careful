/// <reference types="vite/client" />

type ImportMetaEnv = {
  readonly VITE_API_URL: string;
  // 다른 환경변수들도 여기에 추가
};

type ImportMeta = {
  readonly env: ImportMetaEnv;
};
