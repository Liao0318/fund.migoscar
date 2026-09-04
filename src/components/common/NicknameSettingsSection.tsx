import React, { useState, useEffect } from 'react';
import { Check, CheckCircle2, AlertCircle, Sparkles, Tag } from 'lucide-react';
import { AuthUser, NicknameLengthPreference } from '../../types';

interface NicknameSettingsSectionProps {
  currentUser: AuthUser | null;
  onUpdateNickname?: (
    nickname: string,
    lengthPreference?: NicknameLengthPreference,
    nickname1Char?: string,
    nickname2Char?: string
  ) => boolean;
  accentColor?: 'amber' | 'rose';
}

export const NicknameSettingsSection: React.FC<NicknameSettingsSectionProps> = ({
  currentUser,
  onUpdateNickname,
  accentColor = 'amber'
}) => {
  const isAdmin = currentUser?.userRole !== 'partner';
  const default1Char = isAdmin ? '廖' : '周';
  const default2Char = isAdmin ? '廖廖' : '周周';

  // 稱呼字數偏好狀態：'1-char' (單字) 或 '2-char' (雙字)
  const [lengthPref, setLengthPref] = useState<NicknameLengthPreference>(() => {
    if (currentUser?.nicknameLengthPreference) {
      return currentUser.nicknameLengthPreference;
    }
    if (currentUser?.nickname && currentUser.nickname.length === 1) {
      return '1-char';
    }
    return '2-char';
  });

  // 單字稱呼 (限 1 個字)
  const [n1Input, setN1Input] = useState<string>(() => {
    if (currentUser?.nickname1Char) return currentUser.nickname1Char;
    if (currentUser?.nickname?.length === 1) return currentUser.nickname;
    return currentUser?.nickname?.[0] || currentUser?.name?.[0] || default1Char;
  });

  // 雙字暱稱 (限 2 個字)
  const [n2Input, setN2Input] = useState<string>(() => {
    if (currentUser?.nickname2Char) return currentUser.nickname2Char;
    if (currentUser?.nickname?.length === 2) return currentUser.nickname;
    return currentUser?.name?.slice(0, 2) || default2Char;
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (currentUser) {
      if (currentUser.nicknameLengthPreference) {
        setLengthPref(currentUser.nicknameLengthPreference);
      } else if (currentUser.nickname && currentUser.nickname.length === 1) {
        setLengthPref('1-char');
      }
      if (currentUser.nickname1Char) {
        setN1Input(currentUser.nickname1Char);
      } else if (currentUser.nickname?.length === 1) {
        setN1Input(currentUser.nickname);
      }
      if (currentUser.nickname2Char) {
        setN2Input(currentUser.nickname2Char);
      } else if (currentUser.nickname?.length === 2) {
        setN2Input(currentUser.nickname);
      }
    }
  }, [currentUser]);

  // 單字驗證 (1 個字元，純文字)
  const cleanN1 = n1Input.trim();
  const isN1Valid = cleanN1.length === 1 && /^[\p{L}\p{N}]+$/u.test(cleanN1);

  // 雙字驗證 (2 個字元，純文字)
  const cleanN2 = n2Input.trim();
  const isN2Valid = cleanN2.length === 2 && /^[\p{L}\p{N}]+$/u.test(cleanN2);

  // 當前預覽依選擇的字數模式顯示
  const currentPreview = lengthPref === '1-char' ? cleanN1 || default1Char : cleanN2 || default2Char;

  // 快速標籤清單
  const quickPresets1Char = isAdmin
    ? ['廖', '丞', '寶', '哥', '翁']
    : ['周', '沛', '緹', '寶', '妞'];

  const quickPresets2Char = isAdmin
    ? ['廖廖', '尹丞', '小廖', '寶貝', '阿丞']
    : ['周周', '沛緹', '小周', '寶貝', '阿緹'];

  const handleSave = () => {
    if (!onUpdateNickname) return;
    if (lengthPref === '1-char' && !isN1Valid) return;
    if (lengthPref === '2-char' && !isN2Valid) return;

    const chosenName = lengthPref === '1-char' ? cleanN1 : cleanN2;
    const ok = onUpdateNickname(chosenName, lengthPref, cleanN1 || default1Char, cleanN2 || default2Char);
    if (ok) {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    }
  };

  const isFormValid = lengthPref === '1-char' ? isN1Valid : isN2Valid;

  const ringColorClass = accentColor === 'rose' ? 'ring-rose-400' : 'ring-amber-500';
  const activeBgClass = accentColor === 'rose' ? 'bg-rose-50 border-rose-300' : 'bg-amber-50/90 border-amber-300';
  const textAccentClass = accentColor === 'rose' ? 'text-rose-700' : 'text-amber-800';

  return (
    <div className="bg-gradient-to-br from-[#FFFDF9] to-[#FAF7F0] p-4 sm:p-5 rounded-2xl border border-[#E8E2D5] space-y-4 shadow-2xs">
      <div className="flex items-center justify-between border-b border-[#EFEAE0] pb-2.5">
        <div className="flex items-center gap-2">
          <Tag className={`w-4 h-4 ${textAccentClass}`} />
          <h4 className="text-xs sm:text-sm font-extrabold text-[#3E3A36]">
            稱呼顯示設定（字數模式挑選）
          </h4>
        </div>
        <span className="text-[10px] bg-white border border-[#E2DDD0] text-[#7A7366] px-2 py-0.5 rounded-full font-bold">
          隨選即時套用
        </span>
      </div>

      {/* 1. 字數偏好切換按鈕 (單字模式 vs 雙字模式) */}
      <div className="space-y-1.5">
        <label className="block text-[11px] font-bold text-[#5C564E]">
          請挑選在全站畫面優先顯示的稱呼字數風格：
        </label>
        <div className="grid grid-cols-2 gap-2.5">
          {/* 模式 A: 單字顯示 (1 個字) */}
          <button
            type="button"
            onClick={() => setLengthPref('1-char')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
              lengthPref === '1-char'
                ? `${activeBgClass} shadow-xs`
                : 'bg-white hover:bg-[#F8F6F0] border-[#E5E0D5]'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`text-xs font-black ${lengthPref === '1-char' ? textAccentClass : 'text-[#3E3A36]'}`}>
                🔘 單字模式（1 個字）
              </span>
              <span className="text-xs font-mono font-extrabold px-1.5 py-0.2 rounded bg-white/80 border border-[#E0DBD0] text-[#3E3A36]">
                {cleanN1 || default1Char}
              </span>
            </div>
            <p className="text-[10px] text-[#7A7366] leading-relaxed">
              在頂部導覽列、記帳卡片等處，優先顯示俐落簡潔的單字稱呼。
            </p>
          </button>

          {/* 模式 B: 雙字顯示 (2 個字) */}
          <button
            type="button"
            onClick={() => setLengthPref('2-char')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
              lengthPref === '2-char'
                ? `${activeBgClass} shadow-xs`
                : 'bg-white hover:bg-[#F8F6F0] border-[#E5E0D5]'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`text-xs font-black ${lengthPref === '2-char' ? textAccentClass : 'text-[#3E3A36]'}`}>
                🔘 雙字模式（2 個字）
              </span>
              <span className="text-xs font-mono font-extrabold px-1.5 py-0.2 rounded bg-white/80 border border-[#E0DBD0] text-[#3E3A36]">
                {cleanN2 || default2Char}
              </span>
            </div>
            <p className="text-[10px] text-[#7A7366] leading-relaxed">
              在頂部導覽列、記帳卡片等處，優先顯示親暱完整的雙字暱稱。
            </p>
          </button>
        </div>
      </div>

      {/* 2. 客製化單字與雙字輸入區塊 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {/* 單字輸入欄 */}
        <div className={`p-3 rounded-xl border transition-all ${
          lengthPref === '1-char' ? 'bg-white border-[#E0D8C8] ring-1 ring-amber-300' : 'bg-[#FAF8F3] border-[#ECE6D9]'
        }`}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-[#3E3A36] flex items-center gap-1">
              <span>單字稱呼</span>
              <span className="text-[10px] text-[#8C8475] font-normal">(限 1 個字)</span>
            </span>
            <span className={`text-[10px] font-mono ${isN1Valid ? 'text-emerald-700 font-bold' : 'text-rose-600 font-medium'}`}>
              {cleanN1.length}/1 字
            </span>
          </div>
          <input
            type="text"
            value={n1Input}
            maxLength={1}
            onChange={(e) => setN1Input(e.target.value)}
            placeholder={`例如：${default1Char}`}
            className="w-full bg-white border border-[#DDD7CC] rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#3E3A36] focus:outline-none focus:border-amber-600 text-center text-sm"
          />
          {/* 快選標籤 */}
          <div className="flex items-center gap-1 flex-wrap mt-2">
            <span className="text-[9px] text-[#8C8475]">快選：</span>
            {quickPresets1Char.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setN1Input(preset)}
                className="px-1.5 py-0.5 rounded bg-white hover:bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-bold cursor-pointer transition-all active:scale-95"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* 雙字輸入欄 */}
        <div className={`p-3 rounded-xl border transition-all ${
          lengthPref === '2-char' ? 'bg-white border-[#E0D8C8] ring-1 ring-amber-300' : 'bg-[#FAF8F3] border-[#ECE6D9]'
        }`}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-[#3E3A36] flex items-center gap-1">
              <span>雙字暱稱</span>
              <span className="text-[10px] text-[#8C8475] font-normal">(限 2 個字)</span>
            </span>
            <span className={`text-[10px] font-mono ${isN2Valid ? 'text-emerald-700 font-bold' : 'text-rose-600 font-medium'}`}>
              {cleanN2.length}/2 字
            </span>
          </div>
          <input
            type="text"
            value={n2Input}
            maxLength={2}
            onChange={(e) => setN2Input(e.target.value)}
            placeholder={`例如：${default2Char}`}
            className="w-full bg-white border border-[#DDD7CC] rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#3E3A36] focus:outline-none focus:border-amber-600 text-center text-sm"
          />
          {/* 快選標籤 */}
          <div className="flex items-center gap-1 flex-wrap mt-2">
            <span className="text-[9px] text-[#8C8475]">快選：</span>
            {quickPresets2Char.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setN2Input(preset)}
                className="px-1.5 py-0.5 rounded bg-white hover:bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-bold cursor-pointer transition-all active:scale-95"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. 即時視覺效果預覽 */}
      <div className="bg-white p-3 rounded-xl border border-[#E5E0D5] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
          <div>
            <div className="font-bold text-[#3E3A36] flex items-center gap-1.5">
              <span>目前全站顯示效果預覽：</span>
              <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded font-black text-xs font-mono">
                【{currentPreview}】
              </span>
              <span className="text-[10px] text-[#7A7366]">
                ({lengthPref === '1-char' ? '單字風格' : '雙字風格'})
              </span>
            </div>
            <p className="text-[10px] text-[#8C8475] mt-0.5">
              頂部導覽列按鈕、代墊結算卡片與個人明細將直接顯示為「{currentPreview}」
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={!isFormValid}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-2xs ${
            isFormValid
              ? 'bg-amber-800 hover:bg-amber-900 text-white cursor-pointer active:scale-95'
              : 'bg-[#EAE5D9] text-[#A8A295] cursor-not-allowed'
          }`}
        >
          {savedSuccess ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-300" />
              <span>已儲存設定！</span>
            </>
          ) : (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>儲存稱呼與偏好</span>
            </>
          )}
        </button>
      </div>

      {savedSuccess && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>稱呼顯示偏好已成功更新為「{currentPreview}」，全站已即時套用！</span>
        </div>
      )}
    </div>
  );
};
