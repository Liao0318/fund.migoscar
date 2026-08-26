import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Database, Download, Upload, RefreshCw, CheckCircle, AlertTriangle, Check, X, ShieldAlert, ArrowRight, Layers } from 'lucide-react';
import { RecordItem, ShoppingItem, SplitRecordItem, TravelTrip, TravelExpenseItem, TravelWishItem } from '../../types';

interface DataBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: RecordItem[];
  shoppingItems: ShoppingItem[];
  shoppingStores: string[];
  splitItems: SplitRecordItem[];
  onRestoreData: (restoredData: any) => void;
  onSyncAll: () => Promise<void>;
  isSyncing: boolean;
  lastSyncedAt: string;
  isOnline: boolean;
}

export const DataBackupModal: React.FC<DataBackupModalProps> = ({
  isOpen,
  onClose,
  records,
  shoppingItems,
  shoppingStores,
  splitItems,
  onRestoreData,
  onSyncAll,
  isSyncing,
  lastSyncedAt,
  isOnline
}) => {
  const [activeTab, setActiveTab] = useState<'backup' | 'reconcile'>('backup');
  const [restoreJsonText, setRestoreJsonText] = useState('');
  const [restorePreview, setRestorePreview] = useState<any | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [isRestoreSuccess, setIsRestoreSuccess] = useState(false);

  // 處理匯出備份 JSON
  const handleExportBackup = () => {
    try {
      let travelTrips: TravelTrip[] = [];
      let travelExpenses: TravelExpenseItem[] = [];
      let travelWishlist: TravelWishItem[] = [];

      try {
        const tripsRaw = localStorage.getItem('banban_travel_trips');
        if (tripsRaw) travelTrips = JSON.parse(tripsRaw);
        const expRaw = localStorage.getItem('banban_travel_expenses');
        if (expRaw) travelExpenses = JSON.parse(expRaw);
        const wishRaw = localStorage.getItem('banban_travel_wishlist');
        if (wishRaw) travelWishlist = JSON.parse(wishRaw);
      } catch (e) {}

      const fullBackupData = {
        version: '2.0',
        exportedAt: new Date().toISOString(),
        appName: '伴伴記 (Banban Fund & Split)',
        records,
        shoppingItems,
        shoppingStores,
        splitItems,
        travelTrips,
        travelExpenses,
        travelWishlist,
        stats: {
          recordsCount: records.length,
          shoppingCount: shoppingItems.length,
          splitCount: splitItems.length,
          travelTripsCount: travelTrips.length,
          travelExpensesCount: travelExpenses.length
        }
      };

      const jsonStr = JSON.stringify(fullBackupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `伴伴記_全量資料備份_${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('匯出失敗：' + (err.message || '未知錯誤'));
    }
  };

  // 處理匯入檔案選擇
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        setRestoreJsonText(text);
        parseAndPreviewJson(text);
      } catch (err: any) {
        setRestoreError('解析檔案失敗，請確認是否為合法的 JSON 備份檔。');
        setRestorePreview(null);
      }
    };
    reader.readAsText(file);
  };

  const parseAndPreviewJson = (text: string) => {
    setRestoreError(null);
    setIsRestoreSuccess(false);
    try {
      const data = JSON.parse(text);
      if (!data || typeof data !== 'object') {
        throw new Error('格式不正確');
      }
      setRestorePreview({
        recordsCount: Array.isArray(data.records) ? data.records.length : 0,
        shoppingCount: Array.isArray(data.shoppingItems) ? data.shoppingItems.length : 0,
        splitCount: Array.isArray(data.splitItems) ? data.splitItems.length : 0,
        tripsCount: Array.isArray(data.travelTrips) ? data.travelTrips.length : 0,
        exportedAt: data.exportedAt || '未知時間',
        rawData: data
      });
    } catch (err) {
      setRestoreError('無法讀取此 JSON 內容，請檢查資料格式是否齊全。');
      setRestorePreview(null);
    }
  };

  // 執行還原
  const handleConfirmRestore = () => {
    if (!restorePreview || !restorePreview.rawData) return;
    try {
      onRestoreData(restorePreview.rawData);
      setIsRestoreSuccess(true);
      setTimeout(() => {
        setIsRestoreSuccess(false);
        setRestorePreview(null);
        setRestoreJsonText('');
        onClose();
      }, 1500);
    } catch (err: any) {
      setRestoreError('還原過程發生錯誤：' + err.message);
    }
  };

  // 對帳與重複性檢查
  const duplicateRecords = React.useMemo(() => {
    const seen = new Map<string, RecordItem>();
    const dupes: RecordItem[] = [];
    records.forEach(r => {
      const key = `${r.date}_${r.item}_${r.amount}_${r.payer}`;
      if (seen.has(key)) {
        dupes.push(r);
      } else {
        seen.set(key, r);
      }
    });
    return dupes;
  }, [records]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-[#FAF9F5] rounded-2xl sm:rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-[#E5E0D2] max-h-[90vh] flex flex-col my-auto text-left font-sans"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-[#E8E4D9] flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                <Database className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <h3 className="font-extrabold text-[#3E3A36] text-sm sm:text-base flex items-center gap-2">
                  <span>資料備份與對帳中心</span>
                  <span className="text-[10px] text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full font-bold border border-blue-200">
                    雲端與快照
                  </span>
                </h3>
                <p className="text-[11px] text-[#8C8475] font-medium">
                  全量 JSON 資料匯出/還原與 Google 試算表即時對帳
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#EFECE3] hover:bg-[#E5E1D5] flex items-center justify-center text-[#8C8475] transition-all cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 導航 Tabs */}
          <div className="flex border-b border-[#E8E4D9] bg-[#F5F2EA] px-4 pt-2 gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('backup')}
              className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'backup'
                  ? 'bg-white text-blue-900 border-t border-x border-[#E8E4D9] shadow-2xs'
                  : 'text-[#8C8475] hover:text-[#3E3A36]'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>全量備份與還原</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('reconcile')}
              className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'reconcile'
                  ? 'bg-white text-emerald-900 border-t border-x border-[#E8E4D9] shadow-2xs'
                  : 'text-[#8C8475] hover:text-[#3E3A36]'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>對帳與資料診斷</span>
            </button>
          </div>

          {/* 內容區 */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
            {/* 1. 備份與還原 Tab */}
            {activeTab === 'backup' && (
              <div className="space-y-4">
                {/* 匯出卡片 */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8E4D9] shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-extrabold text-[#3E3A36] flex items-center gap-1.5">
                        <Download className="w-4 h-4 text-blue-700" />
                        <span>📥 匯出完整備份檔 (JSON Snapshot)</span>
                      </h4>
                      <p className="text-[11px] text-[#8C8475] mt-0.5">
                        包含公積金記帳 ({records.length} 筆)、代墊借還 ({splitItems.length} 筆)、採購清單 ({shoppingItems.length} 項) 與旅遊帳本
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleExportBackup}
                      className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
                    >
                      <Download className="w-4 h-4" />
                      <span>立即下載 JSON 備份檔</span>
                    </button>
                  </div>
                </div>

                {/* 還原卡片 */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8E4D9] shadow-2xs space-y-3.5">
                  <div>
                    <h4 className="text-xs font-extrabold text-[#3E3A36] flex items-center gap-1.5">
                      <Upload className="w-4 h-4 text-amber-700" />
                      <span>📤 自 JSON 備份檔還原資料</span>
                    </h4>
                    <p className="text-[11px] text-[#8C8475] mt-0.5">
                      上傳先前匯出的備份檔案，可一次還原所有紀錄與分類
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <label className="w-full sm:w-auto px-4 py-2.5 bg-[#FAF8F3] hover:bg-[#F2EDE1] text-[#3E3A36] border border-[#DDD8CC] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs">
                      <Upload className="w-4 h-4 text-[#8C8475]" />
                      <span>選擇備份檔案 (.json)</span>
                      <input
                        type="file"
                        accept=".json,application/json"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </label>
                    <span className="text-[11px] text-[#A39E93]">或貼上 JSON 內容進行預覽</span>
                  </div>

                  {restoreError && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{restoreError}</span>
                    </div>
                  )}

                  {isRestoreSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-bold animate-pulse">
                      <Check className="w-4 h-4 shrink-0" />
                      <span>🎉 資料已成功還原！畫面將即刻刷新。</span>
                    </div>
                  )}

                  {restorePreview && (
                    <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                          <Layers className="w-4 h-4 text-blue-700" />
                          <span>備份檔解析成功，待還原項目：</span>
                        </span>
                        <span className="text-[10px] text-blue-800 font-mono">
                          匯出時間：{new Date(restorePreview.exportedAt).toLocaleString()}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                        <div className="bg-white p-2 rounded-lg border border-blue-100">
                          <span className="text-[#8C8475] block text-[10px]">公積金紀錄</span>
                          <span className="font-bold text-[#3E3A36] text-sm">{restorePreview.recordsCount} 筆</span>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-blue-100">
                          <span className="text-[#8C8475] block text-[10px]">代墊借還</span>
                          <span className="font-bold text-[#3E3A36] text-sm">{restorePreview.splitCount} 筆</span>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-blue-100">
                          <span className="text-[#8C8475] block text-[10px]">心願與採購</span>
                          <span className="font-bold text-[#3E3A36] text-sm">{restorePreview.shoppingCount} 項</span>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-blue-100">
                          <span className="text-[#8C8475] block text-[10px]">旅遊行程</span>
                          <span className="font-bold text-[#3E3A36] text-sm">{restorePreview.tripsCount} 個</span>
                        </div>
                      </div>

                      <div className="pt-2 flex items-center justify-between border-t border-blue-200/60">
                        <span className="text-[11px] text-rose-700 font-medium flex items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>注意：還原將覆蓋現有本地暫存紀錄！</span>
                        </span>
                        <button
                          type="button"
                          onClick={handleConfirmRestore}
                          className="px-4 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer active:scale-95"
                        >
                          <span>確認覆蓋並還原</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. 對帳與資料診斷 Tab */}
            {activeTab === 'reconcile' && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8E4D9] shadow-2xs space-y-3.5">
                  <div className="flex items-center justify-between border-b border-[#F2EDE1] pb-3">
                    <div>
                      <h4 className="text-xs font-extrabold text-[#3E3A36] flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-emerald-700" />
                        <span>資料完整性與防呆檢核</span>
                      </h4>
                      <p className="text-[11px] text-[#8C8475] mt-0.5">
                        自動掃描同日同金額重複記帳與對帳狀態
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSyncAll()}
                      disabled={isSyncing}
                      className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>{isSyncing ? '重新對帳中...' : '重新自試算表抓取'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-[#FAF8F3] p-3 rounded-xl border border-[#E8E4D9]">
                      <span className="text-[11px] text-[#8C8475] block">連線狀態</span>
                      <span className="text-xs font-bold text-[#3E3A36] mt-1 flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        {isOnline ? '🟢 已連網' : '🟠 離線中'}
                      </span>
                    </div>

                    <div className="bg-[#FAF8F3] p-3 rounded-xl border border-[#E8E4D9]">
                      <span className="text-[11px] text-[#8C8475] block">最後同步時間</span>
                      <span className="text-xs font-bold text-[#3E3A36] mt-1 font-mono">
                        {lastSyncedAt || '尚未同步'}
                      </span>
                    </div>

                    <div className="bg-[#FAF8F3] p-3 rounded-xl border border-[#E8E4D9]">
                      <span className="text-[11px] text-[#8C8475] block">重複記帳疑似項目</span>
                      <span className="text-xs font-bold text-[#3E3A36] mt-1">
                        {duplicateRecords.length > 0 ? (
                          <span className="text-amber-800 font-bold">{duplicateRecords.length} 筆疑似重複</span>
                        ) : (
                          <span className="text-emerald-800 font-bold">無重複項目</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {duplicateRecords.length > 0 && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                      <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                        <span>疑似重複記帳提醒（同日、同出資人、同品項與同金額）：</span>
                      </span>
                      <div className="space-y-1 divide-y divide-amber-100 max-h-36 overflow-y-auto text-[11px]">
                        {duplicateRecords.map((dup, idx) => (
                          <div key={idx} className="pt-1 first:pt-0 flex items-center justify-between text-amber-900">
                            <span>{dup.date} ｜ {dup.payer} ｜ {dup.item}</span>
                            <span className="font-bold">NT$ {(Number(dup.amount) || 0).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
