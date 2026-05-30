export function ChickenMascot() {
  return (
    <div className="relative">
      {/* Multi-layer Glow effect background */}
      <div className="absolute inset-0 blur-3xl opacity-70">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600 rounded-full animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-violet-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-fuchsia-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-pink-400 rounded-full animate-pulse" style={{ animationDelay: '1.5s' }}></div>
      </div>

      {/* Chicken SVG */}
      <svg 
        width="400" 
        height="520" 
        viewBox="0 0 400 520" 
        className="relative z-10 max-w-full h-auto"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Advanced Gradients */}
          <linearGradient id="bodyGradientChicken" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f3e8ff">
              <animate attributeName="stop-color" values="#f3e8ff;#e9d5ff;#f3e8ff" dur="4s" repeatCount="indefinite"/>
            </stop>
            <stop offset="30%" stopColor="#e9d5ff" />
            <stop offset="70%" stopColor="#d8b4fe" />
            <stop offset="100%" stopColor="#c084fc" />
          </linearGradient>
          
          <linearGradient id="headGradientChicken" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#faf5ff" />
            <stop offset="40%" stopColor="#f3e8ff" />
            <stop offset="100%" stopColor="#e9d5ff" />
          </linearGradient>

          <radialGradient id="headShineGradient" cx="30%" cy="30%">
            <stop offset="0%" stopColor="#ffffff" opacity="0.6"/>
            <stop offset="50%" stopColor="#faf5ff" opacity="0.3"/>
            <stop offset="100%" stopColor="#e9d5ff" opacity="0"/>
          </radialGradient>

          <linearGradient id="combGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fecdd3">
              <animate attributeName="stop-color" values="#fecdd3;#fda4af;#fecdd3" dur="3s" repeatCount="indefinite"/>
            </stop>
            <stop offset="50%" stopColor="#fb7185" />
            <stop offset="100%" stopColor="#f43f5e" />
          </linearGradient>

          <radialGradient id="combShineGradient" cx="40%" cy="30%">
            <stop offset="0%" stopColor="#ffe4e6" opacity="0.8"/>
            <stop offset="100%" stopColor="#fb7185" opacity="0"/>
          </radialGradient>

          <linearGradient id="beakGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef3c7" />
            <stop offset="30%" stopColor="#fde68a" />
            <stop offset="70%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>

          <radialGradient id="beakShineGradient" cx="30%" cy="20%">
            <stop offset="0%" stopColor="#fffbeb" opacity="0.9"/>
            <stop offset="100%" stopColor="#fbbf24" opacity="0"/>
          </radialGradient>

          <linearGradient id="wingsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e9d5ff" />
            <stop offset="40%" stopColor="#d8b4fe" />
            <stop offset="70%" stopColor="#c084fc" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>

          <linearGradient id="featherGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f3e8ff" />
            <stop offset="50%" stopColor="#d8b4fe" />
            <stop offset="100%" stopColor="#c084fc" />
          </linearGradient>

          <radialGradient id="eyeGradientChicken" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="30%" stopColor="#faf5ff" />
            <stop offset="60%" stopColor="#e9d5ff" />
            <stop offset="100%" stopColor="#c084fc" />
          </radialGradient>

          <radialGradient id="pupilGradient" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#1e1b4b" />
            <stop offset="70%" stopColor="#312e81" />
            <stop offset="100%" stopColor="#4c1d95" />
          </radialGradient>

          <linearGradient id="glowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f3e8ff">
              <animate attributeName="stop-color" values="#f3e8ff;#e9d5ff;#f3e8ff" dur="2s" repeatCount="indefinite"/>
            </stop>
            <stop offset="100%" stopColor="#c084fc" />
          </linearGradient>

          <linearGradient id="legGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fed7aa" />
            <stop offset="40%" stopColor="#fdba74" />
            <stop offset="100%" stopColor="#fb923c" />
          </linearGradient>

          {/* Advanced Filters */}
          <filter id="glowChicken">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          <filter id="strongGlowChicken">
            <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          <filter id="ultraGlowChicken">
            <feGaussianBlur stdDeviation="12" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          <filter id="softGlow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          <filter id="innerShadow">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feOffset in="blur" dx="2" dy="2" result="offsetBlur"/>
            <feMerge>
              <feMergeNode in="offsetBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Ambient glow rings */}
        <g transform="translate(200, 280)" filter="url(#ultraGlowChicken)">
          <circle cx="0" cy="-20" r="140" fill="none" stroke="#e9d5ff" strokeWidth="2" opacity="0.2">
            <animate attributeName="r" values="140;160;140" dur="4s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.2;0.05;0.2" dur="4s" repeatCount="indefinite"/>
          </circle>
          <circle cx="0" cy="-20" r="120" fill="none" stroke="#d8b4fe" strokeWidth="2" opacity="0.3">
            <animate attributeName="r" values="120;135;120" dur="3.5s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.3;0.1;0.3" dur="3.5s" repeatCount="indefinite"/>
          </circle>
        </g>

        {/* Body */}
        <g transform="translate(200, 290)">
          {/* Main body - rounded chicken shape */}
          <ellipse cx="0" cy="0" rx="95" ry="110" fill="url(#bodyGradientChicken)" filter="url(#strongGlowChicken)"/>
          
          {/* Body shine highlight */}
          <ellipse cx="-25" cy="-35" rx="45" ry="55" fill="url(#headShineGradient)" opacity="0.5"/>
          
          {/* Body texture details */}
          <g opacity="0.15">
            <ellipse cx="0" cy="-20" rx="70" ry="30" fill="#ffffff"/>
            <ellipse cx="0" cy="10" rx="75" ry="35" fill="#ffffff"/>
            <ellipse cx="0" cy="40" rx="70" ry="30" fill="#ffffff"/>
          </g>

          {/* Chest feathers detail */}
          <g transform="translate(0, 20)" opacity="0.3">
            <path d="M -40 0 Q -30 -20 0 -25 Q 30 -20 40 0 Q 30 20 0 25 Q -30 20 -40 0 Z" fill="#ffffff"/>
          </g>

          {/* Wings - Left */}
          <g transform="translate(-70, -10)" filter="url(#glowChicken)">
            <ellipse rx="42" ry="70" fill="url(#wingsGradient)" opacity="0.95">
              <animateTransform attributeName="transform" type="rotate" values="0 0 0;-8 0 0;0 0 0" dur="3s" repeatCount="indefinite"/>
            </ellipse>
            <ellipse rx="35" ry="60" fill="url(#headShineGradient)" opacity="0.4"/>
            
            {/* Wing feathers detail */}
            <g opacity="0.4">
              <ellipse cx="0" cy="-30" rx="25" ry="20" fill="#ffffff"/>
              <ellipse cx="0" cy="0" rx="28" ry="22" fill="#ffffff"/>
              <ellipse cx="0" cy="30" rx="25" ry="20" fill="#ffffff"/>
            </g>
          </g>

          {/* Wings - Right (partial, behind body) */}
          <g transform="translate(70, -10)" filter="url(#glowChicken)" opacity="0.6">
            <ellipse rx="35" ry="65" fill="url(#wingsGradient)">
              <animateTransform attributeName="transform" type="rotate" values="0 0 0;8 0 0;0 0 0" dur="3.2s" repeatCount="indefinite"/>
            </ellipse>
          </g>

          {/* Tail feathers - Enhanced */}
          <g transform="translate(80, -40)" filter="url(#strongGlowChicken)">
            {/* Large center feather */}
            <path d="M 0 0 Q 25 -45 30 -75 Q 28 -50 25 -30 Q 22 -10 15 0 Z" fill="url(#featherGradient)">
              <animateTransform attributeName="transform" type="rotate" values="0 0 0;-12 0 0;0 0 0" dur="2.5s" repeatCount="indefinite"/>
            </path>
            <path d="M 2 -5 Q 22 -40 27 -70 Q 25 -45 22 -25 Q 20 -8 13 -2 Z" fill="#faf5ff" opacity="0.5"/>
            
            {/* Left feather */}
            <path d="M -8 5 Q 12 -30 18 -65 Q 15 -38 12 -18 Q 10 0 5 8 Z" fill="url(#featherGradient)" opacity="0.9">
              <animateTransform attributeName="transform" type="rotate" values="0 0 0;-10 0 0;0 0 0" dur="2.7s" repeatCount="indefinite"/>
            </path>
            <path d="M -6 0 Q 10 -25 15 -60 Q 13 -35 10 -15 Q 8 2 3 6 Z" fill="#faf5ff" opacity="0.4"/>
            
            {/* Right feather */}
            <path d="M 8 5 Q 30 -35 40 -70 Q 35 -42 30 -22 Q 25 -5 20 5 Z" fill="url(#featherGradient)" opacity="0.85">
              <animateTransform attributeName="transform" type="rotate" values="0 0 0;-14 0 0;0 0 0" dur="2.3s" repeatCount="indefinite"/>
            </path>
            <path d="M 10 0 Q 28 -30 37 -65 Q 33 -38 28 -18 Q 23 -2 18 3 Z" fill="#faf5ff" opacity="0.4"/>
            
            {/* Extra decorative feathers */}
            <path d="M -15 10 Q 5 -20 10 -50 Q 8 -28 5 -12 Q 3 5 0 12 Z" fill="url(#featherGradient)" opacity="0.7">
              <animateTransform attributeName="transform" type="rotate" values="0 0 0;-8 0 0;0 0 0" dur="2.9s" repeatCount="indefinite"/>
            </path>
            <path d="M 15 8 Q 38 -28 48 -65 Q 42 -38 35 -20 Q 28 -3 23 8 Z" fill="url(#featherGradient)" opacity="0.75">
              <animateTransform attributeName="transform" type="rotate" values="0 0 0;-16 0 0;0 0 0" dur="2.1s" repeatCount="indefinite"/>
            </path>
          </g>
        </g>

        {/* Head */}
        <g transform="translate(200, 150)">
          {/* Head circle with enhanced details */}
          <circle cx="0" cy="0" r="62" fill="url(#headGradientChicken)" filter="url(#strongGlowChicken)"/>
          <circle cx="-18" cy="-22" r="28" fill="url(#headShineGradient)" opacity="0.7"/>
          
          {/* Head texture */}
          <g opacity="0.15">
            <circle cx="-15" cy="-10" r="25" fill="#ffffff"/>
            <circle cx="10" cy="-5" r="22" fill="#ffffff"/>
          </g>

          {/* Comb (crista) - Enhanced with more detail */}
          <g transform="translate(0, -62)" filter="url(#strongGlowChicken)">
            {/* Main comb structure */}
            <path d="M -20 0 Q -20 -18 -12 -25 Q -10 -15 -6 -30 Q -4 -16 0 -35 Q 4 -16 6 -30 Q 10 -15 12 -25 Q 20 -18 20 0 Z" 
                  fill="url(#combGradient)">
              <animate attributeName="opacity" values="0.95;1;0.95" dur="2s" repeatCount="indefinite"/>
            </path>
            
            {/* Comb highlights */}
            <path d="M -16 -2 Q -16 -15 -10 -21 Q -8 -12 -5 -25 Q -3 -13 0 -28 Q 3 -13 5 -25 Q 8 -12 10 -21 Q 16 -15 16 -2 Z" 
                  fill="url(#combShineGradient)" opacity="0.7"/>
            
            {/* Comb edge details */}
            <circle cx="-12" cy="-20" r="3" fill="#ffe4e6" opacity="0.6">
              <animate attributeName="opacity" values="0.6;0.9;0.6" dur="2s" repeatCount="indefinite"/>
            </circle>
            <circle cx="-6" cy="-26" r="3.5" fill="#ffe4e6" opacity="0.7">
              <animate attributeName="opacity" values="0.7;1;0.7" dur="2.2s" repeatCount="indefinite"/>
            </circle>
            <circle cx="0" cy="-31" r="4" fill="#ffe4e6" opacity="0.8">
              <animate attributeName="opacity" values="0.8;1;0.8" dur="1.8s" repeatCount="indefinite"/>
            </circle>
            <circle cx="6" cy="-26" r="3.5" fill="#ffe4e6" opacity="0.7">
              <animate attributeName="opacity" values="0.7;1;0.7" dur="2.1s" repeatCount="indefinite"/>
            </circle>
            <circle cx="12" cy="-20" r="3" fill="#ffe4e6" opacity="0.6">
              <animate attributeName="opacity" values="0.6;0.9;0.6" dur="2.3s" repeatCount="indefinite"/>
            </circle>
          </g>

          {/* Wattle (barbela) - Enhanced */}
          <g transform="translate(0, 52)" filter="url(#strongGlowChicken)">
            <ellipse cx="-10" cy="0" rx="10" ry="18" fill="url(#combGradient)">
              <animate attributeName="ry" values="18;20;18" dur="2s" repeatCount="indefinite"/>
            </ellipse>
            <ellipse cx="-10" cy="-3" rx="7" ry="12" fill="url(#combShineGradient)" opacity="0.7"/>
            
            <ellipse cx="10" cy="0" rx="10" ry="18" fill="url(#combGradient)">
              <animate attributeName="ry" values="18;20;18" dur="2s" repeatCount="indefinite" begin="0.5s"/>
            </ellipse>
            <ellipse cx="10" cy="-3" rx="7" ry="12" fill="url(#combShineGradient)" opacity="0.7"/>
            
            {/* Wattle highlights */}
            <ellipse cx="-10" cy="-5" rx="4" ry="6" fill="#ffe4e6" opacity="0.8"/>
            <ellipse cx="10" cy="-5" rx="4" ry="6" fill="#ffe4e6" opacity="0.8"/>
          </g>

          {/* Beak - Enhanced with more detail */}
          <g filter="url(#strongGlowChicken)">
            {/* Upper beak */}
            <path d="M 0 15 L -7 28 L 7 28 Z" fill="url(#beakGradient)"/>
            <path d="M 0 17 L -5 26 L 5 26 Z" fill="url(#beakShineGradient)"/>
            
            {/* Lower beak */}
            <path d="M 0 28 L -6 38 L 6 38 Z" fill="url(#beakGradient)"/>
            <path d="M 0 29 L -4 36 L 4 36 Z" fill="#f59e0b"/>
            
            {/* Beak highlights */}
            <path d="M -2 22 L 2 22 L 0 26 Z" fill="#fef3c7" opacity="0.8"/>
            <ellipse cx="0" cy="33" rx="3" ry="2" fill="#fef3c7" opacity="0.6"/>
            
            {/* Nostril details */}
            <circle cx="-2" cy="24" r="1" fill="#d97706" opacity="0.6"/>
            <circle cx="2" cy="24" r="1" fill="#d97706" opacity="0.6"/>
          </g>

          {/* Eyes - Ultra Enhanced */}
          <g filter="url(#strongGlowChicken)">
            {/* Left eye */}
            <g transform="translate(-24, -8)">
              {/* Outer glow */}
              <circle r="22" fill="#c084fc" opacity="0.2">
                <animate attributeName="r" values="22;24;22" dur="3s" repeatCount="indefinite"/>
              </circle>
              
              {/* Eye white */}
              <circle r="17" fill="url(#eyeGradientChicken)"/>
              
              {/* Iris */}
              <circle r="12" fill="url(#pupilGradient)">
                <animate attributeName="r" values="12;12.5;12" dur="3s" repeatCount="indefinite"/>
              </circle>
              
              {/* Pupil */}
              <circle r="6" fill="#0f0a1e">
                <animate attributeName="r" values="6;7;6" dur="4s" repeatCount="indefinite"/>
              </circle>
              
              {/* Main highlight */}
              <circle cx="-3" cy="-4" r="5" fill="#ffffff">
                <animate attributeName="opacity" values="0.95;0.75;0.95" dur="2s" repeatCount="indefinite"/>
              </circle>
              
              {/* Secondary highlight */}
              <circle cx="4" cy="-2" r="3" fill="#ffffff" opacity="0.7"/>
              
              {/* Tiny sparkle */}
              <circle cx="2" cy="5" r="1.5" fill="#faf5ff" opacity="0.9">
                <animate attributeName="opacity" values="0.9;0.4;0.9" dur="1.5s" repeatCount="indefinite"/>
              </circle>
              
              {/* Bottom reflection */}
              <ellipse cy="10" rx="8" ry="3" fill="#c084fc" opacity="0.3"/>
            </g>
            
            {/* Right eye */}
            <g transform="translate(24, -8)">
              {/* Outer glow */}
              <circle r="22" fill="#c084fc" opacity="0.2">
                <animate attributeName="r" values="22;24;22" dur="3s" repeatCount="indefinite" begin="0.5s"/>
              </circle>
              
              {/* Eye white */}
              <circle r="17" fill="url(#eyeGradientChicken)"/>
              
              {/* Iris */}
              <circle r="12" fill="url(#pupilGradient)">
                <animate attributeName="r" values="12;12.5;12" dur="3s" repeatCount="indefinite" begin="0.5s"/>
              </circle>
              
              {/* Pupil */}
              <circle r="6" fill="#0f0a1e">
                <animate attributeName="r" values="6;7;6" dur="4s" repeatCount="indefinite" begin="0.5s"/>
              </circle>
              
              {/* Main highlight */}
              <circle cx="-3" cy="-4" r="5" fill="#ffffff">
                <animate attributeName="opacity" values="0.95;0.75;0.95" dur="2s" repeatCount="indefinite" begin="0.5s"/>
              </circle>
              
              {/* Secondary highlight */}
              <circle cx="4" cy="-2" r="3" fill="#ffffff" opacity="0.7"/>
              
              {/* Tiny sparkle */}
              <circle cx="2" cy="5" r="1.5" fill="#faf5ff" opacity="0.9">
                <animate attributeName="opacity" values="0.9;0.4;0.9" dur="1.5s" repeatCount="indefinite" begin="0.5s"/>
              </circle>
              
              {/* Bottom reflection */}
              <ellipse cy="10" rx="8" ry="3" fill="#c084fc" opacity="0.3"/>
            </g>
          </g>

          {/* Cheeks - Enhanced */}
          <g filter="url(#softGlow)">
            <circle cx="-60" cy="10" r="12" fill="#fb7185" opacity="0.25">
              <animate attributeName="opacity" values="0.25;0.35;0.25" dur="3s" repeatCount="indefinite"/>
            </circle>
            <circle cx="-60" cy="10" r="8" fill="#fecdd3" opacity="0.4"/>
            <circle cx="-60" cy="7" r="4" fill="#ffe4e6" opacity="0.6"/>
            
            <circle cx="60" cy="10" r="12" fill="#fb7185" opacity="0.25">
              <animate attributeName="opacity" values="0.25;0.35;0.25" dur="3s" repeatCount="indefinite" begin="0.5s"/>
            </circle>
            <circle cx="60" cy="10" r="8" fill="#fecdd3" opacity="0.4"/>
            <circle cx="60" cy="7" r="4" fill="#ffe4e6" opacity="0.6"/>
          </g>

          {/* Head decorative lines */}
          <g opacity="0.2" stroke="#a855f7" strokeWidth="1.5" fill="none">
            <line x1="-65" y1="-18" x2="-75" y2="-18"/>
            <line x1="-65" y1="-10" x2="-72" y2="-10"/>
            <line x1="-65" y1="-2" x2="-70" y2="-2"/>
            <line x1="65" y1="-18" x2="75" y2="-18"/>
            <line x1="65" y1="-10" x2="72" y2="-10"/>
            <line x1="65" y1="-2" x2="70" y2="-2"/>
          </g>
        </g>

        {/* Legs and Feet - Enhanced */}
        <g transform="translate(200, 400)" filter="url(#glowChicken)">
          {/* Left Leg */}
          <g transform="translate(-35, 0)">
            <rect x="-7" y="0" width="14" height="70" rx="7" fill="url(#legGradient)"/>
            <rect x="-5" y="0" width="10" height="70" rx="5" fill="#fef3c7" opacity="0.3"/>
            <ellipse cx="0" cy="35" rx="4" ry="8" fill="#fed7aa" opacity="0.4"/>
            
            {/* Left foot - more detailed */}
            <g transform="translate(0, 70)">
              {/* Back toe */}
              <path d="M 0 5 L -3 18 L -6 18 L -4 5 Z" fill="url(#legGradient)"/>
              <path d="M -3 18 L -5 20 L -8 19 L -6 18 Z" fill="#fb923c"/>
              
              {/* Center toes */}
              <path d="M 0 0 L -18 18 L -22 15 L -10 0 Z" fill="url(#legGradient)"/>
              <path d="M -18 18 L -20 22 L -24 20 L -22 15 Z" fill="#fb923c"/>
              
              <path d="M 0 0 L 0 22 L -4 22 L -4 0 Z" fill="url(#legGradient)"/>
              <path d="M 0 22 L 0 26 L -4 26 L -4 22 Z" fill="#fb923c"/>
              
              <path d="M 0 0 L 18 18 L 22 15 L 10 0 Z" fill="url(#legGradient)"/>
              <path d="M 18 18 L 20 22 L 24 20 L 22 15 Z" fill="#fb923c"/>
              
              {/* Highlights on toes */}
              <ellipse cx="-16" cy="14" rx="2" ry="3" fill="#fef3c7" opacity="0.5"/>
              <ellipse cx="0" cy="18" rx="2" ry="3" fill="#fef3c7" opacity="0.5"/>
              <ellipse cx="16" cy="14" rx="2" ry="3" fill="#fef3c7" opacity="0.5"/>
            </g>
          </g>

          {/* Right Leg */}
          <g transform="translate(35, 0)">
            <rect x="-7" y="0" width="14" height="70" rx="7" fill="url(#legGradient)"/>
            <rect x="-5" y="0" width="10" height="70" rx="5" fill="#fef3c7" opacity="0.3"/>
            <ellipse cx="0" cy="35" rx="4" ry="8" fill="#fed7aa" opacity="0.4"/>
            
            {/* Right foot - more detailed */}
            <g transform="translate(0, 70)">
              {/* Back toe */}
              <path d="M 0 5 L -3 18 L -6 18 L -4 5 Z" fill="url(#legGradient)"/>
              <path d="M -3 18 L -5 20 L -8 19 L -6 18 Z" fill="#fb923c"/>
              
              {/* Center toes */}
              <path d="M 0 0 L -18 18 L -22 15 L -10 0 Z" fill="url(#legGradient)"/>
              <path d="M -18 18 L -20 22 L -24 20 L -22 15 Z" fill="#fb923c"/>
              
              <path d="M 0 0 L 0 22 L -4 22 L -4 0 Z" fill="url(#legGradient)"/>
              <path d="M 0 22 L 0 26 L -4 26 L -4 22 Z" fill="#fb923c"/>
              
              <path d="M 0 0 L 18 18 L 22 15 L 10 0 Z" fill="url(#legGradient)"/>
              <path d="M 18 18 L 20 22 L 24 20 L 22 15 Z" fill="#fb923c"/>
              
              {/* Highlights on toes */}
              <ellipse cx="-16" cy="14" rx="2" ry="3" fill="#fef3c7" opacity="0.5"/>
              <ellipse cx="0" cy="18" rx="2" ry="3" fill="#fef3c7" opacity="0.5"/>
              <ellipse cx="16" cy="14" rx="2" ry="3" fill="#fef3c7" opacity="0.5"/>
            </g>
          </g>
        </g>

        {/* Floating magical particles */}
        <g filter="url(#strongGlowChicken)">
          <circle cx="100" cy="180" r="4" fill="#f3e8ff" opacity="0.8">
            <animate attributeName="cy" values="180;160;180" dur="3s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.8;0.3;0.8" dur="3s" repeatCount="indefinite"/>
          </circle>
          <circle cx="300" cy="220" r="5" fill="#e9d5ff" opacity="0.7">
            <animate attributeName="cy" values="220;195;220" dur="3.5s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.7;0.2;0.7" dur="3.5s" repeatCount="indefinite"/>
          </circle>
          <circle cx="130" cy="300" r="3.5" fill="#d8b4fe" opacity="0.75">
            <animate attributeName="cy" values="300;280;300" dur="2.8s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.75;0.25;0.75" dur="2.8s" repeatCount="indefinite"/>
          </circle>
          <circle cx="270" cy="340" r="4.5" fill="#c084fc" opacity="0.65">
            <animate attributeName="cy" values="340;315;340" dur="3.2s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.65;0.2;0.65" dur="3.2s" repeatCount="indefinite"/>
          </circle>
          <circle cx="160" cy="130" r="3" fill="#faf5ff" opacity="0.9">
            <animate attributeName="cy" values="130;110;130" dur="2.5s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.9;0.3;0.9" dur="2.5s" repeatCount="indefinite"/>
          </circle>
          <circle cx="240" cy="170" r="3.5" fill="#e9d5ff" opacity="0.8">
            <animate attributeName="cy" values="170;150;170" dur="3.3s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.8;0.25;0.8" dur="3.3s" repeatCount="indefinite"/>
          </circle>
        </g>

        {/* Sparkles */}
        <g filter="url(#softGlow)">
          <g transform="translate(120, 200)">
            <path d="M 0 -8 L 1 -2 L 8 0 L 1 2 L 0 8 L -1 2 L -8 0 L -1 -2 Z" fill="#faf5ff" opacity="0.8">
              <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite"/>
              <animateTransform attributeName="transform" type="rotate" values="0;360" dur="8s" repeatCount="indefinite"/>
            </path>
          </g>
          <g transform="translate(280, 280)">
            <path d="M 0 -6 L 0.8 -1.5 L 6 0 L 0.8 1.5 L 0 6 L -0.8 1.5 L -6 0 L -0.8 -1.5 Z" fill="#e9d5ff" opacity="0.9">
              <animate attributeName="opacity" values="0.9;0.4;0.9" dur="2.5s" repeatCount="indefinite"/>
              <animateTransform attributeName="transform" type="rotate" values="0;-360" dur="10s" repeatCount="indefinite"/>
            </path>
          </g>
          <g transform="translate(180, 350)">
            <path d="M 0 -5 L 0.7 -1.3 L 5 0 L 0.7 1.3 L 0 5 L -0.7 1.3 L -5 0 L -0.7 -1.3 Z" fill="#d8b4fe" opacity="0.85">
              <animate attributeName="opacity" values="0.85;0.35;0.85" dur="2.2s" repeatCount="indefinite"/>
              <animateTransform attributeName="transform" type="rotate" values="0;360" dur="9s" repeatCount="indefinite"/>
            </path>
          </g>
        </g>
      </svg>
    </div>
  );
}
