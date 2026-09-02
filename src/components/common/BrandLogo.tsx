import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: number;
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
        {/* Google Material 柔和陰影 */}
        <filter id="bl-google-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#1a1c1e" floodOpacity="0.12" />
          <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#1a1c1e" floodOpacity="0.08" />
        </filter>

        <filter id="bl-coin-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000000" floodOpacity="0.15" />
        </filter>

        {/* Google 經典漸層色系 */}
        <linearGradient id="bl-bgGlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F8F9FA" />
          <stop offset="100%" stopColor="#EDF2FA" />
        </linearGradient>

        {/* Google Blue Gradient (記帳卡片底座) */}
        <linearGradient id="bl-googleBlue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4285F4" />
          <stop offset="100%" stopColor="#2B6CB0" />
        </linearGradient>

        {/* Google Red / Pink Gradient (情侶愛心) */}
        <linearGradient id="bl-coupleHeart" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#FF6B8B" />
          <stop offset="100%" stopColor="#EA4335" />
        </linearGradient>

        {/* Google Yellow / Orange Gradient (公積金金幣) */}
        <linearGradient id="bl-googleCoin" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD04C" />
          <stop offset="100%" stopColor="#FBBC04" />
        </linearGradient>
      </defs>

      {/* 背景圓角 App Icon 底圖 (transparent 為 true 時去背) */}
      {!transparent && (
        <rect x="32" y="32" width="448" height="448" rx="100" fill="url(#bl-bgGlow)" filter="url(#bl-google-shadow)" />
      )}

      {/* 1. 記帳系統主卡片 (Google Blue 矩形與數據圖表) */}
      <g filter="url(#bl-google-shadow)">
        {/* 主卡片底座 */}
        <rect x="96" y="140" width="320" height="240" rx="28" fill="url(#bl-googleBlue)" />
        
        {/* 卡片內的記帳柱狀圖 (Google 綠/白/淡藍) */}
        <rect x="140" y="270" width="36" height="70" rx="18" fill="#FFFFFF" opacity="0.4" />
        <rect x="196" y="230" width="36" height="110" rx="18" fill="#34A853" />
        <rect x="252" y="200" width="36" height="140" rx="18" fill="#FFFFFF" />
        
        {/* 裝飾性記帳橫條/預算線 */}
        <line x1="136" y1="180" x2="280" y2="180" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" opacity="0.5" />
      </g>

      {/* 2. 情侶意象：重疊雙心 (Material 面向與幾何感) */}
      <g filter="url(#bl-google-shadow)">
        {/* 伴侶心形 (淺粉/紫調襯底) */}
        <path
          d="M 330 130 C 330 100, 290 90, 270 120 C 250 90, 210 100, 210 130 C 210 170, 270 200, 270 200 C 270 200, 330 170, 330 130 Z" 
          fill="#A1C2FA"
          opacity="0.9"
          transform="rotate(-15 270 140) scale(0.85)"
        />
              
        {/* 主心形 (Google Red 鮮豔愛心) */}
        <path
          d="M 360 150 C 360 120, 320 110, 300 140 C 280 110, 240 120, 240 150 C 240 190, 300 220, 300 220 C 300 220, 360 190, 360 150 Z" 
          fill="url(#bl-coupleHeart)"
        />
      </g>

      {/* 3. 公積金意象：金幣與金錢符號 (前端右下角突出) */}
      <g filter="url(#bl-coin-shadow)">
        {/* 大金幣 (代表共同基金累積) */}
        <circle cx="340" cy="320" r="64" fill="url(#bl-googleCoin)" />
        <circle cx="340" cy="320" r="50" fill="none" stroke="#FFFFFF" strokeWidth="4" opacity="0.6" />
        
        {/* 美金/貨幣符號 */}
        <text
          x="340"
          y="342" 
          fontFamily="Google Sans, Roboto, Arial, sans-serif" 
          fontSize="64" 
          fontWeight="bold" 
          fill="#FFFFFF" 
          textAnchor="middle"
        >
          ＄
        </text>
      </g>

      {/* 4. Google Style 經典四色亮點點綴 (Sparkles/浮動元素) */}
      <path d="M 120 100 L 124 112 L 136 116 L 124 120 L 120 132 L 116 120 L 104 116 L 116 112 Z" fill="#EA4335" />
      <circle cx="400" cy="100" r="10" fill="#4285F4" />
      <circle cx="100" cy="380" r="8" fill="#34A853" />
    </svg>
  );
};
