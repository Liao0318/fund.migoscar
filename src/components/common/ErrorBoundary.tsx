import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetState = () => {
    try {
      // 僅清除可能引發解析錯誤的暫存快取，但保留重要設定
      localStorage.removeItem('banban_split_summary');
      localStorage.removeItem('muji_active_tab');
      window.location.hash = '';
      window.location.reload();
    } catch (e) {
      window.location.reload();
    }
  };

  private handleFullReset = () => {
    if (window.confirm('確定要修復並重設本地暫存嗎？（已同步至雲端試算表的資料不會遺失）')) {
      try {
        localStorage.clear();
        window.location.hash = '';
        window.location.reload();
      } catch (e) {
        window.location.reload();
      }
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F7F5F0] text-[#3E3A36] flex items-center justify-center p-4 font-sans">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E2D5] shadow-xl space-y-5 text-center">
            <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center text-3xl mx-auto shadow-xs">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg sm:text-xl font-black text-[#3E3A36]">
                {this.props.fallbackTitle || '伴伴記畫面載入異常'}
              </h2>
              <p className="text-xs text-[#8C8475] leading-relaxed">
                系統剛才在切換畫面或更新帳目時偵測到非預期資料格式。請點擊下方按鈕即可立即恢復運作！
              </p>
            </div>

            {this.state.error && (
              <div className="bg-[#FAF8F3] p-3 rounded-xl border border-[#E8E2D5] text-left">
                <p className="text-[11px] font-mono text-rose-700 font-bold break-all">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={this.handleResetState}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                <span>一鍵修復並重新整理</span>
              </button>

              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-2.5 px-4 rounded-xl bg-[#FAF8F5] hover:bg-[#F2ECE1] text-[#6E6659] border border-[#DDD8CD] text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>直接重新整理網頁</span>
              </button>

              <button
                type="button"
                onClick={this.handleFullReset}
                className="w-full py-2 px-4 text-[11px] text-[#A59F94] hover:text-rose-600 hover:underline transition-all cursor-pointer pt-1 flex items-center justify-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>遇到無法排除的問題？點此重置本機快取</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
