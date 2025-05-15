import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/common/Button';
import RemixIcon from './RemixIcon';
import { motion, AnimatePresence } from 'framer-motion';

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
 * @param {string} [props.inputs[].value] - 입력 필드 값
 * @param {Function} [props.inputs[].onChange] - 입력 필드 변경 핸들러
 * @param {string} [props.inputs[].error] - 입력 필드 변경 핸들러
 * @param {Object[]} [props.buttons] - 입력 필드 관련 에러 메세지
 * @param {string} props.buttons[].id - 버튼 ID
 * @param {string} props.buttons[].label - 버튼 텍스트
 * @param {'primary' | 'secondary' | 'success' | 'neutral' | 'outline' | 'text'} props.buttons[].variant - 버튼 스타일 변형
 * @param {Function} props.buttons[].onClick - 버튼 클릭 핸들러 함수
 * @param {boolean} [props.buttons[].disabled] - 버튼 비활성화 여부
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
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    error?: string;
  }[];
  buttons?: {
    id: string;
    label: string;
    variant: 'primary' | 'secondary' | 'success' | 'neutral' | 'outline' | 'text';
    onClick: () => void;
    disabled?: boolean;
  }[];
};

const DURATION = 300;

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
  const firstInputRef = useRef<HTMLInputElement>(null);

  // 바텀시트 열기/닫기 애니메이션 처리
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'; // 배경 스크롤 방지
      setIsVisible(true);
    } else {
      // 바텀시트 닫기 애니메이션
      setIsVisible(true); // 애니메이션을 위해 일시적으로 true로 설정

      const timer = setTimeout(() => {
        setIsVisible(false);
        document.body.style.overflow = ''; // 배경 스크롤 허용
      }, DURATION);

      return () => clearTimeout(timer);
    }
  }, [isOpen, inputs.length]);

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

  // Enter 키 이벤트 처리
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && isOpen && buttons.length > 0) {
        // Enter 키를 누르면 첫 번째(또는 마지막) 버튼의 onClick 실행
        // 비활성화되지 않은 버튼 찾기
        const activeButton = buttons.find((button) => !button.disabled);
        if (activeButton) {
          activeButton.onClick();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, buttons]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end justify-center bg-black bg-opacity-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: isOpen ? 1 : 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: DURATION / 1000 }}
      >
        <motion.div
          ref={bottomSheetRef}
          className={`-mb-56 w-full max-w-md rounded-t-3xl bg-white p-8 pb-64`}
          initial={{ y: '100%' }}
          animate={{ y: isOpen ? '0%' : '100%' }}
          exit={{ y: '100%' }}
          transition={{ duration: DURATION / 1000, ease: 'easeOut' }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{
            top: 0.1,
            bottom: 1,
          }}
          dragMomentum={false}
          onDragEnd={(_, info) => {
            if (info.offset.y > 100) onClose();
          }}
        >
          <div className="mb-10 flex items-center justify-between text-start">
            <h3 className="text-xl font-extrabold text-bc-brown-100">{title}</h3>
            <button
              onClick={onClose}
              className="flex-shrink-0 text-black hover:text-gray-700"
              aria-label="닫기"
            >
              <RemixIcon className="ri-2x" name="ri-close-line" />
            </button>
          </div>

          {content && <p className="text-medium mb-4 mt-4 text-left">{content}</p>}

          {inputs.length > 0 && (
            <div className="mb-4 space-y-4">
              {inputs.map((input, index) => (
                <div key={input.id} className="w-full">
                  <input
                    ref={index === 0 ? firstInputRef : null}
                    type={input.type || 'text'}
                    id={input.id}
                    name={input.id}
                    placeholder={input.placeholder}
                    value={input.value}
                    onChange={input.onChange}
                    className={`w-full rounded-xl border ${
                      input.error ? 'border-red-500' : 'border-gray-200'
                    } bg-gray-100 px-4 py-4 focus:outline-none focus:ring-2 ${
                      input.error ? 'focus:ring-red-400' : 'focus:ring-yellow-400'
                    }`}
                    autoComplete="off"
                  />
                  {input.error && (
                    <p className="mt-2 text-left text-sm text-red-500">{input.error}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {buttons.length > 0 && (
            <div className="mt-8 space-y-4">
              {buttons.map((button) => (
                <Button
                  key={button.id}
                  variant={button.variant}
                  size="lg"
                  fullWidth
                  onClick={button.onClick}
                  disabled={button.disabled}
                >
                  <p className="font-bold">{button.label}</p>
                </Button>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BottomSheet;
