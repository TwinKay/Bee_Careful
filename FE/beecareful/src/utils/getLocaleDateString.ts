import { convertUTCToLocal } from './format';

export const getLocaleDateString = (date: string | Date) => {
  const utcDate = convertUTCToLocal(date);
  if (!utcDate) return '';
  return utcDate.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: '2-digit',
  });
};
