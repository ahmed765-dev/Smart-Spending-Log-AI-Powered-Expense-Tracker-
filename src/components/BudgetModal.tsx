import React, { useState } from 'react';
import { X, Check, Save, Settings } from 'lucide-react';
import { Category } from '../types';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onBudgetsUpdated: () => void;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  categories,
  onBudgetsUpdated,
}) => {
  const [limits, setLimits] = useState<Record<string, number>>(
    categories.reduce((acc, c) => ({ ...acc, [c.id]: c.budgetLimit }), {})
  );
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await Promise.all(
        Object.entries(limits).map(([id, limit]) =>
          fetch(`/api/categories/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ budgetLimit: limit })
          })
        )
      );
      onBudgetsUpdated();
      onClose();
    } catch (err) {
      console.error('Failed to update budgets:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-base">Adjust Monthly Category Budgets</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-3.5 max-h-[60vh] overflow-y-auto">
          {categories.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-4 text-xs font-semibold">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                <span className="text-slate-800 text-sm">{c.name}</span>
              </div>
              <div className="relative w-32">
                <span className="absolute left-2.5 top-2 text-slate-400 font-medium">$</span>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={limits[c.id] !== undefined ? limits[c.id] : c.budgetLimit}
                  onChange={(e) =>
                    setLimits({ ...limits, [c.id]: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full pl-6 pr-2 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow transition-all flex items-center space-x-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
