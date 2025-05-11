/**
 * @description 애플리케이션 전체에서 일관된 스타일의 버튼을 제공하는 컴포넌트
 */

import React from 'react';
import { twMerge } from 'tailwind-merge';

// 버튼의 모든 가능한 변형을 정의
export type ButtonVariantType =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'neutral'
  | 'outline'
  | 'text';
export type ButtonSizeType = 'sm' | 'md' | 'lg';

export type ButtonPropsType = {
  /** 버튼의 시각적 스타일 */
  variant?: ButtonVariantType;
  /** 버튼의 크기 */
  size?: ButtonSizeType;
  /** 버튼을 전체 너비로 확장할지 여부 */
  fullWidth?: boolean;
  /** 버튼에 로딩 상태를 표시할지 여부 */
  isLoading?: boolean;
  /** 추가 CSS 클래스 */
  className?: string;
  /** 버튼 내용 */
  children: React.ReactNode;
  /** 시작 부분에 표시할 아이콘 (선택 사항) */
  startIcon?: React.ReactNode;
  /** 끝 부분에 표시할 아이콘 (선택 사항) */
  endIcon?: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  className = '',
  children,
  startIcon,
  endIcon,
  disabled,
  type = 'button',
  ...props
}: ButtonPropsType) => {
  // 기본 클래스: 모든 버튼에 적용됨
  const baseClasses =
    'rounded-2xl font-medium transition-colors focus:outline-none disabled:cursor-not-allowed';

  // 크기별 클래스
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-6 py-4 text-lg',
  };

  // 변형별 클래스
  const variantClasses = {
    primary: 'bg-bc-brown-90 text-white hover:bg-bc-brown-20 disabled:bg-gray-300',
    secondary: 'bg-bc-brown-20 text-white hover:bg-bc-brown-90 disabled:bg-gray-300',
    success: 'bg-bc-yellow-90 text-bc-brown-100 hover:bg-bc-yellow-40 disabled:bg-gray-300',
    neutral: 'bg-bc-yellow-40 text-bc-brown-100 hover:bg-bc-yellow-90 disabled:bg-gray-300',
    outline:
      'border-2 border-bc-brown-90 text-bc-brown-90 hover:bg-bc-brown-10 disabled:border-bc-brown-90/50 disabled:text-bc-brown-90/50',
    text: 'text-bc-brown-90 hover:bg-bc-brown-10 disabled:text-bc-brown-90/50',
  };

  // 너비 클래스
  const widthClass = fullWidth ? 'w-full' : '';

  // 로딩 상태 표시
  const content = isLoading ? (
    <div className="flex items-center justify-center">
      <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span>로딩 중...</span>
    </div>
  ) : (
    <div className="flex items-center justify-center">
      {startIcon && <span className="mr-2">{startIcon}</span>}
      {children}
      {endIcon && <span className="ml-2">{endIcon}</span>}
    </div>
  );

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={twMerge(
        baseClasses,
        sizeClasses[size],
        variantClasses[variant],
        widthClass,
        className,
      )}
      {...props}
    >
      {content}
    </button>
  );
};

// 더 명확한 의미를 가진 특수 목적 버튼 컴포넌트들
export const PrimaryButton = (props: Omit<ButtonPropsType, 'variant'>) => (
  <Button variant="primary" {...props} />
);

export const SecondaryButton = (props: Omit<ButtonPropsType, 'variant'>) => (
  <Button variant="secondary" {...props} />
);

export const OutlineButton = (props: Omit<ButtonPropsType, 'variant'>) => (
  <Button variant="outline" {...props} />
);

export const TextButton = (props: Omit<ButtonPropsType, 'variant'>) => (
  <Button variant="text" {...props} />
);

export default Button;
