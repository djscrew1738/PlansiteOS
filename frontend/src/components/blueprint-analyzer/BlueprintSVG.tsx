// The SVG floor plan rendering component
export default function BlueprintSVG() {
  return (
    <svg viewBox="0 0 1200 800" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Outer walls */}
      <rect x="100" y="80" width="1000" height="640" fill="none" stroke="#2a5a9a" strokeWidth="3" />

      {/* Master Bath */}
      <rect x="100" y="80" width="450" height="350" fill="rgba(26,58,106,0.08)" stroke="#2a5a9a" strokeWidth="2" />
      <text x="325" y="265" textAnchor="middle" fill="#4a7ab5" fontFamily="'Space Mono', monospace" fontSize="14">
        MASTER BATH
      </text>
      <text x="325" y="285" textAnchor="middle" fill="#3a6a9a" fontFamily="'Space Mono', monospace" fontSize="11">
        12'-6" × 10'-2"
      </text>

      {/* Kitchen */}
      <rect x="550" y="80" width="550" height="350" fill="rgba(26,58,106,0.05)" stroke="#2a5a9a" strokeWidth="2" />
      <text x="825" y="265" textAnchor="middle" fill="#4a7ab5" fontFamily="'Space Mono', monospace" fontSize="14">
        KITCHEN
      </text>
      <text x="825" y="285" textAnchor="middle" fill="#3a6a9a" fontFamily="'Space Mono', monospace" fontSize="11">
        18'-0" × 10'-2"
      </text>

      {/* Bathroom 2 */}
      <rect x="100" y="430" width="500" height="290" fill="rgba(26,58,106,0.05)" stroke="#2a5a9a" strokeWidth="2" />
      <text x="350" y="585" textAnchor="middle" fill="#4a7ab5" fontFamily="'Space Mono', monospace" fontSize="14">
        BATHROOM 2
      </text>
      <text x="350" y="605" textAnchor="middle" fill="#3a6a9a" fontFamily="'Space Mono', monospace" fontSize="11">
        8'-4" × 6'-8"
      </text>

      {/* Utility / Laundry */}
      <rect x="600" y="430" width="500" height="290" fill="rgba(26,58,106,0.05)" stroke="#2a5a9a" strokeWidth="2" />
      <text x="850" y="585" textAnchor="middle" fill="#4a7ab5" fontFamily="'Space Mono', monospace" fontSize="14">
        UTILITY / LAUNDRY
      </text>
      <text x="850" y="605" textAnchor="middle" fill="#3a6a9a" fontFamily="'Space Mono', monospace" fontSize="11">
        10'-0" × 6'-8"
      </text>

      {/* Plumbing Fixtures */}
      {/* TUB - Master */}
      <rect x="150" y="120" width="80" height="50" rx="8" fill="rgba(0,212,255,0.15)" stroke="#00d4ff" strokeWidth="2" />
      <text x="190" y="150" textAnchor="middle" fill="#00d4ff" fontFamily="'Space Mono', monospace" fontSize="10">
        TUB
      </text>

      {/* SHWR - Master */}
      <circle cx="350" cy="140" r="22" fill="rgba(0,212,255,0.15)" stroke="#00d4ff" strokeWidth="2" />
      <text x="350" y="144" textAnchor="middle" fill="#00d4ff" fontFamily="'Space Mono', monospace" fontSize="9">
        SHWR
      </text>

      {/* WC - Master */}
      <rect x="420" y="130" width="40" height="30" rx="4" fill="rgba(0,212,255,0.15)" stroke="#00d4ff" strokeWidth="2" />
      <text x="440" y="150" textAnchor="middle" fill="#00d4ff" fontFamily="'Space Mono', monospace" fontSize="8">
        WC
      </text>

      {/* LAV - Master */}
      <rect x="160" y="340" width="50" height="40" rx="4" fill="rgba(0,212,255,0.15)" stroke="#00d4ff" strokeWidth="2" />
      <text x="185" y="365" textAnchor="middle" fill="#00d4ff" fontFamily="'Space Mono', monospace" fontSize="8">
        LAV
      </text>

      {/* SINK - Kitchen */}
      <rect x="750" y="120" width="70" height="50" rx="4" fill="rgba(0,212,255,0.15)" stroke="#00d4ff" strokeWidth="2" />
      <text x="785" y="150" textAnchor="middle" fill="#00d4ff" fontFamily="'Space Mono', monospace" fontSize="9">
        SINK
      </text>

      {/* DW - Kitchen */}
      <circle cx="950" cy="145" r="18" fill="rgba(0,212,255,0.15)" stroke="#00d4ff" strokeWidth="2" />
      <text x="950" y="149" textAnchor="middle" fill="#00d4ff" fontFamily="'Space Mono', monospace" fontSize="8">
        DW
      </text>

      {/* WC - Bath 2 */}
      <rect x="180" y="490" width="40" height="30" rx="4" fill="rgba(0,212,255,0.15)" stroke="#00d4ff" strokeWidth="2" />
      <text x="200" y="510" textAnchor="middle" fill="#00d4ff" fontFamily="'Space Mono', monospace" fontSize="8">
        WC
      </text>

      {/* LAV - Bath 2 */}
      <rect x="300" y="480" width="50" height="40" rx="4" fill="rgba(0,212,255,0.15)" stroke="#00d4ff" strokeWidth="2" />
      <text x="325" y="505" textAnchor="middle" fill="#00d4ff" fontFamily="'Space Mono', monospace" fontSize="8">
        LAV
      </text>

      {/* TUB - Bath 2 */}
      <rect x="420" y="490" width="45" height="35" rx="4" fill="rgba(0,212,255,0.15)" stroke="#00d4ff" strokeWidth="2" />
      <text x="443" y="512" textAnchor="middle" fill="#00d4ff" fontFamily="'Space Mono', monospace" fontSize="8">
        TUB
      </text>

      {/* W/D - Utility */}
      <rect x="700" y="490" width="60" height="50" rx="4" fill="rgba(0,212,255,0.15)" stroke="#00d4ff" strokeWidth="2" />
      <text x="730" y="520" textAnchor="middle" fill="#00d4ff" fontFamily="'Space Mono', monospace" fontSize="9">
        W/D
      </text>

      {/* SINK - Utility */}
      <rect x="850" y="500" width="50" height="40" rx="4" fill="rgba(0,212,255,0.15)" stroke="#00d4ff" strokeWidth="2" />
      <text x="875" y="524" textAnchor="middle" fill="#00d4ff" fontFamily="'Space Mono', monospace" fontSize="8">
        SINK
      </text>

      {/* Pipe Runs (dashed lines) */}
      <line x1="190" y1="170" x2="190" y2="340" stroke="#00d4ff" strokeWidth="1.5" strokeDasharray="6,4" opacity="0.5" />
      <line x1="190" y1="340" x2="350" y2="340" stroke="#00d4ff" strokeWidth="1.5" strokeDasharray="6,4" opacity="0.5" />
      <line x1="350" y1="162" x2="350" y2="340" stroke="#00d4ff" strokeWidth="1.5" strokeDasharray="6,4" opacity="0.5" />
      <line x1="440" y1="160" x2="440" y2="340" stroke="#00d4ff" strokeWidth="1.5" strokeDasharray="6,4" opacity="0.5" />
      <line x1="440" y1="340" x2="440" y2="490" stroke="#00d4ff" strokeWidth="1.5" strokeDasharray="6,4" opacity="0.4" />
      <line x1="785" y1="170" x2="785" y2="430" stroke="#00d4ff" strokeWidth="1.5" strokeDasharray="6,4" opacity="0.4" />
      <line x1="785" y1="430" x2="730" y2="490" stroke="#00d4ff" strokeWidth="1.5" strokeDasharray="6,4" opacity="0.4" />
    </svg>
  );
}
