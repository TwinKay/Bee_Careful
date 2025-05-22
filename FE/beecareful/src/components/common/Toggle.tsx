export type TogglePropsType = {
  isLeft?: boolean;
  onToggle: (isLeft: boolean) => void;
  className?: string;
  leftLabel: string;
  rightLabel: string;
};

const ToggleLabel: React.FC<{
  label: string;
  isActive: boolean;
}> = ({ label, isActive }) => {
  return (
    <p
      className={`text-md z-10 w-1/2 rounded-full p-1.5 text-center font-bold ${isActive ? 'text-white' : 'text-gray-600'}`}
    >
      {label}
    </p>
  );
};

const Toggle: React.FC<TogglePropsType> = ({ isLeft = true, onToggle, leftLabel, rightLabel }) => {
  return (
    <div className={`rounded-full bg-gray-200 p-1`} onClick={() => onToggle(!isLeft)}>
      <div className={`relative flex w-28 items-center justify-between`}>
        <div
          className={`absolute h-full w-1/2 rounded-full bg-bc-brown-100 transition-transform duration-200 ${
            isLeft ? 'translate-x-0' : 'translate-x-full'
          }`}
        ></div>
        <ToggleLabel isActive={isLeft} label={leftLabel} />
        <ToggleLabel isActive={!isLeft} label={rightLabel} />
      </div>
    </div>
  );
};
export default Toggle;
