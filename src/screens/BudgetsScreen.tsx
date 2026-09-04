import React, { useState } from 'react';
import { Budget, Category, Transaction, FinancialCycle } from '../types';
import * as Icons from 'lucide-react';

interface BudgetsScreenProps {
  budgets: Budget[];
  categories: Category[];
  transactions: Transaction[];
  financialCycle: FinancialCycle;
  currencySymbol: string;
  onSaveBudget: (budget: Budget) => void;
  onDeleteBudget: (budgetId: string) => void;
}

export const BudgetsScreen: React.FC<BudgetsScreenProps> = ({
  budgets,
  categories,
  transactions,
  financialCycle,
  currencySymbol,
  onSaveBudget,
  onDeleteBudget,
}) => {
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalCategoryId, setModalCategoryId] = useState('');
  const [modalAmount, setModalAmount] = useState('');

  // Calculate spent per category within current financial cycle
  const startDate = new Date(financialCycle.startDate + 'T00:00:00').getTime();
  const endDate = new Date(financialCycle.endDate + 'T23:59:59').getTime();

  const cycleExpenses = transactions.filter(
    t => t.type === 'DEBIT' && t.reviewStatus !== 'IGNORED' && t.timestamp >= startDate && t.timestamp <= endDate
  );

  const spentMap = new Map<string, number>();
  for (const tx of cycleExpenses) {
    spentMap.set(tx.categoryId, (spentMap.get(tx.categoryId) || 0) + tx.amount);
  }

  const categoryMap = new Map<string, Category>(categories.map(c => [c.id, c]));

  const totalBudgeted = budgets.reduce((acc, b) => acc + b.amount, 0);
  const totalSpent = Array.from(spentMap.values()).reduce((acc, val) => acc + val, 0);

  const handleOpenAdd = () => {
    // Find first category without a budget
    const budgetedCatIds = new Set(budgets.map(b => b.categoryId));
    const unbudgetedCat = categories.find(c => c.type === 'EXPENSE' && !budgetedCatIds.has(c.id));
    setEditingBudget(null);
    setModalCategoryId(unbudgetedCat?.id || categories[0]?.id || '');
    setModalAmount('300');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setModalCategoryId(budget.categoryId);
    setModalAmount(budget.amount.toString());
    setIsModalOpen(true);
  };

  const handleSubmitModal = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(modalAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    const b: Budget = {
      id: editingBudget?.id || `b_${modalCategoryId}`,
      categoryId: modalCategoryId,
      amount: amountNum,
      period: 'CYCLE',
      warningThreshold: 0.8,
    };

    onSaveBudget(b);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#1E293B] dark:text-white tracking-tight">
            Budgets
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Allocated spending limits for cycle ({financialCycle.cycleLabel}).
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md font-medium text-xs shadow-xs transition-colors cursor-pointer"
        >
          <Icons.Plus className="w-3.5 h-3.5" />
          Create Budget
        </button>
      </div>

      {/* Overview Card */}
      <div className="bg-white dark:bg-[#13111C] rounded-lg p-5 border border-[#EDE9FE] dark:border-[#272138] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[11px] text-purple-400 font-semibold uppercase tracking-wider">
              Total Allocated
            </span>
            <div className="text-2xl font-bold text-[#1E1B2E] dark:text-white mt-0.5">
              {currencySymbol}{totalSpent.toFixed(2)}{' '}
              <span className="text-xs font-medium text-[#7A7489] dark:text-purple-300/70">
                / {currencySymbol}{totalBudgeted.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-[#7A7489] dark:text-purple-300/70 font-medium">
              Remaining Spending Headroom
            </span>
            <div
              className={`text-lg font-bold mt-0.5 ${
                totalBudgeted - totalSpent >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'
              }`}
            >
              {currencySymbol}{Math.max(0, totalBudgeted - totalSpent).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="w-full h-2 bg-purple-50 dark:bg-[#181524] rounded-full overflow-hidden border border-purple-100 dark:border-[#272138]">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              totalSpent > totalBudgeted
                ? 'bg-rose-500'
                : totalSpent > totalBudgeted * 0.85
                ? 'bg-amber-500'
                : 'bg-purple-600'
            }`}
            style={{
              width: `${Math.min(100, totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0)}%`,
            }}
          />
        </div>
      </div>

      {/* Category Budgets Grid */}
      {budgets.length === 0 ? (
        <div className="bg-white dark:bg-[#13111C] rounded-lg p-10 border border-[#EDE9FE] dark:border-[#272138] text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 mx-auto flex items-center justify-center">
            <Icons.PieChart className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="font-semibold text-sm text-[#1E1B2E] dark:text-white">
              No Category Budgets Set
            </h3>
            <p className="text-xs text-[#7A7489] dark:text-purple-300/70 mt-1">
              Set spending caps for your categories to track cycle pace and calculate your daily safe-to-spend allowance.
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
          >
            <Icons.Plus className="w-3.5 h-3.5" />
            Create Category Budget
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map((budget) => {
            const cat = categoryMap.get(budget.categoryId);
            const spent = spentMap.get(budget.categoryId) || 0;
            const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
            const isOver = spent > budget.amount;
            const isNear = spent >= budget.amount * budget.warningThreshold && !isOver;
            const remaining = Math.max(0, budget.amount - spent);

            const iconName = (cat?.icon || 'PieChart') as keyof typeof Icons;
            const IconComponent = (Icons[iconName] as React.ElementType) || Icons.PieChart;

            return (
              <div
                key={budget.id}
                className="bg-white dark:bg-[#13111C] rounded-lg p-4 border border-[#EDE9FE] dark:border-[#272138] shadow-xs space-y-3 hover:border-purple-300 dark:hover:border-purple-800/60 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded flex items-center justify-center shadow-xs shrink-0"
                      style={{
                        backgroundColor: `${cat?.color || '#9333ea'}18`,
                        color: cat?.color || '#9333ea',
                      }}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-xs text-[#1E1B2E] dark:text-white">
                        {cat?.name || 'Uncategorized'}
                      </h3>
                      <span className="text-[11px] text-[#7A7489] dark:text-purple-300/70">
                        Cap: {currencySymbol}{budget.amount.toFixed(2)} per cycle
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(budget)}
                      className="p-1 rounded text-[#7A7489] hover:text-purple-600 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-[#181524] cursor-pointer"
                      title="Edit Budget"
                    >
                      <Icons.Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Remove budget for ${cat?.name}?`)) {
                          onDeleteBudget(budget.id);
                        }
                      }}
                      className="p-1 rounded text-[#7A7489] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                      title="Delete Budget"
                    >
                      <Icons.Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#1E1B2E] dark:text-purple-200 text-xs">
                      {currencySymbol}{spent.toFixed(2)}{' '}
                      <span className="text-[11px] font-normal text-[#7A7489] dark:text-purple-300/70">spent</span>
                    </span>
                    <span
                      className={`font-semibold text-[11px] ${
                        isOver ? 'text-rose-500' : isNear ? 'text-amber-500' : 'text-[#7A7489] dark:text-purple-300/70'
                      }`}
                    >
                      {isOver ? `Over by ${currencySymbol}${(spent - budget.amount).toFixed(2)}` : `${percentage.toFixed(0)}% used`}
                    </span>
                  </div>

                  <div className="w-full h-1.5 bg-purple-50 dark:bg-[#181524] rounded-full overflow-hidden border border-purple-100 dark:border-[#272138]">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isOver ? 'bg-rose-500' : isNear ? 'bg-amber-400' : 'bg-purple-600'
                      }`}
                      style={{ width: `${Math.min(100, percentage)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#7A7489] dark:text-purple-300/70 pt-1 border-t border-[#EDE9FE] dark:border-[#272138]">
                  <span>Safe headroom:</span>
                  <span className={`font-medium ${isOver ? 'text-rose-500' : 'text-[#1E1B2E] dark:text-purple-200'}`}>
                    {currencySymbol}{remaining.toFixed(2)} left
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Budget Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#13111C] rounded-xl max-w-sm w-full p-5 shadow-xl border border-[#EDE9FE] dark:border-[#272138] animate-in fade-in zoom-in-95">
            <h2 className="text-sm font-bold text-[#1E1B2E] dark:text-white mb-4 flex items-center gap-2">
              <Icons.PiggyBank className="w-4 h-4 text-purple-600" />
              {editingBudget ? 'Edit Category Budget' : 'Add Category Budget'}
            </h2>

            <form onSubmit={handleSubmitModal} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-[#4A4458] dark:text-purple-300 mb-1">
                  Category
                </label>
                <select
                  disabled={!!editingBudget}
                  value={modalCategoryId}
                  onChange={(e) => setModalCategoryId(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#FAF8FD] dark:bg-[#181524] border border-[#EDE9FE] dark:border-[#2E2844] rounded-md text-xs text-[#1E1B2E] dark:text-white"
                >
                  {categories.filter(c => c.type === 'EXPENSE').map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#4A4458] dark:text-purple-300 mb-1">
                  Budget Cap ({currencySymbol})
                </label>
                <input
                  type="number"
                  step="10"
                  required
                  value={modalAmount}
                  onChange={(e) => setModalAmount(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#FAF8FD] dark:bg-[#181524] border border-[#EDE9FE] dark:border-[#2E2844] rounded-md font-bold text-base text-[#1E1B2E] dark:text-white focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-md text-xs font-medium text-[#6B647B] dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-[#181524] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-md bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium shadow-xs cursor-pointer"
                >
                  Save Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
