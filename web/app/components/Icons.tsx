import type { ReactNode } from 'react';

type IconProps = { className?: string; size?: number };

const defaults = { size: 24, className: '' };

function Svg({ children, className, size }: IconProps & { children: ReactNode }) {
  return (
    <svg
      className={className}
      width={size ?? 24}
      height={size ?? 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

export function IconLock(props: IconProps) {
  return (
    <Svg {...{ ...defaults, ...props }}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </Svg>
  );
}

export function IconScan(props: IconProps) {
  return (
    <Svg {...{ ...defaults, ...props }}>
      <path d="M4 7V5a1 1 0 0 1 1-1h2" />
      <path d="M4 17v2a1 1 0 0 0 1 1h2" />
      <path d="M20 7V5a1 1 0 0 0-1-1h-2" />
      <path d="M20 17v2a1 1 0 0 1-1 1h-2" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </Svg>
  );
}

export function IconChart(props: IconProps) {
  return (
    <Svg {...{ ...defaults, ...props }}>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </Svg>
  );
}

export function IconExport(props: IconProps) {
  return (
    <Svg {...{ ...defaults, ...props }}>
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </Svg>
  );
}

export function IconCloud(props: IconProps) {
  return (
    <Svg {...{ ...defaults, ...props }}>
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
    </Svg>
  );
}

export function IconLayers(props: IconProps) {
  return (
    <Svg {...{ ...defaults, ...props }}>
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </Svg>
  );
}

export function IconMobile(props: IconProps) {
  return (
    <Svg {...{ ...defaults, ...props }}>
      <rect x="7" y="2" width="10" height="20" rx="2" />
      <line x1="11" y1="18" x2="13" y2="18" />
    </Svg>
  );
}

export function IconShield(props: IconProps) {
  return (
    <Svg {...{ ...defaults, ...props }}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </Svg>
  );
}

export function IconZap(props: IconProps) {
  return (
    <Svg {...{ ...defaults, ...props }}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </Svg>
  );
}

export function IconServer(props: IconProps) {
  return (
    <Svg {...{ ...defaults, ...props }}>
      <rect x="2" y="3" width="20" height="8" rx="2" />
      <rect x="2" y="13" width="20" height="8" rx="2" />
      <line x1="6" y1="7" x2="6.01" y2="7" />
      <line x1="6" y1="17" x2="6.01" y2="17" />
    </Svg>
  );
}

export function IconCheck(props: IconProps) {
  return (
    <Svg {...{ ...defaults, ...props }}>
      <polyline points="20 6 9 17 4 12" />
    </Svg>
  );
}

export function IconChevronRight(props: IconProps) {
  return (
    <Svg {...{ ...defaults, ...props }}>
      <polyline points="9 18 15 12 9 6" />
    </Svg>
  );
}

export function IconMail(props: IconProps) {
  return (
    <Svg {...{ ...defaults, ...props }}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </Svg>
  );
}

export type ServiceIconName = 'lock' | 'scan' | 'chart' | 'export' | 'cloud' | 'layers';

const serviceIconMap = {
  lock: IconLock,
  scan: IconScan,
  chart: IconChart,
  export: IconExport,
  cloud: IconCloud,
  layers: IconLayers,
};

export function ServiceIcon({ name, ...props }: IconProps & { name: ServiceIconName }) {
  const Icon = serviceIconMap[name];
  return <Icon {...props} />;
}
