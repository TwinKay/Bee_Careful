export type CardPropsType = {
  children: React.ReactNode;
  className?: string;
};

const Card: React.FC<CardPropsType> = ({ children, className }) => {
  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-start rounded-2xl bg-white p-6 ${className}`}
    >
      {children}
    </div>
  );
};
export default Card;
