type IconPropsType = {
  name: string; // example: "ri-home-line"
  className?: string;
  onClick?: () => void; // optional click handler
};

const RemixIcon: React.FC<IconPropsType> = ({ name, className, onClick }) => {
  return (
    <div className="flex aspect-square items-center justify-center">
      <i className={`${name} ri-xl ${className ?? ''}`} onClick={onClick} />
    </div>
  );
};

export default RemixIcon;
