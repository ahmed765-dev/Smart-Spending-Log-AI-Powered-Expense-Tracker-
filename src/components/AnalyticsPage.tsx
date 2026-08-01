import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  User,
  Store,
  Calendar,
  DollarSign,
  ShoppingBag,
  Sparkles,
  Settings,
  Trash2,
  CalendarDays,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  RotateCcw,
  Layers
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { DeepAnalyticsData, Category } from '../types';

interface AnalyticsPageProps {
  categories: Category[];
  onDataChanged: () => void;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ categories, onDataChanged }) => {
  const [data, setData] = useState<DeepAnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [month1, setMonth1] = useState<string>('');
  const [month2, setMonth2] = useState<string>('');
  const [monthStartDay, setMonthStartDay] = useState<number>(1);
  const [purgeTargetMonth, setPurgeTargetMonth] = useState<string | null>(null);
  const [isPurging, setIsPurging] = useState<boolean>(false);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState<boolean>(false);
  const [isClearingAll, setIsClearingAll] = useState<boolean>(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async (m1?: string, m2?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (m1) params.append('month1', m1);
      if (m2) params.append('month2', m2);

      const res = await fetch(`/api/analytics/deep?${params.toString()}`);
      if (res.ok) {
        const result: DeepAnalyticsData = await res.json();
        setData(result);
        if (!m1 && result.monthComparison.month1) {
          setMonth1(result.monthComparison.month1);
        }
        if (!m2 && result.monthComparison.month2) {
          setMonth2(result.monthComparison.month2);
        }
      }
    } catch (err) {
      console.error('Failed to load deep analytics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics(month1 || undefined, month2 || undefined);
  }, [fetchAnalytics]);

  const handleCompareMonthsChange = (newM1: string, newM2: string) => {
    setMonth1(newM1);
    setMonth2(newM2);
    fetchAnalytics(newM1, newM2);
  };

  const handlePurgeMonth = async () => {
    if (!purgeTargetMonth) return;
    setIsPurging(true);
    try {
      const res = await fetch(`/api/transactions/month/${purgeTargetMonth}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const resData = await res.json();
        setStatusNotice(resData.message || `Deleted data for ${purgeTargetMonth}`);
        setTimeout(() => setStatusNotice(null), 4000);
        setPurgeTargetMonth(null);
        onDataChanged();
        fetchAnalytics();
      }
    } catch (err) {
      console.error('Failed to purge month data:', err);
    } finally {
      setIsPurging(false);
    }
  };

  const handleClearAllHistory = async () => {
    setIsClearingAll(true);
    try {
      const res = await fetch('/api/transactions', { method: 'DELETE' });
      if (res.ok) {
        setStatusNotice('Entire transaction log history has been cleared.');
        setTimeout(() => setStatusNotice(null), 4000);
        setShowClearAllConfirm(false);
        onDataChanged();
        fetchAnalytics();
      }
    } catch (err) {
      console.error('Failed to clear all transaction history:', err);
    } finally {
      setIsClearingAll(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-2xl border border-slate-200 p-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 animate-spin mb-4">
          <BarChart3 className="w-6 h-6" />
        </div>
        <p className="text-sm font-bold text-slate-700">Calculating Data Analytics & Insights...</p>
        <p className="text-xs text-slate-400 mt-1">Aggregating payer metrics, store statistics, and month comparisons.</p>
      </div>
    );
  }

  const payerList = data?.payerBreakdown || [];
  const topPayer = data?.topSpendingPayer;
  const monthComp = data?.monthComparison;
  const availableMonths = monthComp?.availableMonths || [];

  // Prepare Chart Data for Month-over-Month Comparison
  const chartData = (monthComp?.categoryComparison || []).map((cat) => ({
    category: cat.category,
    [monthComp?.month1Label || 'Month A']: cat.month1Total,
    [monthComp?.month2Label || 'Month B']: cat.month2Total
  }));

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Status Notice Toast */}
      {statusNotice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-between shadow-xs">
          <span>{statusNotice}</span>
          <button onClick={() => setStatusNotice(null)} className="text-emerald-600 hover:text-emerald-900">
            Dismiss
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-xs font-semibold text-indigo-300">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Dedicated Data Analytics Studio</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Data Analytics & Behavioral Insights
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Deep dive into multi-payer spending habits, store distributions, average daily velocity, and month-over-month variances.
            </p>
          </div>

          {/* Month Start Configuration Pill */}
          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col space-y-2 shrink-0">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-200">
              <Settings className="w-4 h-4 text-indigo-400" />
              <span>Cycle Settings</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="text-slate-300">Month Start Day:</span>
              <select
                value={monthStartDay}
                onChange={(e) => setMonthStartDay(Number(e.target.value))}
                className="bg-slate-900 text-white border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={1}>1st of Month</option>
                <option value={5}>5th of Month</option>
                <option value={10}>10th of Month</option>
                <option value={15}>15th of Month</option>
                <option value={20}>20th of Month</option>
                <option value={25}>25th of Month</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* KEY USEFUL INSIGHTS TILES */}
      <div>
        <h2 className="text-base font-extrabold text-slate-900 mb-4 flex items-center space-x-2">
          <Layers className="w-5 h-5 text-indigo-600" />
          <span>Core Spending Insights & Key Metrics</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Highest Single Purchase */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Highest Purchase</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            {data?.highestSinglePurchase ? (
              <div>
                <p className="text-2xl font-black text-slate-900">${data.highestSinglePurchase.amount.toFixed(2)}</p>
                <p className="text-xs font-bold text-slate-700 truncate mt-1">{data.highestSinglePurchase.description}</p>
                <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-2">
                  <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-semibold">
                    {data.highestSinglePurchase.payerName || 'Self'}
                  </span>
                  <span>•</span>
                  <span>{new Date(data.highestSinglePurchase.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">No purchases recorded.</p>
            )}
          </div>

          {/* Top Store / Market */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Top Store / Market</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Store className="w-4 h-4" />
              </div>
            </div>
            {data?.topSpendingStore ? (
              <div>
                <p className="text-2xl font-black text-slate-900">${data.topSpendingStore.totalSpent.toFixed(2)}</p>
                <p className="text-xs font-bold text-slate-700 truncate mt-1">{data.topSpendingStore.storeName}</p>
                <p className="text-[11px] text-slate-400 mt-2 font-medium">
                  {data.topSpendingStore.count} transaction(s) recorded
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-400">No stores recorded.</p>
            )}
          </div>

          {/* Average Daily Spend */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avg. Daily Spend</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CalendarDays className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">${data?.avgDailySpend.toFixed(2) || '0.00'}</p>
              <p className="text-xs font-bold text-slate-700 mt-1">
                Avg. Weekly: <span className="text-emerald-600">${data?.avgWeeklySpend.toFixed(2) || '0.00'}</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-2 font-medium">
                Calculated across {data?.activeDaysCount || 1} active logging day(s)
              </p>
            </div>
          </div>

          {/* Top Spending Payer Callout */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Top Spender</span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
            </div>
            {topPayer ? (
              <div>
                <p className="text-2xl font-black text-slate-900">${topPayer.totalSpent.toFixed(2)}</p>
                <p className="text-xs font-bold text-slate-700 truncate mt-1">{topPayer.payerName}</p>
                <p className="text-[11px] text-purple-600 font-bold mt-2">
                  Accounted for {topPayer.percentageOfTotal}% of all logged expenses
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-400">No payers recorded.</p>
            )}
          </div>
        </div>
      </div>

      {/* ALL MONTHS OVERALL ANALYTICS & HISTORICAL INSIGHTS SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-black text-slate-900 flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <span>All-Months Multi-Period Overall Analytics & Insights</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive lifetime aggregation across all recorded months, historical trend comparisons, and category distribution.
            </p>
          </div>
          <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-xl shrink-0 self-start sm:self-auto">
            {data?.allMonthsHistory?.length || 0} Month(s) Recorded
          </span>
        </div>

        {/* Overall Lifetime KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">All-Time Total Spend</span>
            <p className="text-2xl font-black text-slate-900 mt-1">${(data?.totalAllTimeSpent || 0).toFixed(2)}</p>
            <p className="text-[11px] text-slate-400 mt-1">Across all logged transaction records</p>
          </div>

          <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Average Monthly Spend</span>
            <p className="text-2xl font-black text-indigo-600 mt-1">
              ${((data?.totalAllTimeSpent || 0) / Math.max(1, data?.allMonthsHistory?.length || 1)).toFixed(2)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Monthly run-rate over recorded history</p>
          </div>

          <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Peak Spending Month</span>
            {(() => {
              const highest = [...(data?.allMonthsHistory || [])].sort((a, b) => b.totalSpent - a.totalSpent)[0];
              return highest ? (
                <div>
                  <p className="text-2xl font-black text-slate-900 mt-1">${highest.totalSpent.toFixed(2)}</p>
                  <p className="text-[11px] font-bold text-amber-600 mt-0.5">{highest.monthLabel}</p>
                </div>
              ) : (
                <p className="text-sm font-bold text-slate-400 mt-1">N/A</p>
              );
            })()}
          </div>

          <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Active Logging Days</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{data?.activeDaysCount || 0}</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Avg daily velocity: <strong className="text-slate-700">${(data?.avgDailySpend || 0).toFixed(2)}</strong>/day
            </p>
          </div>
        </div>

        {/* Historical Monthly Progression & All-Time Category Distribution Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
          {/* Monthly Progression List */}
          <div className="lg:col-span-6 bg-slate-50/50 rounded-2xl border border-slate-200/80 p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
              <span>Historical Monthly Breakdown</span>
              <span className="text-slate-400 font-normal">Ranked Chronologically</span>
            </h3>

            <div className="space-y-3">
              {(() => {
                const maxMonthSpend = Math.max(...(data?.allMonthsHistory || []).map((m) => m.totalSpent), 1);
                return (data?.allMonthsHistory || []).map((m) => {
                  const pctOfMax = (m.totalSpent / maxMonthSpend) * 100;
                  return (
                    <div key={m.month} className="bg-white border border-slate-200/90 rounded-xl p-3 space-y-1.5 shadow-2xs">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-800">{m.monthLabel}</span>
                        <span className="text-slate-900 font-black">${m.totalSpent.toFixed(2)}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, pctOfMax)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                        <span>{m.count} transaction{m.count === 1 ? '' : 's'}</span>
                        <span>{pctOfMax.toFixed(0)}% of peak month</span>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* All-Time Category Share */}
          <div className="lg:col-span-6 bg-slate-50/50 rounded-2xl border border-slate-200/80 p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
              <span>All-Time Category Distribution</span>
              <span className="text-slate-400 font-normal">Cumulative Total</span>
            </h3>

            <div className="space-y-3">
              {(data?.allTimeCategoryBreakdown || []).map((cat) => (
                <div key={cat.category} className="bg-white border border-slate-200/90 rounded-xl p-3 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="text-slate-800">{cat.category}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-900 font-black">${cat.totalSpent.toFixed(2)}</span>
                      <span className="text-[10px] text-indigo-600 font-bold ml-2">({cat.percentageOfTotal}%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{ backgroundColor: cat.color, width: `${Math.min(100, cat.percentageOfTotal)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-black text-slate-900 flex items-center space-x-2">
              <User className="w-5 h-5 text-indigo-600" />
              <span>Payer Spending & Behavioral Breakdown</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Identifies which member or account spends the most and highlights their favorite categories & merchants.
            </p>
          </div>
          <span className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-xl shrink-0 self-start sm:self-auto">
            {payerList.length} Active Payer(s)
          </span>
        </div>

        {/* Payer Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {payerList.map((payer) => (
            <div
              key={payer.payerName}
              className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-indigo-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                    {payer.payerName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{payer.payerName}</h3>
                    <p className="text-[11px] text-slate-500 font-medium">{payer.count} total expense item(s)</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-base font-black text-slate-900">${payer.totalSpent.toFixed(2)}</p>
                  <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md">
                    {payer.percentageOfTotal}% share
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, payer.percentageOfTotal)}%` }}
                  />
                </div>
              </div>

              {/* Top Category & Store Badges */}
              <div className="pt-2 border-t border-slate-200/60 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Top Category</span>
                  <span className="font-bold text-slate-800 text-xs truncate block">{payer.topCategory}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Frequent Store</span>
                  <span className="font-bold text-slate-800 text-xs truncate block">{payer.topStore}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MONTH-OVER-MONTH COMPARISON SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h2 className="text-base font-black text-slate-900 flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <span>Month-over-Month Comparative Analytics</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select any two specific months to evaluate variance, category shifts, and total spending trends.
            </p>
          </div>

          {/* Month Selector Controls */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-2 border border-slate-200 rounded-2xl">
            <div className="flex items-center space-x-2 text-xs font-bold">
              <span className="text-slate-500">Compare:</span>
              <select
                value={month1}
                onChange={(e) => handleCompareMonthsChange(e.target.value, month2)}
                className="bg-white border border-slate-200 text-slate-900 font-bold px-3 py-1.5 rounded-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {availableMonths.map((m) => (
                  <option key={`m1-${m}`} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <span className="text-xs font-bold text-slate-400">VS</span>

            <div className="flex items-center space-x-2 text-xs font-bold">
              <select
                value={month2}
                onChange={(e) => handleCompareMonthsChange(month1, e.target.value)}
                className="bg-white border border-slate-200 text-slate-900 font-bold px-3 py-1.5 rounded-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {availableMonths.map((m) => (
                  <option key={`m2-${m}`} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Month Summary KPI Banner */}
        {monthComp && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Month 1 Total */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
              <span className="text-xs font-bold text-slate-500 block mb-1">{monthComp.month1Label}</span>
              <p className="text-2xl font-black text-slate-900">${monthComp.month1Total.toFixed(2)}</p>
            </div>

            {/* Month 2 Total */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
              <span className="text-xs font-bold text-slate-500 block mb-1">{monthComp.month2Label}</span>
              <p className="text-2xl font-black text-slate-900">${monthComp.month2Total.toFixed(2)}</p>
            </div>

            {/* Variance */}
            <div
              className={`border rounded-2xl p-4 text-center flex flex-col justify-center ${
                monthComp.difference > 0
                  ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                  : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
              }`}
            >
              <span className="text-xs font-bold uppercase tracking-wider block mb-1">
                Net Variance ({monthComp.month1Label} vs {monthComp.month2Label})
              </span>
              <div className="flex items-center justify-center space-x-1 text-xl font-black">
                {monthComp.difference > 0 ? (
                  <>
                    <ArrowUpRight className="w-5 h-5 text-amber-600" />
                    <span>+${monthComp.difference.toFixed(2)} (+{monthComp.percentageChange}%)</span>
                  </>
                ) : (
                  <>
                    <ArrowDownRight className="w-5 h-5 text-emerald-600" />
                    <span>-${Math.abs(monthComp.difference).toFixed(2)} ({monthComp.percentageChange}%)</span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Recharts Bar Chart for Category Comparison */}
        <div className="pt-2">
          <h3 className="text-sm font-bold text-slate-800 mb-3">Category-by-Category Spend Comparison ($)</h3>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#64748B' }} interval={0} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(val) => `$${val}`} />
                <Tooltip
                  formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Spend']}
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', color: '#FFF', fontSize: '12px', border: 'none' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey={monthComp?.month1Label || 'Month A'} fill="#4F46E5" radius={[6, 6, 0, 0]} />
                <Bar dataKey={monthComp?.month2Label || 'Month B'} fill="#94A3B8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Comparison Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold text-xs uppercase border-b border-slate-200">
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">{monthComp?.month1Label}</th>
                <th className="py-3 px-4">{monthComp?.month2Label}</th>
                <th className="py-3 px-4 text-right">Difference ($)</th>
                <th className="py-3 px-4 text-right">Variance (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {(monthComp?.categoryComparison || []).map((cat) => (
                <tr key={cat.category} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-bold text-slate-900 flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span>{cat.category}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-semibold">${cat.month1Total.toFixed(2)}</td>
                  <td className="py-3 px-4 text-slate-700 font-semibold">${cat.month2Total.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right font-bold">
                    <span className={cat.difference > 0 ? 'text-amber-600' : cat.difference < 0 ? 'text-emerald-600' : 'text-slate-500'}>
                      {cat.difference > 0 ? `+$${cat.difference.toFixed(2)}` : `$${cat.difference.toFixed(2)}`}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-bold">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-md text-[11px] ${
                        cat.percentageChange > 0
                          ? 'bg-amber-50 text-amber-700'
                          : cat.percentageChange < 0
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {cat.percentageChange > 0 ? `+${cat.percentageChange}%` : `${cat.percentageChange}%`}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MONTH PURGE & DATA MAINTENANCE SECTION */}
      <div className="bg-white rounded-2xl border border-red-100 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900 flex items-center space-x-2">
              <Trash2 className="w-5 h-5 text-red-600" />
              <span>Month Data Management & Purge</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select a specific historical month to wipe out its transaction logs, or clear all transaction history across all months.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 bg-red-50/50 p-4 rounded-2xl border border-red-100">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-slate-700">Select Month to Delete:</span>
            <select
              value={purgeTargetMonth || ''}
              onChange={(e) => setPurgeTargetMonth(e.target.value || null)}
              className="bg-white border border-slate-300 text-slate-900 font-bold px-3 py-1.5 rounded-xl text-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">-- Select Month --</option>
              {availableMonths.map((m) => (
                <option key={`purge-${m}`} value={m}>
                  {m}
                </option>
              ))}
            </select>

            <button
              onClick={() => {
                if (!purgeTargetMonth) {
                  alert('Please select a month first.');
                  return;
                }
              }}
              disabled={!purgeTargetMonth}
              className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Purge Month Expenses</span>
            </button>
          </div>

          {/* Clear All History Button (Moved from Expense Log tab) */}
          <div className="border-t sm:border-t-0 sm:border-l border-red-200 pt-3 sm:pt-0 sm:pl-4">
            <button
              onClick={() => setShowClearAllConfirm(true)}
              className="px-4 py-1.5 bg-red-700 hover:bg-red-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer"
              title="Clear all transaction history across all months"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear All History</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Single Month Purge */}
      {purgeTargetMonth && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Purge Expense Logs for {purgeTargetMonth}?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                This action will permanently delete all transaction records dated in <strong className="text-slate-800">{purgeTargetMonth}</strong>. This cannot be undone.
              </p>
            </div>
            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setPurgeTargetMonth(null)}
                className="flex-1 py-2 px-4 border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handlePurgeMonth}
                disabled={isPurging}
                className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                {isPurging ? 'Purging...' : 'Confirm Purge'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Clear All History */}
      {showClearAllConfirm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Clear Entire Transaction History?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to permanently delete <strong>ALL transaction records</strong> across all months? This action cannot be undone and will completely reset your dataset.
              </p>
            </div>
            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setShowClearAllConfirm(false)}
                className="flex-1 py-2 px-4 border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAllHistory}
                disabled={isClearingAll}
                className="flex-1 py-2 px-4 bg-red-700 hover:bg-red-800 text-white font-semibold text-xs rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                {isClearingAll ? 'Clearing...' : 'Yes, Delete Everything'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
