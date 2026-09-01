import type { ReactNode } from "react";

export type IconName =
  | "spark" | "check" | "close" | "plus" | "menu" | "alert" | "info" | "warning"
  | "arrowLeft" | "arrowRight" | "chevronRight"
  | "grid" | "folder" | "users" | "compass" | "target" | "cpu" | "layers"
  | "calendar" | "clock" | "chart" | "gauge" | "chat" | "file" | "book" | "search"
  | "flag" | "play" | "refresh" | "send" | "copy" | "download" | "eye" | "logout"
  | "cap" | "edit" | "shield";

const PATHS: Record<IconName, ReactNode> = {
  spark: <path d="M12 2.5l2.3 7.2 7.2 2.3-7.2 2.3L12 21.5l-2.3-7.2-7.2-2.3 7.2-2.3z" />,
  check: <path d="M4.5 12.5l5 5 10-11" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  alert: (
    <>
      <path d="M12 3.2L22 20H2z" />
      <path d="M12 9.8v4.4" />
      <path d="M12 17.3h.01" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5" />
      <path d="M12 7.6h.01" />
    </>
  ),
  warning: (
    <>
      <path d="M12 3.2L22 20H2z" />
      <path d="M12 9.8v4.4" />
      <path d="M12 17.3h.01" />
    </>
  ),
  arrowLeft: <path d="M19 12H5m0 0l6-6m-6 6l6 6" />,
  arrowRight: <path d="M5 12h14m0 0l-6-6m6 6l-6 6" />,
  chevronRight: <path d="M9 6l6 6-6 6" />,
  grid: <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />,
  folder: <path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
  users: (
    <>
      <circle cx="9.5" cy="7.5" r="3.5" />
      <path d="M3 20.5v-1.6a4.5 4.5 0 0 1 4.5-4.5h4a4.5 4.5 0 0 1 4.5 4.5v1.6" />
      <path d="M16.5 4.2a3.5 3.5 0 0 1 0 6.6" />
      <path d="M21 20.5v-1.4a4.5 4.5 0 0 0-3-4.2" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M15.7 8.3l-2.1 5.3-5.3 2.1 2.1-5.3z" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.4" />
    </>
  ),
  cpu: (
    <>
      <rect x="6.5" y="6.5" width="11" height="11" rx="1.5" />
      <rect x="10.2" y="10.2" width="3.6" height="3.6" />
      <path d="M9.5 2.5v4M14.5 2.5v4M9.5 17.5v4M14.5 17.5v4M2.5 9.5h4M2.5 14.5h4M17.5 9.5h4M17.5 14.5h4" />
    </>
  ),
  layers: (
    <>
      <path d="M12 3l9 4.8-9 4.8-9-4.8z" />
      <path d="M3 12.6l9 4.8 9-4.8" />
      <path d="M3 16.8l9 4.8 9-4.8" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5" width="16" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M4 10.5h16" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.2l3.6 2.1" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20.5h16" />
      <path d="M6.5 20.5v-6M12 20.5V5.5M17.5 20.5v-9.5" />
    </>
  ),
  gauge: (
    <>
      <path d="M4.5 18.5a9 9 0 1 1 15 0" />
      <path d="M12 14.5l3.8-4.3" />
      <path d="M12 14.5h.01" />
    </>
  ),
  chat: <path d="M21 11.6a8.4 8.4 0 0 1-8.5 8.3c-1.3 0-2.5-.3-3.6-.8L3 20.9l1.9-5.6A8.3 8.3 0 1 1 21 11.6z" />,
  file: (
    <>
      <path d="M14 3H7a1.5 1.5 0 0 0-1.5 1.5v15A1.5 1.5 0 0 0 7 21h10a1.5 1.5 0 0 0 1.5-1.5V7.5z" />
      <path d="M14 3v4.5h4.5" />
      <path d="M9 12.5h6M9 16h6" />
    </>
  ),
  book: (
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3.5H6.5A2.5 2.5 0 0 0 4 6z" />
      <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20.5 20.5L16 16" />
    </>
  ),
  flag: <path d="M5.5 21.5V4c4-2.2 7 2.2 13.5 0v9.5c-6.5 2.2-9.5-2.2-13.5 0" />,
  play: <path d="M8 5.5l11 6.5-11 6.5z" />,
  refresh: (
    <>
      <path d="M20 12a8 8 0 1 1-2.5-5.8" />
      <path d="M20 3.5V8h-4.5" />
    </>
  ),
  send: <path d="M21.5 2.5L11 13M21.5 2.5l-6.8 19-3.7-8.5-8.5-3.5z" />,
  copy: (
    <>
      <rect x="9" y="9" width="11.5" height="11.5" rx="2" />
      <path d="M5.5 15h-1a2 2 0 0 1-2-2V4.5a2 2 0 0 1 2-2H13a2 2 0 0 1 2 2v1" />
    </>
  ),
  download: (
    <>
      <path d="M12 3.5V15m0 0l-4.5-4.5M12 15l4.5-4.5" />
      <path d="M4.5 20.5h15" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="2.8" />
    </>
  ),
  logout: (
    <>
      <path d="M9.5 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.5" />
      <path d="M16 16.5L20.5 12 16 7.5" />
      <path d="M20.5 12H9.5" />
    </>
  ),
  cap: (
    <>
      <path d="M2.5 9.5L12 5l9.5 4.5L12 14z" />
      <path d="M6.5 11.8v4.4c0 1.5 2.5 2.9 5.5 2.9s5.5-1.4 5.5-2.9v-4.4" />
      <path d="M21.5 9.8v5" />
    </>
  ),
  edit: (
    <>
      <path d="M12 20h9" />
      <path d="M16.6 3.6a2.1 2.1 0 0 1 3 3L7.5 18.7 3 20l1.3-4.5z" />
    </>
  ),
  shield: (
    <>
      <path d="M12 2.5l8 3.4v5.5c0 4.8-3.4 8.3-8 10.1-4.6-1.8-8-5.3-8-10.1V5.9z" />
      <path d="M8.8 11.8l2.2 2.2 4.2-4.8" />
    </>
  ),
};

export function Icon({ name, size = 16, className, strokeWidth = 1.8 }: { name: IconName; size?: number; className?: string; strokeWidth?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
