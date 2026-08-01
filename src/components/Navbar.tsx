import React from 'react';
import { LayoutDashboard, BarChart3, DollarSign, BrainCircuit, Sparkles, ReceiptText } from 'lucide-react';

interface NavbarProps {
  activeTab: 'tracker' | 'analytics';
  setActiveTab: (tab: 'tracker' | 'analytics') => void;
  totalSpent: number;
  transactionCount: number;
  aiConfidence: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  totalSpent,
  transactionCount,
  aiConfidence
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between py-2 sm:py-0 sm:h-16 gap-3 sm:gap-0">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 shrink-0">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white">Smart Spending Log</span>
                <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-400" /> AI Expense Tracker
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Intelligent Categorization & Multi-Month Analytics</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700/80 text-xs">
            <button
              onClick={() => setActiveTab('tracker')}
              className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all flex items-center space-x-1.5 ${
                activeTab === 'tracker'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <ReceiptText className="w-3.5 h-3.5" />
              <span>Expense Log</span>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all flex items-center space-x-1.5 ${
                activeTab === 'analytics'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Analytics & Insights</span>
            </button>
          </div>

          {/* Metrics Pill */}
          <div className="hidden lg:flex items-center space-x-4 bg-slate-800/80 border border-slate-700/60 rounded-xl px-3 py-1.5 text-xs">
            <div className="flex items-center space-x-1.5 text-slate-300">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>Total Spent:</span>
              <span className="font-bold text-white">${totalSpent.toFixed(2)}</span>
            </div>
            <div className="w-px h-3.5 bg-slate-700" />
            <div className="flex items-center space-x-1.5 text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>AI Engine:</span>
              <span className="font-bold text-indigo-300">Active</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
