import React, { useState } from 'react';
import { Category, Transaction } from '../types';

interface CategoryDonutChartProps {
  categories: Category[];
  transactions: Transaction[];
  currencySymbol: string;
}

interface SliceData {
  categoryId: string;
  name: string;
  color: string;
  amount: number;
  percentage: number;
  startAngle: number;
  endAngle: number;
}

export const CategoryDonutChart: React.FC<CategoryDonutChartProps> = ({
  categories,
  transactions,
  currencySymbol,
}) => {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // Calculate sum per category for debit (expense) transactions
  const expenseTransactions = transactions.filter(t => t.type === 'DEBIT' && t.reviewStatus !== 'IGNORED');
  const catAmountMap = new Map<string, number>();

  let totalExpense = 0;
  for (const tx of expenseTransactions) {
    totalExpense += tx.amount;
    catAmountMap.set(tx.categoryId, (catAmountMap.get(tx.categoryId) || 0) + tx.amount);
  }

  const categoryMap = new Map<string, Category>(categories.map(c => [c.id, c]));

  // Build slices sorted by amount descending
  const slices: SliceData[] = [];
  let currentAngle = -90; // Start at 12 o'clock

  const sortedCategories = Array.from(catAmountMap.entries())
    .filter(([_, amt]) => amt > 0)
    .sort((a, b) => b[1] - a[1]);

  for (const [catId, amount] of sortedCategories) {
    const cat = categoryMap.get(catId);
    const percentage = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
    const angleSpan = (percentage / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angleSpan;
    currentAngle = endAngle;

    slices.push({
      categoryId: catId,
      name: cat ? cat.name : 'Other',
      color: cat ? cat.color : '#94a3b8',
      amount,
      percentage,
      startAngle,
      endAngle,
    });
  }

  // SVG dimensions
  const size = 240;
  const strokeWidth = 32;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;

  // Polar to cartesian helper
  const polarToCartesian = (centerX: number, centerY: number, r: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + r * Math.cos(angleInRadians),
      y: centerY + r * Math.sin(angleInRadians),
    };
  };

  const describeArc = (x: number, y: number, r: number, startAngle: number, endAngle: number) => {
    // If arc is full circle or almost full
    const adjustedEnd = endAngle - startAngle >= 359.99 ? startAngle + 359.99 : endAngle;
    const start = polarToCartesian(x, y, r, adjustedEnd);
    const end = polarToCartesian(x, y, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

    return ['M', start.x, start.y, 'A', r, r, 0, largeArcFlag, 0, end.x, end.y].join(' ');
  };

  const activeSlice = hoveredCategory ? slices.find(s => s.categoryId === hoveredCategory) : null;

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-4">
      {/* SVG Donut */}
      <div className="relative flex items-center justify-center shrink-0">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
          {/* Background circle if no expenses */}
          {slices.length === 0 ? (
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth={strokeWidth}
              className="dark:stroke-slate-800"
            />
          ) : (
            slices.map((slice) => {
              const isHovered = hoveredCategory === slice.categoryId;
              const pathD = describeArc(center, center, radius, slice.startAngle, slice.endAngle);
              return (
                <path
                  key={slice.categoryId}
                  d={pathD}
                  fill="none"
                  stroke={slice.color}
                  strokeWidth={isHovered ? strokeWidth + 6 : strokeWidth}
                  strokeLinecap="butt"
                  className="transition-all duration-200 cursor-pointer"
                  onMouseEnter={() => setHoveredCategory(slice.categoryId)}
                  onMouseLeave={() => setHoveredCategory(null)}
                />
              );
            })
          )}
        </svg>

        {/* Center Text Indicator */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
          {activeSlice ? (
            <>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                {activeSlice.name}
              </span>
              <span className="text-lg font-bold text-slate-900 dark:text-white">
                {currencySymbol}{activeSlice.amount.toFixed(2)}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 mt-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {activeSlice.percentage.toFixed(1)}%
              </span>
            </>
          ) : (
            <>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Total Expenses
              </span>
              <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                {currencySymbol}{totalExpense.toFixed(2)}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {slices.length} categories
              </span>
            </>
          )}
        </div>
      </div>

      {/* Legend List */}
      <div className="flex-1 w-full max-h-56 overflow-y-auto space-y-2 pr-1">
        {slices.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 italic text-center py-4">
            No expenses recorded in this cycle
          </p>
        ) : (
          slices.map((slice) => {
            const isHovered = hoveredCategory === slice.categoryId;
            return (
              <div
                key={slice.categoryId}
                onMouseEnter={() => setHoveredCategory(slice.categoryId)}
                onMouseLeave={() => setHoveredCategory(null)}
                className={`flex items-center justify-between p-2 rounded-lg text-sm cursor-pointer transition-colors ${
                  isHovered
                    ? 'bg-slate-100 dark:bg-slate-800/80 font-medium'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: slice.color }}
                  />
                  <span className="text-slate-700 dark:text-slate-200 truncate">
                    {slice.name}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-2">
                  <span className="text-slate-900 dark:text-white font-semibold">
                    {currencySymbol}{slice.amount.toFixed(2)}
                  </span>
                  <span className="text-xs text-slate-400 w-10 text-right">
                    {slice.percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
