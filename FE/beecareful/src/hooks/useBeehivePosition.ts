import type React from 'react';
import { isPositionOccupied } from '@/utils/calculatePosition';
import { useCallback } from 'react';
import type { BeehiveType } from '@/types/beehive';
import {
  findEmptyPosition,
  findVisibleEmptyPosition,
  getVisibleArea,
} from '@/utils/calculatePosition';

type UseBeehivePositionPropType = {
  containerRef: React.RefObject<HTMLDivElement | null>;
  scale: number;
};

export const useBeehivePosition = ({ containerRef, scale }: UseBeehivePositionPropType) => {
  /**
   * 맵 중앙에서 빈 위치 찾기
   */
  const findCenterPosition = useCallback(
    (hives: BeehiveType[]): { xDirection: number; yDirection: number } => {
      // 맵 중앙(1000, 1000)에서 시작하여 빈 위치 찾기
      const { x, y } = findEmptyPosition(hives, 1000, 1000); // 명시적으로 중앙 좌표 전달
      return { xDirection: x, yDirection: y };
    },
    [],
  );

  /**
   * 새 벌통을 위한 최적의 위치를 찾는 함수
   * 현재 화면에 보이는 영역 내에서 다른 벌통과 충돌하지 않는 위치를 찾음
   */
  const findOptimalPosition = useCallback(
    (hives: BeehiveType[]): { xDirection: number; yDirection: number } => {
      // 컨테이너가 없으면 맵 중앙 위치 반환
      if (!containerRef.current) {
        return { xDirection: 1000, yDirection: 1000 };
      }

      // 현재 보이는 화면 영역 계산
      const visibleArea = getVisibleArea(containerRef.current, scale);

      // 화면 중앙 좌표 계산
      const centerX = (visibleArea.minX + visibleArea.maxX) / 2;
      const centerY = (visibleArea.minY + visibleArea.maxY) / 2;

      // 화면 영역 내에서 빈 위치 찾기 - 중앙에서 시작
      const { x, y } = findVisibleEmptyPosition(hives, {
        ...visibleArea,
        centerX,
        centerY,
      });

      // 충돌 감지를 한 번 더 확인 (안전 장치)
      if (isPositionOccupied(x, y, hives)) {
        // 충돌이 감지되면 맵 전체에서 빈 위치 찾기
        return findCenterPosition(hives);
      }

      return { xDirection: x, yDirection: y };
    },
    [containerRef, scale, findCenterPosition],
  );

  return {
    findOptimalPosition,
    findCenterPosition,
  };
};
