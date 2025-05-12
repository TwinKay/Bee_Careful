import { useState, useRef, useCallback, useEffect } from 'react';
import type { HiveType } from '@/components/beehive/BeehiveMap';

type UseMapInteractionsPropsType = {
  containerRef: React.RefObject<HTMLDivElement | null>; // null을 허용하도록 변경
  hives: HiveType[];
  setHives: React.Dispatch<React.SetStateAction<HiveType[]>>;
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

  const longPressTimeoutRef = useRef<number | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const autoScrollThreshold = 50;
  const autoScrollSpeed = 10;
  const MIN_SCALE = 0.5;
  const MAX_SCALE = 2;

  // 맵 중앙에 있는 벌통 위치(900, 900 주변)로 스크롤
  const centerToHives = useCallback(() => {
    if (!containerRef.current) return;

    const centerX = 900;
    const centerY = 900;

    const scrollLeft = centerX * scale - containerRef.current.clientWidth / 2;
    const scrollTop = centerY * scale - containerRef.current.clientHeight / 2;

    // 스크롤 값이 음수가 되지 않도록 조정
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
      e.preventDefault(); // 텍스트 선택 방지

      // 롱프레스 상태 초기화
      setIsLongPress(false);

      const hive = hives.find((h) => h.id === id);
      if (!hive || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const scrollLeft = containerRef.current.scrollLeft;
      const scrollTop = containerRef.current.scrollTop;

      // 롱프레스 타이머 설정
      if (longPressTimeoutRef.current !== null) {
        window.clearTimeout(longPressTimeoutRef.current);
      }

      longPressTimeoutRef.current = window.setTimeout(() => {
        setIsLongPress(true);
        setDraggingId(id);

        // 롱프레스가 확인되면 드래그 오프셋 계산
        if ('clientX' in e) {
          const hiveScreenX = hive.x * scale - scrollLeft;
          const hiveScreenY = hive.y * scale - scrollTop;

          dragOffsetRef.current = {
            x: e.clientX - hiveScreenX - containerRect.left,
            y: e.clientY - hiveScreenY - containerRect.top,
          };
        } else if (e.touches && e.touches.length > 0) {
          const touch = e.touches[0];
          const hiveScreenX = hive.x * scale - scrollLeft;
          const hiveScreenY = hive.y * scale - scrollTop;

          dragOffsetRef.current = {
            x: touch.clientX - hiveScreenX - containerRect.left,
            y: touch.clientY - hiveScreenY - containerRect.top,
          };
        }

        longPressTimeoutRef.current = null;
      }, 1000); // 1초 롱프레스
    },
    [hives, scale, containerRef],
  );

  // 드래그 핸들러
  const handleDrag = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      // 롱프레스가 아니면 드래그 처리 안 함
      if (draggingId === null || !containerRef.current || !isLongPress) return;

      // 핀치 줌 동작 중에는 드래그 처리하지 않음
      if ('touches' in e && e.touches.length > 1) return;

      let clientX, clientY;

      if ('clientX' in e) {
        clientX = e.clientX;
        clientY = e.clientY;
        e.preventDefault();
      } else if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
        // 터치 드래그 중에는 기본 동작 방지
        e.preventDefault();
        e.stopPropagation();
      } else {
        return;
      }

      checkAutoScroll(clientX, clientY);

      const containerRect = containerRef.current.getBoundingClientRect();
      const scrollLeft = containerRef.current.scrollLeft;
      const scrollTop = containerRef.current.scrollTop;

      // 경계 체크를 제거하고 직접 계산
      const newX = (clientX - containerRect.left - dragOffsetRef.current.x + scrollLeft) / scale;
      const newY = (clientY - containerRect.top - dragOffsetRef.current.y + scrollTop) / scale;

      // 맵 경계 내로 제한만 수행
      const clampedX = Math.max(hiveSize / 2, Math.min(newX, mapWidth - hiveSize / 2));
      const clampedY = Math.max(hiveSize / 2, Math.min(newY, mapHeight - hiveSize / 2));

      setHives((prev) =>
        prev.map((hive) => (hive.id === draggingId ? { ...hive, x: clampedX, y: clampedY } : hive)),
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
    ],
  );

  // 드래그 종료 핸들러
  const handleDragEnd = useCallback(() => {
    // 롱프레스 타이머 제거
    if (longPressTimeoutRef.current !== null) {
      window.clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }

    setDraggingId(null);
    setIsLongPress(false);
    setAutoScroll({ x: 0, y: 0 });
  }, []);

  // 개선된 줌 핸들러
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
    if (!containerRef.current) return { x: 10, y: 10 };

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

  // 마우스 휠 이벤트 핸들러
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isZooming = false;
    let zoomTimeout: number | null = null;

    const handleWheelEvent = (e: WheelEvent) => {
      e.preventDefault();

      // 여러 휠 이벤트가 빠르게 발생할 때 스로틀링
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

      // 매우 작은 델타 값을 사용하여 부드럽게 확대/축소
      const delta = -e.deltaY * 0.0005;
      const newScale = scale * (1 + delta * 7);

      handleZoom(newScale, e.clientX, e.clientY);

      // 짧은 시간 후 다시 줌 허용
      zoomTimeout = window.setTimeout(() => {
        isZooming = false;
        zoomTimeout = null;
      }, 50);
    };

    // 이벤트 리스너 등록 (non-passive로 설정)
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

    // 터치 이벤트 처리를 위한 함수들
    const handleTouchMoveInEffect = (e: TouchEvent) => {
      // 핀치 줌 처리 (가장 우선순위 높음)
      if (pinchStartDist !== null && e.touches.length === 2) {
        e.preventDefault();
        e.stopPropagation();

        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // 줌 비율 계산
        const scaleFactor = distance / pinchStartDist;
        const newScale = pinchStartScale * scaleFactor;

        // 두 손가락의 중간점 계산
        const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

        handleZoom(newScale, centerX, centerY);
        return; // 핀치 줌 중에는 다른 처리 안 함
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

        // 직접 계산하여 경계 체크 제거
        const newX =
          (touch.clientX - containerRect.left - dragOffsetRef.current.x + scrollLeft) / scale;
        const newY =
          (touch.clientY - containerRect.top - dragOffsetRef.current.y + scrollTop) / scale;

        // 맵 경계 내로 제한
        const clampedX = Math.max(hiveSize / 2, Math.min(newX, mapWidth - hiveSize / 2));
        const clampedY = Math.max(hiveSize / 2, Math.min(newY, mapHeight - hiveSize / 2));

        setHives((prev) =>
          prev.map((hive) =>
            hive.id === draggingId ? { ...hive, x: clampedX, y: clampedY } : hive,
          ),
        );
      }
    };

    // touchstart 이벤트 핸들러
    const handleTouchStartInEffect = (e: TouchEvent) => {
      // 2개 손가락으로 터치했을 때 핀치 줌 시작
      if (e.touches.length === 2) {
        e.preventDefault(); // 핀치 줌 시에만 스크롤 방지

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
      }
    };

    // touchend 이벤트 핸들러
    const handleTouchEndInEffect = (e: TouchEvent) => {
      // 핀치 줌 종료
      if (e.touches.length < 2) {
        setPinchStartDist(null);
      }

      // 드래그 종료
      if (e.touches.length === 0) {
        setDraggingId(null);
        setAutoScroll({ x: 0, y: 0 });
        setIsLongPress(false);

        // 롱프레스 타이머 제거
        if (longPressTimeoutRef.current !== null) {
          window.clearTimeout(longPressTimeoutRef.current);
          longPressTimeoutRef.current = null;
        }
      }
    };

    // passive 옵션에 따라 다르게 이벤트 리스너 등록
    // touchmove는 preventDefault를 사용해야 하므로 non-passive로 등록
    container.addEventListener('touchmove', handleTouchMoveInEffect, { passive: false });
    container.addEventListener('touchstart', handleTouchStartInEffect, { passive: false });
    container.addEventListener('touchend', handleTouchEndInEffect);
    container.addEventListener('touchcancel', handleTouchEndInEffect);

    return () => {
      // 이벤트 리스너 제거
      container.removeEventListener('touchmove', handleTouchMoveInEffect);
      container.removeEventListener('touchstart', handleTouchStartInEffect);
      container.removeEventListener('touchend', handleTouchEndInEffect);
      container.removeEventListener('touchcancel', handleTouchEndInEffect);
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
  ]);

  // 자동 스크롤 효과
  useEffect(() => {
    if (autoScroll.x === 0 && autoScroll.y === 0) return;

    const interval = setInterval(() => {
      if (draggingId !== null) {
        setHives((prev) =>
          prev.map((hive) =>
            hive.id === draggingId
              ? { ...hive, x: hive.x + autoScroll.x / scale, y: hive.y + autoScroll.y / scale }
              : hive,
          ),
        );
      }

      if (containerRef.current) {
        containerRef.current.scrollLeft += autoScroll.x;
        containerRef.current.scrollTop += autoScroll.y;
      }
    }, 16);

    return () => clearInterval(interval);
  }, [autoScroll, draggingId, scale, setHives, containerRef]);

  return {
    scale,
    draggingId,
    isLongPress,
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
