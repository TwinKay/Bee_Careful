/**
 * @description React의 CSSProperties 타입을 확장하여 벤더 프리픽스 CSS 속성들을 타입 안전하게 사용할 수 있도록 함
 * @example
 * const styles: React.CSSProperties = {
 *   WebkitTouchCallout: 'none',
 *   WebkitBackfaceVisibility: 'hidden'
 * };
 */

import 'react';

declare module 'react' {
  type CSSPropertiesType = {
    WebkitTouchCallout?: 'none' | 'default' | 'inherit' | 'initial' | 'unset';
    WebkitBackfaceVisibility?: 'visible' | 'hidden' | 'inherit' | 'initial' | 'unset';
    WebkitFontSmoothing?: 'auto' | 'none' | 'antialiased' | 'subpixel-antialiased';
    MozOsxFontSmoothing?: 'auto' | 'grayscale';
  };
}
