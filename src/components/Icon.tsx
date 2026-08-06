import type { CSSProperties } from 'react';

// SVG Icons (1.5px stroke, 24px grid)
export type IconName =
  | 'home' | 'user' | 'pen' | 'book' | 'folder' | 'check' | 'calendar' | 'chart'
  | 'x' | 'repeat' | 'compare' | 'ai' | 'report' | 'medal' | 'message' | 'bell'
  | 'students' | 'money' | 'alert' | 'task' | 'note' | 'meeting' | 'send' | 'logout'
  | 'star' | 'resource' | 'grid' | 'template' | 'plus' | 'trash' | 'copy' | 'download'
  | 'refresh' | 'arrow_back';

const ICON_PATHS: Record<IconName, React.ReactNode> = {
  home: (<><path d="M3 9.5L12 3l9 6.5V21H3z"/><path d="M9 21V12h6v9"/></>),
  user: (<><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></>),
  pen: (<><path d="M12 19l7-7-3-3-7 7v3h3z"/><path d="M16 5l3 3"/></>),
  book: (<><path d="M4 5a2 2 0 012-2h12a2 2 0 012 2v16l-8-3-8 3z"/></>),
  folder: (<><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></>),
  check: (<><path d="M5 13l4 4L19 7"/></>),
  calendar: (<><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>),
  chart: (<><path d="M3 18l5-6 4 3 4-5 5 8"/><path d="M3 3v18h18"/></>),
  x: (<><circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/></>),
  repeat: (<><path d="M1 4l4 4-4 4"/><path d="M5 8h14a2 2 0 012 2v3"/><path d="M23 20l-4-4 4-4"/><path d="M19 16H5a2 2 0 01-2-2v-3"/></>),
  compare: (<><path d="M9 3H5a2 2 0 00-2 2v14a2 2 0 002 2h4M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M12 3v18"/></>),
  ai: (<><path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5z"/><circle cx="12" cy="18" r="3"/></>),
  report: (<><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M8 12h8M8 16h5"/></>),
  medal: (<><circle cx="12" cy="14" r="6"/><path d="M8.5 2.5l-2 5M15.5 2.5l2 5M9 7.5h6"/></>),
  message: (<><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></>),
  bell: (<><path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></>),
  students: (<><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></>),
  money: (<><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M12 9v6M9 12h6"/></>),
  alert: (<><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/></>),
  task: (<><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></>),
  note: (<><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M8 10h8M8 14h8M8 18h5"/></>),
  meeting: (<><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M16 11h6"/></>),
  send: (<><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></>),
  logout: (<><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></>),
  star: (<><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></>),
  resource: (<><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></>),
  grid: (<><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></>),
  template: (<><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></>),
  plus: (<><path d="M12 5v14M5 12h14"/></>),
  trash: (<><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></>),
  copy: (<><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></>),
  download: (<><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></>),
  refresh: (<><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></>),
  arrow_back: (<><path d="M19 12H5M12 19l-7-7 7-7"/></>),
};

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: CSSProperties;
}

export function Icon({ name, size = 18, color = 'currentColor', style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      {ICON_PATHS[name]}
    </svg>
  );
}
