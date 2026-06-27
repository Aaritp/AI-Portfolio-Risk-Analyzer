// Animated stock ticker at top + NYC skyline SVG + hero text
const TICKERS = ["AAPL +2.4%","MSFT -0.8%","GOOGL +1.2%","NVDA +4.1%","JPM +0.6%","TSLA -1.3%","AMZN +0.9%","META +2.1%","BRK.B +0.3%","V +0.7%","SPY +0.8%","QQQ +1.1%"];

function TickerTape() {
  const repeated = [...TICKERS, ...TICKERS];
  return (
    <div className="overflow-hidden border-b border-white/5 py-2 bg-white/[0.02]">
      <div className="flex animate-ticker whitespace-nowrap" style={{ width: "200%" }}>
        {repeated.map((t, i) => {
          const positive = t.includes("+");
          return (
            <span key={i} className="fig text-xs mx-6 shrink-0" style={{ color: positive ? "#34D399" : "#F87171" }}>
              {t}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// NYC Skyline as inline SVG
function NYCSkyline() {
  return (
    <svg
      viewBox="0 0 1440 260"
      xmlns="http://www.w3.org/2000/svg"
      className="absolute bottom-0 left-0 w-full"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366F1" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#6366F1" stopOpacity="0.18" />
        </linearGradient>
        <linearGradient id="glowLine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#6366F1" stopOpacity="0" />
          <stop offset="30%"  stopColor="#6366F1" stopOpacity="0.6" />
          <stop offset="70%"  stopColor="#818CF8" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Glow line at horizon */}
      <line x1="0" y1="258" x2="1440" y2="258" stroke="url(#glowLine)" strokeWidth="1.5" />

      {/* NYC Skyline silhouette */}
      <path
        d="
          M0,260 L0,200
          L30,200 L30,180 L40,180 L40,160 L50,160 L50,155 L55,150 L60,155 L60,160 L70,160 L70,180 L80,180 L80,200
          L100,200 L100,175 L115,175 L115,170 L120,165 L125,170 L125,175 L140,175 L140,200
          L155,200 L155,190 L165,190 L165,185 L170,185 L170,190 L185,190 L185,200
          L200,200 L200,140 L210,140 L210,135 L215,128 L220,135 L220,140 L230,140 L230,200
          L235,200 L235,178 L248,178 L248,200
          L255,200 L255,120 L258,118 L260,115 L262,112 L265,108 L268,112 L270,115 L272,118 L275,120 L275,200
          L285,200 L285,158 L295,158 L295,155 L300,150 L305,155 L305,158 L315,158 L315,200
          L325,200 L325,175 L340,175 L340,200
          L350,200 L350,145 L360,145 L360,140 L368,135 L368,130 L372,125 L376,130 L376,135 L384,140 L384,145 L394,145 L394,200
          L400,200 L400,170 L412,170 L412,200
          L420,200 L420,155 L428,155 L428,150 L432,145 L436,150 L436,155 L444,155 L444,200
          L455,200 L455,168 L468,168 L468,200
          L475,200 L475,130 L478,128 L481,124 L484,120 L487,116 L490,112 L493,108 L496,104 L498,100 L500,96 L502,100 L504,104 L506,108 L509,112 L512,116 L515,120 L518,124 L521,128 L524,130 L524,200
          L530,200 L530,155 L542,155 L542,200
          L548,200 L548,165 L560,165 L560,200
          L570,200 L570,142 L574,138 L578,134 L582,130 L586,134 L590,138 L594,142 L594,200
          L600,200 L600,175 L612,175 L612,200
          L620,200 L620,158 L630,158 L630,152 L634,148 L638,152 L638,158 L648,158 L648,200
          L658,200 L658,170 L668,170 L668,200
          L675,200 L675,125 L679,120 L683,115 L687,110 L691,105 L695,100 L699,95 L703,90 L706,87 L709,90 L712,95 L715,100 L719,105 L722,110 L726,115 L730,120 L733,125 L733,200
          L740,200 L740,160 L752,160 L752,200
          L758,200 L758,145 L764,140 L768,136 L772,140 L778,145 L778,200
          L785,200 L785,168 L798,168 L798,200
          L805,200 L805,155 L812,155 L812,148 L816,144 L820,148 L820,155 L828,155 L828,200
          L835,200 L835,178 L848,178 L848,200
          L855,200 L855,140 L860,136 L864,132 L868,128 L872,132 L876,136 L880,140 L880,200
          L890,200 L890,162 L902,162 L902,200
          L910,200 L910,148 L916,143 L920,138 L924,143 L930,148 L930,200
          L938,200 L938,170 L950,170 L950,200
          L958,200 L958,155 L964,150 L968,145 L972,150 L978,155 L978,200
          L985,200 L985,172 L998,172 L998,200
          L1005,200 L1005,135 L1009,130 L1013,125 L1017,120 L1021,115 L1025,111 L1029,115 L1033,120 L1037,125 L1041,130 L1045,135 L1045,200
          L1055,200 L1055,160 L1065,160 L1065,200
          L1072,200 L1072,175 L1085,175 L1085,200
          L1092,200 L1092,148 L1098,143 L1102,138 L1106,143 L1112,148 L1112,200
          L1120,200 L1120,165 L1132,165 L1132,200
          L1140,200 L1140,152 L1145,147 L1149,142 L1153,138 L1157,142 L1161,147 L1165,152 L1165,200
          L1175,200 L1175,170 L1185,170 L1185,200
          L1192,200 L1192,145 L1197,140 L1202,135 L1207,130 L1212,125 L1216,121 L1220,125 L1224,130 L1229,135 L1233,140 L1237,145 L1237,200
          L1248,200 L1248,165 L1258,165 L1258,200
          L1265,200 L1265,178 L1278,178 L1278,200
          L1285,200 L1285,160 L1294,160 L1294,155 L1298,150 L1302,155 L1302,160 L1312,160 L1312,200
          L1320,200 L1320,175 L1332,175 L1332,200
          L1340,200 L1340,190 L1352,190 L1352,200
          L1360,200 L1360,182 L1372,182 L1372,200
          L1380,200 L1380,195 L1440,195 L1440,260 Z
        "
        fill="url(#skyGrad)"
        stroke="rgba(99,102,241,0.25)"
        strokeWidth="0.5"
      />

      {/* Windows — small lit rectangles on taller buildings */}
      {[
        [262,130,4,3],[268,130,4,3],[262,142,4,3],[268,142,4,3],
        [497,112,4,3],[503,112,4,3],[497,124,4,3],[503,124,4,3],
        [497,136,4,3],[503,136,4,3],
        [700,102,4,3],[706,102,4,3],[700,114,4,3],[706,114,4,3],
        [700,126,4,3],[706,126,4,3],[700,138,4,3],[706,138,4,3],
        [703,150,4,3],[706,150,4,3],
        [1022,122,4,3],[1028,122,4,3],[1022,134,4,3],[1028,134,4,3],[1022,146,4,3],
        [1213,132,4,3],[1219,132,4,3],[1213,144,4,3],[1219,144,4,3],
      ].map(([x,y,w,h], i) => (
        <rect key={i} x={x} y={y} width={w} height={h}
          fill="rgba(200,210,255,0.45)" rx="0.5" />
      ))}
    </svg>
  );
}

export default function Hero({ children }) {
  return (
    <div className="relative min-h-screen flex flex-col" style={{ background: "radial-gradient(ellipse 100% 70% at 50% 110%, rgba(99,102,241,0.22) 0%, transparent 65%), linear-gradient(to bottom, #05080F 0%, #080D1A 100%)" }}>
      <TickerTape />

      {/* Grid texture overlay */}
      <div className="absolute inset-0 grid-texture opacity-60 pointer-events-none" />

      {/* Hero content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 pb-40 pt-20">
        <div className="inline-flex items-center gap-2 glass-sm px-4 py-1.5 mb-8 animate-revealFade">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-DEFAULT animate-pulse" />
          <span className="eyebrow text-secondary">Real-time quantitative analysis</span>
        </div>

        <h1 className="font-display font-bold text-primary leading-[0.95] tracking-tight mb-6"
            style={{ fontSize: "clamp(56px, 9vw, 96px)", animation: "revealUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.1s both" }}>
          Frontier
          <span className="block" style={{ color: "#818CF8", textShadow: "0 0 80px rgba(99,102,241,0.5)" }}>
            Risk Engine
          </span>
        </h1>

        <p className="text-secondary text-lg max-w-xl mb-10 leading-relaxed"
           style={{ animation: "revealUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.25s both" }}>
          Efficient frontier optimization · Monte Carlo simulation ·
          Sharpe ratio · VaR / CVaR · AI-generated risk commentary
        </p>

        {/* Form card */}
        <div style={{ animation: "revealUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.4s both" }}
             className="w-full max-w-2xl">
          {children}
        </div>
      </div>

      {/* NYC Skyline */}
      <NYCSkyline />
    </div>
  );
}
