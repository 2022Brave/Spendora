import React from 'react';

interface SpendoraLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  textSize?: string;
}

/**
 * SPENDORA Official Brand Logo
 * Abstract geometric "S" formed from two flowing financial paths,
 * using the approved purple brand palette.
 */
export const SpendoraLogo: React.FC<SpendoraLogoProps> = ({
  className = '',
  size = 32,
  showText = false,
  textSize = 'text-lg',
}) => {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-xs"
        aria-label="Spendora Logo"
      >
        <defs>
          {/* Primary Flowing Gradient (Upper Financial Path) */}
          <linearGradient id="spendoraFlowUpper" x1="15" y1="15" x2="85" y2="65" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#C084FC" />
            <stop offset="45%" stopColor="#9333EA" />
            <stop offset="100%" stopColor="#7E22CE" />
          </linearGradient>
          {/* Complementary Flowing Gradient (Lower Financial Path) */}
          <linearGradient id="spendoraFlowLower" x1="85" y1="85" x2="15" y2="35" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#E9D5FF" />
            <stop offset="40%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#6B21A8" />
          </linearGradient>
          {/* Ambient Glow */}
          <radialGradient id="spendoraGlow" cx="50" cy="50" r="45" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#9333EA" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#9333EA" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient Subtle Purple Glow Backdrop */}
        <circle cx="50" cy="50" r="46" fill="url(#spendoraGlow)" />

        {/* Path 1: Upper Flowing Financial Path (sweeps right -> top-left -> center spine) */}
        <path
          d="M 82 22 C 78 12 60 8 46 8 C 26 8 14 18 14 34 C 14 50 32 56 52 62 C 64 65 72 70 72 78 C 72 82 68 86 60 88 C 68 82 72 76 72 70 C 72 58 56 53 38 48 C 24 44 22 34 22 28 C 22 18 34 14 48 14 C 62 14 74 18 82 22 Z"
          fill="url(#spendoraFlowUpper)"
        />

        {/* Path 2: Lower Flowing Financial Path (sweeps left -> bottom-right -> center spine) */}
        <path
          d="M 18 78 C 22 88 40 92 54 92 C 74 92 86 82 86 66 C 86 50 68 44 48 38 C 36 35 28 30 28 22 C 28 18 32 14 40 12 C 32 18 28 24 28 30 C 28 42 44 47 62 52 C 76 56 78 66 78 72 C 78 82 66 86 52 86 C 38 86 26 82 18 78 Z"
          fill="url(#spendoraFlowLower)"
        />

        {/* Flow Accents: Micro luminous nodes illustrating financial path velocity */}
        <circle cx="82" cy="22" r="3" fill="#E9D5FF" />
        <circle cx="18" cy="78" r="3" fill="#C084FC" />
      </svg>

      {showText && (
        <span className={`font-bold tracking-tight text-[#1E1B2E] dark:text-white ${textSize}`}>
          Spendora
        </span>
      )}
    </div>
  );
};
