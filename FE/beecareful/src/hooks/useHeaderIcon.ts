import type { HeaderIconOptionType } from '@/layouts/MainLayout';
import { useEffect, type RefObject, type Dispatch, type SetStateAction } from 'react';
import { useOutletContext } from 'react-router-dom';

export const useHeaderIcon = (option: RefObject<HeaderIconOptionType>) => {
  const context = useOutletContext<{
    headerIconOption: HeaderIconOptionType;
    setHeaderIconOption: Dispatch<SetStateAction<HeaderIconOptionType>>;
  }>();

  const setHeaderIconOption = context.setHeaderIconOption;

  useEffect(() => {
    setHeaderIconOption(option.current);
  }, [option, setHeaderIconOption]);
};
