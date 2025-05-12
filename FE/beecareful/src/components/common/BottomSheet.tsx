import type { TouchEvent } from 'react';
import React, { useState, useEffect, useRef } from 'react';
import { Button } from './Button';

/**
 * @component
 * @description 바텀시트 컴포넌트 - 화면 하단에서 올라오는 모달 형태의 UI
 *
 * @param {boolean} props.isOpen - 바텀시트 표시 여부
 * @param {Function} props.onClose - 바텀시트를 닫는 함수
 * @param {string} props.title - 바텀시트 제목
 * @param {string} [props.content] - 바텀시트 내용 텍스트
 * @param {Object[]} [props.inputs] - 입력 필드 배열
 * @param {string} props.inputs[].id - 입력 필드 ID
 * @param {string} props.inputs[].placeholder - 입력 필드 플레이스홀더
 * @param {string} [props.inputs[].type='text'] - 입력 필드 타입
 * @param {Object[]} [props.buttons] - 버튼 배열
 * @param {string} props.buttons[].id - 버튼 ID
 * @param {string} props.buttons[].label - 버튼 텍스트
 * @param {'primary' | 'secondary' | 'success' | 'neutral' | 'outline' | 'text'} props.buttons[].variant - 버튼 스타일 변형
 *   - primary: 메인 액션 버튼
 *   - secondary: 보조 액션 버튼
 *   - success: 성공 상태 버튼
 *   - neutral: 중립 버튼
 *   - outline: 테두리만 있는 버튼
 *   - text: 텍스트만 있는 버튼
 * @param {Function} props.buttons[].onClick - 버튼 클릭 핸들러 함수
 *
 */
export type BottomSheetPropsType = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content?: string;
  inputs?: {
    id: string;
    placeholder: string;
    type?: string;
  }[];
  buttons?: {
    id: string;
    label: string;
    variant: 'primary' | 'secondary' | 'success' | 'neutral' | 'outline' | 'text';
    onClick: () => void;
  }[];
};

const BottomSheet: React.FC<BottomSheetPropsType> = ({
  isOpen,
  onClose,
  title,
  content,
  inputs = [],
  buttons = [],
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const bottomSheetRef = useRef<HTMLDivElement>(null);
  const [startY, setStartY] = useState(0);
  const [currentTranslate, setCurrentTranslate] = useState(0);

  // 바텀시트 열기/닫기
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'; // 배경 스크롤 방지
      setIsVisible(true);
      setCurrentTranslate(0); // 트랜스레이트 초기화
    } else {
      const timer = setTimeout(() => {
        setIsVisible(false);
        document.body.style.overflow = ''; // 배경 스크롤 허용
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // 바텀시트 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        bottomSheetRef.current &&
        !bottomSheetRef.current.contains(event.target as Node) &&
        isOpen
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // 터치 시작 이벤트 핸들러
  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    setStartY(e.touches[0].clientY);
  };

  // 터치 이동 이벤트 핸들러
  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY;

    // 아래로 스와이프할 때만 반응 (위로 스와이프는 무시)
    if (diff > 0) {
      setCurrentTranslate(diff);
    }
  };

  // 터치 종료 이벤트 핸들러
  const handleTouchEnd = (_e: TouchEvent<HTMLDivElement>) => {
    // 충분히 아래로 스와이프했으면 바텀시트 닫기
    if (currentTranslate > 100) {
      // 100px 이상 드래그하면 닫힘
      onClose();
    } else {
      // 충분하지 않으면 원래 위치로 돌아감
      setCurrentTranslate(0);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black bg-opacity-50 transition-opacity duration-300">
      <div
        ref={bottomSheetRef}
        style={{ transform: `translateY(${currentTranslate}px)` }}
        className={`w-full max-w-md rounded-t-2xl bg-white p-5 py-8 transition-transform duration-300 ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="mb-4 flex items-start justify-between text-start">
          <h3 className="pr-4 text-xl font-extrabold text-bc-brown-100">{title}</h3>
          <button onClick={onClose} className="flex-shrink-0 text-black" aria-label="닫기">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {content && <p className="text-medium mb-4 mt-8 text-left">{content}</p>}

        {inputs.length > 0 && (
          <div className="mb-4 space-y-3">
            {inputs.map((input) => (
              <div key={input.id} className="w-full">
                <input
                  type={input.type || 'text'}
                  id={input.id}
                  placeholder={input.placeholder}
                  className="w-full rounded-xl border border-gray-200 bg-gray-100 px-4 py-4 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
            ))}
          </div>
        )}

        {buttons.length > 0 && (
          <div className="mt-12 space-y-3">
            {buttons.map((button) => (
              <Button
                key={button.id}
                variant={button.variant}
                size="lg"
                fullWidth
                onClick={button.onClick}
              >
                {button.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BottomSheet;
