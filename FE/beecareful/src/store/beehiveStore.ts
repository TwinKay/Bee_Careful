import type { BeehiveType } from '@/types/beehive';
import { create } from 'zustand';

// 앱 모드 타입 정의
export type MainModeType = 'normal' | 'diagnosis';

// 스토어 상태 타입 정의
type BeehiveStoreType = {
  // 현재 앱 모드 (normal: 일반 모드, diagnosis: 질병 검사 모드)
  currentMode: MainModeType;
  // 선택된 벌통 ID (질병 검사 모드에서 사용)
  selectedBeehive: BeehiveType | null;
  selectedBeehiveId: number | null;
  // 모드 변경 함수
  setMode: (mode: MainModeType) => void;
  // 선택된 벌통 ID 설정 함수
  setSelectedBeehiveId: (id: number | null) => void;

  setSelectedBeehive: (beehive: BeehiveType | null) => void;
};

const useBeehiveStore = create<BeehiveStoreType>((set) => ({
  currentMode: 'normal',
  selectedBeehiveId: null,
  setMode: (mode) => set({ currentMode: mode }),
  setSelectedBeehiveId: (id) => set({ selectedBeehiveId: id }),
  selectedBeehive: null,
  setSelectedBeehive: (beehive) => set({ selectedBeehive: beehive }),
}));

export default useBeehiveStore;
