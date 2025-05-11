import { twMerge } from 'tailwind-merge';

export type CardTitlePropsType = {
  title: string;
  className?: string;
};
const CardTitle: React.FC<CardTitlePropsType> = ({ title, className }) => {
  return (
    <h1
      className={twMerge(
        'flex h-full w-full items-center justify-start text-2xl font-bold text-gray-800',
        className,
      )}
    >
      {title}
    </h1>
  );
};

export default CardTitle;
