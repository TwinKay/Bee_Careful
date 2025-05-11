import { twMerge } from 'tailwind-merge';

export type CardPropsType = {
  children: React.ReactNode;
  className?: string;
};

const Card: React.FC<CardPropsType> = ({ children, className }) => {
  return (
    <div
      className={twMerge(
        'flex h-full w-full flex-col items-center justify-start gap-6 rounded-3xl bg-white p-6',
        className,
      )}
    >
      {children}
    </div>
  );
};
export default Card;
