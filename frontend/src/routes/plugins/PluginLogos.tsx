import React from 'react';

interface LogoProps {
  size?: number;
}

export const PsiphonConduitLogo: React.FC<LogoProps> = ({ size = 48 }) => (
  <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label="Psiphon Conduit logo">
    <defs>
      <linearGradient id="psiphon-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#7C3AED" />
        <stop offset="100%" stopColor="#4338CA" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="14" fill="url(#psiphon-grad)" />
    <path
      d="M20 18h14c6.6 0 12 5.4 12 12s-5.4 12-12 12h-5v6h-9V18Zm9 8v8h5a4 4 0 0 0 0-8h-5Z"
      fill="#ffffff"
    />
  </svg>
);

export const LanternUnboundedLogo: React.FC<LogoProps> = ({ size = 48 }) => (
  <svg
    viewBox="0 0 64 64"
    width={size}
    height={size}
    role="img"
    aria-label="Lantern Unbounded logo"
  >
    <defs>
      <linearGradient id="lantern-grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FBBF24" />
        <stop offset="100%" stopColor="#F97316" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="14" fill="url(#lantern-grad)" />
    <path
      d="M32 12v6M22 22h20M22 22v18a10 10 0 0 0 20 0V22M27 22v18M37 22v18M27 52h10"
      stroke="#ffffff"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <circle cx="32" cy="32" r="4" fill="#ffffff" opacity="0.9" />
  </svg>
);

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

export const TorBridgeLogo: React.FC<LogoProps> = ({ size = 48 }) => (
  <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label="Tor Bridge logo">
    <defs>
      <linearGradient id="tor-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#9059C8" />
        <stop offset="100%" stopColor="#5B2D86" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="14" fill="url(#tor-grad)" />
    <circle cx="32" cy="32" r="14" fill="none" stroke="#ffffff" strokeWidth="3" />
    <circle cx="32" cy="32" r="9" fill="none" stroke="#ffffff" strokeWidth="2" />
    <circle cx="32" cy="32" r="4" fill="#ffffff" />
    <path
      d="M32 14v6M32 44v6M14 32h6M44 32h6"
      stroke="#ffffff"
      strokeWidth="3"
      strokeLinecap="round"
    />
  </svg>
);

export const SnowflakeProxyLogo: React.FC<LogoProps> = ({ size = 48 }) => (
  <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label="Snowflake Proxy logo">
    <defs>
      <linearGradient id="snow-grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#60A5FA" />
        <stop offset="100%" stopColor="#1E40AF" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="14" fill="url(#snow-grad)" />
    <g stroke="#ffffff" strokeWidth="3" strokeLinecap="round" transform="translate(32 32)">
      <line x1="0" y1="-18" x2="0" y2="18" />
      <line x1="-15.6" y1="-9" x2="15.6" y2="9" />
      <line x1="-15.6" y1="9" x2="15.6" y2="-9" />
      <line x1="0" y1="-18" x2="-4" y2="-14" />
      <line x1="0" y1="-18" x2="4" y2="-14" />
      <line x1="0" y1="18" x2="-4" y2="14" />
      <line x1="0" y1="18" x2="4" y2="14" />
    </g>
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

export const OnionShareLogo: React.FC<LogoProps> = ({ size = 48 }) => (
  <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label="OnionShare logo">
    <defs>
      <linearGradient id="onion-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#A855F7" />
        <stop offset="100%" stopColor="#6B21A8" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="14" fill="url(#onion-grad)" />
    <path d="M32 12c-2 0-3 3-3 6s-6 4-6 12 4 22 9 22 9-14 9-22-4-9-6-12-2-6-3-6Z" fill="#ffffff" />
    <path
      d="M28 28c-2 4-2 10 0 16M36 28c2 4 2 10 0 16"
      stroke="#6B21A8"
      strokeWidth="2"
      fill="none"
    />
  </svg>
);

export const BriarMailboxLogo: React.FC<LogoProps> = ({ size = 48 }) => (
  <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label="Briar Mailbox logo">
    <defs>
      <linearGradient id="briar-grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#F97316" />
        <stop offset="100%" stopColor="#9A3412" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="14" fill="url(#briar-grad)" />
    <path
      d="M16 26a8 8 0 0 1 8-8h16a8 8 0 0 1 8 8v18a4 4 0 0 1-4 4H20a4 4 0 0 1-4-4V26Z"
      fill="#ffffff"
    />
    <path d="M22 28v8M30 28v8M38 28v8" stroke="#9A3412" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="32" cy="42" r="3" fill="#9A3412" />
  </svg>
);

export const CenoLogo: React.FC<LogoProps> = ({ size = 48 }) => (
  <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label="CENO Browser logo">
    <defs>
      <linearGradient id="ceno-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#14B8A6" />
        <stop offset="100%" stopColor="#115E59" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="14" fill="url(#ceno-grad)" />
    <circle cx="32" cy="32" r="16" fill="none" stroke="#ffffff" strokeWidth="3" />
    <circle cx="22" cy="22" r="3" fill="#ffffff" />
    <circle cx="42" cy="22" r="3" fill="#ffffff" />
    <circle cx="42" cy="42" r="3" fill="#ffffff" />
    <circle cx="22" cy="42" r="3" fill="#ffffff" />
    <path d="m24 24 16 16M40 24 24 40" stroke="#ffffff" strokeWidth="2" />
  </svg>
);

export const MailpileLogo: React.FC<LogoProps> = ({ size = 48 }) => (
  <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label="Mailpile logo">
    <defs>
      <linearGradient id="mp-grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FCD34D" />
        <stop offset="100%" stopColor="#B45309" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="14" fill="url(#mp-grad)" />
    <path d="M14 22h28v22H14z" fill="#ffffff" opacity="0.6" />
    <path d="M18 18h28v22H18z" fill="#ffffff" opacity="0.8" />
    <path d="M22 14h28v22H22z" fill="#ffffff" />
    <path d="m22 14 14 11 14-11" fill="none" stroke="#B45309" strokeWidth="2.5" />
    <path d="m14 50 36-8" stroke="#B45309" strokeWidth="2" fill="none" opacity="0.5" />
  </svg>
);

export const FDroidLogo: React.FC<LogoProps> = ({ size = 48 }) => (
  <svg
    viewBox="0 0 64 64"
    width={size}
    height={size}
    role="img"
    aria-label="F-Droid Repository logo"
  >
    <defs>
      <linearGradient id="fd-grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1976D2" />
        <stop offset="100%" stopColor="#0D47A1" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="14" fill="url(#fd-grad)" />
    <path d="M22 16v-2M42 16v-2" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
    <path
      d="M20 22a4 4 0 0 1 4-4h16a4 4 0 0 1 4 4v18a4 4 0 0 1-4 4H24a4 4 0 0 1-4-4V22Z"
      fill="#ffffff"
    />
    <circle cx="26" cy="28" r="2" fill="#0D47A1" />
    <circle cx="38" cy="28" r="2" fill="#0D47A1" />
    <path d="M18 50v-4M46 50v-4" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export const I2pdLogo: React.FC<LogoProps> = ({ size = 48 }) => (
  <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label="i2pd logo">
    <defs>
      <linearGradient id="i2pd-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#4B5563" />
        <stop offset="100%" stopColor="#111827" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="14" fill="url(#i2pd-grad)" />
    <path
      d="M32 12c-3 0-4 4-4 6s-8 4-8 14 6 20 12 20 12-10 12-20-6-12-8-14-1-6-4-6Z"
      fill="#ffffff"
    />
    <path
      d="M26 30c-2 4-2 12 0 18M38 30c2 4 2 12 0 18M32 22v32"
      stroke="#111827"
      strokeWidth="2"
      fill="none"
    />
  </svg>
);

export const SecureDropLogo: React.FC<LogoProps> = ({ size = 48 }) => (
  <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label="SecureDrop logo">
    <defs>
      <linearGradient id="sd-grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1F2937" />
        <stop offset="100%" stopColor="#111827" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="14" fill="url(#sd-grad)" />
    <path
      d="M32 10c8 0 14 6 14 14v6h2a4 4 0 0 1 4 4v16a4 4 0 0 1-4 4H16a4 4 0 0 1-4-4V34a4 4 0 0 1 4-4h2v-6c0-8 6-14 14-14Zm0 6c-4 0-8 4-8 8v6h16v-6c0-4-4-8-8-8Z"
      fill="#ffffff"
    />
    <circle cx="32" cy="44" r="3" fill="#111827" />
  </svg>
);

export const GlobaLeaksLogo: React.FC<LogoProps> = ({ size = 48 }) => (
  <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label="GlobaLeaks logo">
    <defs>
      <linearGradient id="gl-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#EF4444" />
        <stop offset="100%" stopColor="#7F1D1D" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="14" fill="url(#gl-grad)" />
    <circle cx="32" cy="32" r="16" fill="none" stroke="#ffffff" strokeWidth="3" />
    <path
      d="M16 32h32M32 16c5 4 8 10 8 16s-3 12-8 16c-5-4-8-10-8-16s3-12 8-16Z"
      stroke="#ffffff"
      strokeWidth="3"
      fill="none"
    />
  </svg>
);

export const BitmaskLogo: React.FC<LogoProps> = ({ size = 48 }) => (
  <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label="Bitmask Gateway logo">
    <defs>
      <linearGradient id="bm-grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#38BDF8" />
        <stop offset="100%" stopColor="#0C4A6E" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="14" fill="url(#bm-grad)" />
    <path d="M14 26c0-4 4-6 8-6h20c4 0 8 2 8 6v6c0 8-8 16-18 16S14 40 14 32v-6Z" fill="#ffffff" />
    <ellipse cx="24" cy="30" rx="3" ry="2" fill="#0C4A6E" />
    <ellipse cx="40" cy="30" rx="3" ry="2" fill="#0C4A6E" />
    <path
      d="M30 36c1 1 3 1 4 0"
      stroke="#0C4A6E"
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

export const MagicWormholeLogo: React.FC<LogoProps> = ({ size = 48 }) => (
  <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label="Magic Wormhole logo">
    <defs>
      <radialGradient id="mw-grad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#0B0F1F" />
        <stop offset="60%" stopColor="#6D28D9" />
        <stop offset="100%" stopColor="#312E81" />
      </radialGradient>
    </defs>
    <rect width="64" height="64" rx="14" fill="url(#mw-grad)" />
    <circle cx="32" cy="32" r="20" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.6" />
    <circle cx="32" cy="32" r="14" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.75" />
    <circle cx="32" cy="32" r="8" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.9" />
    <circle cx="32" cy="32" r="3" fill="#ffffff" />
  </svg>
);

export const CabalLogo: React.FC<LogoProps> = ({ size = 48 }) => (
  <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label="Cabal logo">
    <defs>
      <linearGradient id="cabal-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#F472B6" />
        <stop offset="100%" stopColor="#9D174D" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="14" fill="url(#cabal-grad)" />
    <circle cx="32" cy="20" r="6" fill="#ffffff" />
    <circle cx="18" cy="40" r="6" fill="#ffffff" />
    <circle cx="46" cy="40" r="6" fill="#ffffff" />
    <path d="M32 20 18 40M32 20 46 40M18 40h28" stroke="#ffffff" strokeWidth="2.5" />
  </svg>
);

export const ConjureLogo: React.FC<LogoProps> = ({ size = 48 }) => (
  <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label="Conjure logo">
    <defs>
      <linearGradient id="conj-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#1E293B" />
        <stop offset="100%" stopColor="#0F172A" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="14" fill="url(#conj-grad)" />
    <path d="M32 14l3 9 9 3-9 3-3 9-3-9-9-3 9-3 3-9Z" fill="#FBBF24" />
    <circle cx="48" cy="20" r="2" fill="#FBBF24" />
    <circle cx="18" cy="46" r="2" fill="#FBBF24" />
    <circle cx="50" cy="44" r="1.5" fill="#FBBF24" />
  </svg>
);

export const CwtchLogo: React.FC<LogoProps> = ({ size = 48 }) => (
  <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label="Cwtch logo">
    <defs>
      <linearGradient id="cwtch-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FB7185" />
        <stop offset="100%" stopColor="#BE123C" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="14" fill="url(#cwtch-grad)" />
    <path d="M32 50s-16-9-16-22a8 8 0 0 1 16-4 8 8 0 0 1 16 4c0 13-16 22-16 22Z" fill="#ffffff" />
    <circle cx="26" cy="28" r="2" fill="#BE123C" />
    <circle cx="38" cy="28" r="2" fill="#BE123C" />
    <path
      d="M28 34c2 2 6 2 8 0"
      stroke="#BE123C"
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);
