type IconPropsType = {
  name: string; // example: "ri-home-line"
  className?: string;
};

const RemixIcon: React.FC<IconPropsType> = ({ name, className }) => {
  return <i className={`${name} ri-lg ${className ?? ''}`} />;
};

export default RemixIcon;
