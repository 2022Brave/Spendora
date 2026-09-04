import { FinancialCycle, Transaction, Budget, AppSettings } from '../../types';

export class FinancialCycleCalculator {
  /**
   * Calculates the current financial cycle dates and statistics
   */
  static calculateCurrentCycle(
    settings: AppSettings,
    transactions: Transaction[],
    budgets: Budget[],
    refDate: Date = new Date()
  ): FinancialCycle {
    const { cycleType, cycleStartDay } = settings;
    const year = refDate.getFullYear();
    const month = refDate.getMonth(); // 0-indexed (0 = Jan)
    const day = refDate.getDate();

    let cycleStartDate: Date;
    let cycleEndDate: Date;

    if (cycleType === 'CALENDAR_MONTH' || cycleStartDay === 1) {
      // 1st of current month to last day of current month
      cycleStartDate = new Date(year, month, 1, 0, 0, 0, 0);
      cycleEndDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
    } else {
      // Custom start day, e.g. 25th of month (paycheck cycle)
      if (day >= cycleStartDay) {
        // We are in current month's cycle: e.g. Aug 25 to Sep 24
        cycleStartDate = new Date(year, month, cycleStartDay, 0, 0, 0, 0);
        // End date is day before cycleStartDay in the next month
        const nextMonthYear = month === 11 ? year + 1 : year;
        const nextMonth = month === 11 ? 0 : month + 1;
        cycleEndDate = new Date(nextMonthYear, nextMonth, cycleStartDay - 1, 23, 59, 59, 999);
      } else {
        // We are before cycleStartDay, so cycle started in previous month: e.g. July 25 to Aug 24
        const prevMonthYear = month === 0 ? year - 1 : year;
        const prevMonth = month === 0 ? 11 : month - 1;
        cycleStartDate = new Date(prevMonthYear, prevMonth, cycleStartDay, 0, 0, 0, 0);
        cycleEndDate = new Date(year, month, cycleStartDay - 1, 23, 59, 59, 999);
      }
    }

    const startMs = cycleStartDate.getTime();
    const endMs = cycleEndDate.getTime();
    const nowMs = Math.min(Math.max(refDate.getTime(), startMs), endMs);

    // Filter confirmed transactions within this cycle
    const cycleTransactions = transactions.filter(
      (tx) => tx.timestamp >= startMs && tx.timestamp <= endMs && tx.reviewStatus !== 'IGNORED'
    );

    let totalIncome = 0;
    let totalExpenses = 0;

    for (const tx of cycleTransactions) {
      if (tx.type === 'CREDIT') {
        totalIncome += tx.amount;
      } else if (tx.type === 'DEBIT') {
        totalExpenses += tx.amount;
      }
    }

    const netSavings = totalIncome - totalExpenses;
    const totalBudget = budgets.reduce((acc, b) => acc + b.amount, 0);
    const remainingBudget = Math.max(0, totalBudget - totalExpenses);

    const msPerDay = 24 * 60 * 60 * 1000;
    const totalDays = Math.max(1, Math.round((endMs - startMs) / msPerDay) + 1);
    const daysElapsed = Math.min(totalDays, Math.max(1, Math.ceil((nowMs - startMs) / msPerDay)));
    const daysRemaining = Math.max(1, totalDays - daysElapsed + 1);

    const dailySafeToSpend = Number((remainingBudget / daysRemaining).toFixed(2));
    const percentElapsed = Math.min(100, Math.round((daysElapsed / totalDays) * 100));

    // Format label, e.g. "Sep 1 - Sep 30, 2026"
    const startStr = cycleStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = cycleEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const cycleLabel = `${startStr} – ${endStr}`;

    return {
      cycleType,
      startDay: cycleStartDay,
      startDate: cycleStartDate.toISOString().split('T')[0],
      endDate: cycleEndDate.toISOString().split('T')[0],
      totalIncome,
      totalExpenses,
      netSavings,
      totalBudget,
      remainingBudget,
      daysRemaining,
      totalDays,
      dailySafeToSpend,
      cycleLabel,
      percentElapsed,
    };
  }

  static calculateCycle = FinancialCycleCalculator.calculateCurrentCycle;
}
