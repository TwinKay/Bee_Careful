import type React from 'react';
import { useState, useRef, useCallback, useEffect } from 'react';
import type { BeehiveType } from '@/types/beehive';
import { useUpdateBeehive } from '@/apis/beehive';

// 벌통 간 충돌 감지 함수 추가
const calculateDistance = (x1: number, y1: number, x2: number, y2: number): number => {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};

type UseMapInteractionsPropsType = {
  containerRef: React.RefObject<HTMLDivElement | null>;
  hives: BeehiveType[];
  setHives: React.Dispatch<React.SetStateAction<BeehiveType[]>>;
  mapWidth: number;
  mapHeight: number;
  hiveSize: number;
};

const useMapInteractions = ({
  containerRef,
  hives,
  setHives,
  mapWidth,
  mapHeight,
  hiveSize,
}: UseMapInteractionsPropsType) => {
  // 모든 useState 훅을 최상위 레벨에 배치
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [autoScroll, setAutoScroll] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isLongPress, setIsLongPress] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [collisionDetected, setCollisionDetected] = useState(false);

  // 벌통 위치 업데이트를 위한 mutation 훅 추가
  const updateBeehiveMutation = useUpdateBeehive();

  // 마지막으로 드래그한 벌통의 위치 저장
  const lastDraggedHiveRef = useRef<{ id: number; x: number; y: number } | null>(null);
  // 드래그 종료 시 상태를 저장하기 위한 ref 추가
  const dragEndStateRef = useRef<{ id: number | null; isLongPress: boolean }>({
    id: null,
    isLongPress: false,
  });

  const longPressTimeoutRef = useRef<number | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const autoScrollThreshold = 50;
  const autoScrollSpeed = 10;
  const MIN_SCALE = 0.5;
  const MAX_SCALE = 2;
  const MIN_HIVE_DISTANCE = 120;

  // 두 벌통 간의 거리 계산 함수
  const calculateDistance2 = useCallback((hive1: BeehiveType, hive2: BeehiveType): number => {
    const dx = hive1.xDirection - hive2.xDirection;
    const dy = hive1.yDirection - hive2.yDirection;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // 충돌 감지 함수
  const detectCollision = useCallback(
    (hiveId: number, newX: number, newY: number): boolean => {
      return hives.some((otherHive) => {
        if (otherHive.beehiveId === hiveId) return false;

        const dx = newX - otherHive.xDirection;
        const dy = newY - otherHive.yDirection;
        const distance = Math.sqrt(dx * dx + dy * dy);

        return distance < MIN_HIVE_DISTANCE;
      });
    },
    [hives, MIN_HIVE_DISTANCE],
  );

  // 충돌 감지 및 위치 조정 함수
  const checkCollisionAndAdjust = useCallback(
    (hiveId: number, newX: number, newY: number): { x: number; y: number } => {
      for (const otherHive of hives) {
        if (otherHive.beehiveId === hiveId) continue;

        const distance = calculateDistance(newX, newY, otherHive.xDirection, otherHive.yDirection);

        if (distance < MIN_HIVE_DISTANCE) {
          const angle = Math.atan2(newY - otherHive.yDirection, newX - otherHive.xDirection);
          const adjustedX = otherHive.xDirection + Math.cos(angle) * MIN_HIVE_DISTANCE;
          const adjustedY = otherHive.yDirection + Math.sin(angle) * MIN_HIVE_DISTANCE;

          return { x: adjustedX, y: adjustedY };
        }
      }

      return { x: newX, y: newY };
    },
    [hives, MIN_HIVE_DISTANCE],
  );

  // 맵 중앙에 있는 벌통 위치로 스크롤
  const centerToHives = useCallback(() => {
    if (!containerRef.current) {
      return;
    }

    // 맵의 실제 중앙 좌표 사용 (2000x2000 맵의 중앙은 1000, 1000)
    const centerX = 1000;
    const centerY = 1000;

    // 컨테이너의 크기를 가져옵니다
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;

    // 스크롤 위치를 정확히 계산합니다
    // 스케일 값이 유효한지 확인
    const currentScale = scale > 0 ? scale : 1;

    const scrollLeft = centerX * currentScale - containerWidth / 2;
    const scrollTop = centerY * currentScale - containerHeight / 2;

    // 계산된 값이 유효한지 확인
    if (isNaN(scrollLeft) || isNaN(scrollTop)) {
      return;
    }

    // 스크롤 값이 음수가 되지 않도록 조정
    const finalScrollLeft = Math.max(0, scrollLeft);
    const finalScrollTop = Math.max(0, scrollTop);

    // scrollTo 메서드 사용 전 컨테이너가 여전히 유효한지 확인
    if (containerRef.current) {
      try {
        containerRef.current.scrollTo({
          left: finalScrollLeft,
          top: finalScrollTop,
          behavior: 'smooth',
        });
      } catch {
        // 대체 방법으로 직접 스크롤 위치 설정
        try {
          containerRef.current.scrollLeft = finalScrollLeft;
          containerRef.current.scrollTop = finalScrollTop;
        } catch {
          // 대체 스크롤 방법도 실패
        }
      }
    }
  }, [scale, containerRef]);

  // 자동 스크롤 체크 함수
  const checkAutoScroll = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      let scrollX = 0;
      let scrollY = 0;

      if (clientX - rect.left < autoScrollThreshold) {
        scrollX = -autoScrollSpeed;
      } else if (rect.right - clientX < autoScrollThreshold) {
        scrollX = autoScrollSpeed;
      }

      if (clientY - rect.top < autoScrollThreshold) {
        scrollY = -autoScrollSpeed;
      } else if (rect.bottom - clientY < autoScrollThreshold) {
        scrollY = autoScrollSpeed;
      }

      setAutoScroll({ x: scrollX, y: scrollY });
    },
    [autoScrollThreshold, autoScrollSpeed, containerRef],
  );

  // 드래그 시작 핸들러
  const handleDragStart = useCallback(
    (id: number, e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();

      setIsLongPress(false);
      setIsDragging(true);
      setCollisionDetected(false);

      const hive = hives.find((h) => h.beehiveId === id);
      if (!hive || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const scrollLeft = containerRef.current.scrollLeft;
      const scrollTop = containerRef.current.scrollTop;

      if (longPressTimeoutRef.current !== null) {
        window.clearTimeout(longPressTimeoutRef.current);
      }

      longPressTimeoutRef.current = window.setTimeout(() => {
        setIsLongPress(true);
        setDraggingId(id);
        // 드래그 상태 ref 업데이트
        dragEndStateRef.current = { id, isLongPress: true };

        if ('clientX' in e) {
          // 셀 중앙 기준으로 좌표 계산 수정
          const hiveScreenX = (hive.xDirection - hiveSize / 2) * scale - scrollLeft;
          const hiveScreenY = (hive.yDirection - hiveSize / 2) * scale - scrollTop;

          dragOffsetRef.current = {
            x: e.clientX - hiveScreenX - containerRect.left,
            y: e.clientY - hiveScreenY - containerRect.top,
          };
        } else if (e.touches && e.touches.length > 0) {
          const touch = e.touches[0];
          // 셀 중앙 기준으로 좌표 계산 수정
          const hiveScreenX = (hive.xDirection - hiveSize / 2) * scale - scrollLeft;
          const hiveScreenY = (hive.yDirection - hiveSize / 2) * scale - scrollTop;

          dragOffsetRef.current = {
            x: touch.clientX - hiveScreenX - containerRect.left,
            y: touch.clientY - hiveScreenY - containerRect.top,
          };
        }

        longPressTimeoutRef.current = null;
      }, 1000);
    },
    [hives, scale, containerRef, hiveSize],
  );

  // 드래그 핸들러
  const handleDrag = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (draggingId === null || !containerRef.current || !isLongPress) return;

      if ('touches' in e && e.touches.length > 1) return;

      let clientX, clientY;

      if ('clientX' in e) {
        clientX = e.clientX;
        clientY = e.clientY;
        // 롱프레스 상태일 때만 기본 동작 방지
        if (isLongPress) {
          e.preventDefault();
        }
      } else if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
        // 롱프레스 상태일 때만 기본 동작 방지
        if (isLongPress) {
          e.preventDefault();
        }
      } else {
        return;
      }

      checkAutoScroll(clientX, clientY);

      const containerRect = containerRef.current.getBoundingClientRect();
      const scrollLeft = containerRef.current.scrollLeft;
      const scrollTop = containerRef.current.scrollTop;

      // 셀 중앙 기준으로 좌표 계산 수정
      // 드래그 시 마우스/터치 위치에서 셀 중앙으로 좌표 계산
      const newX =
        (clientX - containerRect.left - dragOffsetRef.current.x + scrollLeft) / scale +
        hiveSize / 2;
      const newY =
        (clientY - containerRect.top - dragOffsetRef.current.y + scrollTop) / scale + hiveSize / 2;

      const clampedX = Math.max(hiveSize, Math.min(newX, mapWidth - hiveSize));
      const clampedY = Math.max(hiveSize, Math.min(newY, mapHeight - hiveSize));

      const hasCollision = detectCollision(draggingId, clampedX, clampedY);
      setCollisionDetected(hasCollision);

      const adjustedPosition = checkCollisionAndAdjust(draggingId, clampedX, clampedY);

      setHives((prev) =>
        prev.map((hive) =>
          hive.beehiveId === draggingId
            ? {
                ...hive,
                xDirection: adjustedPosition.x,
                yDirection: adjustedPosition.y,
                x: adjustedPosition.x,
                y: adjustedPosition.y,
              }
            : hive,
        ),
      );

      // 드래그 상태 ref 업데이트
      dragEndStateRef.current = { id: draggingId, isLongPress };
    },
    [
      draggingId,
      containerRef,
      isLongPress,
      checkAutoScroll,
      scale,
      mapWidth,
      mapHeight,
      hiveSize,
      setHives,
      detectCollision,
      checkCollisionAndAdjust,
    ],
  );

  // 벌통 위치 업데이트 함수 - 드래그 종료 핸들러와 분리
  const updateBeehivePosition = useCallback(
    (id: number) => {
      const draggedHive = hives.find((h) => h.beehiveId === id);

      if (draggedHive) {
        // 업데이트 전에 현재 위치 저장 (실패 시 복원용)
        lastDraggedHiveRef.current = {
          id: draggedHive.beehiveId,
          x: draggedHive.xDirection,
          y: draggedHive.yDirection,
        };
        try {
          // 서버에 위치 업데이트 요청
          updateBeehiveMutation.mutate(
            {
              beeHiveId: draggedHive.beehiveId,
              nickname: draggedHive.nickname,
              xDirection: draggedHive.xDirection,
              yDirection: draggedHive.yDirection,
            },
            {
              onSuccess: (data) => {
                console.log('벌통 위치 업데이트 성공:', data);
                // 성공 시 참조 초기화
                lastDraggedHiveRef.current = null;
              },
              onError: (error) => {
                console.error('벌통 위치 업데이트 실패:', error);

                // 실패 시 UI 상의 위치를 원래대로 되돌림
                setHives((prev) =>
                  prev.map((hive) =>
                    hive.beehiveId === lastDraggedHiveRef.current?.id
                      ? {
                          ...hive,
                          xDirection: lastDraggedHiveRef.current.x,
                          yDirection: lastDraggedHiveRef.current.y,
                          x: lastDraggedHiveRef.current.x,
                          y: lastDraggedHiveRef.current.y,
                        }
                      : hive,
                  ),
                );
              },
            },
          );
          console.log('updateBeehiveMutation 호출 완료');
        } catch (error) {
          console.error('updateBeehiveMutation 호출 중 예외 발생:', error);
        }
      } else {
        console.warn('드래그된 벌통을 찾을 수 없음:', id);
      }
    },
    [hives, updateBeehiveMutation, setHives],
  );

  // 드래그 종료 핸들러
  const handleDragEnd = useCallback(() => {
    if (longPressTimeoutRef.current !== null) {
      window.clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }

    // 저장된 드래그 상태 가져오기
    const { id, isLongPress: wasLongPress } = dragEndStateRef.current;

    // 드래그 중이던 벌통이 있고 실제로 위치가 변경되었다면 서버에 업데이트
    if (id !== null && wasLongPress) {
      updateBeehivePosition(id);
    }

    // 상태 초기화 (이제 API 호출 후에 초기화)
    setDraggingId(null);
    setIsLongPress(false);
    setAutoScroll({ x: 0, y: 0 });
    setCollisionDetected(false);
    dragEndStateRef.current = { id: null, isLongPress: false };

    setTimeout(() => {
      setIsDragging(false);
    }, 50);
  }, [updateBeehivePosition]);

  // 개선된 줌 핸들러 - 정적 줌으로 변경
  const handleZoom = useCallback(
    (newScale: number, clientX?: number, clientY?: number) => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();

      // 이전 스케일 및 스크롤 위치 저장
      const oldScale = scale;
      const oldScrollLeft = container.scrollLeft;
      const oldScrollTop = container.scrollTop;

      // 줌 중심점 계산 (마우스 위치 또는 화면 중앙)
      const pointX = clientX !== undefined ? clientX - rect.left : container.clientWidth / 2;
      const pointY = clientY !== undefined ? clientY - rect.top : container.clientHeight / 2;

      // 줌 중심점의 맵 좌표 계산 (이전 스케일 기준)
      const mapX = (oldScrollLeft + pointX) / oldScale;
      const mapY = (oldScrollTop + pointY) / oldScale;

      // 스케일 적용 (제한된 범위 내에서)
      const clampedScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, newScale));

      // 새 스케일로 스크롤 위치 계산
      const newScrollLeft = mapX * clampedScale - pointX;
      const newScrollTop = mapY * clampedScale - pointY;

      // DOM 업데이트를 한 번만 수행하기 위해 requestAnimationFrame 사용
      requestAnimationFrame(() => {
        // 스케일과 스크롤 위치를 동시에 업데이트
        setScale(clampedScale);

        // 약간의 지연 후 스크롤 위치 조정 (스케일 변경이 반영된 후)
        requestAnimationFrame(() => {
          if (containerRef.current) {
            containerRef.current.scrollLeft = newScrollLeft;
            containerRef.current.scrollTop = newScrollTop;
          }
        });
      });
    },
    [scale, MIN_SCALE, MAX_SCALE, containerRef],
  );

  // 맵 중앙 좌표를 가져오는 함수
  const getMapCenter = useCallback(() => {
    if (!containerRef.current) return { x: 1000, y: 1000 }; // 기본값을 맵 중앙으로 변경

    const container = containerRef.current;
    const viewportWidth = container.clientWidth;
    const viewportHeight = container.clientHeight;

    // 뷰포트 중앙의 스크롤 위치
    const centerScrollX = container.scrollLeft + viewportWidth / 2;
    const centerScrollY = container.scrollTop + viewportHeight / 2;

    // 스크롤 위치를 맵 좌표로 변환 (스케일 고려)
    const mapX = centerScrollX / scale;
    const mapY = centerScrollY / scale;

    return { x: mapX, y: mapY };
  }, [scale, containerRef]);

  // 마우스 휠 이벤트 핸들러 - 정적 줌으로 변경
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isZooming = false;
    let zoomTimeout: number | null = null;

    const handleWheelEvent = (e: WheelEvent) => {
      e.preventDefault();
      console.log('handleWheelEvent called');

      // 디바운스 처리
      if (isZooming) {
        if (zoomTimeout !== null) {
          window.clearTimeout(zoomTimeout);
        }
        zoomTimeout = window.setTimeout(() => {
          isZooming = false;
        }, 200);
        return;
      }

      isZooming = true;

      // 휠 방향에 따라 줌 인/아웃
      if (e.deltaY < 0) {
        // 줌 인 (20% 증가)
        handleZoom(scale * 1.2, e.clientX, e.clientY);
      } else {
        // 줌 아웃 (20% 감소)
        handleZoom(scale / 1.2, e.clientX, e.clientY);
      }

      zoomTimeout = window.setTimeout(() => {
        isZooming = false;
      }, 200);
    };

    container.addEventListener('wheel', handleWheelEvent, { passive: false });

    return () => {
      if (zoomTimeout !== null) {
        window.clearTimeout(zoomTimeout);
      }
      container.removeEventListener('wheel', handleWheelEvent);
    };
  }, [scale, handleZoom, containerRef]);

  // 터치 이벤트 처리 - 핀치 줌을 고정 스케일로 변경
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 핀치 줌 상태 관리 변수
    let isPinching = false;
    let lastPinchDistance = 0;
    let lastPinchTime = 0;
    let lastZoomDirection: 'in' | 'out' | null = null;

    // 터치 이벤트 처리를 위한 함수들
    const handleTouchMoveInEffect = (e: TouchEvent) => {
      // 핀치 줌 처리 (2개 손가락)
      if (e.touches.length === 2) {
        // 핀치 줌 중에는 스크롤 방지
        e.preventDefault();

        // 두 손가락 사이의 거리 계산
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // 두 손가락의 중간점 계산
        const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

        // 처음 핀치 시작할 때
        if (!isPinching) {
          isPinching = true;
          lastPinchDistance = distance;
          lastPinchTime = Date.now();
          return;
        }

        // 너무 빠른 연속 줌 방지 (100ms 간격)
        const now = Date.now();
        if (now - lastPinchTime < 10) return;

        // 핀치 거리 변화가 충분히 클 때만 줌 처리 (10px 이상)
        const pinchDelta = distance - lastPinchDistance;
        if (Math.abs(pinchDelta) < 10) return;

        // 핀치 방향 감지
        const zoomDirection = pinchDelta > 0 ? 'in' : 'out';

        // 방향이 바뀌었거나 마지막 줌으로부터 충분한 시간이 지났을 때만 줌 실행
        if (zoomDirection !== lastZoomDirection || now - lastPinchTime > 300) {
          if (zoomDirection === 'in') {
            // 줌 인 (20% 증가)
            handleZoom(scale * 1.15, centerX, centerY);
          } else {
            // 줌 아웃 (20% 감소)
            handleZoom(scale / 1.15, centerX, centerY);
          }

          lastZoomDirection = zoomDirection;
          lastPinchTime = now;
          lastPinchDistance = distance;
        }
        return;
      }

      // 롱프레스 후 벌통 드래그 처리
      if (draggingId !== null && isLongPress && e.touches.length === 1) {
        e.preventDefault(); // 롱프레스 벌통 드래그 중일 때 스크롤 방지
        e.stopPropagation();

        const touch = e.touches[0];

        if (!containerRef.current) return;

        checkAutoScroll(touch.clientX, touch.clientY);

        const containerRect = containerRef.current.getBoundingClientRect();
        const scrollLeft = containerRef.current.scrollLeft;
        const scrollTop = containerRef.current.scrollTop;

        // 셀 중앙 기준으로 좌표 계산 수정
        const newX =
          (touch.clientX - containerRect.left - dragOffsetRef.current.x + scrollLeft) / scale +
          hiveSize / 2;
        const newY =
          (touch.clientY - containerRect.top - dragOffsetRef.current.y + scrollTop) / scale +
          hiveSize / 2;

        const clampedX = Math.max(hiveSize, Math.min(newX, mapWidth - hiveSize));
        const clampedY = Math.max(hiveSize, Math.min(newY, mapHeight - hiveSize));

        const hasCollision = detectCollision(draggingId, clampedX, clampedY);
        setCollisionDetected(hasCollision);

        const adjustedPosition = checkCollisionAndAdjust(draggingId, clampedX, clampedY);

        setHives((prev) =>
          prev.map((hive) =>
            hive.beehiveId === draggingId
              ? {
                  ...hive,
                  xDirection: adjustedPosition.x,
                  yDirection: adjustedPosition.y,
                  x: adjustedPosition.x,
                  y: adjustedPosition.y,
                }
              : hive,
          ),
        );

        // 드래그 상태 ref 업데이트
        dragEndStateRef.current = { id: draggingId, isLongPress };
      }
      // 일반 터치 스크롤은 브라우저의 기본 동작에 맡김 (preventDefault 호출 안 함)
    };

    // touchstart 이벤트 핸들러
    const handleTouchStartInEffect = (e: TouchEvent) => {
      // 핀치 줌 상태 초기화
      isPinching = false;
      lastZoomDirection = null;

      // 2개 손가락으로 터치했을 때 핀치 줌 시작
      if (e.touches.length === 2) {
        // 기존 벌통 드래그 취소
        if (draggingId !== null) {
          // 드래그 상태 ref 초기화
          dragEndStateRef.current = { id: null, isLongPress: false };

          setDraggingId(null);
          setIsLongPress(false);
          if (longPressTimeoutRef.current !== null) {
            window.clearTimeout(longPressTimeoutRef.current);
            longPressTimeoutRef.current = null;
          }
        }
      }
    };

    // touchend 이벤트 핸들러
    const handleTouchEndInEffect = (e: TouchEvent) => {
      // 핀치 줌 종료
      if (e.touches.length < 2) {
        isPinching = false;
        lastZoomDirection = null;
      }

      // 드래그 종료 - 상태를 초기화하지 않고 handleDragEnd 함수를 호출
      if (e.touches.length === 0) {
        // 여기서 상태를 초기화하지 않고 handleDragEnd 함수에서 처리
        handleDragEnd();
      }
    };

    // passive 옵션에 따라 다르게 이벤트 리스너 등록
    // touchmove는 preventDefault를 사용해야 하므로 non-passive로 등록
    container.addEventListener('touchmove', handleTouchMoveInEffect, { passive: false });
    container.addEventListener('touchstart', handleTouchStartInEffect, { passive: true });
    container.addEventListener('touchend', handleTouchEndInEffect, { passive: true });
    container.addEventListener('touchcancel', handleTouchEndInEffect, { passive: true });

    return () => {
      // 이벤트 리스너 제거
      container.removeEventListener('touchmove', handleTouchMoveInEffect);
      container.removeEventListener('touchstart', handleTouchStartInEffect);
      container.removeEventListener('touchend', handleTouchEndInEffect);
      container.removeEventListener('touchcancel', handleTouchEndInEffect);
    };
  }, [
    draggingId,
    scale,
    handleZoom,
    checkAutoScroll,
    isLongPress,
    containerRef,
    mapWidth,
    mapHeight,
    hiveSize,
    setHives,
    detectCollision,
    checkCollisionAndAdjust,
    handleDragEnd,
  ]);

  // 자동 스크롤 효과
  useEffect(() => {
    if (autoScroll.x === 0 && autoScroll.y === 0) return;

    const interval = setInterval(() => {
      if (draggingId !== null) {
        setHives((prev) => {
          const currentHive = prev.find((h) => h.beehiveId === draggingId);
          if (!currentHive) return prev;

          const newX = currentHive.xDirection + autoScroll.x / scale;
          const newY = currentHive.yDirection + autoScroll.y / scale;

          const clampedX = Math.max(hiveSize, Math.min(newX, mapWidth - hiveSize));
          const clampedY = Math.max(hiveSize, Math.min(newY, mapHeight - hiveSize));

          const hasCollision = detectCollision(draggingId, clampedX, clampedY);
          setCollisionDetected(hasCollision);

          // 드래그 상태 ref 업데이트
          dragEndStateRef.current = { id: draggingId, isLongPress: true };

          return prev.map((hive) => {
            if (hive.beehiveId !== draggingId) return hive;

            const newX = hive.xDirection + autoScroll.x / scale;
            const newY = hive.yDirection + autoScroll.y / scale;

            const clampedX = Math.max(hiveSize, Math.min(newX, mapWidth - hiveSize));
            const clampedY = Math.max(hiveSize, Math.min(newY, mapHeight - hiveSize));

            const adjustedPosition = checkCollisionAndAdjust(hive.beehiveId, clampedX, clampedY);

            return {
              ...hive,
              xDirection: adjustedPosition.x,
              yDirection: adjustedPosition.y,
              x: adjustedPosition.x,
              y: adjustedPosition.y,
            };
          });
        });
      }

      if (containerRef.current) {
        containerRef.current.scrollLeft += autoScroll.x;
        containerRef.current.scrollTop += autoScroll.y;
      }
    }, 16);

    return () => clearInterval(interval);
  }, [
    autoScroll,
    draggingId,
    scale,
    setHives,
    containerRef,
    mapWidth,
    mapHeight,
    hiveSize,
    detectCollision,
    checkCollisionAndAdjust,
  ]);

  // 초기 벌통 배치 시 충돌 해결
  useEffect(() => {
    const resolveInitialCollisions = () => {
      let hasCollisions = false;
      let iterations = 0;
      const maxIterations = 10;

      do {
        hasCollisions = false;
        const newPositions: Record<number, { x: number; y: number }> = {};

        for (let i = 0; i < hives.length; i++) {
          for (let j = i + 1; j < hives.length; j++) {
            const hive1 = hives[i];
            const hive2 = hives[j];
            const distance = calculateDistance2(hive1, hive2);

            if (distance < MIN_HIVE_DISTANCE) {
              hasCollisions = true;

              const dx = hive2.xDirection - hive1.xDirection;
              const dy = hive2.yDirection - hive1.yDirection;
              const angle = Math.atan2(dy, dx);

              const moveDistance = (MIN_HIVE_DISTANCE - distance) / 2;

              const move1X = -Math.cos(angle) * moveDistance;
              const move1Y = -Math.sin(angle) * moveDistance;
              const move2X = Math.cos(angle) * moveDistance;
              const move2Y = Math.sin(angle) * moveDistance;

              const newPos1X = (newPositions[hive1.beehiveId]?.x || hive1.xDirection) + move1X;
              const newPos1Y = (newPositions[hive1.beehiveId]?.y || hive1.yDirection) + move1Y;
              const newPos2X = (newPositions[hive2.beehiveId]?.x || hive2.xDirection) + move2X;
              const newPos2Y = (newPositions[hive2.beehiveId]?.y || hive2.yDirection) + move2Y;

              const clampedPos1X = Math.max(hiveSize, Math.min(newPos1X, mapWidth - hiveSize));
              const clampedPos1Y = Math.max(hiveSize, Math.min(newPos1Y, mapHeight - hiveSize));
              const clampedPos2X = Math.max(hiveSize, Math.min(newPos2X, mapWidth - hiveSize));
              const clampedPos2Y = Math.max(hiveSize, Math.min(newPos2Y, mapHeight - hiveSize));

              newPositions[hive1.beehiveId] = { x: clampedPos1X, y: clampedPos1Y };
              newPositions[hive2.beehiveId] = { x: clampedPos2X, y: clampedPos2Y };
            }
          }
        }

        if (Object.keys(newPositions).length > 0) {
          setHives((prev) =>
            prev.map((hive) => {
              const newPos = newPositions[hive.beehiveId];
              if (!newPos) return hive;

              return {
                ...hive,
                xDirection: newPos.x,
                yDirection: newPos.y,
                x: newPos.x,
                y: newPos.y,
              };
            }),
          );
        }

        iterations++;
      } while (hasCollisions && iterations < maxIterations);
    };

    if (hives.length > 1) {
      resolveInitialCollisions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    scale,
    draggingId,
    isLongPress,
    isDragging,
    collisionDetected,
    autoScroll,
    handleZoom,
    handleDragStart,
    handleDrag,
    handleDragEnd,
    centerToHives,
    getMapCenter,
  };
};

export default useMapInteractions;
