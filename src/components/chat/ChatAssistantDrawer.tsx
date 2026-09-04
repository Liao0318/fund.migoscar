import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Undo2,
  Heart,
  BellRing,
  ShoppingBag,
  UserCheck,
  SlidersHorizontal,
  ChevronRight,
  User
} from 'lucide-react';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { AppNotification, AppNotifySettings, SmartCommandResult, SmartCommandCardData, AuthUser, CoupleBindingInfo } from '../../types';
import { formatAmPmTime, isIncomingFromPartner } from '../../utils/formatters';
import { resolveUserPersonas } from '../../utils/userPersona';

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
  currentUser?: AuthUser | null;
  partnerBindingInfo?: CoupleBindingInfo | null;
  onMarkRead?: (id: string) => void;
  onMarkAllRead?: () => void;
  onDeleteNotification?: (id: string) => void;
  onClearAllNotifications?: () => void;
  notifySettings?: AppNotifySettings;
  setAllNotifySettings?: (val: boolean) => void;
  toggleNotifySetting?: (key: keyof AppNotifySettings) => void;
  onTestNotification?: () => void;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'welcome-1',
    sender: 'assistant',
    text: '嗨！我是伴伴記帳小秘書 💬\n所有即時通知、公積金存入、代墊平帳與採購動態，都會即時在此對話中推播更新！\n\n您可以直接打字或按下方 🎙️ 麥克風說話記帳。',
    timestamp: '剛剛',
    type: 'text'
  },
  {
    id: 'welcome-2',
    sender: 'assistant',
    text: '💡 常用指令範例（可直接點擊下方快捷鍵）：\n• 記帳：出資人 金額 品項（如：廖 1200 晚餐）\n• 存入：存 金額 項目（如：存 10000 薪資）\n• 採購：需要買 品名 地點（如：需要買 鮮奶 全聯）\n• 查詢：查代墊 / 結餘（即時對帳狀況）',
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
  currentUser,
  partnerBindingInfo,
  onMarkRead,
  onMarkAllRead,
  onDeleteNotification,
  onClearAllNotifications,
  notifySettings,
  setAllNotifySettings,
  toggleNotifySetting,
  onTestNotification,
}) => {
  const { userA, userB } = useMemo(() => {
    return resolveUserPersonas(currentUser, partnerBindingInfo);
  }, [currentUser, partnerBindingInfo]);

  const undoHandler = onUndo || onUndoCommandItem;
  const [activeTab, setActiveTab] = useState<'chat' | 'notifications' | 'settings'>('chat');
  const [filterMode, setFilterMode] = useState<'partner' | 'all' | 'unread'>('partner');
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

  const activeCount = Object.values(notifySettings || {}).filter(Boolean).length;

  // 判斷是否為「伴侶發送給我的通知」
  const checkIsIncoming = (n: AppNotification) => isIncomingFromPartner(n, currentUser);

  const incomingUnreadCount = notifications.filter(n => !n.read && checkIsIncoming(n)).length;

  const filteredNotifications = notifications.filter(n => {
    if (filterMode === 'partner') {
      return checkIsIncoming(n);
    }
    if (filterMode === 'unread') {
      return !n.read && checkIsIncoming(n);
    }
    return true;
  });

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
    if (isOpen && activeTab === 'chat') {
      setTimeout(scrollToBottom, 150);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, activeTab, messages]);

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
    { label: `${userA.shortName} 1200 晚餐`, cmd: `${userA.shortName} 1200 晚餐` },
    { label: `${userB.shortName} 85 珍奶`, cmd: `${userB.shortName} 85 珍奶` },
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
              即時推播連線中
            </span>
            <span className="font-mono text-gray-400">{msg.timestamp}</span>
          </div>
        </div>
      </div>
    );
  };

  const NOTIFY_CONFIG_ITEMS: { key: keyof AppNotifySettings; title: string; desc: string; icon: string; category: string }[] = [
    {
      key: 'notifyOnAdd',
      title: '日常代墊記帳推播',
      desc: '伴侶或自己在代墊分帳新增任何支出時發送即時通知',
      icon: '💳',
      category: '代墊與公積金記帳'
    },
    {
      key: 'notifyOnIncome',
      title: '公積金存入通知',
      desc: '雙方存入公積金款項入帳時，即時發送推播與金額提醒',
      icon: '💰',
      category: '代墊與公積金記帳'
    },
    {
      key: 'notifyOnEdit',
      title: '帳目修改更新通知',
      desc: '任何帳目的品名、金額、付款人或分攤比例被編輯時提醒',
      icon: '✏️',
      category: '帳目異動提醒'
    },
    {
      key: 'notifyOnDelete',
      title: '帳目刪除警示通知',
      desc: '任何既有支出或公積金紀錄被刪除時發送安全確認提醒',
      icon: '🗑️',
      category: '帳目異動提醒'
    },
    {
      key: 'notifyOnSettle',
      title: '代墊平帳結算完成通知',
      desc: '雙方進行月度對帳清償平帳時，即時推播結算確認與歸零報告',
      icon: '⚖️',
      category: '結算與預算'
    },
    {
      key: 'showBalance',
      title: '公積金剩餘額度警戒',
      desc: '公積金結餘低於設定水位（或透支）時發送警示推播',
      icon: '⚠️',
      category: '結算與預算'
    },
    {
      key: 'notifyOnShoppingAdd',
      title: '採購待買清單新增',
      desc: '另一半在採購記事加入想要或需要購買的食材與日用品時推播',
      icon: '🛒',
      category: '採購清單'
    },
    {
      key: 'notifyOnShoppingComplete',
      title: '採購物品已買回勾選',
      desc: '清單中的物品被標記為已購買（或直接轉代墊記帳）時推播',
      icon: '✅',
      category: '採購清單'
    },
    {
      key: 'notifyOnShoppingDelete',
      title: '採購清單項目刪除',
      desc: '採購記事內的品項被移除時通知',
      icon: '📝',
      category: '採購清單'
    }
  ];

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

          {/* 沉浸式機器人抽屜視窗 */}
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-[#FAF9F5] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[90vh] sm:h-[720px] max-h-[96vh] z-10 border border-white/20"
          >
            {/* 頂部 Header */}
            <div className="bg-[#243342] text-white px-4 py-3 sm:px-5 sm:py-3.5 flex items-center justify-between shadow-sm shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#06C755] to-emerald-400 p-0.5 flex items-center justify-center shadow-md relative">
                  <Bot className="w-6 h-6 text-white" />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#243342]" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="font-bold text-sm sm:text-base leading-tight">伴伴記帳小秘書</h3>
                    {currentUser && (
                      <span className="text-[10px] bg-white/20 text-emerald-300 px-2 py-0.2 rounded-full font-bold">
                        {currentUser.nickname || currentUser.name || '已登入'}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-300 font-light flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#06C755] animate-pulse"></span>
                    對話記帳、雙向推播與即時通知中心
                  </p>
                </div>
              </div>

              {/* 頂部動作按鈕 */}
              <div className="flex items-center gap-1.5">
                {activeTab === 'chat' && (
                  <button
                    type="button"
                    onClick={handleClearChat}
                    title="清空對話紀錄"
                    className="p-2 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer ml-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 🤖 機器人多功能頁籤列 (對話記帳 💬 / 即時通知 🔔 / 推播設定 ⚙️) */}
            <div className="bg-[#1C2833] px-2 sm:px-3 pt-1.5 flex items-center justify-between border-b border-white/10 shrink-0 overflow-x-auto [scrollbar-width:none] gap-1">
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('chat')}
                  className={`px-2.5 sm:px-3 py-2 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 rounded-t-xl shrink-0 ${
                    activeTab === 'chat'
                      ? 'bg-[#8C9EB5] text-white shadow-xs'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>對話記帳</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('notifications')}
                  className={`px-2.5 sm:px-3 py-2 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 rounded-t-xl relative shrink-0 ${
                    activeTab === 'notifications'
                      ? 'bg-[#FAF9F5] text-[#3E3A36] shadow-xs'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <Bell className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>即時通知</span>
                  {incomingUnreadCount > 0 && (
                    <span className="min-w-[15px] h-3.5 px-1 bg-rose-500 rounded-full text-[9px] text-white font-black flex items-center justify-center animate-pulse shrink-0">
                      {incomingUnreadCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('settings')}
                  className={`px-2.5 sm:px-3 py-2 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 rounded-t-xl shrink-0 ${
                    activeTab === 'settings'
                      ? 'bg-[#FAF9F5] text-[#3E3A36] shadow-xs'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>推播設定</span>
                  <span className="text-[10px] bg-white/20 text-gray-300 font-bold px-1.5 py-0.2 rounded-full shrink-0">
                    {activeCount}/9
                  </span>
                </button>
              </div>

              {onTestNotification && (
                <button
                  type="button"
                  onClick={onTestNotification}
                  className="text-[10px] sm:text-xs bg-emerald-600/90 hover:bg-emerald-600 px-2 sm:px-2.5 py-1 rounded-lg text-white font-bold cursor-pointer transition-colors shadow-2xs shrink-0 flex items-center gap-1 whitespace-nowrap ml-1"
                >
                  <span>🔔 測試推播</span>
                </button>
              )}
            </div>

            {/* TAB 1: 💬 對話記帳畫面 */}
            {activeTab === 'chat' && (
              <div className="flex-1 bg-[#8C9EB5] flex flex-col min-h-0 overflow-hidden">
                {/* 對話清單 */}
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
                        {!isUser && (
                          <div className="w-8 h-8 rounded-full bg-white shadow-xs flex items-center justify-center text-emerald-600 shrink-0 mb-1 border border-emerald-100">
                            <Bot className="w-4 h-4 text-[#06C755]" />
                          </div>
                        )}

                        {isUser && (
                          <span className="text-[10px] text-white/80 font-mono mb-0.5">
                            {msg.timestamp}
                          </span>
                        )}

                        {isUser ? (
                          <div className="flex items-end gap-2 max-w-[85%] sm:max-w-[78%]">
                            <div className="px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm bg-[#85E249] text-[#1E3A1A] font-medium rounded-br-xs flex-1">
                              {msg.text}
                            </div>
                            {currentUser?.avatar ? (
                              <img
                                src={currentUser.avatar}
                                alt={currentUser.nickname || currentUser.name || 'User'}
                                referrerPolicy="no-referrer"
                                className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-white/50 mb-0.5 shadow-2xs"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-white/20 text-white flex items-center justify-center text-xs font-bold shrink-0 mb-0.5 shadow-2xs">
                                <User className="w-3.5 h-3.5 text-white" />
                              </div>
                            )}
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

                        {!isUser && (
                          <span className="text-[10px] text-white/80 font-mono mb-0.5">
                            {msg.timestamp}
                          </span>
                        )}
                      </motion.div>
                    );
                  })}

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

                  <button
                    type="button"
                    onClick={() => handleSendMessage()}
                    disabled={!inputVal.trim() || isProcessing}
                    className="w-10 h-10 rounded-full bg-[#06C755] hover:bg-[#05b34c] disabled:opacity-40 disabled:hover:bg-[#06C755] text-white flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
                  >
                    <Send className="w-4 h-4 ml-0.5" />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: 🔔 即時通知動態中心 */}
            {activeTab === 'notifications' && (
              <div className="flex-1 bg-[#FAF9F5] p-3 sm:p-4 overflow-y-auto space-y-3.5 text-left">
                {/* 伴侶雙向通知提示說明條 */}
                <div className="bg-rose-50/90 border border-rose-200/90 rounded-2xl p-3 flex items-start gap-2.5 shadow-2xs">
                  <Heart className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div className="text-xs text-[#5C564E] space-y-0.5">
                    <p className="font-bold text-[#3E3A36]">
                      💖 雙向伴侶通知路由中心
                    </p>
                    <p className="text-[11px] text-[#7A756E] leading-relaxed">
                      當伴侶記帳、存入公積金或採購時，您會在此即時收到專屬推播提醒；您自己的操作不會對您產生未讀紅點干擾。
                    </p>
                  </div>
                </div>

                {/* 篩選與批量操作工具列 */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-2.5 rounded-2xl border border-[#E8E4D9]">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFilterMode('partner')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        filterMode === 'partner'
                          ? 'bg-rose-600 text-white shadow-2xs'
                          : 'bg-[#F2EFE7] text-[#706B62] hover:bg-[#EAE5D9]'
                      }`}
                    >
                      💖 伴侶即時通知
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterMode('all')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        filterMode === 'all'
                          ? 'bg-[#4D4942] text-white shadow-2xs'
                          : 'bg-[#F2EFE7] text-[#706B62] hover:bg-[#EAE5D9]'
                      }`}
                    >
                      全部動態
                    </button>
                    {incomingUnreadCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setFilterMode('unread')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          filterMode === 'unread'
                            ? 'bg-rose-500 text-white shadow-2xs'
                            : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                        }`}
                      >
                        未讀 ({incomingUnreadCount})
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 ml-auto">
                    {onMarkAllRead && incomingUnreadCount > 0 && (
                      <button
                        type="button"
                        onClick={onMarkAllRead}
                        className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#EFECE3] hover:bg-[#E5E1D5] text-[#5C564E] transition-all cursor-pointer flex items-center gap-1"
                      >
                        <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>全部已讀</span>
                      </button>
                    )}
                    {onClearAllNotifications && notifications.length > 0 && (
                      <button
                        type="button"
                        onClick={onClearAllNotifications}
                        className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-red-50 hover:bg-red-100 text-red-700 transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>清空</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 通知列表清單 */}
                <div className="space-y-2.5">
                  {filteredNotifications.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 border border-[#E8E4D9] text-center text-[#8C8475] space-y-2">
                      <div className="w-12 h-12 rounded-full bg-[#FAF9F5] flex items-center justify-center mx-auto text-xl text-[#BCB8B0]">
                        📭
                      </div>
                      <p className="text-xs font-bold text-[#4A4641]">目前尚無任何通知</p>
                      <p className="text-[11px] text-[#8C8475]">（每日結束自動清空歸零，我記帳對方收到通知，伴侶記帳您將在此收到即時提醒）</p>
                    </div>
                  ) : (
                    filteredNotifications.map((n) => {
                      const isExpense = n.type === 'expense';
                      const isIncome = n.type === 'income';
                      const isSettle = n.type === 'settle';
                      const isDelete = n.type === 'delete';
                      const isSystem = n.type === 'system';

                      return (
                        <div
                          key={n.id}
                          className={`p-3.5 rounded-2xl border transition-all relative ${
                            !n.read 
                              ? 'bg-white border-rose-300/80 shadow-xs ring-1 ring-rose-200/50' 
                              : 'bg-white/80 border-[#E8E4D9] opacity-90'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2.5">
                            <div className="flex items-start gap-2.5 min-w-0">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-sm ${
                                isExpense ? 'bg-emerald-100 text-emerald-800' :
                                isIncome ? 'bg-teal-100 text-teal-800' :
                                isSettle ? 'bg-amber-100 text-amber-800' :
                                isDelete ? 'bg-red-100 text-red-800' :
                                'bg-rose-100 text-rose-800'
                              }`}>
                                {isExpense ? '💳' : isIncome ? '💰' : isSettle ? '⚖️' : isDelete ? '🗑️' : '🔔'}
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-extrabold text-[#3E3A36] text-xs sm:text-sm">
                                    {n.title}
                                  </span>
                                  {!n.read && (
                                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
                                  )}
                                  {n.actorRole && (
                                    <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${
                                      n.actorRole === '周' || n.actorRole?.includes('周')
                                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                                    }`}>
                                      {n.actorRole === '周' || n.actorRole?.includes('周')
                                        ? (userB.isPendingBinding ? '⏳ 待確認伴侶' : `💖 ${userB.displayName}`)
                                        : `👑 ${userA.displayName}`}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-[#5C564E] mt-1 leading-relaxed break-words whitespace-pre-wrap">
                                  {n.desc}
                                </p>
                                <span className="text-[10px] text-[#A39E92] font-mono mt-1.5 inline-block">
                                  {formatAmPmTime(n.time || '') || n.time}
                                </span>
                              </div>
                            </div>

                            {/* 標記已讀與刪除 */}
                            <div className="flex items-center gap-1 shrink-0">
                              {!n.read && onMarkRead && (
                                <button
                                  type="button"
                                  onClick={() => onMarkRead(n.id)}
                                  className="p-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors cursor-pointer"
                                  title="標記為已讀"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {onDeleteNotification && (
                                <button
                                  type="button"
                                  onClick={() => onDeleteNotification(n.id)}
                                  className="p-1 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                                  title="刪除此通知"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: ⚙️ 推播偏好設定 */}
            {activeTab === 'settings' && notifySettings && toggleNotifySetting && (
              <div className="flex-1 bg-[#FAF9F5] p-3 sm:p-4 overflow-y-auto space-y-3 text-left">
                {/* 個人綁定狀態 */}
                <div className="bg-white rounded-2xl p-3.5 border border-[#E8E4D9] flex items-center justify-between shadow-2xs">
                  <div>
                    <div className="text-xs font-extrabold text-[#3E3A36] flex items-center gap-1.5">
                      <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                      <span>使用者獨立專屬推播偏好</span>
                    </div>
                    <p className="text-[11px] text-[#8C8475] mt-0.5">
                      當前綁定：<span className="font-mono text-[#3E3A36] font-bold">{currentUser?.email || '本地使用者'}</span>
                    </p>
                  </div>
                  {setAllNotifySettings && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setAllNotifySettings(true)}
                        className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                      >
                        全開
                      </button>
                      <button
                        type="button"
                        onClick={() => setAllNotifySettings(false)}
                        className="px-2 py-1 bg-[#F2EDE1] hover:bg-[#E8E2D2] text-[#706B62] rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                      >
                        全關
                      </button>
                    </div>
                  )}
                </div>

                {/* 9 項推播細項開關清單 */}
                <div className="space-y-2">
                  {NOTIFY_CONFIG_ITEMS.map((item) => {
                    const isChecked = !!notifySettings[item.key];
                    return (
                      <label
                        key={item.key}
                        className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                          isChecked 
                            ? 'bg-white border-[#DDD7C9] shadow-2xs' 
                            : 'bg-[#FAF8F3] border-[#EAE6DC] opacity-70'
                        }`}
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <span className="text-base shrink-0 mt-0.5">{item.icon}</span>
                          <div className="min-w-0">
                            <div className="text-xs font-extrabold text-[#3E3A36]">
                              {item.title}
                            </div>
                            <p className="text-[11px] text-[#8C8475] mt-0.5 leading-snug">
                              {item.desc}
                            </p>
                          </div>
                        </div>

                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleNotifySetting(item.key)}
                          className="w-4 h-4 accent-emerald-600 rounded cursor-pointer shrink-0"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
