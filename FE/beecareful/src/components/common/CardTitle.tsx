import { twMerge } from 'tailwind-merge';

export type CardTitlePropsType = {
  children: React.ReactNode;
  className?: string;
};
const CardTitle: React.FC<CardTitlePropsType> = ({ children, className }) => {
  return (
    <h1
      className={twMerge(
        'flex h-full w-full items-center justify-start text-xl font-bold text-gray-800',
        className,
      )}
    >
      {children}
    </h1>
  );
};

export default CardTitle;
