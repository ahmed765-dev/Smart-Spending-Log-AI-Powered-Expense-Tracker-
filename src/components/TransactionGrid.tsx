import React, { useState } from 'react';
import { Search, Filter, Trash2, Edit3, CheckCircle2, User, Store, AlertTriangle, RotateCcw } from 'lucide-react';
import { Transaction, Category } from '../types';

interface TransactionGridProps {
  transactions: Transaction[];
  categories: Category[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  selectedCategoryFilter: string;
  onCategoryFilterChange: (category: string) => void;
  selectedStoreFilter: string;
  onStoreFilterChange: (store: string) => void;
  selectedPayerFilter: string;
  onPayerFilterChange: (payer: string) => void;
  availableStores: string[];
  availablePayers: string[];
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onTransactionUpdated: () => void;
  onTransactionDeleted: (id: string) => void;
  onClearAllTransactions: () => void;
  onResetFilters: () => void;
}

export const TransactionGrid: React.FC<TransactionGridProps> = ({
  transactions,
  categories,
  totalCount,
  currentPage,
  totalPages,
  onPageChange,
  selectedCategoryFilter,
  onCategoryFilterChange,
  selectedStoreFilter,
  onStoreFilterChange,
  selectedPayerFilter,
  onPayerFilterChange,
  availableStores = [],
  availablePayers = [],
  searchQuery,
  onSearchQueryChange,
  onTransactionUpdated,
  onTransactionDeleted,
  onClearAllTransactions,
  onResetFilters
}) => {
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [deleteTxTarget, setDeleteTxTarget] = useState<{ id: string; description: string } | null>(null);
  const [isDeletingSingle, setIsDeletingSingle] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setStatusNotice(msg);
    setTimeout(() => setStatusNotice(null), 3000);
  };

  const handleOverrideCategory = async (tx: Transaction, newCat: string) => {
    if (newCat === tx.predictedCategory) {
      setEditingTxId(null);
      return;
    }

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/transactions/${tx.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: newCat })
      });

      if (res.ok) {
        showNotice(`Updated category for "${tx.description}" to ${newCat}`);
        onTransactionUpdated();
      }
    } catch (err) {
      console.error('Failed to update category:', err);
    } finally {
      setIsUpdating(false);
      setEditingTxId(null);
    }
  };

  const confirmDeleteSingle = async () => {
    if (!deleteTxTarget) return;
    setIsDeletingSingle(true);
    try {
      const res = await fetch(`/api/transactions/${deleteTxTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        showNotice(`Transaction "${deleteTxTarget.description}" deleted successfully.`);
        onTransactionDeleted(deleteTxTarget.id);
      } else {
        showNotice(`Failed to delete transaction. Please try again.`);
      }
    } catch (err) {
      console.error('Failed to delete transaction:', err);
      showNotice(`Error occurred while deleting transaction.`);
    } finally {
      setIsDeletingSingle(false);
      setDeleteTxTarget(null);
    }
  };

  const handleClearCurrentMonth = async () => {
    setIsClearing(true);
    const currentMonthStr = new Date().toISOString().substring(0, 7);
    try {
      const res = await fetch(`/api/transactions/month/${currentMonthStr}`, { method: 'DELETE' });
      if (res.ok) {
        showNotice(`All expenses for current month (${currentMonthStr}) have been deleted.`);
        setShowClearConfirm(false);
        onClearAllTransactions();
      } else {
        showNotice(`Failed to clear current month expenses.`);
      }
    } catch (err) {
      console.error('Failed to clear current month transactions:', err);
    } finally {
      setIsClearing(false);
    }
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const hasActiveFilters = 
    selectedCategoryFilter !== 'All' || 
    selectedStoreFilter !== 'All' || 
    selectedPayerFilter !== 'All' || 
    searchQuery.trim() !== '';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
      {statusNotice && (
        <div className="bg-indigo-600 text-white text-xs py-2 px-4 flex items-center justify-between font-medium">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{statusNotice}</span>
          </div>
        </div>
      )}

      {/* Filter Toolbar Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search description, store, or payer..."
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 font-medium"
            />
          </div>

          {/* Delete Current Month Control */}
          <div className="flex items-center justify-end">
            <button
              onClick={() => setShowClearConfirm(true)}
              disabled={totalCount === 0}
              className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl font-semibold text-xs transition-all flex items-center space-x-1.5 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Delete current month transaction log"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-600" />
              <span>Clear Current Month Log</span>
            </button>
          </div>
        </div>

        {/* Multi-Filter Dropdowns: Category, Store / Market, Payer */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {/* Category Dropdown */}
          <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-semibold">
            <Filter className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span className="text-slate-500">Category:</span>
            <select
              value={selectedCategoryFilter}
              onChange={(e) => onCategoryFilterChange(e.target.value)}
              className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="All">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Store / Market Filter Dropdown */}
          <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-semibold">
            <Store className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span className="text-slate-500">Store:</span>
            <select
              value={selectedStoreFilter}
              onChange={(e) => onStoreFilterChange(e.target.value)}
              className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer max-w-[140px] truncate"
            >
              <option value="All">All Stores / Markets</option>
              {availableStores.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Payer Filter Dropdown */}
          <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-semibold">
            <User className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span className="text-slate-500">Payer:</span>
            <select
              value={selectedPayerFilter}
              onChange={(e) => onPayerFilterChange(e.target.value)}
              className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer max-w-[140px] truncate"
            >
              <option value="All">All Payers</option>
              {availablePayers.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs transition-all flex items-center space-x-1"
            >
              <RotateCcw className="w-3 h-3 text-slate-500" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Modal for Single Transaction Delete */}
      {deleteTxTarget && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Delete Expense?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to delete <strong className="text-slate-800">"{deleteTxTarget.description}"</strong>? This will remove the record from your expense log.
              </p>
            </div>
            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setDeleteTxTarget(null)}
                className="flex-1 py-2 px-4 border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteSingle}
                disabled={isDeletingSingle}
                className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all disabled:opacity-50"
              >
                {isDeletingSingle ? 'Deleting...' : 'Delete Expense'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Clear Current Month */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Clear Current Month Log ({new Date().toISOString().substring(0, 7)})?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to delete expense records for the current month (<strong>{new Date().toISOString().substring(0, 7)}</strong>)? Other historical months will remain safely preserved in Analytics.
              </p>
            </div>
            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2 px-4 border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleClearCurrentMonth}
                disabled={isClearing}
                className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                {isClearing ? 'Clearing...' : 'Clear Current Month'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th className="py-3 px-4">Transaction Description</th>
              <th className="py-3 px-4">Payer</th>
              <th className="py-3 px-4">Store / Market</th>
              <th className="py-3 px-4">Amount</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Confidence</th>
              <th className="py-3 px-4">Date & Method</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400 italic">
                  No transaction records found matching filter criteria.
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors group">
                  {/* Description */}
                  <td className="py-3.5 px-4 font-medium text-slate-900">
                    <div className="font-semibold text-sm text-slate-900">{tx.description}</div>
                  </td>

                  {/* Payer Name */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-700">
                    <span className="inline-flex items-center gap-1 font-medium bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg text-xs">
                      <User className="w-3 h-3 text-indigo-500" />
                      {tx.payerName || 'Alex Johnson'}
                    </span>
                  </td>

                  {/* Store / Market Name */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-700">
                    <span className="inline-flex items-center gap-1 font-medium bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg text-xs">
                      <Store className="w-3 h-3 text-indigo-500" />
                      {tx.storeName || tx.merchant || 'General Market'}
                    </span>
                  </td>

                  {/* Amount */}
                  <td className="py-3.5 px-4 font-bold text-slate-900 text-sm whitespace-nowrap">
                    ${tx.amount.toFixed(2)}
                  </td>

                  {/* Category & Inline Override */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {editingTxId === tx.id ? (
                      <select
                        autoFocus
                        value={editingCategory || tx.predictedCategory}
                        onChange={(e) => handleOverrideCategory(tx, e.target.value)}
                        onBlur={() => setEditingTxId(null)}
                        className="py-1 px-2 text-xs bg-white border-2 border-indigo-500 rounded-lg focus:outline-none font-semibold text-slate-900"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex items-center space-x-1.5">
                        <span
                          onClick={() => {
                            setEditingTxId(tx.id);
                            setEditingCategory(tx.predictedCategory);
                          }}
                          title="Click to manually correct category and retrain ML model"
                          className={`cursor-pointer inline-flex items-center space-x-1 px-2.5 py-1 rounded-full font-semibold text-xs border transition-all ${
                            tx.isCategoryManuallyOverridden
                              ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                              : 'bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100'
                          }`}
                        >
                          <span>{tx.predictedCategory}</span>
                          <Edit3 className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                        </span>

                        {tx.isCategoryManuallyOverridden && (
                          <span
                            title="Category corrected by user feedback - ML model weights updated"
                            className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-900 rounded border border-amber-300"
                          >
                            Trained
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Confidence */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full"
                          style={{ width: `${Math.min(100, (tx.confidence || 0.85) * 100)}%` }}
                        />
                      </div>
                      <span className="text-slate-600 font-semibold text-[11px]">
                        {((tx.confidence || 0.85) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>

                  {/* Date & Payment Method */}
                  <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                    <div>{formatDate(tx.createdAt)}</div>
                    <div className="text-[10px] text-slate-400 font-medium">{tx.paymentMethod || 'Credit Card'}</div>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => setDeleteTxTarget({ id: tx.id, description: tx.description })}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete expense"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div>
          Showing {transactions.length} of {totalCount} transactions
        </div>

        <div className="flex items-center space-x-2">
          <button
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 font-medium"
          >
            Previous
          </button>
          <span className="font-semibold text-slate-800">
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 font-medium"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
