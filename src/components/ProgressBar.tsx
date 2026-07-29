import { useEffect, useState } from "react";

interface Props {
  oran: number; // 0-100
  color: string;
  delay?: number;
}

export default function ProgressBar({ oran, color, delay = 0 }: Props) {
  const [genislik, setGenislik] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setGenislik(oran), 50 + delay);
    return () => clearTimeout(t);
  }, [oran, delay]);

  return (
    <div className="progress-track">
      <div className="progress-fill" style={{ width: `${genislik}%`, background: color }} />
    </div>
  );
}
