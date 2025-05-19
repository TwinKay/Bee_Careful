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
  // 전체 벌통 목록 저장
  beehives: BeehiveType[];
  // 모드 변경 함수
  setMode: (mode: MainModeType) => void;
  // 선택된 벌통 ID 설정 함수
  setSelectedBeehiveId: (id: number | null) => void;
  setSelectedBeehive: (beehive: BeehiveType | null) => void;
  // 벌통 목록 설정 함수
  setBeehives: (beehives: BeehiveType[]) => void;
  // 벌통 ID로 별명 조회 함수
  getBeehiveNicknameById: (id: number) => string | undefined;
  // 벌통 ID로 벌통 정보 조회 함수
  getBeehiveById: (id: number) => BeehiveType | undefined;
};

const useBeehiveStore = create<BeehiveStoreType>((set, get) => ({
  currentMode: 'normal',
  selectedBeehiveId: null,
  selectedBeehive: null,
  beehives: [],
  setMode: (mode) => set({ currentMode: mode }),
  setSelectedBeehiveId: (id) => set({ selectedBeehiveId: id }),
  setSelectedBeehive: (beehive) => set({ selectedBeehive: beehive }),
  setBeehives: (beehives) => set({ beehives }),
  getBeehiveNicknameById: (id) => {
    const beehive = get().beehives.find((beehive) => beehive.beehiveId === id);
    return beehive?.nickname;
  },
  getBeehiveById: (beehiveId) => {
    return get().beehives.find((beehive) => beehive.beehiveId === Number(beehiveId));
  },
}));

export default useBeehiveStore;
