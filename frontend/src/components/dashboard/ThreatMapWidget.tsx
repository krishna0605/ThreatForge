'use client';

import Widget from './Widget';
import { motion } from 'framer-motion';

interface ThreatLocation {
  lat: number;
  lng: number;
  country: string;
  city?: string;
  attacks: number;
  risk: string;
  color: string;
}

// Simple Mercator projection to map lat/lng to SVG coordinates
function latLngToXY(lat: number, lng: number, width: number, height: number) {
  const x = ((lng + 180) / 360) * width;
  const latRad = (lat * Math.PI) / 180;
  const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
  const y = height / 2 - (mercN * height) / (2 * Math.PI);
  return { x, y };
}

export default function ThreatMapWidget({ locations }: { locations: ThreatLocation[] }) {
  const W = 500;
  const H = 260;

  return (
    <Widget id="MAP_05">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-base font-bold text-text-main dark:text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">public</span>
          Global Threat Map
        </h3>
        <span className="px-2 py-0.5 border border-gray-300 dark:border-gray-600 text-[10px] font-mono text-text-muted dark:text-gray-500 tracking-wider cursor-pointer hover:border-primary hover:text-primary transition-colors">
          FULL VIEW
        </span>
      </div>
      <div className="relative h-52 bg-gray-100 dark:bg-gray-800/50 overflow-hidden rounded-sm">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
          {/* Simplified continent outlines */}
          <defs>
            <radialGradient id="dot-glow-red" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="dot-glow-yellow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="dot-glow-blue" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="dot-glow-green" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Continent shapes — simplified polygons */}
          {/* North America */}
          <path d="M60,60 L120,40 L145,65 L140,100 L120,120 L100,130 L85,110 L65,90 Z"
            fill="currentColor" className="text-gray-200 dark:text-gray-700" opacity="0.5" />
          {/* South America */}
          <path d="M115,145 L135,135 L145,160 L140,200 L125,220 L110,210 L105,175 Z"
            fill="currentColor" className="text-gray-200 dark:text-gray-700" opacity="0.5" />
          {/* Europe */}
          <path d="M230,50 L260,40 L275,55 L270,75 L250,80 L235,70 Z"
            fill="currentColor" className="text-gray-200 dark:text-gray-700" opacity="0.5" />
          {/* Africa */}
          <path d="M240,90 L270,85 L285,110 L280,160 L260,180 L240,170 L235,130 Z"
            fill="currentColor" className="text-gray-200 dark:text-gray-700" opacity="0.5" />
          {/* Asia */}
          <path d="M280,40 L390,35 L410,70 L400,100 L370,110 L340,100 L310,90 L290,70 Z"
            fill="currentColor" className="text-gray-200 dark:text-gray-700" opacity="0.5" />
          {/* Australia */}
          <path d="M380,165 L420,160 L435,180 L425,200 L395,195 L380,185 Z"
            fill="currentColor" className="text-gray-200 dark:text-gray-700" opacity="0.5" />
          {/* India */}
          <path d="M320,105 L340,100 L345,130 L330,145 L315,130 Z"
            fill="currentColor" className="text-gray-200 dark:text-gray-700" opacity="0.5" />

          {/* Connection lines between threat sources */}
          {locations.length >= 2 && locations.slice(0, 4).map((loc, i) => {
            const from = latLngToXY(loc.lat, loc.lng, W, H);
            const to = latLngToXY(locations[(i + 1) % locations.length].lat, locations[(i + 1) % locations.length].lng, W, H);
            return (
              <line key={`line-${i}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                stroke={loc.color} strokeWidth="0.5" opacity="0.3" strokeDasharray="3 3" />
            );
          })}

          {/* Threat dots */}
          {locations.map((loc, i) => {
            const { x, y } = latLngToXY(loc.lat, loc.lng, W, H);
            const size = Math.min(Math.max(loc.attacks / 200, 3), 10);
            const glowId = loc.risk === 'high' ? 'dot-glow-red' : loc.risk === 'medium' ? 'dot-glow-yellow' : loc.risk === 'low' ? 'dot-glow-blue' : 'dot-glow-green';

            return (
              <g key={i}>
                {/* Glow effect */}
                <circle cx={x} cy={y} r={size * 3} fill={`url(#${glowId})`} />
                {/* Pulsing ring */}
                <motion.circle
                  cx={x} cy={y} r={size}
                  fill="none" stroke={loc.color} strokeWidth="1" opacity="0.5"
                  animate={{ r: [size, size * 2, size], opacity: [0.5, 0, 0.5] }}
                  transition={{ repeat: Infinity, duration: 2.5, delay: i * 0.4 }}
                />
                {/* Core dot */}
                <motion.circle
                  cx={x} cy={y}
                  fill={loc.color}
                  animate={{ r: [size * 0.6, size * 0.8, size * 0.6] }}
                  transition={{ repeat: Infinity, duration: 2, delay: i * 0.3 }}
                  style={{ filter: `drop-shadow(0 0 4px ${loc.color})` }}
                />
                {/* Label */}
                <text x={x + size + 4} y={y + 3} fill="currentColor"
                  className="text-gray-500 dark:text-gray-400" fontSize="7" fontFamily="JetBrains Mono, monospace">
                  {loc.country}
                </text>
              </g>
            );
          })}
        </svg>

        {/* LIVE indicator */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
          <span className="text-[9px] font-mono text-gray-400">LIVE FEED</span>
        </div>

        {/* Legend */}
        <div className="absolute bottom-2 right-2 flex gap-3">
          {[
            { label: 'High', color: 'bg-red-500' },
            { label: 'Med', color: 'bg-yellow-500' },
            { label: 'Low', color: 'bg-blue-500' },
          ].map((l, i) => (
            <div key={i} className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${l.color}`} />
              <span className="text-[8px] font-mono text-gray-400">{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    </Widget>
  );
}
