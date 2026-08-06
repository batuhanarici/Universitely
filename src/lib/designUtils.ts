import { useEffect, useRef, useState } from 'react';

export function useCountUp(target: number, duration = 900, start = false) {
  const [value, setValue] = useState(0);
  const raf = useRef<number>(0);

  useEffect(() => {
    if (!start) return;
    const startTime = performance.now();
    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(parseFloat((eased * target).toFixed(2)));
      if (progress < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration, start]);

  return value;
}

export function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

export function net(correct: number, wrong: number) {
  return +(correct - wrong / 4).toFixed(2);
}

export function formatDate(d: string) {
  const date = new Date(d);
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function relativeDate(d: string) {
  const today = new Date(); today.setHours(0,0,0,0);
  const date = new Date(d); date.setHours(0,0,0,0);
  const diff = Math.round((date.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return 'Bugün';
  if (diff === 1) return 'Yarın';
  if (diff === -1) return 'Dün';
  return formatDate(d);
}

export function daysLeft(endDate: string) {
  const today = new Date(); today.setHours(0,0,0,0);
  const end = new Date(endDate); end.setHours(0,0,0,0);
  return Math.round((end.getTime() - today.getTime()) / 86400000);
}

export function pct(a: number, b: number) {
  if (!b) return 0;
  return Math.round((a / b) * 100);
}

export function downloadCSV(filename: string, headers: string[], rows: string[][]) {
  const csv = [headers, ...rows].map(r => r.join(';')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename + '.csv'; a.click();
  URL.revokeObjectURL(url);
}

export function printPDF(title: string, subtitle: string, headers: string[], rows: string[][]) {
  const table = `<table border="1" cellpadding="8" style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:13px;">
    <thead><tr>${headers.map(h => `<th style="background:#0F1B2D;color:#F4EFE4;text-align:left;">${h}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
  </table>`;
  const html = `<html><head><title>${title}</title></head><body>
    <h1 style="font-family:serif;">${title}</h1>
    <p style="font-family:sans-serif;color:#666;">${subtitle}</p>
    ${table}
    <p style="margin-top:24px;font-family:sans-serif;font-size:11px;color:#999;">Tarih: ${new Date().toLocaleDateString('tr-TR')}</p>
  </body></html>`;
  const w = window.open('', '_blank');
  if (w) { w.document.write(html); w.document.close(); w.print(); }
}
