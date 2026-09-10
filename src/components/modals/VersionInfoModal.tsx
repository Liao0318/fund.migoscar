import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  X, 
  CheckCircle2, 
  Layers, 
  Clock, 
  Globe, 
  ShieldCheck, 
  Database,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { APP_VERSION, APP_BUILD_DATE, APP_NAME, APP_FULL_NAME, APP_RELEASE_NOTES, getRuntimeEnvironmentInfo } from '../../version';

interface VersionInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSandboxMode?: boolean;
  isGuestMode?: boolean;
  isDevUser?: boolean;
  gasWebUrl?: string;
  onOpenDatabaseSettings?: () => void;
  onToggleDevSandbox?: () => void;
}

export const VersionInfoModal: React.FC<VersionInfoModalProps> = ({
  isOpen,
  onClose,
  isSandboxMode = false,
  isGuestMode = false,
  isDevUser = false,
  gasWebUrl = '',
  onOpenDatabaseSettings,
  onToggleDevSandbox
}) => {
  const envInfo = getRuntimeEnvironmentInfo(isSandboxMode, isGuestMode, isDevUser);
  const isDbConnected = Boolean(gasWebUrl && gasWebUrl.startsWith('http'));

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="bg-[#FAF9F5] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-[#E5E0D2] my-auto text-left font-sans flex flex-col"
          >
            {/* Modal 頂部 Header */}
            <div className="p-5 border-b border-[#E8E4D9] bg-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold shadow-inner">
                  <Layers className="w-5 h-5 text-amber-800" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-[#3E3A36] text-base">
                      {APP_NAME} 版本與環境資訊
                    </h3>
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#EDE8DC] text-[#635B4E] border border-[#DDD6C8]">
                      {APP_VERSION}
                    </span>
                  </div>
                  <p className="text-xs text-[#8C8475] mt-0.5">
                    {APP_FULL_NAME}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-[#EFECE3] hover:bg-[#E5E1D5] flex items-center justify-center text-[#8C8475] transition-all cursor-pointer"
                title="關閉"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal 主要內容 */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              
              {/* 1. 當前運行環境卡片 */}
              <div className="bg-white rounded-2xl p-4 border border-[#EAE4D8] shadow-2xs space-y-2.5">
                <div className="text-xs font-bold text-[#8C8475] uppercase tracking-wider flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-amber-700" />
                  <span>目前運行狀態</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-[#FAF8F5] rounded-xl border border-[#EDE8DE]">
                    <span className="text-[#8C8475] block text-[11px] mb-0.5">系統環境</span>
                    <span className="font-bold text-[#3E3A36] flex items-center gap-1">
                      {envInfo.envLabel}
                    </span>
                  </div>

                  <div className="p-2.5 bg-[#FAF8F5] rounded-xl border border-[#EDE8DE]">
                    <span className="text-[#8C8475] block text-[11px] mb-0.5">託管主機</span>
                    <span className="font-bold text-[#3E3A36] truncate block">
                      {envInfo.hostingLabel}
                    </span>
                  </div>

                  <div className="p-2.5 bg-[#FAF8F5] rounded-xl border border-[#EDE8DE]">
                    <span className="text-[#8C8475] block text-[11px] mb-0.5">發布日期</span>
                    <span className="font-mono font-bold text-[#3E3A36]">
                      {APP_BUILD_DATE}
                    </span>
                  </div>

                  <div className="p-2.5 bg-[#FAF8F5] rounded-xl border border-[#EDE8DE]">
                    <span className="text-[#8C8475] block text-[11px] mb-0.5">資料庫連線</span>
                    <span className={`font-bold flex items-center gap-1 ${isDbConnected ? 'text-emerald-700' : 'text-amber-700'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isDbConnected ? 'bg-emerald-600' : 'bg-amber-500'}`} />
                      <span>{isDbConnected ? 'API 已連通' : '未連線'}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. 更新紀錄 Changelog */}
              <div className="bg-white rounded-2xl p-4 border border-[#EAE4D8] shadow-2xs space-y-3">
                <div className="text-xs font-bold text-[#8C8475] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                  <span>版本更新亮點</span>
                </div>

                <div className="space-y-3">
                  {APP_RELEASE_NOTES.map((note) => (
                    <div key={note.version} className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EDE8DE] space-y-1.5 text-left">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black font-mono px-2 py-0.5 rounded-md bg-amber-800 text-white">
                            {note.version}
                          </span>
                          <span className="text-xs font-bold text-[#3E3A36]">
                            {note.title}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#A39E92] font-mono">
                          {note.date}
                        </span>
                      </div>

                      <ul className="space-y-1 pt-1">
                        {note.highlights.map((highlight, idx) => (
                          <li key={idx} className="text-xs text-[#5C564E] flex items-start gap-1.5 leading-relaxed">
                            <span className="text-amber-700 text-xs mt-0.5 font-bold">•</span>
                            <span>{highlight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Modal 底部按鈕 */}
            <div className="p-4 border-t border-[#E8E4D9] bg-white flex items-center justify-between gap-2 shrink-0">
              {onOpenDatabaseSettings && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenDatabaseSettings();
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#5C564E] hover:text-[#3E3A36] bg-[#F4F0E6] hover:bg-[#EAE4D8] border border-[#DDD6C8] transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Database className="w-3.5 h-3.5 text-amber-800" />
                  <span>資料庫設定</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 bg-[#3E3A36] hover:bg-[#2A2724] text-white rounded-xl text-xs font-bold transition-all cursor-pointer text-center shadow-2xs"
              >
                關閉
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
