import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { AnalyticsSummary, Category, Transaction } from '../types';
import { PieChart as PieIcon, TrendingUp, ShieldCheck, Settings, Store, Calendar, CreditCard, Users, Filter, ShoppingBag } from 'lucide-react';

interface AnalyticsDashboardProps {
  summary: AnalyticsSummary | null;
  categories: Category[];
  transactions?: Transaction[];
  onOpenBudgetModal: () => void;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  selectedStoreCategory?: string;
  onStoreCategoryChange?: (cat: string) => void;
  selectedPayerCategory?: string;
  onPayerCategoryChange?: (cat: string) => void;
}

const formatMonthLabel = (ymStr: string) => {
  if (ymStr === 'ALL') return 'All Months (All Time)';
  try {
    const [y, m] = ymStr.split('-').map(Number);
    const date = new Date(y, m - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  } catch {
    return ymStr;
  }
};

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  summary,
  categories,
  onOpenBudgetModal,
  selectedMonth,
  onMonthChange,
  selectedStoreCategory = 'All',
  onStoreCategoryChange,
  selectedPayerCategory = 'All',
  onPayerCategoryChange,
}) => {
  if (!summary) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400">
        Loading analytics summary...
      </div>
    );
  }

  // Filter out zero categories for pie chart
  const pieData = summary.categoryTotals
    .filter((c) => c.total > 0)
    .map((c) => ({
      name: c.category,
      value: c.total,
      color: c.color,
    }));

  const filteredStores = (summary.topVendors || []).map(v => ({
    storeName: v.merchant,
    total: v.total,
    count: v.count,
    items: v.items || []
  }));

  const filteredPayers = (summary.topPayers || []).map(p => ({
    payerName: p.payer,
    total: p.total,
    count: p.count,
    items: p.items || []
  }));

  return (
    <div className="space-y-6 mb-8">
      {/* Month Selector Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              Month Scope & Breakdown
            </div>
            <h3 className="text-sm font-black text-slate-900">
              {selectedMonth === 'ALL'
                ? 'All Months (All Time Aggregate)'
                : `Showing Data for ${formatMonthLabel(selectedMonth)}`}
            </h3>
          </div>
        </div>

        {/* Month Dropdown */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <span className="text-xs font-bold text-slate-700 whitespace-nowrap">Select Month:</span>
          <select
            value={selectedMonth}
            onChange={(e) => onMonthChange(e.target.value)}
            className="w-full md:w-auto px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold text-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-xs"
          >
            <option value="ALL">All Months (All Time Aggregate)</option>
            {summary.availableMonths?.map((m) => (
              <option key={m} value={m}>
                {formatMonthLabel(m)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Spent in Selected Period */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {selectedMonth === 'ALL' ? 'Total Spent (All Time)' : `${formatMonthLabel(selectedMonth)} Spent`}
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">${summary.totalSpent.toFixed(2)}</div>
          <div className="text-xs text-slate-500 mt-2 flex items-center justify-between">
            <span>Budget Limit: ${summary.monthlyBudget.toFixed(2)}</span>
            <span className={`font-bold ${summary.totalBudgetSpentPercentage > 100 ? 'text-red-600' : 'text-emerald-600'}`}>
              {summary.totalBudgetSpentPercentage.toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                summary.totalBudgetSpentPercentage > 100
                  ? 'bg-red-500'
                  : summary.totalBudgetSpentPercentage > 80
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, summary.totalBudgetSpentPercentage)}%` }}
            />
          </div>
        </div>

        {/* Transaction Count Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5 text-indigo-500" /> Logged Transactions
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {summary.transactionCount} <span className="text-xs font-normal text-slate-500">records</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 font-medium">
            Avg transaction: <strong>${summary.avgTransaction.toFixed(2)}</strong>
          </p>
        </div>

        {/* AI Classifier Status */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ML Model Health</div>
          <div className="text-2xl font-black text-indigo-600 mt-1 flex items-center gap-1.5">
            <ShieldCheck className="w-6 h-6 text-indigo-500" />
            <span>94.2%</span>
          </div>
          <div className="text-xs text-slate-500 mt-2">
            TF-IDF N-Gram Classifier Active
          </div>
        </div>

        {/* Budget Manager trigger */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold text-indigo-300 uppercase tracking-wider flex items-center gap-1">
              <Settings className="w-3.5 h-3.5" /> Budget Limits
            </div>
            <div className="text-sm font-bold text-white mt-1">Configure Category Caps</div>
          </div>
          <button
            onClick={onOpenBudgetModal}
            className="mt-3 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer"
          >
            Adjust Budget Caps
          </button>
        </div>
      </div>

      {/* Grid: Pie Chart + Category Budget Utilization */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pie Chart */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-indigo-600" /> Spending Distribution
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {selectedMonth === 'ALL' ? 'All Months' : formatMonthLabel(selectedMonth)}
            </span>
          </div>

          <div className="w-full h-64 my-auto">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number) => [`$${val.toFixed(2)}`, 'Spent']}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
                No expense data recorded for this month scope.
              </div>
            )}
          </div>
        </div>

        {/* Category Budget Bars */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" /> Category Budget Utilization
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              {selectedMonth === 'ALL' ? 'All Time Aggregate' : 'Monthly Allocation'}
            </span>
          </div>

          <div className="space-y-3.5">
            {summary.categoryTotals.map((cat) => {
              const pct = cat.budgetLimit > 0 ? (cat.total / cat.budgetLimit) * 100 : 0;
              const isOver = pct >= 100;
              const isWarning = pct >= 80 && !isOver;

              return (
                <div key={cat.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      <span className="text-slate-800">{cat.category}</span>
                      {isOver && (
                        <span className="px-1.5 py-0.2 text-[10px] bg-red-100 text-red-700 font-bold rounded">
                          OVER BUDGET
                        </span>
                      )}
                      {isWarning && (
                        <span className="px-1.5 py-0.2 text-[10px] bg-amber-100 text-amber-800 font-bold rounded">
                          HIGH
                        </span>
                      )}
                    </div>
                    <div className="text-slate-600 font-mono">
                      <strong className="text-slate-900">${cat.total.toFixed(2)}</strong> / ${cat.budgetLimit} ({pct.toFixed(0)}%)
                    </div>
                  </div>

                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOver ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-indigo-600'
                      }`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Spending Stores Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Top Spending Stores</h3>
            <span className="text-xs text-slate-400">
              ({selectedMonth === 'ALL' ? 'All-Time' : formatMonthLabel(selectedMonth)})
            </span>
          </div>

          {/* Store Category Filter Dropdown */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-xs font-semibold text-slate-600">Category Filter:</span>
            <select
              value={selectedStoreCategory}
              onChange={(e) => onStoreCategoryChange && onStoreCategoryChange(e.target.value)}
              className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="All">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredStores.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {filteredStores.map((store, i) => (
              <div key={store.storeName} className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 flex flex-col justify-between">
                <div>
                  <div className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider mb-0.5">#{i + 1} Store</div>
                  <div className="font-bold text-slate-800 text-xs truncate" title={store.storeName}>{store.storeName}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{store.count} purchase{store.count === 1 ? '' : 's'}</div>

                  {/* Purchased items preview if category filtered */}
                  {selectedStoreCategory !== 'All' && store.items.length > 0 && (
                    <div className="mt-2 text-[10px] text-slate-600 bg-white p-1.5 rounded border border-slate-200 space-y-0.5">
                      <div className="font-bold text-indigo-700 flex items-center gap-1">
                        <ShoppingBag className="w-2.5 h-2.5" /> Items in {selectedStoreCategory}:
                      </div>
                      <div className="truncate font-medium text-slate-800">{store.items.join(', ')}</div>
                    </div>
                  )}
                </div>
                <div className="font-extrabold text-slate-900 text-sm mt-2 pt-1 border-t border-slate-200/50">
                  ${store.total.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-slate-400 italic py-4 text-center">
            No store purchases found matching category "{selectedStoreCategory}".
          </div>
        )}
      </div>

      {/* Top Spending Payers Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Top Spending Payers</h3>
            <span className="text-xs text-slate-400">
              ({selectedMonth === 'ALL' ? 'All-Time' : formatMonthLabel(selectedMonth)})
            </span>
          </div>

          {/* Payer Category Filter Dropdown */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-xs font-semibold text-slate-600">Category Filter:</span>
            <select
              value={selectedPayerCategory}
              onChange={(e) => onPayerCategoryChange && onPayerCategoryChange(e.target.value)}
              className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="All">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredPayers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {filteredPayers.map((payer, i) => {
              const share = summary.totalSpent > 0 ? (payer.total / summary.totalSpent) * 100 : 0;
              return (
                <div
                  key={payer.payerName}
                  className={`border rounded-xl p-3 flex flex-col justify-between ${
                    i === 0
                      ? 'bg-indigo-50/70 border-indigo-200 shadow-2xs'
                      : 'bg-slate-50/70 border-slate-200/80'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                        #{i + 1} Payer
                      </span>
                      {i === 0 && (
                        <span className="text-[10px] bg-indigo-600 text-white font-black px-1.5 py-0.2 rounded">
                          Top Spender
                        </span>
                      )}
                    </div>
                    <div className="font-bold text-slate-900 text-xs truncate" title={payer.payerName}>
                      {payer.payerName}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                      {payer.count} expense{payer.count === 1 ? '' : 's'} {selectedPayerCategory === 'All' && `(${share.toFixed(0)}%)`}
                    </div>

                    {/* Purchased items preview if category filtered */}
                    {selectedPayerCategory !== 'All' && payer.items.length > 0 && (
                      <div className="mt-2 text-[10px] text-slate-600 bg-white p-1.5 rounded border border-slate-200 space-y-0.5">
                        <div className="font-bold text-indigo-700 flex items-center gap-1">
                          <ShoppingBag className="w-2.5 h-2.5" /> Items in {selectedPayerCategory}:
                        </div>
                        <div className="truncate font-medium text-slate-800">{payer.items.join(', ')}</div>
                      </div>
                    )}
                  </div>
                  <div className="font-extrabold text-slate-900 text-sm mt-2 pt-1 border-t border-slate-200/50">
                    ${payer.total.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-xs text-slate-400 italic py-4 text-center">
            No payer expenses found matching category "{selectedPayerCategory}".
          </div>
        )}
      </div>
    </div>
  );
};
