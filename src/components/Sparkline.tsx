interface SparklineProps {
  values: number[];
}

export function Sparkline({ values }: SparklineProps) {
  if (values.length < 2) {
    return <span className="text-sm text-zinc-600">—</span>;
  }

  const width = 112;
  const height = 36;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const rising = values[values.length - 1] >= values[0];
  const stroke = rising ? "#34d399" : "#fb7185";

  const coordinates = values.map((value, index) => {
    const x = (index / (values.length - 1)) * width;
    const y = 4 + ((max - value) / span) * (height - 8);
    return { x, y };
  });

  const line = coordinates
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(" ");
  const first = coordinates[0];
  const last = coordinates[coordinates.length - 1];
  const area = `${line} L${last.x.toFixed(2)} ${height} L${first.x.toFixed(2)} ${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-9 w-28"
      role="img"
      aria-label={rising ? "Price rose over 7 days" : "Price fell over 7 days"}
    >
      <path d={area} fill={stroke} opacity="0.14" />
      <path d={line} fill="none" stroke={stroke} strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last.x} cy={last.y} r="2.2" fill={stroke} />
    </svg>
  );
}
