import { useEffect, useRef } from "react";

type TrailPoint = { x: number; y: number; life: number };

export function useCursorTrail() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let points: TrailPoint[] = [];
    let raf = 0;

    const isFine = window.matchMedia("(pointer: fine)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!isFine || reducedMotion) return;

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    function handleMove(e: MouseEvent) {
      points.push({ x: e.clientX, y: e.clientY, life: 1 });
      if (points.length > 40) points.shift();
    }
    window.addEventListener("mousemove", handleMove);

    function draw() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      if (points.length > 1) {
        ctx!.beginPath();
        ctx!.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) ctx!.lineTo(points[i].x, points[i].y);
        ctx!.strokeStyle = "rgba(228,187,96,0.55)";
        ctx!.lineWidth = 1.6;
        ctx!.lineCap = "round";
        ctx!.lineJoin = "round";
        ctx!.stroke();
      }
      points.forEach((p) => (p.life -= 0.045));
      points = points.filter((p) => p.life > 0);
      raf = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return canvasRef;
}
