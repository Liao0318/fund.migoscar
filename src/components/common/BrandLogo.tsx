import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: number | string;
  transparent?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ 
  className = "w-9 h-9 sm:w-10 sm:h-10", 
  size,
  transparent = false 
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={size || "100%"}
      height={size || "100%"}
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      <defs>
        {/* 柔和景深陰影 */}
        <filter id="bl-main-shadow" x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="10" stdDeviation="14" floodColor="#1a1c1e" floodOpacity="0.16" />
          <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#1a1c1e" floodOpacity="0.10" />
        </filter>

        <filter id="bl-coin-shadow" x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#000000" floodOpacity="0.22" />
        </filter>

        <filter id="bl-heart-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#EA4335" floodOpacity="0.25" />
        </filter>

        {/* 日系暖白與 Google 質感的溫潤底圖漸層 */}
        <linearGradient id="bl-bgGlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="50%" stopColor="#FAF8F5" />
          <stop offset="100%" stopColor="#F0EAE1" />
        </linearGradient>

        {/* Google Blue Gradient (記帳主體卡片) */}
        <linearGradient id="bl-googleBlue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4A90E2" />
          <stop offset="40%" stopColor="#357ABD" />
          <stop offset="100%" stopColor="#245A94" />
        </linearGradient>

        {/* 情侶愛心暖紅漸層 */}
        <linearGradient id="bl-coupleHeart" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#FF6584" />
          <stop offset="100%" stopColor="#E02447" />
        </linearGradient>

        <linearGradient id="bl-coupleHeartBack" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#B8D5FC" />
          <stop offset="100%" stopColor="#7DAAF5" />
        </linearGradient>

        {/* 公積金金幣黃金光澤 */}
        <linearGradient id="bl-googleCoin" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE066" />
          <stop offset="50%" stopColor="#FFC72C" />
          <stop offset="100%" stopColor="#E69500" />
        </linearGradient>

        <linearGradient id="bl-coinRing" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF4B8" />
          <stop offset="100%" stopColor="#E59900" />
        </linearGradient>
      </defs>

      {/* 背景圓角底圖 (填滿整張圖示 512x512) */}
      {!transparent && (
        <rect 
          x="0" 
          y="0" 
          width="512" 
          height="512" 
          rx="116" 
          fill="url(#bl-bgGlow)" 
        />
      )}

      {/* 1. 記帳系統主卡片 (填滿主要視覺區域，飽滿大氣) */}
      <g filter="url(#bl-main-shadow)">
        {/* 主卡片本體 */}
        <rect 
          x="38" 
          y="92" 
          width="436" 
          height="328" 
          rx="44" 
          fill="url(#bl-googleBlue)" 
        />
        
        {/* 卡片頂部裝飾條 / 預算線 */}
        <line 
          x1="80" 
          y1="146" 
          x2="280" 
          y2="146" 
          stroke="#FFFFFF" 
          strokeWidth="12" 
          strokeLinecap="round" 
          opacity="0.45" 
        />

        {/* 卡片內的記帳柱狀圖 (Google 綠/白/淡藍，比例放大飽滿) */}
        <rect x="88" y="270" width="46" height="96" rx="23" fill="#FFFFFF" opacity="0.35" />
        <rect x="160" y="215" width="46" height="151" rx="23" fill="#34A853" />
        <rect x="232" y="175" width="46" height="191" rx="23" fill="#FFFFFF" />
        <rect x="304" y="240" width="46" height="126" rx="23" fill="#A8C7FA" opacity="0.75" />
      </g>

      {/* 2. 情侶意象：重疊雙心 (右上角延伸，愛心飽滿鮮明) */}
      <g filter="url(#bl-heart-shadow)">
        {/* 伴侶心形 (淺藍/紫調襯底) */}
        <path
          d="M 370 120 C 370 70, 310 50, 280 95 C 250 50, 190 70, 190 120 C 190 180, 280 230, 280 230 C 280 230, 370 180, 370 120 Z" 
          fill="url(#bl-coupleHeartBack)"
          opacity="0.95"
          transform="rotate(-16 280 130) scale(0.92)"
        />
              
        {/* 主心形 (鮮豔愛心) */}
        <path
          d="M 425 140 C 425 85, 365 65, 335 112 C 305 65, 245 85, 245 140 C 245 205, 335 258, 335 258 C 335 258, 425 205, 425 140 Z" 
          fill="url(#bl-coupleHeart)"
        />
      </g>

      {/* 3. 公積金意象：大金幣與金錢符號 (右下角突出，填滿邊緣) */}
      <g filter="url(#bl-coin-shadow)">
        {/* 金幣外環與本體 */}
        <circle cx="390" cy="370" r="92" fill="url(#bl-googleCoin)" />
        <circle cx="390" cy="370" r="76" fill="none" stroke="url(#bl-coinRing)" strokeWidth="6" opacity="0.9" />
        
        {/* 貨幣符號 */}
        <text
          x="390"
          y="404" 
          fontFamily="system-ui, -apple-system, sans-serif" 
          fontSize="92" 
          fontWeight="900" 
          fill="#FFFFFF" 
          textAnchor="middle"
          style={{ textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
        >
          ＄
        </text>
      </g>

      {/* 4. Google 經典四色星芒與亮點裝飾 */}
      <path 
        d="M 72 56 L 78 72 L 94 78 L 78 84 L 72 100 L 66 84 L 50 78 L 66 72 Z" 
        fill="#EA4335" 
      />
      <circle cx="456" cy="64" r="14" fill="#4285F4" />
      <circle cx="46" cy="442" r="12" fill="#34A853" />
      <path 
        d="M 464 240 L 468 250 L 478 254 L 468 258 L 464 268 L 460 258 L 450 254 L 460 250 Z" 
        fill="#FBBC04" 
      />
    </svg>
  );
};
