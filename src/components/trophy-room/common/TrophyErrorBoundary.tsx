'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class TrophyErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Trophy Room Error Boundary caught error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center text-[#111827]">
          <div className="max-w-xl w-full bg-white border-4 border-[#111827] rounded-3xl p-8 shadow-[8px_8px_0_#111827] space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-[#FF4757] border-3 border-[#111827] flex items-center justify-center mx-auto shadow-[4px_4px_0_#111827] text-white transform -rotate-3">
              <AlertOctagon className="w-9 h-9 stroke-[2.5]" />
            </div>

            <h2 className="text-2xl font-black uppercase tracking-wider text-[#111827]">
              {this.props.fallbackTitle || 'Trophy Vault Display Exception'}
            </h2>

            <p className="text-xs font-bold text-slate-600 font-comic">
              A temporary rendering issue occurred in the shelf or search index.
            </p>

            {this.state.error && (
              <div className="p-3.5 bg-rose-50 border-2 border-[#FF4757] rounded-xl text-left overflow-x-auto text-[11px] font-mono text-rose-900 font-bold max-h-36">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#FFDE59] hover:bg-[#ffd938] text-[#111827] font-black text-xs uppercase tracking-wider rounded-xl border-2 border-[#111827] shadow-[3px_3px_0_#111827] active:scale-95 transition-all"
              >
                <RotateCcw className="w-4 h-4 stroke-[2.5]" />
                <span>Reload Shelf</span>
              </button>

              <Link
                href="/"
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#111827] font-black text-xs uppercase tracking-wider rounded-xl border-2 border-[#111827] shadow-[3px_3px_0_#111827] transition-all"
              >
                <Home className="w-4 h-4 stroke-[2.5]" />
                <span>Return to Broadsheet</span>
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
