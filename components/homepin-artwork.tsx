import type { ReactElement } from "react";

/** Crisp house + location-pin mark matching the HomeTayo PWA SVG icon.
 * No logo text is baked into the icon so it remains legible at 32–192px.
 */
export function HomePinArtwork({
  size = 512,
  maskable = false,
}: {
  size?: number;
  maskable?: boolean;
}): ReactElement {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 512 512" aria-label="HomeTayo icon">
      <defs>
        <linearGradient id="tile" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#196247"/>
          <stop offset=".52" stopColor="#0c4332"/>
          <stop offset="1" stopColor="#072a22"/>
        </linearGradient>
        <linearGradient id="ivory" x1="0" y1="0" x2=".86" y2="1">
          <stop offset="0" stopColor="#fffdf5"/>
          <stop offset="1" stopColor="#eee8d6"/>
        </linearGradient>
        <radialGradient id="gold" cx=".35" cy=".22" r=".85">
          <stop offset="0" stopColor="#f8d98b"/>
          <stop offset=".66" stopColor="#e5b558"/>
          <stop offset="1" stopColor="#ba8736"/>
        </radialGradient>
      </defs>
      <rect width="512" height="512" rx={maskable ? 0 : 108} fill="url(#tile)"/>
      {maskable ? null : <rect x="4" y="4" width="504" height="504" rx="105" fill="none" stroke="#f1f5dd" strokeOpacity=".09" strokeWidth="6"/>}
      <g transform={maskable ? "translate(64 64) scale(.75)" : undefined}>
        <rect x="341" y="140" width="36" height="88" rx="12" fill="url(#ivory)"/>
        <path d="M119 229 256 109 391 229" fill="none" stroke="url(#ivory)" strokeWidth="36" strokeLinejoin="round" strokeLinecap="round"/>
        <path d="M163 227v97c0 19 9 31 24 44l69 64 69-64c15-13 24-25 24-44v-97" fill="none" stroke="url(#ivory)" strokeWidth="33" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M193 335c0-36 28-65 63-65s63 29 63 65c0 42-63 96-63 96s-63-54-63-96Z" fill="none" stroke="url(#ivory)" strokeWidth="29" strokeLinejoin="round"/>
        <circle cx="256" cy="335" r="28" fill="url(#gold)"/>
      </g>
    </svg>
  );
}
