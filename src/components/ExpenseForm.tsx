import React, { useState, useEffect, useRef } from 'react';
import { PlusCircle, BrainCircuit, Sparkles, AlertCircle, CheckCircle2, User, Store, CreditCard } from 'lucide-react';
import { Category, PredictCategoryResponse } from '../types';

interface ExpenseFormProps {
  categories: Category[];
  onTransactionAdded: () => void;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({ categories, onTransactionAdded }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [payerName, setPayerName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');
  const [selectedCategory, setSelectedCategory] = useState('');
  
  const [prediction, setPrediction] = useState<PredictCategoryResponse | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced live prediction as user types description or amount
  useEffect(() => {
    if (selectedCategory) return; // Skip prediction if user explicitly selected a category

    if (description.trim().length >= 3) {
      setIsPredicting(true);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

      debounceTimerRef.current = setTimeout(async () => {
        try {
          const numAmount = parseFloat(amount) || 10.0;
          const res = await fetch('/api/predict-category', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description, amount: numAmount })
          });
          if (res.ok) {
            const data: PredictCategoryResponse = await res.json();
            setPrediction(data);
          }
        } catch (err) {
          console.error('Prediction fetch failed:', err);
        } finally {
          setIsPredicting(false);
        }
      }, 350);
    } else {
      setPrediction(null);
      setIsPredicting(false);
    }

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [description, amount, selectedCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setErrorMsg('Please enter a transaction description.');
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg('Please enter a valid amount greater than $0.');
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: description.trim(),
          amount: numAmount,
          category: selectedCategory || (prediction ? prediction.predictedCategory : undefined),
          paymentMethod,
          payerName: payerName.trim() || undefined,
          storeName: storeName.trim() || undefined,
          merchant: storeName.trim() || undefined
        })
      });

      if (!res.ok) throw new Error('Failed to save expense');

      setDescription('');
      setAmount('');
      setPayerName('');
      setStoreName('');
      setSelectedCategory('');
      setPrediction(null);
      setSuccessMsg('Expense logged & categorized successfully!');
      onTransactionAdded();

      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6 mb-8 transition-all">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Log New Expense</h2>
            <p className="text-xs text-slate-500">Record payer, store, amount, and AI auto-categorization in real time</p>
          </div>
        </div>

        <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
          <BrainCircuit className="w-3.5 h-3.5 text-indigo-600 animate-pulse" /> Live ML Predictor
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Description Input */}
          <div className="md:col-span-4 space-y-1">
            <label className="block text-xs font-semibold text-slate-700">
              Transaction Description <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. Starbucks Coffee, Grocery Shopping"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full pl-3 pr-9 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-900 placeholder-slate-400"
                required
              />
              {isPredicting && (
                <div className="absolute right-3 top-2.5">
                  <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          </div>

          {/* Amount Input */}
          <div className="md:col-span-2 space-y-1">
            <label className="block text-xs font-semibold text-slate-700">
              Amount ($) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-medium text-sm">$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-900 placeholder-slate-400 font-semibold"
                required
              />
            </div>
          </div>

          {/* Payer Name Input */}
          <div className="md:col-span-3 space-y-1">
            <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-indigo-500" /> Payer Name
            </label>
            <input
              type="text"
              placeholder="e.g. Alex, Sarah, Self"
              value={payerName}
              onChange={(e) => setPayerName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-900 placeholder-slate-400"
            />
          </div>

          {/* Store / Market Name Input */}
          <div className="md:col-span-3 space-y-1">
            <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1">
              <Store className="w-3.5 h-3.5 text-indigo-500" /> Store / Market Name
            </label>
            <input
              type="text"
              placeholder="e.g. Trader Joe's, Target, Shell"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-900 placeholder-slate-400"
            />
          </div>
        </div>

        {/* Row 2: Payment Method + AI Prediction Badge */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-1">
          <div className="md:col-span-4 space-y-1">
            <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5 text-indigo-500" /> Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
            >
              <option value="Credit Card">Credit Card</option>
              <option value="Debit Card">Debit Card</option>
              <option value="Apple Pay / Google Pay">Apple Pay / Google Pay</option>
              <option value="Bank Transfer">Bank Transfer (ACH)</option>
              <option value="Cash">Cash</option>
            </select>
          </div>

          <div className="md:col-span-8 bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-100/80 rounded-lg text-indigo-700 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">AI Category Prediction</div>
                {prediction ? (
                  <div className="flex items-center space-x-2 mt-0.5">
                    <span className="text-xs font-bold text-slate-900">{prediction.predictedCategory}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-md font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
                      {(prediction.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 italic">Type a description for live AI prediction</span>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs py-1.5 px-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 font-medium"
              >
                <option value="">Auto AI Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    Manual: {c.name}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-sm hover:shadow transition-all flex items-center space-x-1.5 shrink-0 disabled:opacity-50"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{isSubmitting ? 'Logging...' : 'Log Expense'}</span>
              </button>
            </div>
          </div>
        </div>

        {prediction && (
          <p className="text-[11px] text-slate-500 italic bg-white p-2 rounded-lg border border-slate-100">
            <strong>Model Reasoning:</strong> {prediction.reasoning}
          </p>
        )}
      </form>
    </div>
  );
};
