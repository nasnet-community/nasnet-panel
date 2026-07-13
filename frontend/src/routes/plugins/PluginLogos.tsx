import React from 'react';

interface LogoProps {
  size?: number;
}

export const TelegramMtprotoLogo: React.FC<LogoProps> = ({ size = 48 }) => (
  <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label="Telegram MTProto logo">
    <defs>
      <linearGradient id="telegram-grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#37BBFE" />
        <stop offset="100%" stopColor="#007DBB" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="14" fill="url(#telegram-grad)" />
    <path
      d="M46.5 19.2 41 46.4c-.4 1.8-1.5 2.3-3 1.4l-8.3-6.1-4 3.8c-.4.4-.8.8-1.7.8l.6-8.6 15.6-14.1c.7-.6-.2-1-1-.4L20 33l-8.4-2.6c-1.8-.6-1.9-1.8.4-2.7l32.7-12.6c1.5-.5 2.9.4 1.8 4.1Z"
      fill="#ffffff"
    />
  </svg>
);

export const XrayLogo: React.FC<LogoProps> = ({ size = 48 }) => (
  <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label="V2Ray / Xray logo">
    <defs>
      <linearGradient id="xray-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#3B3F51" />
        <stop offset="100%" stopColor="#14161F" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="14" fill="url(#xray-grad)" />
    <path
      d="M20 19h7.3l4.7 7.3 4.7-7.3H44L36.7 32 44 45h-7.3L32 37.7 27.3 45H20l7.3-13L20 19Z"
      fill="#ffffff"
    />
  </svg>
);

export const DeltaChatLogo: React.FC<LogoProps> = ({ size = 48 }) => (
  <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label="DeltaChat logo">
    <defs>
      <linearGradient id="delta-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#22C55E" />
        <stop offset="100%" stopColor="#15803D" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="14" fill="url(#delta-grad)" />
    <path d="M14 46c0-13.3 8-26 18-26s18 12.7 18 26H40l-8-6-8 6H14Z" fill="#ffffff" />
    <path d="M27 38h10l-5-9-5 9Z" fill="#15803D" />
  </svg>
);

export const OONIProbeLogo: React.FC<LogoProps> = ({ size = 48 }) => (
  <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label="OONI Probe logo">
    <defs>
      <linearGradient id="ooni-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#0EA5E9" />
        <stop offset="100%" stopColor="#0F766E" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="14" fill="url(#ooni-grad)" />
    <circle cx="22" cy="32" r="6" fill="#ffffff" />
    <circle cx="22" cy="32" r="3" fill="#0F766E" />
    <circle cx="42" cy="32" r="6" fill="#ffffff" />
    <circle cx="42" cy="32" r="3" fill="#0F766E" />
    <path
      d="M16 44c4 2 8 3 16 3s12-1 16-3"
      fill="none"
      stroke="#ffffff"
      strokeWidth="3"
      strokeLinecap="round"
    />
  </svg>
);

export const NasnetMonitorLogo: React.FC<LogoProps> = ({ size = 48 }) => (
  <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label="NASNET Monitor logo">
    <defs>
      <linearGradient id="nasnet-monitor-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#6366F1" />
        <stop offset="100%" stopColor="#4338CA" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="14" fill="url(#nasnet-monitor-grad)" />
    <path
      d="M12 35h9l4-11 7 19 5-13 3 5h12"
      fill="none"
      stroke="#ffffff"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
