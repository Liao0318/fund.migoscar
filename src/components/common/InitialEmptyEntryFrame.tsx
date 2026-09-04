import React from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  Crown, 
  Heart, 
  Database, 
  Key, 
  ArrowRight, 
  ShieldCheck, 
  FileCode, 
  Users, 
  HelpCircle,
  PlayCircle
} from 'lucide-react';
import { AuthUser, CoupleBindingInfo } from '../../types';

interface InitialEmptyEntryFrameProps {
  currentUser: AuthUser | null;
  partnerBindingInfo?: CoupleBindingInfo | null;
  onOpenWizard: (initialRole?: 'admin' | 'partner') => void;
  onOpenDirectSettings: () => void;
  onEnableSandbox: () => void;
  appMode?: 'fund' | 'split';
}

export const InitialEmptyEntryFrame: React.FC<InitialEmptyEntryFrameProps> = ({
  currentUser,
  partnerBindingInfo,
  onOpenWizard,
  onOpenDirectSettings,
  onEnableSandbox,
  appMode = 'fund'
}) => {
  const userName = currentUser?.nickname || currentUser?.name || '新朋友';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.3 }}
      className="space-y-4 sm:space-y-6 max-w-4xl mx-auto pb-6 font-sans text-left"
    >
      {/* 🌟 頂部歡迎與初始狀態說明卡片 */}
      <div className="bg-gradient-to-br from-white via-[#FAF8F3] to-[#F5EFE3] rounded-3xl p-5 sm:p-7 border border-[#E6E0D2] shadow-2xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-200/20 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
        <div className="absolute bottom-0 right-10 text-amber-900/5 pointer-events-none hidden sm:block">
          <Database className="w-36 h-36" />
        </div>

        <div className="relative z-10 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/90 text-amber-900 border border-amber-200 text-xs font-bold shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              <span>帳本初始化狀態 · 尚未連線資料庫</span>
            </div>

            <div className="text-[11px] text-[#8C8475] font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>100% Google 雲端試算表私有存取</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-black text-[#3E3A36] tracking-tight">
              歡迎 {userName}，開啟伴伴記情侶雲端記帳 ✨
            </h2>
            <p className="text-xs sm:text-sm text-[#7A7366] leading-relaxed max-w-2xl font-normal">
              您的帳戶目前尚未綁定任何 Google 試算表資料庫或伴侶帳本。所有財務指標與明細已為您呈現乾淨初始狀態。請依據您的身分選擇下列任一方式開始使用：
            </p>
          </div>

          {/* 快速指標卡片 (初始化全 0 框架) */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-2">
            <div className="bg-white/90 backdrop-blur-xs p-3 rounded-2xl border border-[#ECE6D8] shadow-2xs">
              <div className="text-[10px] sm:text-xs text-[#8C8475] font-bold">公積金池內餘額</div>
              <div className="text-sm sm:text-lg font-black text-emerald-700 mt-0.5">$0</div>
            </div>
            <div className="bg-white/90 backdrop-blur-xs p-3 rounded-2xl border border-[#ECE6D8] shadow-2xs">
              <div className="text-[10px] sm:text-xs text-[#8C8475] font-bold">待銷帳代墊款</div>
              <div className="text-sm sm:text-lg font-black text-amber-700 mt-0.5">$0</div>
            </div>
            <div className="bg-white/90 backdrop-blur-xs p-3 rounded-2xl border border-[#ECE6D8] shadow-2xs">
              <div className="text-[10px] sm:text-xs text-[#8C8475] font-bold">目前雙方欠款</div>
              <div className="text-sm sm:text-lg font-black text-rose-700 mt-0.5">$0</div>
            </div>
          </div>
        </div>
      </div>

      {/* 🚀 兩大核心入口框架 (管理員 vs 伴侶) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        
        {/* 入口 1: 我是主管理者 (建立與綁定資料庫) */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-amber-200/80 hover:border-amber-400/90 transition-all duration-300 shadow-2xs hover:shadow-md flex flex-col justify-between group">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-700 to-amber-500 text-white flex items-center justify-center shadow-sm">
                <Crown className="w-6 h-6 text-amber-100" />
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                主管理者推薦
              </span>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base sm:text-lg font-black text-[#3E3A36] group-hover:text-amber-900 transition-colors">
                我是帳本建立者 · 建立專屬資料庫
              </h3>
              <p className="text-xs text-[#7A7366] leading-relaxed">
                由您提供個人的 Google 試算表，小精靈將引導您於 Google Apps Script 部署 Web App，建立 8 大完整分頁，並取得專屬伴侶邀請碼！
              </p>
            </div>

            <ul className="space-y-1.5 text-xs text-[#5C564E] bg-[#FAF8F3] p-3 rounded-2xl border border-[#EAE6DC]">
              <li className="flex items-center gap-1.5">
                <span className="text-amber-600 font-bold">✓</span>
                <span>支援公積金、借還代墊、採購清單、旅遊記帳</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-amber-600 font-bold">✓</span>
                <span>自動生成專屬 6 碼伴侶配對邀請卡</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-amber-600 font-bold">✓</span>
                <span>個人 Google 帳號 100% 私有，資料永續存取</span>
              </li>
            </ul>
          </div>

          <div className="pt-4 mt-2">
            <button
              type="button"
              onClick={() => onOpenWizard('admin')}
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-800 to-amber-900 hover:from-amber-900 hover:to-amber-950 text-white rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-98 cursor-pointer"
            >
              <span>啟動管理者設定小精靈</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 入口 2: 我是伴侶 (輸入伴侶邀請碼) */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-rose-200/80 hover:border-rose-400/90 transition-all duration-300 shadow-2xs hover:shadow-md flex flex-col justify-between group">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 to-rose-400 text-white flex items-center justify-center shadow-sm">
                <Heart className="w-6 h-6 text-rose-100 fill-rose-100" />
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
                免設 API
              </span>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base sm:text-lg font-black text-[#3E3A36] group-hover:text-rose-900 transition-colors">
                我是伴侶 · 輸入邀請碼加入
              </h3>
              <p className="text-xs text-[#7A7366] leading-relaxed">
                另一半已經建立好帳本了嗎？只需輸入對方派發的 6 碼伴侶邀請碼（如 BB-8924）或點擊邀請連結，即可即時連線共同記帳！
              </p>
            </div>

            <ul className="space-y-1.5 text-xs text-[#5C564E] bg-[#FFF8F8] p-3 rounded-2xl border border-[#F9E2E2]">
              <li className="flex items-center gap-1.5">
                <span className="text-rose-600 font-bold">✓</span>
                <span>無需繁瑣 Google Apps Script 設定</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-rose-600 font-bold">✓</span>
                <span>自動同步另一半建立的 Google 雲端試算表</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-rose-600 font-bold">✓</span>
                <span>記帳與採購雙向即時推播通知</span>
              </li>
            </ul>
          </div>

          <div className="pt-4 mt-2">
            <button
              type="button"
              onClick={() => onOpenWizard('partner')}
              className="w-full py-3 px-4 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-98 cursor-pointer"
            >
              <span>輸入伴侶邀請碼加入</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* 底部輔助選項列 */}
      <div className="bg-white/80 backdrop-blur-xs rounded-2xl p-4 border border-[#E8E4D9] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs text-xs">
        <div className="flex items-center gap-2 text-[#7A7366]">
          <HelpCircle className="w-4 h-4 text-amber-700 shrink-0" />
          <span>已有 Web App API 網址，想直接填入設定？或想先體驗模擬範例？</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenDirectSettings}
            className="px-3.5 py-2 bg-[#F4F0E6] hover:bg-[#EAE4D6] text-[#3E3A36] rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Key className="w-3.5 h-3.5 text-amber-800" />
            <span>直接輸入 API 網址</span>
          </button>

          <button
            type="button"
            onClick={onEnableSandbox}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <PlayCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>開啟測試沙盒模式</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};
