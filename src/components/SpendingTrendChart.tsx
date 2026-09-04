import React, { useState } from 'react';
import { FinancialCycle, Transaction } from '../types';

interface SpendingTrendChartProps {
  financialCycle: FinancialCycle;
  transactions: Transaction[];
  currencySymbol: string;
}

interface DailySpendPoint {
  dateStr: string;
  dayNum: number;
  spend: number;
  cumulative: number;
  isToday: boolean;
}

export const SpendingTrendChart: React.FC<SpendingTrendChartProps> = ({
  financialCycle,
  transactions,
  currencySymbol,
}) => {
  const [activePoint, setActivePoint] = useState<DailySpendPoint | null>(null);

  // Parse start and end date
  const startDate = new Date(financialCycle.startDate + 'T00:00:00');
  const endDate = new Date(financialCycle.endDate + 'T23:59:59');
  const now = new Date();

  // Filter expenses
  const expenses = transactions.filter(
    t => t.type === 'DEBIT' &&
    t.reviewStatus !== 'IGNORED' &&
    t.timestamp >= startDate.getTime() &&
    t.timestamp <= endDate.getTime()
  );

  // Group by day
  const dailySpendMap = new Map<string, number>();
  for (const tx of expenses) {
    const d = new Date(tx.timestamp);
    const key = d.toISOString().split('T')[0];
    dailySpendMap.set(key, (dailySpendMap.get(key) || 0) + tx.amount);
  }

  // Generate sequence of days in this cycle
  const points: DailySpendPoint[] = [];
  const curr = new Date(startDate);
  let runningCumulative = 0;

  while (curr <= endDate) {
    const key = curr.toISOString().split('T')[0];
    const isToday = curr.toDateString() === now.toDateString();
    const isPastOrToday = curr <= now;
    const daySpend = dailySpendMap.get(key) || 0;

    if (isPastOrToday) {
      runningCumulative += daySpend;
    }

    points.push({
      dateStr: curr.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      dayNum: curr.getDate(),
      spend: daySpend,
      cumulative: isPastOrToday ? runningCumulative : 0,
      isToday,
    });

    curr.setDate(curr.getDate() + 1);
  }

  const maxSpend = Math.max(10, ...points.map(p => p.spend));
  const maxCumulative = Math.max(financialCycle.totalBudget || 100, runningCumulative * 1.1);

  // Chart dimensions
  const svgWidth = 600;
  const svgHeight = 220;
  const padLeft = 45;
  const padRight = 20;
  const padTop = 25;
  const padBottom = 30;
  const chartWidth = svgWidth - padLeft - padRight;
  const chartHeight = svgHeight - padTop - padBottom;

  const getX = (index: number) => {
    if (points.length <= 1) return padLeft + chartWidth / 2;
    return padLeft + (index / (points.length - 1)) * chartWidth;
  };

  const getYCumulative = (val: number) => {
    return padTop + chartHeight - (val / maxCumulative) * chartHeight;
  };

  // Build cumulative line path
  const pastPoints = points.filter((_, idx) => getX(idx) <= getX(points.findIndex(p => p.isToday) === -1 ? points.length - 1 : points.findIndex(p => p.isToday)));
  
  let linePath = '';
  pastPoints.forEach((p, idx) => {
    const x = getX(idx);
    const y = getYCumulative(p.cumulative);
    if (idx === 0) linePath += `M ${x} ${y}`;
    else linePath += ` L ${x} ${y}`;
  });

  // Area fill
  let areaPath = '';
  if (pastPoints.length > 0) {
    const firstX = getX(0);
    const lastX = getX(pastPoints.length - 1);
    const baseLineY = padTop + chartHeight;
    areaPath = `${linePath} L ${lastX} ${baseLineY} L ${firstX} ${baseLineY} Z`;
  }

  // Budget ceiling guideline Y
  const budgetCeilingY = financialCycle.totalBudget > 0 ? getYCumulative(financialCycle.totalBudget) : null;

  return (
    <div className="flex flex-col space-y-3 p-4">
      {/* Chart Header Stats */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-purple-600"></span>
            Cumulative Spent
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-purple-200 dark:bg-purple-900/60"></span>
            Daily Spend Bar
          </span>
          {budgetCeilingY !== null && (
            <span className="flex items-center gap-1.5">
              <span className="w-3 border-t border-dashed border-rose-400"></span>
              Cycle Budget ({currencySymbol}{financialCycle.totalBudget})
            </span>
          )}
        </div>
        {activePoint && (
          <div className="font-medium text-purple-900 dark:text-purple-200">
            {activePoint.dateStr}: {currencySymbol}{activePoint.spend.toFixed(2)} (Total: {currencySymbol}{activePoint.cumulative.toFixed(2)})
          </div>
        )}
      </div>

      {/* SVG Canvas */}
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto select-none"
        >
          <defs>
            <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#9333ea" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#9333ea" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1={padLeft}
            y1={padTop + chartHeight}
            x2={svgWidth - padRight}
            y2={padTop + chartHeight}
            stroke="#cbd5e1"
            strokeWidth="1"
            className="dark:stroke-slate-800"
          />
          <line
            x1={padLeft}
            y1={padTop + chartHeight / 2}
            x2={svgWidth - padRight}
            y2={padTop + chartHeight / 2}
            stroke="#e2e8f0"
            strokeWidth="1"
            strokeDasharray="4 4"
            className="dark:stroke-slate-800/60"
          />

          {/* Budget Limit Reference Line */}
          {budgetCeilingY !== null && budgetCeilingY >= padTop && (
            <g>
              <line
                x1={padLeft}
                y1={budgetCeilingY}
                x2={svgWidth - padRight}
                y2={budgetCeilingY}
                stroke="#f43f5e"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
              <text
                x={svgWidth - padRight}
                y={budgetCeilingY - 4}
                textAnchor="end"
                fontSize="10"
                fill="#f43f5e"
                fontWeight="600"
              >
                Budget Cap: {currencySymbol}{financialCycle.totalBudget}
              </text>
            </g>
          )}

          {/* Daily Spend Bars */}
          {points.map((p, idx) => {
            const x = getX(idx);
            const barHeight = maxSpend > 0 ? (p.spend / maxSpend) * (chartHeight * 0.45) : 0;
            const y = padTop + chartHeight - barHeight;
            const barWidth = Math.max(3, chartWidth / points.length - 3);

            return (
              <rect
                key={`bar-${idx}`}
                x={x - barWidth / 2}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={1.5}
                fill={p.spend > 0 ? (p.isToday ? '#9333ea' : '#c084fc') : 'transparent'}
                opacity={p.isToday ? 0.95 : 0.45}
                className="transition-all hover:opacity-100 cursor-pointer"
                onMouseEnter={() => setActivePoint(p)}
                onMouseLeave={() => setActivePoint(null)}
              />
            );
          })}

          {/* Cumulative Area Fill */}
          {areaPath && (
            <path d={areaPath} fill="url(#spendGradient)" pointerEvents="none" />
          )}

          {/* Cumulative Line */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="#9333ea"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              pointerEvents="none"
            />
          )}

          {/* Data Points */}
          {pastPoints.map((p, idx) => {
            const x = getX(idx);
            const y = getYCumulative(p.cumulative);
            const isHovered = activePoint?.dateStr === p.dateStr;
            return (
              <circle
                key={`point-${idx}`}
                cx={x}
                cy={y}
                r={isHovered ? 5 : (p.isToday ? 4 : 2.5)}
                fill={p.isToday ? '#9333ea' : '#ffffff'}
                stroke="#9333ea"
                strokeWidth={p.isToday ? 2.5 : 1.5}
                className="cursor-pointer transition-transform duration-150"
                onMouseEnter={() => setActivePoint(p)}
                onMouseLeave={() => setActivePoint(null)}
              />
            );
          })}

          {/* X Axis Labels (selective sample to prevent crowding) */}
          {points.map((p, idx) => {
            // Show first, last, and every ~5 days
            const shouldShow = idx === 0 || idx === points.length - 1 || idx % Math.ceil(points.length / 6) === 0;
            if (!shouldShow) return null;
            const x = getX(idx);
            return (
              <text
                key={`label-${idx}`}
                x={x}
                y={svgHeight - 10}
                textAnchor="middle"
                fontSize="10"
                fill="#64748b"
                className="dark:fill-slate-400 font-medium"
              >
                {p.dateStr}
              </text>
            );
          })}

          {/* Y Axis Label */}
          <text
            x={padLeft - 8}
            y={padTop + 10}
            textAnchor="end"
            fontSize="10"
            fill="#64748b"
            className="dark:fill-slate-400"
          >
            {currencySymbol}{maxCumulative.toFixed(0)}
          </text>
          <text
            x={padLeft - 8}
            y={padTop + chartHeight}
            textAnchor="end"
            fontSize="10"
            fill="#64748b"
            className="dark:fill-slate-400"
          >
            {currencySymbol}0
          </text>
        </svg>
      </div>
    </div>
  );
};
