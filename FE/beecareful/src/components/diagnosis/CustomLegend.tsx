const CustomLegend = (props) => {
  const { payload } = props;

  return (
    <div className="mt-2 flex flex-row flex-wrap items-center justify-center gap-x-4 gap-y-2">
      {payload.map((entry, index) => {
        return (
          <div key={`item-${index}`} className="flex flex-row items-center gap-1">
            <div
              style={{
                backgroundColor: entry.color,
                width: 14,
                height: 5,
                marginRight: 4,
                marginBottom: 3,
              }}
            ></div>
            <span className="text-sm font-bold text-gray-600">{entry.value}</span>
          </div>
        );
      })}
    </div>
  );
};

export default CustomLegend;
