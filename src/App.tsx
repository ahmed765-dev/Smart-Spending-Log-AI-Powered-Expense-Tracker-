import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { ExpenseForm } from './components/ExpenseForm';
import { TransactionGrid } from './components/TransactionGrid';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { AnalyticsPage } from './components/AnalyticsPage';
import { BudgetModal } from './components/BudgetModal';
import { Transaction, Category, AnalyticsSummary } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'tracker' | 'analytics'>('tracker');

  // App Data State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);

  // Selected Month State (defaults to current month YYYY-MM or 'ALL')
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().substring(0, 7)
  );

  // Grid Controls & Filter State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');
  const [selectedStoreFilter, setSelectedStoreFilter] = useState<string>('All');
  const [selectedPayerFilter, setSelectedPayerFilter] = useState<string>('All');
  const [availableStores, setAvailableStores] = useState<string[]>([]);
  const [availablePayers, setAvailablePayers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch Categories
  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  // Fetch Analytics Summary with Month parameter
  const fetchSummary = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        selectedMonth,
      });
      const res = await fetch(`/api/analytics/summary?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch (err) {
      console.error('Failed to fetch analytics summary:', err);
    }
  }, [selectedMonth]);

  // Fetch Transactions with Multi-Filter and Month parameters
  const fetchTransactions = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        category: selectedCategoryFilter,
        store: selectedStoreFilter,
        payer: selectedPayerFilter,
        search: searchQuery,
        month: selectedMonth,
      });
      const res = await fetch(`/api/transactions?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions);
        setTotalPages(data.totalPages);
        setTotalCount(data.totalCount);
        if (data.availableStores) setAvailableStores(data.availableStores);
        if (data.availablePayers) setAvailablePayers(data.availablePayers);
      }
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    selectedCategoryFilter,
    selectedStoreFilter,
    selectedPayerFilter,
    searchQuery,
    selectedMonth,
  ]);

  // Initial & Dependency Load
  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    setCurrentPage(1);
  };

  const handleTransactionAdded = () => {
    fetchTransactions();
    fetchSummary();
  };

  const handleTransactionUpdated = () => {
    fetchTransactions();
    fetchSummary();
  };

  const handleTransactionDeleted = (id: string) => {
    // Optimistic removal from state then refresh
    setTransactions(prev => prev.filter(t => t.id !== id));
    fetchTransactions();
    fetchSummary();
  };

  const handleClearAllTransactions = () => {
    fetchTransactions();
    fetchSummary();
  };

  const handleResetFilters = () => {
    setSelectedCategoryFilter('All');
    setSelectedStoreFilter('All');
    setSelectedPayerFilter('All');
    setSearchQuery('');
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans selection:bg-indigo-500 selection:text-white flex flex-col">
      {/* Header Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalSpent={summary?.totalSpent || 0}
        transactionCount={summary?.transactionCount || 0}
        aiConfidence={0.94}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'tracker' ? (
          <div className="space-y-8">
            {/* Expense Form */}
            <ExpenseForm
              categories={categories}
              onTransactionAdded={handleTransactionAdded}
            />

            {/* Analytics Dashboard */}
            <AnalyticsDashboard
              summary={summary}
              categories={categories}
              transactions={transactions}
              onOpenBudgetModal={() => setIsBudgetModalOpen(true)}
              selectedMonth={selectedMonth}
              onMonthChange={handleMonthChange}
            />

            {/* Transaction Data Grid */}
            <TransactionGrid
              transactions={transactions}
              categories={categories}
              totalCount={totalCount}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(p) => setCurrentPage(p)}
              selectedCategoryFilter={selectedCategoryFilter}
              onCategoryFilterChange={(c) => {
                setSelectedCategoryFilter(c);
                setCurrentPage(1);
              }}
              selectedStoreFilter={selectedStoreFilter}
              onStoreFilterChange={(s) => {
                setSelectedStoreFilter(s);
                setCurrentPage(1);
              }}
              selectedPayerFilter={selectedPayerFilter}
              onPayerFilterChange={(p) => {
                setSelectedPayerFilter(p);
                setCurrentPage(1);
              }}
              availableStores={availableStores}
              availablePayers={availablePayers}
              searchQuery={searchQuery}
              onSearchQueryChange={(q) => {
                setSearchQuery(q);
                setCurrentPage(1);
              }}
              onTransactionUpdated={handleTransactionUpdated}
              onTransactionDeleted={handleTransactionDeleted}
              onClearAllTransactions={handleClearAllTransactions}
              onResetFilters={handleResetFilters}
            />
          </div>
        ) : (
          <AnalyticsPage
            categories={categories}
            onDataChanged={() => {
              fetchTransactions();
              fetchSummary();
            }}
          />
        )}
      </main>

      {/* Budget Modal */}
      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        categories={categories}
        onBudgetsUpdated={() => {
          fetchCategories();
          fetchSummary();
        }}
      />

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-6 text-xs text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>Smart Spending Log</strong> — Intelligent AI Expense Tracker
          </div>
          <div className="text-slate-500">
            Automated ML Categorization, Multi-Filter Analytics & Period Insights
          </div>
        </div>
      </footer>
    </div>
  );
}
