export function AIMascot() {
  return (
    <div className="relative">
      {/* Multi-layer Glow effect background */}
      <div className="absolute inset-0 blur-3xl opacity-70 animate-pulse">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-600 rounded-full"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-violet-500 rounded-full"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-fuchsia-400 rounded-full"></div>
      </div>

      {/* Mascot SVG */}
      <svg 
        width="400" 
        height="500" 
        viewBox="0 0 400 500" 
        className="relative z-10 max-w-full h-auto"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Advanced Gradients */}
          <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#c4a9e8">
              <animate attributeName="stop-color" values="#c4a9e8;#b094db;#c4a9e8" dur="4s" repeatCount="indefinite"/>
            </stop>
            <stop offset="50%" stopColor="#9d78cf" />
            <stop offset="100%" stopColor="#7c63b8" />
          </linearGradient>
          
          <linearGradient id="headGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#d9c8ed" />
            <stop offset="50%" stopColor="#c4a9e8" />
            <stop offset="100%" stopColor="#b094db" />
          </linearGradient>

          <radialGradient id="eyeGradient" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#eee6f5" />
            <stop offset="40%" stopColor="#d9c8ed" />
            <stop offset="100%" stopColor="#b094db" />
          </radialGradient>

          <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#eee6f5" />
            <stop offset="50%" stopColor="#d9c8ed" />
            <stop offset="100%" stopColor="#b094db" />
          </linearGradient>

          <linearGradient id="coreGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#eee6f5">
              <animate attributeName="stop-color" values="#eee6f5;#d9c8ed;#eee6f5" dur="2s" repeatCount="indefinite"/>
            </stop>
            <stop offset="100%" stopColor="#a88bc9" />
          </linearGradient>

          <linearGradient id="limbGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#b094db" />
            <stop offset="50%" stopColor="#9d78cf" />
            <stop offset="100%" stopColor="#8b6bc5" />
          </linearGradient>

          {/* Advanced Filters */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          <filter id="strongGlow">
            <feGaussianBlur stdDeviation="10" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          <filter id="ultraGlow">
            <feGaussianBlur stdDeviation="15" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          <filter id="innerGlow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* Patterns */}
          <pattern id="circuitPattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="20" cy="20" r="1.5" fill="#b094db" opacity="0.25"/>
            <line x1="20" y1="20" x2="40" y2="20" stroke="#b094db" strokeWidth="0.5" opacity="0.15"/>
            <line x1="20" y1="20" x2="20" y2="40" stroke="#b094db" strokeWidth="0.5" opacity="0.15"/>
          </pattern>
        </defs>

        {/* Background circuit grid */}
        <rect x="0" y="0" width="400" height="500" fill="url(#circuitPattern)" opacity="0.15"/>

        {/* Head */}
        <g transform="translate(200, 100)">
          <ellipse cx="0" cy="0" rx="65" ry="70" fill="url(#headGradient)" filter="url(#glow)"/>
          <ellipse cx="-15" cy="-25" rx="30" ry="25" fill="#faf5ff" opacity="0.35" filter="url(#innerGlow)"/>
          <path d="M -45 -5 L -45 10 Q -45 15 -40 15 L 40 15 Q 45 15 45 10 L 45 -5 Q 45 -10 40 -10 L -40 -10 Q -45 -10 -45 -5 Z" fill="#2d2550" opacity="0.2" filter="url(#innerGlow)"/>

          {/* Antenna */}
          <g filter="url(#strongGlow)">
            <line x1="0" y1="-70" x2="0" y2="-95" stroke="url(#coreGradient)" strokeWidth="5" strokeLinecap="round"/>
            <circle cx="0" cy="-100" r="12" fill="#6d5a8c" opacity="0.4">
              <animate attributeName="r" values="12;14;12" dur="2s" repeatCount="indefinite"/>
            </circle>
            <circle cx="0" cy="-100" r="9" fill="url(#coreGradient)">
              <animate attributeName="opacity" values="1;0.7;1" dur="1.5s" repeatCount="indefinite"/>
            </circle>
            <circle cx="0" cy="-100" r="5" fill="#eee6f5">
              <animate attributeName="r" values="5;6;5" dur="1.5s" repeatCount="indefinite"/>
            </circle>
            <g opacity="0.8">
              <line x1="-25" y1="-65" x2="-15" y2="-75" stroke="#b094db" strokeWidth="3" strokeLinecap="round"/>
              <circle cx="-28" cy="-62" r="4" fill="#d9c8ed"/>
              <line x1="25" y1="-65" x2="15" y2="-75" stroke="#b094db" strokeWidth="3" strokeLinecap="round"/>
              <circle cx="28" cy="-62" r="4" fill="#d9c8ed"/>
            </g>
          </g>

          {/* Eyes */}
          <g filter="url(#strongGlow)">
            <g transform="translate(-25, 0)">
              <ellipse rx="20" ry="24" fill="#6d5a8c" opacity="0.4"/>
              <ellipse rx="16" ry="20" fill="#2d2550"/>
              <ellipse rx="11" ry="15" fill="url(#eyeGradient)">
                <animate attributeName="ry" values="15;16;15" dur="3s" repeatCount="indefinite"/>
              </ellipse>
              <circle cy="-5" r="5" fill="#eee6f5">
                <animate attributeName="opacity" values="1;0.8;1" dur="2s" repeatCount="indefinite"/>
              </circle>
              <circle cx="4" cy="-2" r="3" fill="#eee6f5" opacity="0.6"/>
              <ellipse cy="8" rx="6" ry="2" fill="#b094db" opacity="0.3"/>
            </g>
            <g transform="translate(25, 0)">
              <ellipse rx="20" ry="24" fill="#6d5a8c" opacity="0.4"/>
              <ellipse rx="16" ry="20" fill="#2d2550"/>
              <ellipse rx="11" ry="15" fill="url(#eyeGradient)">
                <animate attributeName="ry" values="15;16;15" dur="3s" repeatCount="indefinite"/>
              </ellipse>
              <circle cy="-5" r="5" fill="#eee6f5">
                <animate attributeName="opacity" values="1;0.8;1" dur="2s" repeatCount="indefinite"/>
              </circle>
              <circle cx="4" cy="-2" r="3" fill="#eee6f5" opacity="0.6"/>
              <ellipse cy="8" rx="6" ry="2" fill="#b094db" opacity="0.3"/>
            </g>
          </g>

          {/* Cheeks */}
          <g filter="url(#innerGlow)">
            <circle cx="-55" cy="8" r="8" fill="#d9c8ed" opacity="0.4"/>
            <circle cx="-55" cy="8" r="5" fill="#eee6f5" opacity="0.3"/>
            <circle cx="55" cy="8" r="8" fill="#d9c8ed" opacity="0.4"/>
            <circle cx="55" cy="8" r="5" fill="#eee6f5" opacity="0.3"/>
          </g>

          {/* Smile */}
          <g filter="url(#glow)">
            <path d="M -35 25 Q 0 42 35 25" stroke="#d9c8ed" strokeWidth="5" strokeLinecap="round" fill="none"/>
            <path d="M -35 25 Q 0 39 35 25" stroke="#eee6f5" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.5"/>
            <circle cx="-35" cy="25" r="3" fill="#eee6f5" opacity="0.6"/>
            <circle cx="35" cy="25" r="3" fill="#eee6f5" opacity="0.6"/>
          </g>

          {/* UI elements */}
          <g opacity="0.3">
            <line x1="-60" y1="-15" x2="-70" y2="-15" stroke="#b094db" strokeWidth="1"/>
            <line x1="-60" y1="-8" x2="-68" y2="-8" stroke="#b094db" strokeWidth="1"/>
            <line x1="60" y1="-15" x2="70" y2="-15" stroke="#b094db" strokeWidth="1"/>
            <line x1="60" y1="-8" x2="68" y2="-8" stroke="#b094db" strokeWidth="1"/>
          </g>
        </g>

        {/* Neck */}
        <g transform="translate(200, 170)">
          <rect x="-25" y="0" width="50" height="30" rx="15" fill="url(#bodyGradient)" filter="url(#glow)"/>
          <g stroke="#d9c8ed" strokeWidth="1" opacity="0.3">
            <line x1="-20" y1="8" x2="20" y2="8"/>
            <line x1="-20" y1="15" x2="20" y2="15"/>
            <line x1="-20" y1="22" x2="20" y2="22"/>
          </g>
          <circle cx="-18" cy="15" r="2" fill="#b094db" filter="url(#innerGlow)">
            <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite"/>
          </circle>
          <circle cx="18" cy="15" r="2" fill="#b094db" filter="url(#innerGlow)">
            <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" begin="1s"/>
          </circle>
        </g>

        {/* Body - simplified for brevity, keeping core structure */}
        <g transform="translate(200, 220)">
          <path d="M -75 0 L -70 75 Q -70 92 -50 95 L 50 95 Q 70 92 70 75 L 75 0 Q 70 -10 0 -10 Q -70 -10 -75 0 Z" fill="url(#bodyGradient)" filter="url(#glow)"/>
          
          {/* Chest Core */}
          <g filter="url(#ultraGlow)">
            <circle cx="0" cy="40" r="28" fill="none" stroke="#b094db" strokeWidth="3">
              <animate attributeName="stroke-opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite"/>
            </circle>
            <circle cx="0" cy="40" r="22" fill="#6d5a8c" opacity="0.5"/>
            <circle cx="0" cy="40" r="18" fill="url(#coreGradient)"/>
            <circle cx="0" cy="40" r="12" fill="#eee6f5">
              <animate attributeName="r" values="12;14;12" dur="2s" repeatCount="indefinite"/>
            </circle>
            <circle cx="0" cy="40" r="7" fill="#fafafa">
              <animate attributeName="opacity" values="0.8;1;0.8" dur="1s" repeatCount="indefinite"/>
            </circle>
          </g>
        </g>

        {/* Pulse rings */}
        <g transform="translate(200, 260)">
          <circle cx="0" cy="0" r="28" fill="none" stroke="#b094db" strokeWidth="2.5" opacity="0.5">
            <animate attributeName="r" values="28;45;28" dur="2s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite"/>
          </circle>
        </g>
      </svg>
    </div>
  );
}
