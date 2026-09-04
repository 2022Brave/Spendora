import React from 'react';
import { FinancialCycle, Transaction, Category, Budget } from '../types';
import { SpendingTrendChart } from '../components/SpendingTrendChart';
import { CategoryDonutChart } from '../components/CategoryDonutChart';
import * as Icons from 'lucide-react';

interface AnalyticsScreenProps {
  financialCycle: FinancialCycle;
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  currencySymbol: string;
}

export const AnalyticsScreen: React.FC<AnalyticsScreenProps> = ({
  financialCycle,
  transactions,
  categories,
  budgets,
  currencySymbol,
}) => {
  const startDate = new Date(financialCycle.startDate + 'T00:00:00').getTime();
  const endDate = new Date(financialCycle.endDate + 'T23:59:59').getTime();

  const cycleExpenses = transactions.filter(
    t => t.type === 'DEBIT' && t.reviewStatus !== 'IGNORED' && t.timestamp >= startDate && t.timestamp <= endDate
  );

  // Top Merchants
  const merchantMap = new Map<string, number>();
  for (const tx of cycleExpenses) {
    merchantMap.set(tx.merchant, (merchantMap.get(tx.merchant) || 0) + tx.amount);
  }

  const topMerchants = Array.from(merchantMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const totalExpense = cycleExpenses.reduce((acc, t) => acc + t.amount, 0);

  // Savings rate
  const savingsRate = financialCycle.totalIncome > 0
    ? Math.max(0, Math.round((financialCycle.netSavings / financialCycle.totalIncome) * 100))
    : 0;

  // Average daily burn
  const daysSoFar = Math.max(1, Math.round((Date.now() - startDate) / (24 * 60 * 60 * 1000)));
  const avgDailySpend = (totalExpense / daysSoFar).toFixed(2);

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[#1E293B] dark:text-white tracking-tight">
          Financial Analytics
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Detailed breakdown for {financialCycle.cycleLabel}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-[#13111C] rounded-lg p-4 border border-[#EDE9FE] dark:border-[#272138] shadow-xs">
          <span className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider">
            Savings Rate
          </span>
          <div className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-0.5">
            {savingsRate}%
          </div>
          <span className="text-[11px] text-[#7A7489] dark:text-purple-300/70 mt-0.5 block">
            Net: +{currencySymbol}{Math.max(0, financialCycle.netSavings).toFixed(2)}
          </span>
        </div>

        <div className="bg-white dark:bg-[#13111C] rounded-lg p-4 border border-[#EDE9FE] dark:border-[#272138] shadow-xs">
          <span className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider">
            Avg Daily Spend
          </span>
          <div className="text-xl font-bold text-[#1E1B2E] dark:text-white mt-0.5">
            {currencySymbol}{avgDailySpend}
          </div>
          <span className="text-[11px] text-[#7A7489] dark:text-purple-300/70 mt-0.5 block">
            Over {daysSoFar} active day{daysSoFar === 1 ? '' : 's'}
          </span>
        </div>

        <div className="bg-white dark:bg-[#13111C] rounded-lg p-4 border border-[#EDE9FE] dark:border-[#272138] shadow-xs">
          <span className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider">
            Safe Allowance
          </span>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
            {currencySymbol}{financialCycle.dailySafeToSpend.toFixed(2)}
          </div>
          <span className="text-[11px] text-[#7A7489] dark:text-purple-300/70 mt-0.5 block">
            {financialCycle.daysRemaining} days left in cycle
          </span>
        </div>

        <div className="bg-white dark:bg-[#13111C] rounded-lg p-4 border border-[#EDE9FE] dark:border-[#272138] shadow-xs">
          <span className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider">
            Total Recorded
          </span>
          <div className="text-xl font-bold text-[#1E1B2E] dark:text-white mt-0.5">
            {cycleExpenses.length}
          </div>
          <span className="text-[11px] text-[#7A7489] dark:text-purple-300/70 mt-0.5 block">
            Expenses tracked
          </span>
        </div>
      </div>

      {/* Spending Trend Chart Card */}
      <div className="bg-white dark:bg-[#13111C] rounded-lg p-5 border border-[#EDE9FE] dark:border-[#272138] shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-[#EDE9FE] dark:border-[#272138]">
          <div>
            <h2 className="font-semibold text-sm text-[#1E1B2E] dark:text-white flex items-center gap-2">
              <Icons.TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              Cumulative Spending Velocity
            </h2>
            <p className="text-xs text-[#7A7489] dark:text-purple-300/70">
              Progression vs. allocated cycle budget cap
            </p>
          </div>
        </div>

        <SpendingTrendChart
          financialCycle={financialCycle}
          transactions={transactions}
          currencySymbol={currencySymbol}
        />
      </div>

      {/* Two Column: Category Donut & Top Merchants */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Category Breakdown */}
        <div className="lg:col-span-7 bg-white dark:bg-[#13111C] rounded-lg p-5 border border-[#EDE9FE] dark:border-[#272138] shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-[#EDE9FE] dark:border-[#272138]">
            <h2 className="font-semibold text-sm text-[#1E1B2E] dark:text-white flex items-center gap-2">
              <Icons.PieChart className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              Category Distribution
            </h2>
          </div>

          <CategoryDonutChart
            categories={categories}
            transactions={transactions}
            currencySymbol={currencySymbol}
          />
        </div>

        {/* Top 5 Merchants */}
        <div className="lg:col-span-5 bg-white dark:bg-[#13111C] rounded-lg p-5 border border-[#EDE9FE] dark:border-[#272138] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#EDE9FE] dark:border-[#272138]">
              <h2 className="font-semibold text-sm text-[#1E1B2E] dark:text-white flex items-center gap-2">
                <Icons.Store className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                Top Payees & Merchants
              </h2>
              <span className="text-xs text-[#7A7489] dark:text-purple-300/70 font-medium">Ranked by spend</span>
            </div>

            <div className="divide-y divide-[#EDE9FE] dark:divide-[#272138] mt-1">
              {topMerchants.length === 0 ? (
                <div className="py-8 text-center text-xs text-purple-400">
                  No merchant data available
                </div>
              ) : (
                topMerchants.map(([merchantName, amount], index) => {
                  const percent = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
                  return (
                    <div key={merchantName} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-5 h-5 rounded bg-purple-50 dark:bg-[#181524] text-purple-700 dark:text-purple-300 flex items-center justify-center font-semibold text-xs shrink-0">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#1E1B2E] dark:text-white truncate">
                            {merchantName}
                          </p>
                          <div className="w-24 h-1 bg-purple-50 dark:bg-[#181524] rounded-full mt-1 overflow-hidden border border-purple-100 dark:border-[#272138]">
                            <div
                              className="h-full bg-purple-600 rounded-full"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 ml-2">
                        <div className="font-semibold text-xs text-[#1E293B] dark:text-white">
                          {currencySymbol}{amount.toFixed(2)}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {percent.toFixed(1)}% of total
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-[#E2E8F0] dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Aggregated across all accounts</span>
            <span>Total: {currencySymbol}{totalExpense.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
