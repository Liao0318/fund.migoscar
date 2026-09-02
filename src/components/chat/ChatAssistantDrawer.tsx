import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageCircle, 
  X, 
  Send, 
  Mic, 
  Sparkles, 
  Trash2, 
  Bot, 
  Bell,
  Sliders,
  CheckCheck,
  ArrowRight,
  Clock,
  CreditCard,
  Wallet,
  ShoppingCart,
  Scale,
  Settings,
  CheckCircle2,
  RefreshCw,
  ChevronDown,
  Volume2,
  BarChart3,
  Tag,
  MapPin,
  Check,
  Undo2
} from 'lucide-react';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { AppNotification, AppNotifySettings, SmartCommandResult, SmartCommandCardData } from '../../types';
import { formatAmPmTime } from '../../utils/formatters';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  type?: 'text' | 'success' | 'info' | 'error' | 'notification' | 'query' | 'expense' | 'income' | 'shopping' | 'settle' | 'delete';
  cardData?: SmartCommandCardData;
  actionData?: {
    id: string | number;
    type: 'expense' | 'income' | 'shopping' | 'split';
    title?: string;
  };
  undone?: boolean;
  meta?: {
    title?: string;
    desc?: string;
    category?: string;
    amount?: number;
    payer?: string;
    time?: string;
    isNotificationCard?: boolean;
  };
}

interface ChatAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteCommand: (cmd: string) => Promise<SmartCommandResult | boolean>;
  onUndo?: (actionData?: { id?: string | number; type: 'expense' | 'income' | 'shopping' | 'split'; title?: string }) => Promise<boolean>;
  onUndoCommandItem?: (item: { id: string | number; type: 'expense' | 'income' | 'shopping' | 'split'; title?: string }) => Promise<boolean>;
  appMode?: 'fund' | 'split';
  notifications?: AppNotification[];
  onMarkRead?: (id: string) => void;
  onMarkAllRead?: () => void;
  onDeleteNotification?: (id: string) => void;
  onClearAllNotifications?: () => void;
  notifySettings?: AppNotifySettings;
  toggleNotifySetting?: (key: keyof AppNotifySettings) => void;
  onTestNotification?: () => void;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'welcome-1',
    sender: 'assistant',
    text: '嗨！我是伴伴記帳小秘書 💬\n所有記帳、公積金存入、代墊平帳與購物清單通知，都會即時在此對話中推播更新！\n\n您可以直接打字或按下方 🎙️ 麥克風說話記帳。',
    timestamp: '剛剛',
    type: 'text'
  },
  {
    id: 'welcome-2',
    sender: 'assistant',
    text: '💡 常用指令範例（可直接點擊下方快捷鍵）：\n• 廖 1200 晚餐（自動 AA 代墊記帳）\n• 周 85 珍奶（記帳並發送推播通知）\n• 存 10000 薪資（公積金存入）\n• 需要買 鮮奶 全聯（加入購物清單）\n• 查代墊 / 結餘（即時對帳狀況）',
    timestamp: '剛剛',
    type: 'info'
  }
];

export const ChatAssistantDrawer: React.FC<ChatAssistantDrawerProps> = ({
  isOpen,
  onClose,
  onExecuteCommand,
  onUndo,
  onUndoCommandItem,
  appMode = 'split',
  notifications = [],
  onMarkRead,
  onMarkAllRead,
  onDeleteNotification,
  onClearAllNotifications,
  notifySettings,
  toggleNotifySetting,
  onTestNotification,
}) => {
  const undoHandler = onUndo || onUndoCommandItem;
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [undoLoadingId, setUndoLoadingId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('banban_chat_messages');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {}
    return INITIAL_MESSAGES;
  });

  const [inputVal, setInputVal] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUndo = async (msg: ChatMessage) => {
    if (!msg.actionData || msg.undone || !undoHandler) return;
    setUndoLoadingId(msg.id);
    try {
      const success = await undoHandler(msg.actionData);
      if (success) {
        setMessages((prev) => {
          const updated = prev.map((m) =>
            m.id === msg.id ? { ...m, undone: true } : m
          );
          try {
            localStorage.setItem('banban_chat_messages', JSON.stringify(updated.slice(-50)));
          } catch (e) {}
          return updated;
        });
      }
    } finally {
      setUndoLoadingId(null);
    }
  };

  // 監聽 window 自訂 event (外部操作如代墊表單/結算產生的推播訊息)
  useEffect(() => {
    const handleIncomingChatMessage = (e: any) => {
      if (e.detail) {
        setTimeout(() => {
          setMessages((prev) => {
            if (prev.some(m => m.id === e.detail.id)) return prev;
            const updated = [...prev, e.detail];
            try {
              localStorage.setItem('banban_chat_messages', JSON.stringify(updated.slice(-50)));
            } catch (err) {}
            return updated;
          });
        }, 0);
      }
    };

    window.addEventListener('banban:new_chat_message', handleIncomingChatMessage);
    return () => window.removeEventListener('banban:new_chat_message', handleIncomingChatMessage);
  }, []);

  // 儲存對話紀錄
  useEffect(() => {
    try {
      localStorage.setItem('banban_chat_messages', JSON.stringify(messages.slice(-50)));
    } catch (e) {}
  }, [messages]);

  // 自動捲動至最新訊息
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 150);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, messages]);

  const getCurrentTimeStr = () => {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes().toString().padStart(2, '0');
    const ampm = h >= 12 ? '下午' : '上午';
    const dispH = h % 12 === 0 ? 12 : h % 12;
    return `${ampm} ${dispH}:${m}`;
  };

  const handleSendMessage = async (textToSend?: string) => {
    const raw = (textToSend !== undefined ? textToSend : inputVal).trim();
    if (!raw || isProcessing) return;

    if (isListening) {
      stopListening();
    }

    const timeStr = getCurrentTimeStr();
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: raw,
      timestamp: timeStr
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setIsProcessing(true);

    try {
      // 執行智慧指令並獲取結構化回覆
      const result = await onExecuteCommand(raw);

      let replyText = '';
      let msgType: 'success' | 'info' | 'error' | 'notification' | 'query' | 'expense' | 'income' | 'shopping' | 'settle' = 'info';
      let cardData: SmartCommandCardData | undefined = undefined;
      let actionData: { id: string | number; type: 'expense' | 'income' | 'shopping' | 'split'; title?: string } | undefined = undefined;

      if (typeof result === 'object' && result !== null) {
        replyText = result.replyText;
        msgType = (result.type as any) || (result.success ? 'success' : 'error');
        cardData = result.cardData;
        actionData = result.data;
      } else if (result === true) {
        msgType = 'success';
        if (/^(查|查詢|查帳|查代墊|誰欠誰|結算|結餘|餘額)$/i.test(raw)) {
          replyText = `📊 已為您查詢最新對帳狀況！詳細帳務已在畫面上即時更新。`;
        } else if (raw.includes('存') || raw.includes('公積金') || raw.includes('入帳')) {
          replyText = `💰 已成功記錄公積金存入！已為您自動同步至入帳清單。`;
        } else if (raw.startsWith('買') || raw.startsWith('想要') || raw.startsWith('需要買') || raw.startsWith('購買')) {
          replyText = `🛒 已成功加入購物清單！可在「購物記事」隨時確認。`;
        } else {
          replyText = `✅ 記帳成功！已為您記錄並完成自動分帳計算。`;
        }
      } else {
        msgType = 'error';
        replyText = `⚠️ 抱歉，未能辨識指令格式。您可以試試：\n• 「廖 1200 晚餐」\n• 「周 85 飲料」\n• 「存 10000 薪資」\n• 「需要買 鮮奶 全聯」\n• 「查代墊」`;
      }

      // 保證發送單一則最精美的卡片訊息
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: replyText,
        timestamp: getCurrentTimeStr(),
        type: msgType,
        cardData: cardData,
        actionData: actionData
      };

      setMessages((prev) => {
        const updated = [...prev, botMsg];
        try {
          localStorage.setItem('banban_chat_messages', JSON.stringify(updated.slice(-50)));
        } catch (e) {}
        return updated;
      });
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: `⚠️ 處理過程發生錯誤：${err?.message || '請稍後重試'}`,
        timestamp: getCurrentTimeStr(),
        type: 'error'
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  // 語音辨識 Hook
  const {
    isListening,
    interimTranscript,
    stopListening,
    toggleListening
  } = useSpeechRecognition({
    onResult: (text, isFinal) => {
      setInputVal(text);
    },
    onError: (err) => {
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: `🎙️ 語音辨識提示：${err}`,
        timestamp: getCurrentTimeStr(),
        type: 'error'
      };
      setMessages((prev) => [...prev, botMsg]);
    }
  });

  const handleClearChat = () => {
    setMessages(INITIAL_MESSAGES);
    try {
      localStorage.setItem('banban_chat_messages', JSON.stringify(INITIAL_MESSAGES));
    } catch (e) {}
  };

  const QUICK_PROMPTS = [
    { label: '廖 1200 晚餐', cmd: '廖 1200 晚餐' },
    { label: '周 85 珍奶', cmd: '周 85 珍奶' },
    { label: '存 10000 薪資', cmd: '存 10000 薪資' },
    { label: '需要買 鮮奶 全聯', cmd: '需要買 鮮奶 全聯' },
    { label: '查代墊', cmd: '查代墊' },
    { label: '查結餘', cmd: '結餘' }
  ];

  // 渲染單一最精美的 Flex 推播卡片
  const renderMessageCard = (msg: ChatMessage) => {
    const isExpense = msg.type === 'expense';
    const isIncome = msg.type === 'income';
    const isSettle = msg.type === 'settle';
    const isShopping = msg.type === 'shopping';
    const isQuery = msg.type === 'query';

    let headerBg = 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white';
    let categoryBadge = msg.cardData?.categoryBadge || '🔔 伴伴即時通知';
    let tagPill = msg.cardData?.tagPill || '即時推播';
    let IconComponent = Bell;

    if (isExpense) {
      headerBg = 'bg-gradient-to-r from-[#06C755] to-emerald-600 text-white';
      if (!msg.cardData?.categoryBadge) categoryBadge = '💳 代墊記帳成功';
      IconComponent = CreditCard;
    } else if (isIncome) {
      headerBg = 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white';
      if (!msg.cardData?.categoryBadge) categoryBadge = '💰 公積金存入成功';
      IconComponent = Wallet;
    } else if (isQuery) {
      headerBg = 'bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 text-white';
      if (!msg.cardData?.categoryBadge) categoryBadge = '📊 即時對帳摘要';
      IconComponent = BarChart3;
    } else if (isSettle) {
      headerBg = 'bg-gradient-to-r from-amber-500 to-orange-600 text-white';
      if (!msg.cardData?.categoryBadge) categoryBadge = '⚖️ 代墊清帳結算成功';
      IconComponent = Scale;
    } else if (isShopping) {
      headerBg = 'bg-gradient-to-r from-sky-600 to-blue-700 text-white';
      if (!msg.cardData?.categoryBadge) categoryBadge = '🛒 購物記事已新增';
      IconComponent = ShoppingCart;
    }

    const card = msg.cardData;

    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100/90 overflow-hidden w-full max-w-[95%] sm:max-w-[88%] text-left transition-all">
        {/* 頂部 Header 標籤列 */}
        <div className={`${headerBg} px-4 py-2.5 flex items-center justify-between shadow-xs`}>
          <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm tracking-wide">
            <IconComponent className="w-4 h-4" />
            <span>{categoryBadge}</span>
          </div>
          {tagPill && (
            <span className="text-[10px] sm:text-[11px] bg-white/20 backdrop-blur-xs font-semibold px-2 py-0.5 rounded-full border border-white/25">
              {tagPill}
            </span>
          )}
        </div>

        {/* 卡片主體區塊 */}
        <div className="p-3.5 sm:p-4 space-y-3 bg-[#FCFDFE]">
          {/* 焦點大數字 / 核心狀態區塊 */}
          {card?.highlightValue ? (
            <div className="bg-gradient-to-b from-white to-gray-50/70 border border-gray-100 rounded-xl p-3 shadow-2xs">
              {card.highlightTitle && (
                <div className="text-[11px] font-medium text-gray-500 mb-1 flex items-center gap-1">
                  <Tag className="w-3 h-3 text-emerald-600" />
                  {card.highlightTitle}
                </div>
              )}
              <div className="text-base sm:text-lg font-black text-gray-900 tracking-tight leading-snug">
                {card.highlightValue}
              </div>
              {card.highlightSub && (
                <div className="text-[11px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  {card.highlightSub}
                </div>
              )}
            </div>
          ) : msg.meta?.title ? (
            <div className="font-bold text-sm text-[#2C3E50] leading-snug">
              {msg.meta.title}
            </div>
          ) : null}

          {/* 結構化項目清單 */}
          {card?.items && card.items.length > 0 ? (
            <div className="bg-gray-50/60 rounded-xl p-2.5 space-y-1.5 border border-gray-100/80">
              {card.items.map((item, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-start justify-between text-xs py-0.5 ${
                    idx !== card.items!.length - 1 ? 'border-b border-gray-100 pb-1.5' : ''
                  }`}
                >
                  <span className="text-gray-500 shrink-0 pr-2">{item.label}</span>
                  <span className={`text-right font-medium break-words ${
                    item.isHighlight ? 'text-emerald-700 font-bold' : 'text-gray-800'
                  }`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          ) : msg.meta?.desc || (!card && msg.text) ? (
            <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap break-words">
              {msg.meta?.desc || msg.text}
            </p>
          ) : null}

          {/* 底部小提示 */}
          {card?.footerNote && (
            <div className="text-[11px] text-gray-500 bg-amber-50/60 border border-amber-100/70 rounded-lg px-2.5 py-1.5 leading-relaxed font-normal">
              {card.footerNote}
            </div>
          )}

          {/* ↩️ 復原 (Undo) 與操作按鈕列 */}
          {msg.actionData && undoHandler && (
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
              {msg.undone ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-lg">
                  <Undo2 className="w-3.5 h-3.5 text-gray-400" />
                  <span>已撤銷復原此項目</span>
                </span>
              ) : (
                <button
                  type="button"
                  disabled={undoLoadingId === msg.id}
                  onClick={() => handleUndo(msg)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 px-2.5 py-1 rounded-lg transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                  title="撤銷剛才新增的這筆紀錄"
                >
                  <Undo2 className={`w-3.5 h-3.5 ${undoLoadingId === msg.id ? 'animate-spin' : ''}`} />
                  <span>{undoLoadingId === msg.id ? '撤銷中...' : '↩️ 立即復原 (撤銷)'}</span>
                </button>
              )}
              <span className="text-[10px] text-gray-400">
                {msg.actionData.type === 'expense' || msg.actionData.type === 'split' ? '代墊明細' : msg.actionData.type === 'income' ? '公積金存入' : '購物記事'}
              </span>
            </div>
          )}

          {/* 底部時間與同步標籤 */}
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400">
            <span className="flex items-center gap-1 font-medium text-emerald-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              自動同步至看板
            </span>
            <span className="font-mono text-gray-400">{msg.timestamp}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs">
          {/* 背景遮罩點擊關閉 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0"
          />

          {/* 沉浸式對話視窗 */}
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-[#8C9EB5] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[88vh] sm:h-[700px] max-h-[94vh] z-10 border border-white/20"
          >
            {/* 頂部 Header */}
            <div className="bg-[#243342] text-white px-4 py-3 sm:px-5 sm:py-3.5 flex items-center justify-between shadow-sm shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#06C755] to-emerald-400 p-0.5 flex items-center justify-center shadow-md relative">
                  <Bot className="w-6 h-6 text-white" />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#243342]" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-sm sm:text-base leading-tight">伴伴記帳小秘書</h3>
                  </div>
                  <p className="text-[11px] text-gray-300 font-light flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#06C755] animate-pulse"></span>
                    所有通知與記帳皆在此對話即時呈現
                  </p>
                </div>
              </div>

              {/* 頂部動作按鈕 */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowSettingsPanel(!showSettingsPanel)}
                  title="推播與通知設定"
                  className={`p-2 rounded-full transition-colors cursor-pointer ${
                    showSettingsPanel ? 'bg-white/20 text-emerald-300' : 'hover:bg-white/10 text-gray-300 hover:text-white'
                  }`}
                >
                  <Sliders className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleClearChat}
                  title="清空對話紀錄"
                  className="p-2 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer ml-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 展開式推播通知偏好設定面板 */}
            <AnimatePresence>
              {showSettingsPanel && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-[#1C2833] text-white px-4 py-3 border-b border-white/10 text-xs overflow-hidden shrink-0 shadow-inner"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2.5">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                      <Sliders className="w-3.5 h-3.5" />
                      <span>即時通知推播開關</span>
                    </div>
                    {onTestNotification && (
                      <button
                        type="button"
                        onClick={onTestNotification}
                        className="text-[10px] bg-emerald-600/80 hover:bg-emerald-600 px-2 py-0.5 rounded text-white font-medium cursor-pointer transition-colors"
                      >
                        測試發送通知
                      </button>
                    )}
                  </div>

                  {notifySettings && toggleNotifySetting && (
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <label className="flex items-center gap-1.5 cursor-pointer hover:text-emerald-300">
                        <input
                          type="checkbox"
                          checked={notifySettings.notifyOnAdd}
                          onChange={() => toggleNotifySetting('notifyOnAdd')}
                          className="accent-emerald-500 rounded"
                        />
                        <span>代墊記帳推播</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer hover:text-emerald-300">
                        <input
                          type="checkbox"
                          checked={notifySettings.notifyOnIncome}
                          onChange={() => toggleNotifySetting('notifyOnIncome')}
                          className="accent-emerald-500 rounded"
                        />
                        <span>公積金存入推播</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer hover:text-emerald-300">
                        <input
                          type="checkbox"
                          checked={notifySettings.notifyOnSettle}
                          onChange={() => toggleNotifySetting('notifyOnSettle')}
                          className="accent-emerald-500 rounded"
                        />
                        <span>代墊平帳結算推播</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer hover:text-emerald-300">
                        <input
                          type="checkbox"
                          checked={notifySettings.notifyOnShoppingAdd}
                          onChange={() => toggleNotifySetting('notifyOnShoppingAdd')}
                          className="accent-emerald-500 rounded"
                        />
                        <span>購物清單提醒</span>
                      </label>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* 對話與通知整合聊天清單區域 (經典藍灰背景) */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3.5 select-text">
              {messages.map((msg) => {
                const isUser = msg.sender === 'user';
                const hasCardData = !!msg.cardData || msg.meta?.isNotificationCard || ['expense', 'income', 'query', 'settle', 'shopping'].includes(msg.type || '');

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {/* Bot Avatar */}
                    {!isUser && (
                      <div className="w-8 h-8 rounded-full bg-white shadow-xs flex items-center justify-center text-emerald-600 shrink-0 mb-1 border border-emerald-100">
                        <Bot className="w-4 h-4 text-[#06C755]" />
                      </div>
                    )}

                    {/* 時間戳記 (User 在左) */}
                    {isUser && (
                      <span className="text-[10px] text-white/80 font-mono mb-0.5">
                        {msg.timestamp}
                      </span>
                    )}

                    {/* 對話氣泡 / 精美卡片 */}
                    {isUser ? (
                      <div className="max-w-[85%] sm:max-w-[78%] px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm bg-[#85E249] text-[#1E3A1A] font-medium rounded-br-xs">
                        {msg.text}
                      </div>
                    ) : hasCardData ? (
                      renderMessageCard(msg)
                    ) : (
                      <div
                        className={`max-w-[85%] sm:max-w-[78%] px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm ${
                          msg.type === 'error'
                            ? 'bg-rose-50 text-rose-900 border border-rose-200 rounded-bl-xs'
                            : msg.type === 'success'
                            ? 'bg-emerald-50 text-emerald-950 border border-emerald-200 rounded-bl-xs'
                            : 'bg-white text-[#2C3E50] rounded-bl-xs'
                        }`}
                      >
                        {msg.text}
                      </div>
                    )}

                    {/* 時間戳記 (Bot 在右) */}
                    {!isUser && (
                      <span className="text-[10px] text-white/80 font-mono mb-0.5">
                        {msg.timestamp}
                      </span>
                    )}
                  </motion.div>
                );
              })}

              {/* 處理中指示器 */}
              {isProcessing && (
                <div className="flex items-center gap-2 text-white/90 text-xs pl-10">
                  <div className="w-2 h-2 rounded-full bg-white animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-white animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 rounded-full bg-white animate-bounce [animation-delay:0.4s]" />
                  <span>小秘書正在處理記帳與對帳...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* 快速常用指令捷徑列 */}
            <div className="bg-[#788FA9] px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 border-t border-white/10">
              <span className="text-[11px] text-white/90 font-bold shrink-0 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300" />
                快捷：
              </span>
              {QUICK_PROMPTS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(p.cmd)}
                  className="px-2.5 py-1 rounded-full bg-white/95 hover:bg-white text-[#2C3E50] text-[11px] font-semibold shrink-0 transition-all cursor-pointer shadow-2xs hover:scale-102 active:scale-95"
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* 語音聆聽動態提示區 */}
            <AnimatePresence>
              {isListening && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-[#06C755] text-white px-4 py-2 text-xs flex items-center justify-between shrink-0 shadow-inner"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-ping shrink-0" />
                    <span className="font-bold shrink-0">正在聆聽語音...</span>
                    <span className="text-emerald-100 truncate">
                      {interimTranscript || '請說出記帳內容（如：廖 1200 晚餐）'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={stopListening}
                    className="text-[11px] bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded text-white font-bold ml-2 shrink-0 cursor-pointer"
                  >
                    完成
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 底部輸入列 */}
            <div className="bg-[#F6F7F9] p-2.5 sm:p-3 border-t border-gray-200 flex items-center gap-2 shrink-0">
              {/* 語音麥克風按鈕 */}
              <button
                type="button"
                onClick={toggleListening}
                title={isListening ? "點擊停止語音" : "按一下開始說話記帳"}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-2xs shrink-0 active:scale-95 ${
                  isListening
                    ? 'bg-rose-600 text-white animate-pulse shadow-md ring-2 ring-rose-300'
                    : 'bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                <Mic className={`w-5 h-5 ${isListening ? 'animate-bounce' : ''}`} />
              </button>

              {/* 輸入框 */}
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={isListening ? "正在聆聽中... 請說話" : "輸入指令（如：廖 1200 晚餐、存 10000 薪資）..."}
                  className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white rounded-2xl border focus:outline-none transition-all shadow-2xs font-sans ${
                    isListening
                      ? 'border-emerald-500 ring-2 ring-emerald-200 bg-emerald-50/20 placeholder:text-emerald-600'
                      : 'border-gray-300 focus:border-[#06C755] focus:ring-1 focus:ring-[#06C755]/30'
                  }`}
                />
              </div>

              {/* 發送按鈕 */}
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputVal.trim() || isProcessing}
                className="w-10 h-10 rounded-full bg-[#06C755] hover:bg-[#05b34c] disabled:opacity-40 disabled:hover:bg-[#06C755] text-white flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
