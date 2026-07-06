interface AnimatedChickenMascotProps {
  size?: 'small' | 'medium' | 'large';
  isGesturing?: boolean;
  theme?: 'purple' | 'blue' | 'emerald';
}

export function AnimatedChickenMascot({
  size = 'medium',
  isGesturing = false,
  theme = 'purple'
}: AnimatedChickenMascotProps) {

  const sizes = {
    small:  { width: '200', height: '260', viewBox: '0 0 400 520', scale: 0.5 },
    medium: { width: '300', height: '390', viewBox: '0 0 400 520', scale: 0.75 },
    large:  { width: '400', height: '520', viewBox: '0 0 400 520', scale: 1 },
  };

  const currentSize = sizes[size];

  const backgroundGlows = {
    purple:  { layer1: "bg-purple-600",  layer2: "bg-violet-500",  layer3: "bg-fuchsia-400", layer4: "bg-pink-400" },
    blue:    { layer1: "bg-blue-600",    layer2: "bg-indigo-500",  layer3: "bg-sky-400",     layer4: "bg-cyan-400" },
    emerald: { layer1: "bg-emerald-600", layer2: "bg-teal-500",    layer3: "bg-green-400",   layer4: "bg-cyan-400" },
  };

  const svgGradients = {
    purple: {
      bodyStop0: "#f3e8ff", bodyStop0Anim: "#f3e8ff;#e9d5ff;#f3e8ff", bodyStop30: "#e9d5ff", bodyStop70: "#d8b4fe", bodyStop100: "#c084fc",
      headStop0: "#faf5ff", headStop40: "#f3e8ff", headStop100: "#e9d5ff",
      headShine0: "#ffffff", headShine50: "#faf5ff", headShine100: "#e9d5ff",
      wingsStop0: "#e9d5ff", wingsStop40: "#d8b4fe", wingsStop70: "#c084fc", wingsStop100: "#a855f7",
      featherStop0: "#f3e8ff", featherStop50: "#d8b4fe", featherStop100: "#c084fc",
      eyeStop30: "#faf5ff", eyeStop60: "#e9d5ff", eyeStop100: "#c084fc",
      sparkle1: "#f3e8ff", sparkle2: "#e9d5ff",
      glassStroke: "#a855f7", glassFill: "rgba(168,85,247,0.15)", glassShine: "#d8b4fe",
    },
    blue: {
      bodyStop0: "#eff6ff", bodyStop0Anim: "#eff6ff;#dbeafe;#eff6ff", bodyStop30: "#dbeafe", bodyStop70: "#bfdbfe", bodyStop100: "#93c5fd",
      headStop0: "#f8fafc", headStop40: "#eff6ff", headStop100: "#dbeafe",
      headShine0: "#ffffff", headShine50: "#f0fdfa", headShine100: "#dbeafe",
      wingsStop0: "#dbeafe", wingsStop40: "#bfdbfe", wingsStop70: "#93c5fd", wingsStop100: "#3b82f6",
      featherStop0: "#eff6ff", featherStop50: "#bfdbfe", featherStop100: "#93c5fd",
      eyeStop30: "#f8fafc", eyeStop60: "#dbeafe", eyeStop100: "#60a5fa",
      sparkle1: "#eff6ff", sparkle2: "#dbeafe",
      glassStroke: "#3b82f6", glassFill: "rgba(59,130,246,0.15)", glassShine: "#93c5fd",
    },
    emerald: {
      bodyStop0: "#f0fdf4", bodyStop0Anim: "#f0fdf4;#dcfce7;#f0fdf4", bodyStop30: "#dcfce7", bodyStop70: "#bbf7d0", bodyStop100: "#86efac",
      headStop0: "#f8fafc", headStop40: "#f0fdf4", headStop100: "#dcfce7",
      headShine0: "#ffffff", headShine50: "#f0fdfa", headShine100: "#dcfce7",
      wingsStop0: "#dcfce7", wingsStop40: "#bbf7d0", wingsStop70: "#86efac", wingsStop100: "#10b981",
      featherStop0: "#f0fdf4", featherStop50: "#bbf7d0", featherStop100: "#86efac",
      eyeStop30: "#f8fafc", eyeStop60: "#dcfce7", eyeStop100: "#4ade80",
      sparkle1: "#f0fdf4", sparkle2: "#dcfce7",
      glassStroke: "#10b981", glassFill: "rgba(16,185,129,0.15)", glassShine: "#6ee7b7",
    },
  };

  const activeGlow = backgroundGlows[theme];
  const activeGrad = svgGradients[theme];

  // Olhos estão em translate(200,150), esquerdo em (-24,-8) e direito em (24,-8)
  // Em coordenadas absolutas: esquerdo=(176,142), direito=(224,142)
  // Óculos centrados entre eles, ligeiramente abaixo do centro dos olhos
  const glassY = 142;     // centro vertical dos olhos
  const lensR  = 20;      // raio externo da lente (olho tem r=17)
  const lensLX = 176;     // centro do olho esquerdo
  const lensRX = 224;     // centro do olho direito
  const bridgeY = glassY; // ponte ao nível do centro

  return (
    <div className="relative animate-bounce-gentle">

      {/* Multi-layer Glow */}
      <div className="absolute inset-0 blur-3xl opacity-80 transition-all duration-700">
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 ${activeGlow.layer1} rounded-full animate-pulse transition-all duration-700`} />
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 ${activeGlow.layer2} rounded-full animate-pulse transition-all duration-700`} style={{ animationDelay: '0.5s' }} />
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 ${activeGlow.layer3} rounded-full animate-pulse transition-all duration-700`} style={{ animationDelay: '1s' }} />
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 ${activeGlow.layer4} rounded-full animate-pulse transition-all duration-700`} style={{ animationDelay: '1.5s' }} />
      </div>

      <svg
        width={currentSize.width}
        height={currentSize.height}
        viewBox={currentSize.viewBox}
        className="relative z-10 max-w-full h-auto"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={`bodyGradientChicken-${size}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor={activeGrad.bodyStop0}>
              <animate attributeName="stop-color" values={activeGrad.bodyStop0Anim} dur="4s" repeatCount="indefinite"/>
            </stop>
            <stop offset="30%"  stopColor={activeGrad.bodyStop30} />
            <stop offset="70%"  stopColor={activeGrad.bodyStop70} />
            <stop offset="100%" stopColor={activeGrad.bodyStop100} />
          </linearGradient>

          <linearGradient id={`headGradientChicken-${size}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor={activeGrad.headStop0} />
            <stop offset="40%"  stopColor={activeGrad.headStop40} />
            <stop offset="100%" stopColor={activeGrad.headStop100} />
          </linearGradient>

          <radialGradient id={`headShineGradient-${size}`} cx="30%" cy="30%">
            <stop offset="0%"   stopColor={activeGrad.headShine0}   stopOpacity="0.6"/>
            <stop offset="50%"  stopColor={activeGrad.headShine50}  stopOpacity="0.3"/>
            <stop offset="100%" stopColor={activeGrad.headShine100} stopOpacity="0"/>
          </radialGradient>

          <linearGradient id={`combGradient-${size}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor="#fecdd3">
              <animate attributeName="stop-color" values="#fecdd3;#fda4af;#fecdd3" dur="3s" repeatCount="indefinite"/>
            </stop>
            <stop offset="50%"  stopColor="#fb7185" />
            <stop offset="100%" stopColor="#f43f5e" />
          </linearGradient>

          <linearGradient id={`beakGradient-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#fef3c7" />
            <stop offset="30%"  stopColor="#fde68a" />
            <stop offset="70%"  stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>

          <linearGradient id={`wingsGradient-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor={activeGrad.wingsStop0} />
            <stop offset="40%"  stopColor={activeGrad.wingsStop40} />
            <stop offset="70%"  stopColor={activeGrad.wingsStop70} />
            <stop offset="100%" stopColor={activeGrad.wingsStop100} />
          </linearGradient>

          <linearGradient id={`featherGradient-${size}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor={activeGrad.featherStop0} />
            <stop offset="50%"  stopColor={activeGrad.featherStop50} />
            <stop offset="100%" stopColor={activeGrad.featherStop100} />
          </linearGradient>

          <radialGradient id={`eyeGradientChicken-${size}`} cx="50%" cy="50%">
            <stop offset="0%"   stopColor="#ffffff" />
            <stop offset="30%"  stopColor={activeGrad.eyeStop30} />
            <stop offset="60%"  stopColor={activeGrad.eyeStop60} />
            <stop offset="100%" stopColor={activeGrad.eyeStop100} />
          </radialGradient>

          <linearGradient id={`legGradient-${size}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor="#fed7aa" />
            <stop offset="40%"  stopColor="#fdba74" />
            <stop offset="100%" stopColor="#fb923c" />
          </linearGradient>

          {/* ── Gradiente das hastes dos óculos ── */}
          <linearGradient id={`glassGrad-${size}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor={activeGrad.glassStroke} stopOpacity="0.9"/>
            <stop offset="100%" stopColor={activeGrad.glassShine}  stopOpacity="0.6"/>
          </linearGradient>

          <filter id={`glowChicken-${size}`}>
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id={`strongGlowChicken-${size}`}>
            <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          {/* Glow suave para os óculos */}
          <filter id={`glassGlow-${size}`}>
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* ═══ BODY ═══ */}
        <g transform="translate(200, 290)">
          <ellipse cx="0" cy="0" rx="95" ry="110"
            fill={`url(#bodyGradientChicken-${size})`}
            filter={`url(#strongGlowChicken-${size})`}/>
          <ellipse cx="-25" cy="-35" rx="45" ry="55"
            fill={`url(#headShineGradient-${size})`} opacity="0.5"/>

          {/* Wings — esquerda e direita, proporcionais ao corpo (corrigido) */}
          <g transform="translate(-68, -5)" filter={`url(#glowChicken-${size})`}>
            <ellipse rx="26" ry="45" fill={`url(#wingsGradient-${size})`} opacity="0.95">
              <animateTransform attributeName="transform" type="rotate"
                values={isGesturing ? "0 0 0;-25 0 0;0 0 0" : "0 0 0;-8 0 0;0 0 0"}
                dur={isGesturing ? "1s" : "3s"} repeatCount="indefinite"/>
            </ellipse>
            <ellipse rx="20" ry="36" fill={`url(#headShineGradient-${size})`} opacity="0.4"/>
          </g>

          <g transform="translate(68, -5) scale(-1,1)" filter={`url(#glowChicken-${size})`}>
            <ellipse rx="26" ry="45" fill={`url(#wingsGradient-${size})`} opacity="0.95">
              <animateTransform attributeName="transform" type="rotate"
                values={isGesturing ? "0 0 0;25 0 0;0 0 0" : "0 0 0;8 0 0;0 0 0"}
                dur={isGesturing ? "1s" : "3s"} repeatCount="indefinite"/>
            </ellipse>
            <ellipse rx="20" ry="36" fill={`url(#headShineGradient-${size})`} opacity="0.4"/>
          </g>

          {/* Tail feathers */}
          <g transform="translate(80, -40)" filter={`url(#strongGlowChicken-${size})`}>
            <path d="M 0 0 Q 25 -45 30 -75 Q 28 -50 25 -30 Q 22 -10 15 0 Z" fill={`url(#featherGradient-${size})`}>
              <animateTransform attributeName="transform" type="rotate" values="0 0 0;-12 0 0;0 0 0" dur="2.5s" repeatCount="indefinite"/>
            </path>
            <path d="M -8 5 Q 12 -30 18 -65 Q 15 -38 12 -18 Q 10 0 5 8 Z" fill={`url(#featherGradient-${size})`} opacity="0.9">
              <animateTransform attributeName="transform" type="rotate" values="0 0 0;-10 0 0;0 0 0" dur="2.7s" repeatCount="indefinite"/>
            </path>
            <path d="M 8 5 Q 30 -35 40 -70 Q 35 -42 30 -22 Q 25 -5 20 5 Z" fill={`url(#featherGradient-${size})`} opacity="0.85">
              <animateTransform attributeName="transform" type="rotate" values="0 0 0;-14 0 0;0 0 0" dur="2.3s" repeatCount="indefinite"/>
            </path>
          </g>
        </g>

        {/* ═══ HEAD ═══ */}
        <g transform="translate(200, 150)">
          <circle cx="0" cy="0" r="62"
            fill={`url(#headGradientChicken-${size})`}
            filter={`url(#strongGlowChicken-${size})`}/>
          <circle cx="-18" cy="-22" r="28"
            fill={`url(#headShineGradient-${size})`} opacity="0.7"/>

          {/* Comb */}
          <g transform="translate(0, -62)" filter={`url(#strongGlowChicken-${size})`}>
            <path d="M -20 0 Q -20 -18 -12 -25 Q -10 -15 -6 -30 Q -4 -16 0 -35 Q 4 -16 6 -30 Q 10 -15 12 -25 Q 20 -18 20 0 Z"
              fill={`url(#combGradient-${size})`}>
              <animate attributeName="opacity" values="0.95;1;0.95" dur="2s" repeatCount="indefinite"/>
            </path>
            <circle cx="0" cy="-31" r="4" fill="#ffe4e6" opacity="0.8">
              <animate attributeName="opacity" values="0.8;1;0.8" dur="1.8s" repeatCount="indefinite"/>
            </circle>
          </g>

          {/* Wattle */}
          <g transform="translate(0, 52)" filter={`url(#strongGlowChicken-${size})`}>
            <ellipse cx="-10" cy="0" rx="10" ry="18" fill={`url(#combGradient-${size})`}>
              <animate attributeName="ry" values="18;20;18" dur="2s" repeatCount="indefinite"/>
            </ellipse>
            <ellipse cx="10" cy="0" rx="10" ry="18" fill={`url(#combGradient-${size})`}>
              <animate attributeName="ry" values="18;20;18" dur="2s" repeatCount="indefinite" begin="0.5s"/>
            </ellipse>
          </g>

          {/* Beak */}
          <g filter={`url(#strongGlowChicken-${size})`}>
            <path d="M 0 15 L -7 28 L 7 28 Z"  fill={`url(#beakGradient-${size})`}/>
            <path d="M 0 28 L -6 38 L 6 38 Z"  fill={`url(#beakGradient-${size})`}/>
          </g>

          {/* Eyes */}
          <g filter={`url(#strongGlowChicken-${size})`}>
            <g transform="translate(-24, -8)">
              <circle r="17" fill={`url(#eyeGradientChicken-${size})`}/>
              <circle r="12" fill="#1e1b4b">
                <animate attributeName="r" values="12;12.5;12" dur="3s" repeatCount="indefinite"/>
              </circle>
              <circle r="6" fill="#0f0a1e">
                <animate attributeName="r" values="6;7;6" dur="4s" repeatCount="indefinite"/>
              </circle>
              <circle cx="-3" cy="-4" r="5" fill="#ffffff">
                <animate attributeName="opacity" values="0.95;0.75;0.95" dur="2s" repeatCount="indefinite"/>
              </circle>
            </g>
            <g transform="translate(24, -8)">
              <circle r="17" fill={`url(#eyeGradientChicken-${size})`}/>
              <circle r="12" fill="#1e1b4b">
                <animate attributeName="r" values="12;12.5;12" dur="3s" repeatCount="indefinite" begin="0.5s"/>
              </circle>
              <circle r="6" fill="#0f0a1e">
                <animate attributeName="r" values="6;7;6" dur="4s" repeatCount="indefinite" begin="0.5s"/>
              </circle>
              <circle cx="-3" cy="-4" r="5" fill="#ffffff">
                <animate attributeName="opacity" values="0.95;0.75;0.95" dur="2s" repeatCount="indefinite" begin="0.5s"/>
              </circle>
            </g>
          </g>

          {/* Cheeks */}
          <circle cx="-60" cy="10" r="12" fill="#fb7185" opacity="0.25">
            <animate attributeName="opacity" values="0.25;0.35;0.25" dur="3s" repeatCount="indefinite"/>
          </circle>
          <circle cx="60" cy="10" r="12" fill="#fb7185" opacity="0.25">
            <animate attributeName="opacity" values="0.25;0.35;0.25" dur="3s" repeatCount="indefinite" begin="0.5s"/>
          </circle>

          {/* ═══ ÓCULOS — sobrepostos aos olhos, dentro do grupo da cabeça ═══
              Olho esquerdo centrado em (-24, -8), olho direito em (24, -8)
              Lentes ligeiramente maiores que os olhos (r=17 → rx=21 ry=19)
              A haste esquerda vai até ao canto da cabeça (-62,−8)
              A haste direita vai até ao canto da cabeça ( 62,−8)          */}
          <g filter={`url(#glassGlow-${size})`}>

            {/* Lente esquerda */}
            <ellipse cx="-24" cy="-8" rx="21" ry="19"
              fill={activeGrad.glassFill}
              stroke={activeGrad.glassStroke}
              strokeWidth="2.5"
              strokeLinejoin="round">
              <animate attributeName="stroke-opacity" values="0.85;1;0.85" dur="2.5s" repeatCount="indefinite"/>
            </ellipse>

            {/* Lente direita */}
            <ellipse cx="24" cy="-8" rx="21" ry="19"
              fill={activeGrad.glassFill}
              stroke={activeGrad.glassStroke}
              strokeWidth="2.5"
              strokeLinejoin="round">
              <animate attributeName="stroke-opacity" values="0.85;1;0.85" dur="2.5s" repeatCount="indefinite" begin="0.3s"/>
            </ellipse>

            {/* Ponte entre as lentes */}
            <path d="M -3 -8 Q 0 -13 3 -8"
              fill="none"
              stroke={`url(#glassGrad-${size})`}
              strokeWidth="2"
              strokeLinecap="round"/>

            {/* Haste esquerda */}
            <path d="M -45 -8 Q -54 -10 -62 -8"
              fill="none"
              stroke={`url(#glassGrad-${size})`}
              strokeWidth="2"
              strokeLinecap="round"/>

            {/* Haste direita */}
            <path d="M 45 -8 Q 54 -10 62 -8"
              fill="none"
              stroke={`url(#glassGrad-${size})`}
              strokeWidth="2"
              strokeLinecap="round"/>

            {/* Brilho lente esquerda */}
            <ellipse cx="-29" cy="-14" rx="5" ry="3"
              fill="white" opacity="0.35"
              transform="rotate(-20 -29 -14)"/>

            {/* Brilho lente direita */}
            <ellipse cx="19" cy="-14" rx="5" ry="3"
              fill="white" opacity="0.35"
              transform="rotate(-20 19 -14)"/>
          </g>

        </g>{/* end head group */}

        {/* ═══ LEGS ═══ */}
        <g transform="translate(200, 400)" filter={`url(#glowChicken-${size})`}>
          <g transform="translate(-35, 0)">
            <rect x="-7" y="0" width="14" height="70" rx="7" fill={`url(#legGradient-${size})`}/>
            <rect x="-5" y="0" width="10" height="70" rx="5" fill="#fef3c7" opacity="0.3"/>
            <g transform="translate(0, 70)">
              <path d="M 0 0 L -18 18 L -22 15 L -10 0 Z" fill={`url(#legGradient-${size})`}/>
              <path d="M 0 0 L 0 22 L -4 22 L -4 0 Z"    fill={`url(#legGradient-${size})`}/>
              <path d="M 0 0 L 18 18 L 22 15 L 10 0 Z"   fill={`url(#legGradient-${size})`}/>
            </g>
          </g>
          <g transform="translate(35, 0)">
            <rect x="-7" y="0" width="14" height="70" rx="7" fill={`url(#legGradient-${size})`}/>
            <rect x="-5" y="0" width="10" height="70" rx="5" fill="#fef3c7" opacity="0.3"/>
            <g transform="translate(0, 70)">
              <path d="M 0 0 L -18 18 L -22 15 L -10 0 Z" fill={`url(#legGradient-${size})`}/>
              <path d="M 0 0 L 0 22 L -4 22 L -4 0 Z"    fill={`url(#legGradient-${size})`}/>
              <path d="M 0 0 L 18 18 L 22 15 L 10 0 Z"   fill={`url(#legGradient-${size})`}/>
            </g>
          </g>
        </g>

        {/* ═══ SPARKLES ═══ */}
        <g filter={`url(#strongGlowChicken-${size})`}>
          <circle cx="120" cy="200" r="4" fill={activeGrad.sparkle1} opacity="0.8">
            <animate attributeName="cy"      values="200;180;200" dur="3s"   repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.8;0.3;0.8" dur="3s"   repeatCount="indefinite"/>
          </circle>
          <circle cx="280" cy="250" r="5" fill={activeGrad.sparkle2} opacity="0.7">
            <animate attributeName="cy"      values="250;225;250" dur="3.5s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.7;0.2;0.7" dur="3.5s" repeatCount="indefinite"/>
          </circle>
        </g>
      </svg>
    </div>
  );
}