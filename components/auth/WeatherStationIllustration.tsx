export default function WeatherStationIllustration() {
  return (
    <svg
      viewBox="0 0 320 180"
      className="w-full h-auto rounded-lg"
      role="img"
      aria-label="Illustration of a weather station mast against a night sky"
    >
      <defs>
        <linearGradient id="skyGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#0e1a2e" />
          <stop offset="100%" stopColor="#080c14" />
        </linearGradient>
        <linearGradient id="hillGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#132033" />
          <stop offset="100%" stopColor="#0a1220" />
        </linearGradient>
      </defs>

      <rect width="320" height="180" fill="url(#skyGrad)" />

      {/* Stars */}
      {[
        [30, 20], [70, 40], [110, 18], [160, 30], [200, 15], [250, 35], [280, 22], [50, 55], [230, 55],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={1.1} fill="#c3f5ff" opacity={0.6} />
      ))}

      {/* Rolling hills */}
      <path d="M0 130 Q 60 100, 120 125 T 240 120 T 320 128 V180 H0 Z" fill="url(#hillGrad)" />

      {/* Mast tower */}
      <g stroke="#94a3b8" strokeWidth={1.5} fill="none">
        <line x1="160" y1="150" x2="150" y2="60" />
        <line x1="160" y1="150" x2="170" y2="60" />
        <line x1="150" y1="60" x2="170" y2="60" />
        <line x1="153" y1="120" x2="167" y2="120" />
        <line x1="151" y1="95" x2="169" y2="95" />
        <line x1="150" y1="60" x2="167" y2="120" />
        <line x1="170" y1="60" x2="153" y2="120" />
      </g>

      {/* Anemometer arms */}
      <g stroke="#00e5ff" strokeWidth={1.5}>
        <line x1="160" y1="55" x2="160" y2="40" />
        <line x1="160" y1="40" x2="145" y2="32" />
        <line x1="160" y1="40" x2="175" y2="30" />
        <circle cx="160" cy="40" r={2.5} fill="#00e5ff" />
      </g>

      {/* Solar panel + sensor box */}
      <rect x="140" y="128" width="18" height="10" rx="1.5" fill="#12314a" stroke="#00e5ff" strokeWidth={1} />
      <rect x="162" y="130" width="10" height="8" rx="1.5" fill="#1a2333" stroke="#94a3b8" strokeWidth={1} />

      {/* Beacon glow */}
      <circle cx="160" cy="40" r={5} fill="#00e5ff" opacity={0.25}>
        <animate attributeName="opacity" values="0.15;0.4;0.15" dur="2.5s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}