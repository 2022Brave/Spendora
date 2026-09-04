import React from 'react';
import { FinancialCycle, Transaction, Category, Account, Budget } from '../types';
import { TransactionRowItem } from '../components/TransactionRowItem';
import { CategoryDonutChart } from '../components/CategoryDonutChart';
import * as Icons from 'lucide-react';

interface DashboardScreenProps {
  financialCycle: FinancialCycle;
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  budgets: Budget[];
  currencySymbol: string;
  onNavigateTab: (tab: string) => void;
  onOpenNewTransaction: () => void;
  onSelectTransaction: (tx: Transaction) => void;
  onApproveTransaction: (tx: Transaction) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  financialCycle,
  transactions,
  categories,
  accounts,
  budgets,
  currencySymbol,
  onNavigateTab,
  onOpenNewTransaction,
  onSelectTransaction,
  onApproveTransaction,
}) => {
  const pendingTransactions = transactions.filter(t => t.reviewStatus === 'PENDING_REVIEW');
  const recentTransactions = transactions
    .filter(t => t.reviewStatus !== 'IGNORED')
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 6);

  const categoryMap = new Map(categories.map(c => [c.id, c]));
  const accountMap = new Map(accounts.map(a => [a.id, a]));

  const isBudgetWarning = financialCycle.totalBudget > 0 && financialCycle.totalExpenses > financialCycle.totalBudget * 0.85;
  const isBudgetExceeded = financialCycle.totalBudget > 0 && financialCycle.totalExpenses > financialCycle.totalBudget;

  const totalAccountBalance = accounts.reduce((acc, a) => acc + a.balance, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Pending Review Alert if any */}
      {pendingTransactions.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-950 dark:text-amber-200 animate-in fade-in slide-in-from-top-2 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
              <Icons.Inbox className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-xs">
                {pendingTransactions.length} New Transaction{pendingTransactions.length > 1 ? 's' : ''} from SMS
              </h3>
              <p className="text-[11px] text-amber-700/90 dark:text-amber-300/80">
                Awaiting your approval or category confirmation.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('pending')}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-xs font-medium shadow-xs transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            Review Inbox
            <Icons.ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Hero Financial Cycle Card */}
      <div className="relative overflow-hidden rounded-xl bg-[#161324] text-white p-6 border border-[#2B2342] shadow-sm">
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#2B2342]">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-purple-500/20 text-purple-300 border border-purple-400/30">
                  {financialCycle.cycleType === 'CALENDAR_MONTH' ? 'Monthly Cycle' : 'Paycheck Cycle'}
                </span>
                <span className="text-xs text-purple-200/70 font-medium">
                  {financialCycle.cycleLabel}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight mt-2 text-white">
                Daily Safe-to-Spend
              </h1>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-3xl sm:text-4xl font-bold text-purple-300 tracking-tight">
                {currencySymbol}{financialCycle.dailySafeToSpend.toFixed(2)}
                <span className="text-xs text-purple-200/70 font-normal ml-1">/ day</span>
              </div>
              <div className="text-xs text-purple-200/70 mt-0.5">
                {financialCycle.daysRemaining} days remaining in cycle
              </div>
            </div>
          </div>

          {/* Budget & Cycle Progress Bar */}
          <div className="mt-5 space-y-2">
            <div className="flex items-center justify-between text-xs text-purple-100/90">
              <span>
                Spent: <strong className="text-white font-semibold">{currencySymbol}{financialCycle.totalExpenses.toFixed(2)}</strong> of {currencySymbol}{financialCycle.totalBudget.toFixed(2)} budget
              </span>
              <span className={`font-semibold ${isBudgetExceeded ? 'text-rose-400' : isBudgetWarning ? 'text-amber-400' : 'text-emerald-400'}`}>
                {financialCycle.totalBudget > 0
                  ? `${Math.round((financialCycle.totalExpenses / financialCycle.totalBudget) * 100)}% Used`
                  : 'No Budget Set'}
              </span>
            </div>

            <div className="w-full h-2 bg-[#0E0C17] rounded-full overflow-hidden p-0 border border-[#2B2342]">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isBudgetExceeded
                    ? 'bg-rose-500'
                    : isBudgetWarning
                    ? 'bg-amber-400'
                    : 'bg-purple-600'
                }`}
                style={{
                  width: `${Math.min(
                    100,
                    financialCycle.totalBudget > 0
                      ? (financialCycle.totalExpenses / financialCycle.totalBudget) * 100
                      : 0
                  )}%`,
                }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-purple-200/60 pt-0.5">
              <span>{financialCycle.percentElapsed}% of cycle elapsed</span>
              <span>Remaining allowance: {currencySymbol}{financialCycle.remainingBudget.toFixed(2)}</span>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-[#2B2342]">
            <div className="bg-[#1D192E]/80 rounded-lg p-3 border border-[#2B2342]/80">
              <div className="text-[10px] text-purple-200/70 font-bold mb-1 uppercase tracking-wider flex items-center gap-1">
                <Icons.TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                Cycle Inflow
              </div>
              <div className="text-base sm:text-lg font-bold text-emerald-400">
                +{currencySymbol}{financialCycle.totalIncome.toFixed(2)}
              </div>
            </div>

            <div className="bg-[#1D192E]/80 rounded-lg p-3 border border-[#2B2342]/80">
              <div className="text-[10px] text-purple-200/70 font-bold mb-1 uppercase tracking-wider flex items-center gap-1">
                <Icons.TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                Cycle Outflow
              </div>
              <div className="text-base sm:text-lg font-bold text-purple-50">
                -{currencySymbol}{financialCycle.totalExpenses.toFixed(2)}
              </div>
            </div>

            <div className="bg-[#1D192E]/80 rounded-lg p-3 border border-[#2B2342]/80">
              <div className="text-[10px] text-purple-200/70 font-bold mb-1 uppercase tracking-wider flex items-center gap-1">
                <Icons.PiggyBank className="w-3.5 h-3.5 text-purple-300" />
                Net Savings
              </div>
              <div
                className={`text-base sm:text-lg font-bold ${
                  financialCycle.netSavings >= 0 ? 'text-purple-300' : 'text-rose-400'
                }`}
              >
                {financialCycle.netSavings >= 0 ? '+' : ''}
                {currencySymbol}{financialCycle.netSavings.toFixed(2)}
              </div>
            </div>

            <div className="bg-[#1D192E]/80 rounded-lg p-3 border border-[#2B2342]/80">
              <div className="text-[10px] text-purple-200/70 font-bold mb-1 uppercase tracking-wider flex items-center gap-1">
                <Icons.CreditCard className="w-3.5 h-3.5 text-purple-400" />
                Net Balances
              </div>
              <div className="text-base sm:text-lg font-bold text-white">
                {currencySymbol}{totalAccountBalance.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          onClick={onOpenNewTransaction}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md font-medium text-xs shadow-xs transition-colors cursor-pointer"
        >
          <Icons.PlusCircle className="w-4 h-4" />
          Add Transaction
        </button>

        <button
          onClick={() => onNavigateTab('sms_import')}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-[#13111C] border border-[#EDE9FE] dark:border-[#272138] hover:bg-purple-50/50 dark:hover:bg-[#181524] text-[#332E40] dark:text-purple-100 rounded-md font-medium text-xs shadow-xs transition-colors cursor-pointer"
        >
          <Icons.Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          SMS Parser Bench
        </button>

        <button
          onClick={() => onNavigateTab('budgets')}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-[#13111C] border border-[#EDE9FE] dark:border-[#272138] hover:bg-purple-50/50 dark:hover:bg-[#181524] text-[#332E40] dark:text-purple-100 rounded-md font-medium text-xs shadow-xs transition-colors cursor-pointer"
        >
          <Icons.PieChart className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          Budget Tracker
        </button>
      </div>

      {/* Two Column Section: Category Donut & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Breakdown (Donut Chart) */}
        <div className="lg:col-span-6 bg-white dark:bg-[#13111C] rounded-lg p-4 sm:p-5 border border-[#EDE9FE] dark:border-[#272138] shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-[#EDE9FE] dark:border-[#272138]">
            <h2 className="font-semibold text-sm text-[#1E1B2E] dark:text-white flex items-center gap-2">
              <Icons.PieChart className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              Category Spend
            </h2>
            <button
              onClick={() => onNavigateTab('analytics')}
              className="text-xs font-medium text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
            >
              View Analytics
              <Icons.ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <CategoryDonutChart
            categories={categories}
            transactions={transactions}
            currencySymbol={currencySymbol}
          />
        </div>

        {/* Recent Transactions */}
        <div className="lg:col-span-6 bg-white dark:bg-[#13111C] rounded-lg p-4 sm:p-5 border border-[#EDE9FE] dark:border-[#272138] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#EDE9FE] dark:border-[#272138]">
              <h2 className="font-semibold text-sm text-[#1E1B2E] dark:text-white flex items-center gap-2">
                <Icons.Receipt className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                Recent Ledger
              </h2>
              <button
                onClick={() => onNavigateTab('transactions')}
                className="text-xs font-medium text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
              >
                All Transactions
                <Icons.ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-purple-50 dark:divide-[#201B30] mt-1">
              {recentTransactions.length === 0 ? (
                <div className="text-center py-10 text-[#7A7489] dark:text-purple-300/60 text-xs">
                  No recent transactions found
                </div>
              ) : (
                recentTransactions.map((tx) => (
                  <TransactionRowItem
                    key={tx.id}
                    transaction={tx}
                    category={categoryMap.get(tx.categoryId)}
                    account={accountMap.get(tx.accountId)}
                    currencySymbol={currencySymbol}
                    onClick={onSelectTransaction}
                    onApprove={onApproveTransaction}
                    compact
                  />
                ))
              )}
            </div>
          </div>

          {/* Quick status bar */}
          <div className="pt-3 border-t border-[#EDE9FE] dark:border-[#272138] flex items-center justify-between text-xs text-[#7A7489] dark:text-purple-300/70">
            <span>{transactions.length} Total recorded</span>
            <button
              onClick={onOpenNewTransaction}
              className="font-medium text-purple-600 dark:text-purple-400 hover:underline"
            >
              + Quick Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
