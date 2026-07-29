import { useEffect, useRef, useState } from "react";

interface Props {
  value: number;
  duration?: number;
  decimals?: number;
  suffix?: string;
  className?: string;
}

export default function AnimatedNumber({ value, duration = 900, decimals = 0, suffix = "", className }: Props) {
  const [gosterilen, setGosterilen] = useState(0);
  const basladiRef = useRef(false);

  useEffect(() => {
    basladiRef.current = true;
    const baslangic = performance.now();
    const baslangicDeger = 0;

    let raf: number;
    function adim(simdi: number) {
      const gecen = Math.min((simdi - baslangic) / duration, 1);
      const kolay = 1 - Math.pow(1 - gecen, 3);
      setGosterilen(baslangicDeger + (value - baslangicDeger) * kolay);
      if (gecen < 1) raf = requestAnimationFrame(adim);
    }
    raf = requestAnimationFrame(adim);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <span className={className}>
      {gosterilen.toFixed(decimals)}
      {suffix}
    </span>
  );
}
