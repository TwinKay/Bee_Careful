import type { BeehiveType } from '@/types/beehive';

// 벌통 간 최소 거리 (픽셀 단위)
export const MIN_DISTANCE = 120; // 벌통 크기(100) + 여백(20)

// 두 벌통 간의 거리 계산
export const calculateDistance = (hive1: BeehiveType, hive2: BeehiveType): number => {
  return Math.sqrt(
    Math.pow(hive1.xDirection - hive2.xDirection, 2) +
      Math.pow(hive1.yDirection - hive2.yDirection, 2),
  );
};

// 위치가 다른 벌통과 충돌하는지 확인
export const isPositionOccupied = (
  x: number,
  y: number,
  hives: BeehiveType[],
  currentHiveId?: number,
): boolean => {
  return hives.some((hive) => {
    // 자기 자신은 검사에서 제외
    if (currentHiveId && hive.beehiveId === currentHiveId) {
      return false;
    }

    // 두 지점 간의 거리 계산
    const distance = Math.sqrt(Math.pow(hive.xDirection - x, 2) + Math.pow(hive.yDirection - y, 2));

    // 최소 거리보다 가까우면 충돌로 판단
    return distance < MIN_DISTANCE;
  });
};

// findEmptyPosition 함수를 다음과 같이 수정합니다.
export const findEmptyPosition = (
  hives: BeehiveType[],
  startX = 1000,
  startY = 1000,
): { x: number; y: number } => {
  // 시작 위치가 비어 있으면 그대로 반환
  if (!isPositionOccupied(startX, startY, hives)) {
    return { x: startX, y: startY };
  }

  // 나선형으로 탐색
  const step = MIN_DISTANCE * 1.2; // 탐색 간격을 더 크게 설정 (1.2배)
  let x = startX;
  let y = startY;
  let direction = 0; // 0: 오른쪽, 1: 아래, 2: 왼쪽, 3: 위
  let segmentLength = 1;
  let segmentPassed = 0;

  for (let i = 0; i < 2000; i++) {
    // 최대 시도 횟수 증가 (1000 -> 2000)
    // 이동 방향에 따라 좌표 조정
    switch (direction) {
      case 0: // 오른쪽
        x += step;
        break;
      case 1: // 아래
        y += step;
        break;
      case 2: // 왼쪽
        x -= step;
        break;
      case 3: // 위
        y -= step;
        break;
    }

    segmentPassed++;

    // 현재 세그먼트를 다 지나갔는지 확인
    if (segmentPassed === segmentLength) {
      segmentPassed = 0;
      direction = (direction + 1) % 4;

      // 좌/우 방향이 끝나면 세그먼트 길이 증가
      if (direction === 0 || direction === 2) {
        segmentLength++;
      }
    }

    // 맵 영역 내에 있는지 확인 (100~1900 범위로 제한)
    if (x < 100 || x > 1900 || y < 100 || y > 1900) {
      continue;
    }

    // 현재 위치가 비어 있는지 확인
    if (!isPositionOccupied(x, y, hives)) {
      return { x, y };
    }
  }

  // 기본값 반환 (최악의 경우) - 맵 가장자리 쪽으로 설정
  return { x: 200 + Math.random() * 1600, y: 200 + Math.random() * 1600 };
};

// findVisibleEmptyPosition 함수를 다음과 같이 수정합니다.
export const findVisibleEmptyPosition = (
  hives: BeehiveType[],
  visibleArea: { minX: number; maxX: number; minY: number; maxY: number },
): { x: number; y: number } => {
  // 화면 중앙 좌표 계산
  const centerX = (visibleArea.minX + visibleArea.maxX) / 2;
  const centerY = (visibleArea.minY + visibleArea.maxY) / 2;

  // 화면 영역 내에서 격자 탐색
  const gridSize = MIN_DISTANCE * 1.2; // 격자 크기
  const width = visibleArea.maxX - visibleArea.minX;
  const height = visibleArea.maxY - visibleArea.minY;

  // 화면 영역이 너무 작으면 중앙에서 시작하는 나선형 탐색 사용
  if (width < gridSize * 3 || height < gridSize * 3) {
    return findEmptyPosition(hives, centerX, centerY);
  }

  // 격자 탐색 범위 계산 (화면 영역보다 약간 작게)
  const startX = visibleArea.minX + gridSize;
  const endX = visibleArea.maxX - gridSize;
  const startY = visibleArea.minY + gridSize;
  const endY = visibleArea.maxY - gridSize;

  // 중앙에서 시작하여 바깥쪽으로 나선형 탐���
  for (let radius = 0; radius <= Math.max(width, height) / 2; radius += gridSize) {
    // 원 둘레를 따라 여러 지점 확인
    for (let angle = 0; angle < 360; angle += 30) {
      const radian = (angle * Math.PI) / 180;
      const x = centerX + radius * Math.cos(radian);
      const y = centerY + radius * Math.sin(radian);

      // 화면 영역 내에 있고 비어 있는지 확인
      if (
        x >= startX &&
        x <= endX &&
        y >= startY &&
        y <= endY &&
        !isPositionOccupied(x, y, hives)
      ) {
        return { x, y };
      }
    }
  }

  // 화면 내에서 적절한 위치를 찾지 못하면 중앙에서 시작하는 나선형 탐색 사용
  return findEmptyPosition(hives, centerX, centerY);
};

// 화면 좌표를 실제 맵 좌표로 변환
export const screenToMapCoordinates = (
  clientX: number,
  clientY: number,
  container: HTMLElement,
  scale: number,
): { x: number; y: number } => {
  const rect = container.getBoundingClientRect();
  const scrollLeft = container.scrollLeft;
  const scrollTop = container.scrollTop;

  const x = (clientX - rect.left + scrollLeft) / scale;
  const y = (clientY - rect.top + scrollTop) / scale;

  return { x, y };
};

// 현재 보이는 화면 영역 계산
export const getVisibleArea = (
  container: HTMLElement,
  scale: number,
): { minX: number; maxX: number; minY: number; maxY: number } => {
  const scrollLeft = container.scrollLeft;
  const scrollTop = container.scrollTop;
  const width = container.clientWidth;
  const height = container.clientHeight;

  return {
    minX: scrollLeft / scale,
    maxX: (scrollLeft + width) / scale,
    minY: scrollTop / scale,
    maxY: (scrollTop + height) / scale,
  };
};
