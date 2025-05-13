/**
 * 전화번호를 포맷팅하는 함수
 * @param phone 전화번호 문자열
 * @returns 포맷팅된 전화번호 (XXX-XXXX-XXXX)
 */
export const formatPhoneNumber = (phone: string): string => {
  // 숫자만 추출
  const numbers = phone.replace(/[^0-9]/g, '');

  // 하이픈 추가
  let formattedPhone = '';
  if (numbers.length <= 3) {
    formattedPhone = numbers;
  } else if (numbers.length <= 7) {
    formattedPhone = `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  } else {
    formattedPhone = `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  }

  // 11자리를 넘어가면 자르기
  if (numbers.length > 11) {
    formattedPhone = `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  }

  return formattedPhone;
};

/**
 * 전화번호에서 하이픈을 제거하는 함수
 * @param phone 포맷팅된 전화번호
 * @returns 하이픈이 제거된 전화번호
 */
export const removeHyphenFromPhone = (phone: string): string => {
  return phone.replace(/-/g, '');
};

/**
 * 시간 형식을 변환하는 함수 (ISO 문자열을 "5분 전" 형식으로)
 * @param dateString ISO 문자열
 * @returns 분, 시, 일 단위의 문자열
 */
export const formatTimeAgo = (dateString?: string | null): string => {
  if (!dateString) return '-';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return '방금 전';
  if (diffMinutes < 60) return `${diffMinutes}분 전`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}시간 전`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}일 전`;
};
