import React from 'react';

/**
 * Modern Isometric Cozy Tree
 * Minimalist geometric sphere/cylinder crown with soft ground shadow
 */
export const IsometricTree: React.FC<{
  x: number;
  y: number;
  variant?: 'round' | 'cypress';
  size?: 'sm' | 'md';
  isDarkMode?: boolean;
}> = ({ x, y, variant = 'round', size = 'md', isDarkMode = false }) => {
  const r = size === 'sm' ? 4.5 : 6.5;
  const h = size === 'sm' ? 10 : 14;

  const trunkColor = isDarkMode ? '#475569' : '#78350f';
  const leafColor1 = isDarkMode ? '#166534' : '#22c55e';
  const leafColor2 = isDarkMode ? '#15803d' : '#4ade80';

  if (variant === 'cypress') {
    return (
      <g>
        <ellipse cx={x} cy={y + 1} rx={r * 0.7} ry={r * 0.35} fill="rgba(0,0,0,0.14)" />
        {/* Trunk */}
        <line x1={x} y1={y} x2={x} y2={y - 4} stroke={trunkColor} strokeWidth="1.2" />
        {/* Slender tapered crown */}
        <polygon
          points={`${x - r * 0.6},${y - 3} ${x},${y - h - 4} ${x + r * 0.6},${y - 3}`}
          fill={leafColor1}
        />
        <polygon
          points={`${x},${y - h - 4} ${x + r * 0.6},${y - 3} ${x},${y - 1}`}
          fill={leafColor2}
          opacity="0.8"
        />
      </g>
    );
  }

  return (
    <g>
      {/* Ground soft shadow */}
      <ellipse cx={x + 1} cy={y + 1.5} rx={r} ry={r * 0.55} fill="rgba(0,0,0,0.14)" />

      {/* Trunk */}
      <line x1={x} y1={y} x2={x} y2={y - 6} stroke={trunkColor} strokeWidth="1.5" strokeLinecap="round" />

      {/* Foliage Layers */}
      <circle cx={x} cy={y - 8} r={r} fill={leafColor1} />
      <circle cx={x - 1} cy={y - 9.5} r={r * 0.75} fill={leafColor2} opacity="0.85" />
      <circle cx={x - 1.5} cy={y - 11} r={r * 0.35} fill="#bbf7d0" opacity={isDarkMode ? 0.3 : 0.6} />
    </g>
  );
};

/**
 * Modern Slender Street Lamp with Night Light Glow
 */
export const IsometricStreetLamp: React.FC<{
  x: number;
  y: number;
  isDarkMode?: boolean;
}> = ({ x, y, isDarkMode = false }) => {
  const poleColor = isDarkMode ? '#94a3b8' : '#64748b';
  const lightAmber = '#fde047';

  return (
    <g>
      {/* Base shadow */}
      <ellipse cx={x} cy={y + 0.5} rx={2} ry={1} fill="rgba(0,0,0,0.15)" />

      {/* Night Warm Light Pool on the Ground */}
      {isDarkMode && (
        <ellipse
          cx={x}
          cy={y + 2}
          rx={14}
          ry={7}
          fill="url(#lampGlowGrad)"
          opacity="0.75"
        />
      )}

      {/* Slender Pole */}
      <line x1={x} y1={y} x2={x} y2={y - 18} stroke={poleColor} strokeWidth="1.2" strokeLinecap="round" />
      {/* Curved Arm */}
      <path
        d={`M ${x} ${y - 18} Q ${x + 2} ${y - 21} ${x + 5} ${y - 19}`}
        fill="none"
        stroke={poleColor}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      {/* Lamp Head */}
      <rect x={x + 3.5} y={y - 19} width="3" height="1.5" rx="0.5" fill={poleColor} />

      {/* Glowing Light Bulb / Flare */}
      <circle
        cx={x + 5}
        cy={y - 17.5}
        r={isDarkMode ? 2.5 : 1.2}
        fill={lightAmber}
        opacity={isDarkMode ? 0.95 : 0.7}
      />
      {isDarkMode && (
        <circle cx={x + 5} cy={y - 17.5} r={5} fill={lightAmber} opacity="0.3" />
      )}
    </g>
  );
};

/**
 * Contemporary Park Bench (wood slats & steel legs)
 */
export const IsometricBench: React.FC<{
  x: number;
  y: number;
  angle?: 'left' | 'right';
  isDarkMode?: boolean;
}> = ({ x, y, angle = 'right', isDarkMode = false }) => {
  const woodColor = isDarkMode ? '#b45309' : '#d97706';
  const metalColor = isDarkMode ? '#64748b' : '#475569';

  return (
    <g>
      {/* Bench shadow */}
      <ellipse cx={x} cy={y + 1} rx={4.5} ry={2} fill="rgba(0,0,0,0.12)" />

      {/* Legs */}
      <line x1={x - 3} y1={y + 1} x2={x - 3} y2={y - 2} stroke={metalColor} strokeWidth="0.8" />
      <line x1={x + 3} y1={y + 1} x2={x + 3} y2={y - 2} stroke={metalColor} strokeWidth="0.8" />

      {/* Seat slat */}
      <polygon
        points={`${x - 4},${y - 2} ${x + 4},${y - 2} ${x + 4},${y - 3.5} ${x - 4},${y - 3.5}`}
        fill={woodColor}
      />
      {/* Backrest slat */}
      <polygon
        points={`${x - 4},${y - 4} ${x + 4},${y - 4} ${x + 4},${y - 5.5} ${x - 4},${y - 5.5}`}
        fill={woodColor}
      />
    </g>
  );
};

/**
 * Minimalist Bicycle Rack
 */
export const IsometricBikeRack: React.FC<{
  x: number;
  y: number;
  isDarkMode?: boolean;
}> = ({ x, y, isDarkMode = false }) => {
  const metal = isDarkMode ? '#94a3b8' : '#64748b';
  return (
    <g>
      <path
        d={`M ${x - 3} ${y} L ${x - 3} ${y - 4} Q ${x} ${y - 6} ${x + 3} ${y - 4} L ${x + 3} ${y}`}
        fill="none"
        stroke={metal}
        strokeWidth="0.9"
      />
    </g>
  );
};

/**
 * Clean Pedestrian Zebra Crosswalk
 */
export const IsometricZebraCrossing: React.FC<{
  isoX: number;
  isoY: number;
  isDarkMode?: boolean;
}> = ({ isoX, isoY, isDarkMode = false }) => {
  const stripeColor = isDarkMode ? '#94a3b8' : '#ffffff';
  const opacity = isDarkMode ? 0.45 : 0.75;

  return (
    <g opacity={opacity}>
      <line x1={isoX - 8} y1={isoY - 4} x2={isoX - 2} y2={isoY - 1} stroke={stripeColor} strokeWidth="1.6" strokeLinecap="round" />
      <line x1={isoX - 3} y1={isoY - 1.5} x2={isoX + 3} y2={isoY + 1.5} stroke={stripeColor} strokeWidth="1.6" strokeLinecap="round" />
      <line x1={isoX + 2} y1={isoY + 1} x2={isoX + 8} y2={isoY + 4} stroke={stripeColor} strokeWidth="1.6" strokeLinecap="round" />
    </g>
  );
};

/**
 * Minimalist Lock Badge (Clean stroke lock, no cartoon emoji)
 */
export const MinimalLockBadge: React.FC<{
  x: number;
  y: number;
  size?: number;
  isDark?: boolean;
}> = ({ x, y, size = 16, isDark = false }) => {
  const half = size / 2;
  return (
    <g transform={`translate(${x - half}, ${y - half})`} className="pointer-events-none select-none">
      <rect
        x="0"
        y="0"
        width={size}
        height={size}
        rx={size / 2}
        fill={isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.9)'}
        stroke={isDark ? 'rgba(148, 163, 184, 0.3)' : 'rgba(148, 163, 184, 0.4)'}
        strokeWidth="1"
      />
      {/* Clean minimal padlock icon */}
      <path
        d={`M ${half - 2.5} ${half - 1} V ${half - 3.5} A 2.5 2.5 0 0 1 ${half + 2.5} ${half - 3.5} V ${half - 1}`}
        fill="none"
        stroke={isDark ? '#cbd5e1' : '#64748b'}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <rect
        x={half - 3.5}
        y={half - 1}
        width="7"
        height="5.5"
        rx="1"
        fill={isDark ? '#cbd5e1' : '#64748b'}
      />
      <circle cx={half} cy={half + 1.5} r="0.8" fill={isDark ? '#0f172a' : '#ffffff'} />
    </g>
  );
};
