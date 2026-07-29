interface Props {
  size?: number;
  color?: string;
  animateDraw?: boolean;
  float?: boolean;
  style?: React.CSSProperties;
}

export default function UYArrow({ size = 24, color = "#E4BB60", animateDraw = false, float = false, style }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={[animateDraw ? "arrow-draw" : "", float ? "arrow-float" : ""].filter(Boolean).join(" ")}
      style={{ ...style, ["--arrow-len" as any]: 40 }}
    >
      <path
        d="M12 21V5M12 5L6 11M12 5L18 11"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
