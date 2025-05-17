import type React from 'react';
import { useState, useRef, useCallback, useEffect } from 'react';
import type { BeehiveType } from '@/types/beehive';

// 벌통 간 충돌 감지
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
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [autoScroll, setAutoScroll] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [pinchStartDist, setPinchStartDist] = useState<number | null>(null);
  const [pinchStartScale, setPinchStartScale] = useState<number>(1);
  const [isLongPress, setIsLongPress] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [collisionDetected, setCollisionDetected] = useState(false);

  const longPressTimeoutRef = useRef<number | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const isZoomingRef = useRef(false);

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
    if (!containerRef.current) return;

    const centerX = 900;
    const centerY = 900;

    const scrollLeft = centerX * scale - containerRef.current.clientWidth / 2;
    const scrollTop = centerY * scale - containerRef.current.clientHeight / 2;

    containerRef.current.scrollLeft = Math.max(0, scrollLeft);
    containerRef.current.scrollTop = Math.max(0, scrollTop);
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

        if ('clientX' in e) {
          const hiveScreenX = hive.xDirection * scale - scrollLeft;
          const hiveScreenY = hive.yDirection * scale - scrollTop;

          dragOffsetRef.current = {
            x: e.clientX - hiveScreenX - containerRect.left,
            y: e.clientY - hiveScreenY - containerRect.top,
          };
        } else if (e.touches && e.touches.length > 0) {
          const touch = e.touches[0];
          const hiveScreenX = hive.xDirection * scale - scrollLeft;
          const hiveScreenY = hive.yDirection * scale - scrollTop;

          dragOffsetRef.current = {
            x: touch.clientX - hiveScreenX - containerRect.left,
            y: touch.clientY - hiveScreenY - containerRect.top,
          };
        }

        longPressTimeoutRef.current = null;
      }, 1000);
    },
    [hives, scale, containerRef],
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

      const newX = (clientX - containerRect.left - dragOffsetRef.current.x + scrollLeft) / scale;
      const newY = (clientY - containerRect.top - dragOffsetRef.current.y + scrollTop) / scale;

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

  // 드래그 종료 핸들러
  const handleDragEnd = useCallback(() => {
    if (longPressTimeoutRef.current !== null) {
      window.clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }

    setDraggingId(null);
    setIsLongPress(false);
    setAutoScroll({ x: 0, y: 0 });
    setCollisionDetected(false);

    setTimeout(() => {
      setIsDragging(false);
    }, 50);
  }, []);

  // 개선된 줌 핸들러
  const handleZoom = useCallback(
    (newScale: number, clientX?: number, clientY?: number) => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();

      const oldScale = scale;
      const oldScrollLeft = container.scrollLeft;
      const oldScrollTop = container.scrollTop;

      const pointX = clientX !== undefined ? clientX - rect.left : container.clientWidth / 2;
      const pointY = clientY !== undefined ? clientY - rect.top : container.clientHeight / 2;

      const mapX = (oldScrollLeft + pointX) / oldScale;
      const mapY = (oldScrollTop + pointY) / oldScale;

      const clampedScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, newScale));

      const newScrollLeft = mapX * clampedScale - pointX;
      const newScrollTop = mapY * clampedScale - pointY;

      requestAnimationFrame(() => {
        setScale(clampedScale);

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
    if (!containerRef.current) return { x: 10, y: 10 };

    const container = containerRef.current;
    const viewportWidth = container.clientWidth;
    const viewportHeight = container.clientHeight;

    const centerScrollX = container.scrollLeft + viewportWidth / 2;
    const centerScrollY = container.scrollTop + viewportHeight / 2;

    const mapX = centerScrollX / scale;
    const mapY = centerScrollY / scale;

    return { x: mapX, y: mapY };
  }, [scale, containerRef]);

  // 마우스 휠 이벤트 핸들러
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isZooming = false;
    let zoomTimeout: number | null = null;

    const handleWheelEvent = (e: WheelEvent) => {
      // Ctrl 키가 눌려있을 때만 줌 동작 수행
      if (e.ctrlKey) {
        e.preventDefault();

        if (isZooming) {
          if (zoomTimeout !== null) {
            window.clearTimeout(zoomTimeout);
          }

          zoomTimeout = window.setTimeout(() => {
            isZooming = false;
            zoomTimeout = null;
          }, 50);

          return;
        }

        isZooming = true;

        const delta = -e.deltaY * 0.0005;
        const newScale = scale * (1 + delta * 7);

        handleZoom(newScale, e.clientX, e.clientY);

        zoomTimeout = window.setTimeout(() => {
          isZooming = false;
          zoomTimeout = null;
        }, 50);
      }
    };

    container.addEventListener('wheel', handleWheelEvent, { passive: false });

    return () => {
      if (zoomTimeout !== null) {
        window.clearTimeout(zoomTimeout);
      }
      container.removeEventListener('wheel', handleWheelEvent);
    };
  }, [scale, handleZoom, containerRef]);

  // 터치 이벤트 처리
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 핀치 줌 상태
    let isPinching = false;
    // 마지막 터치 위치 저장
    let lastTouchX = 0;
    let lastTouchY = 0;
    // 터치 시작 위치 저장
    let startTouchX = 0;
    let startTouchY = 0;
    // 터치 이동 거리 임계값 (이 값보다 작으면 클릭으로 간주)
    const TOUCH_MOVE_THRESHOLD = 10;

    const handleTouchStart = (e: TouchEvent) => {
      // 2개 손가락으로 터치했을 때 핀치 줌 시작
      if (e.touches.length === 2) {
        isPinching = true;

        // 기존 벌통 드래그 취소
        if (draggingId !== null) {
          setDraggingId(null);
          setIsLongPress(false);
          if (longPressTimeoutRef.current !== null) {
            window.clearTimeout(longPressTimeoutRef.current);
            longPressTimeoutRef.current = null;
          }
        }

        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        setPinchStartDist(distance);
        setPinchStartScale(scale);
      } else if (e.touches.length === 1) {
        // 단일 터치 시작 위치 저장
        lastTouchX = e.touches[0].clientX;
        lastTouchY = e.touches[0].clientY;
        startTouchX = e.touches[0].clientX;
        startTouchY = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      // 핀치 줌 처리
      if (isPinching && e.touches.length === 2 && pinchStartDist !== null) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        const scaleFactor = distance / pinchStartDist;
        const maxScaleFactor = 1.2;
        const limitedScaleFactor = Math.max(
          1 / maxScaleFactor,
          Math.min(maxScaleFactor, scaleFactor),
        );
        const newScale = pinchStartScale * limitedScaleFactor;

        const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

        if (!isZoomingRef.current) {
          isZoomingRef.current = true;
          requestAnimationFrame(() => {
            handleZoom(newScale, centerX, centerY);
            isZoomingRef.current = false;
          });
        }
        return;
      }

      // 롱프레스 후 벌통 드래그 처리
      if (draggingId !== null && isLongPress && e.touches.length === 1) {
        // 롱프레스 벌통 드래그 중일 때만 preventDefault 호출
        e.preventDefault();

        const touch = e.touches[0];
        if (!containerRef.current) return;

        checkAutoScroll(touch.clientX, touch.clientY);

        const containerRect = containerRef.current.getBoundingClientRect();
        const scrollLeft = containerRef.current.scrollLeft;
        const scrollTop = containerRef.current.scrollTop;

        const newX =
          (touch.clientX - containerRect.left - dragOffsetRef.current.x + scrollLeft) / scale;
        const newY =
          (touch.clientY - containerRect.top - dragOffsetRef.current.y + scrollTop) / scale;

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
        return;
      }

      // 일반 터치 스크롤 처리 (단일 터치)
      if (e.touches.length === 1 && !isLongPress && !draggingId) {
        const touch = e.touches[0];
        const deltaX = lastTouchX - touch.clientX;
        const deltaY = lastTouchY - touch.clientY;

        // 이동 거리가 임계값보다 크면 스크롤로 간주
        const totalDeltaX = startTouchX - touch.clientX;
        const totalDeltaY = startTouchY - touch.clientY;
        const totalDelta = Math.sqrt(totalDeltaX * totalDeltaX + totalDeltaY * totalDeltaY);

        if (totalDelta > TOUCH_MOVE_THRESHOLD) {
          // 스크롤 처리
          if (containerRef.current) {
            containerRef.current.scrollLeft += deltaX;
            containerRef.current.scrollTop += deltaY;
          }
        }

        // 마지막 터치 위치 업데이트
        lastTouchX = touch.clientX;
        lastTouchY = touch.clientY;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      // 핀치 줌 종료
      if (e.touches.length < 2) {
        isPinching = false;
        setPinchStartDist(null);
      }

      // 드래그 종료
      if (e.touches.length === 0) {
        setDraggingId(null);
        setAutoScroll({ x: 0, y: 0 });
        setIsLongPress(false);
        setCollisionDetected(false);

        if (longPressTimeoutRef.current !== null) {
          window.clearTimeout(longPressTimeoutRef.current);
          longPressTimeoutRef.current = null;
        }
      }
    };

    // 이벤트 리스너 등록 - touchmove만 non-passive로 설정
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    container.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [
    draggingId,
    pinchStartDist,
    pinchStartScale,
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
