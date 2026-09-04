import React, { useState } from 'react';
import { AppSettings, FinancialCycle } from '../types';
import * as Icons from 'lucide-react';

interface FinancialCycleSettingsScreenProps {
  settings: AppSettings;
  financialCycle: FinancialCycle;
  onSaveSettings: (newSettings: AppSettings) => void;
}

export const FinancialCycleSettingsScreen: React.FC<FinancialCycleSettingsScreenProps> = ({
  settings,
  financialCycle,
  onSaveSettings,
}) => {
  const [cycleType, setCycleType] = useState(settings.cycleType);
  const [startDay, setStartDay] = useState(settings.cycleStartDay);
  const [currencySymbol, setCurrencySymbol] = useState(settings.currencySymbol);
  const [rollover, setRollover] = useState(settings.budgetRollover);
  const [savedToast, setSavedToast] = useState(false);

  const CURRENCIES = [
    { symbol: '$', code: 'USD', name: 'US Dollar ($)' },
    { symbol: '€', code: 'EUR', name: 'Euro (€)' },
    { symbol: '£', code: 'GBP', name: 'British Pound (£)' },
    { symbol: '₹', code: 'INR', name: 'Indian Rupee (₹)' },
    { symbol: 'C$', code: 'CAD', name: 'Canadian Dollar (C$)' },
    { symbol: 'A$', code: 'AUD', name: 'Australian Dollar (A$)' },
    { symbol: '¥', code: 'JPY', name: 'Japanese Yen (¥)' },
  ];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: AppSettings = {
      ...settings,
      cycleType,
      cycleStartDay: cycleType === 'CALENDAR_MONTH' ? 1 : startDay,
      currencySymbol,
      budgetRollover: rollover,
    };
    onSaveSettings(updated);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Financial Cycle Settings
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Align your spending limits with your real income payday schedule.
        </p>
      </div>

      {savedToast && (
        <div className="p-3 bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <Icons.Check className="w-4 h-4" />
          Financial cycle settings updated successfully!
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSave} className="bg-white dark:bg-[#13111C] rounded-2xl p-6 border border-[#EDE9FE] dark:border-[#272138] shadow-xs space-y-6">
        {/* Cycle Type Mode */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-[#1E1B2E] dark:text-purple-200">
            Cycle Tracking Mode
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              onClick={() => setCycleType('CALENDAR_MONTH')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                cycleType === 'CALENDAR_MONTH'
                  ? 'border-purple-600 bg-purple-50/70 dark:bg-purple-950/40'
                  : 'border-[#EDE9FE] dark:border-[#272138] hover:border-purple-300 dark:hover:border-purple-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icons.Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span className="font-bold text-sm text-[#1E1B2E] dark:text-white">
                  Calendar Month
                </span>
              </div>
              <p className="text-xs text-[#6B647B] dark:text-purple-300/70 mt-1">
                Resets on the 1st of every month (Standard).
              </p>
            </div>

            <div
              onClick={() => setCycleType('CUSTOM_PAYCHECK')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                cycleType === 'CUSTOM_PAYCHECK'
                  ? 'border-purple-600 bg-purple-50/70 dark:bg-purple-950/40'
                  : 'border-[#EDE9FE] dark:border-[#272138] hover:border-purple-300 dark:hover:border-purple-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icons.Wallet className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span className="font-bold text-sm text-[#1E1B2E] dark:text-white">
                  Paycheck Cycle
                </span>
              </div>
              <p className="text-xs text-[#6B647B] dark:text-purple-300/70 mt-1">
                Resets on your salary date (e.g. 25th of month).
              </p>
            </div>
          </div>
        </div>

        {/* Start Day of Month (if custom) */}
        {cycleType === 'CUSTOM_PAYCHECK' && (
          <div className="space-y-3 p-4 bg-[#FAF8FD] dark:bg-[#181524] rounded-xl border border-purple-100 dark:border-[#272138]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1E1B2E] dark:text-purple-200">
                Payday / Cycle Start Day:
              </label>
              <span className="text-sm font-extrabold text-purple-600 dark:text-purple-400">
                {startDay}th of month
              </span>
            </div>

            <input
              type="range"
              min="1"
              max="28"
              value={startDay}
              onChange={(e) => setStartDay(parseInt(e.target.value))}
              className="w-full h-2 bg-purple-100 dark:bg-[#272138] rounded-lg cursor-pointer accent-purple-600"
            />
            <div className="flex justify-between text-[10px] text-[#7A7489] dark:text-purple-400">
              <span>Day 1</span>
              <span>Day 15 (Mid-month)</span>
              <span>Day 25 (Standard Payday)</span>
              <span>Day 28</span>
            </div>
          </div>
        )}

        {/* Currency selection */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-[#1E1B2E] dark:text-purple-200">
            App Currency
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {CURRENCIES.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => setCurrencySymbol(c.symbol)}
                className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-between ${
                  currencySymbol === c.symbol
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold'
                    : 'border-[#EDE9FE] dark:border-[#272138] text-[#4A4458] dark:text-purple-200 hover:bg-purple-50/50 dark:hover:bg-[#181524]'
                }`}
              >
                <span>{c.code}</span>
                <span className="font-bold">{c.symbol}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Budget Rollover Toggle */}
        <div className="flex items-center justify-between p-4 bg-[#FAF8FD] dark:bg-[#181524] rounded-xl border border-purple-100 dark:border-[#272138]">
          <div>
            <span className="text-xs font-bold text-[#1E1B2E] dark:text-purple-200">
              Rollover Unspent Budget
            </span>
            <p className="text-[11px] text-[#6B647B] dark:text-purple-300/70">
              Carry forward remaining budget surplus into next cycle’s safe allowance.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setRollover(!rollover)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
              rollover ? 'bg-purple-600' : 'bg-purple-200 dark:bg-purple-900/60'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                rollover ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Live Cycle Preview */}
        <div className="p-4 bg-purple-50/60 dark:bg-purple-950/20 rounded-xl border border-purple-200 dark:border-purple-900/40 text-xs space-y-1 text-[#4A4458] dark:text-purple-200">
          <div className="font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5 mb-1">
            <Icons.Info className="w-4 h-4" />
            Active Cycle Period
          </div>
          <div>Current cycle: <strong>{financialCycle.cycleLabel}</strong></div>
          <div>Days remaining: <strong>{financialCycle.daysRemaining} days</strong></div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            Save Cycle Preferences
          </button>
        </div>
      </form>
    </div>
  );
};
