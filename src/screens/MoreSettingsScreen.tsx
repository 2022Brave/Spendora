import React, { useState } from 'react';
import { AppSettings, MerchantRule, Category } from '../types';
import { SpendoraStorage } from '../data/storage/SpendoraStorage';
import * as Icons from 'lucide-react';

interface MoreSettingsScreenProps {
  settings: AppSettings;
  merchantRules: MerchantRule[];
  categories: Category[];
  onSaveSettings: (settings: AppSettings) => void;
  onSaveMerchantRules: (rules: MerchantRule[]) => void;
  onNavigateTab: (tab: string) => void;
  onResetData: () => void;
}

export const MoreSettingsScreen: React.FC<MoreSettingsScreenProps> = ({
  settings,
  merchantRules,
  categories,
  onSaveSettings,
  onSaveMerchantRules,
  onNavigateTab,
  onResetData,
}) => {
  const [newPattern, setNewPattern] = useState('');
  const [newNormalized, setNewNormalized] = useState('');
  const [newCategoryId, setNewCategoryId] = useState(categories[0]?.id || '');
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleBiometric = () => {
    const updated = { ...settings, biometricEnabled: !settings.biometricEnabled };
    onSaveSettings(updated);
    showToast(updated.biometricEnabled ? 'Biometric security enabled' : 'Biometric security disabled');
  };

  const handleToggleLocation = () => {
    const updated = { ...settings, locationTaggingEnabled: !settings.locationTaggingEnabled };
    onSaveSettings(updated);
  };

  const handleExportJson = () => {
    const data = SpendoraStorage.exportFullBackup();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spendora_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('JSON backup downloaded');
  };

  const handleExportCsv = () => {
    const csv = SpendoraStorage.exportTransactionsCsv();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spendora_transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Transactions exported to CSV');
  };

  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text && SpendoraStorage.importFullBackup(text)) {
        showToast('Backup restored successfully! Reloading...');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        alert('Invalid backup file format');
      }
    };
    reader.readAsText(file);
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPattern.trim() || !newNormalized.trim()) return;

    const rule: MerchantRule = {
      id: `r_${Date.now()}`,
      pattern: newPattern.trim(),
      normalizedMerchant: newNormalized.trim(),
      categoryId: newCategoryId,
      isRegex: true,
      priority: 10,
    };

    onSaveMerchantRules([...merchantRules, rule]);
    setIsRuleModalOpen(false);
    setNewPattern('');
    setNewNormalized('');
    showToast('Merchant rule added');
  };

  const handleDeleteRule = (id: string) => {
    onSaveMerchantRules(merchantRules.filter(r => r.id !== id));
  };

  const categoryMap = new Map<string, Category>(categories.map(c => [c.id, c]));

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[#1E293B] dark:text-white tracking-tight">
          Settings & Preferences
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Security, SMS intelligence rules, data backup, and appearance.
        </p>
      </div>

      {toastMessage && (
        <div className="p-3 bg-emerald-600 text-white rounded-md text-xs font-medium flex items-center gap-2 animate-in fade-in">
          <Icons.Check className="w-4 h-4" />
          {toastMessage}
        </div>
      )}

      {/* Security & System Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-lg p-5 border border-[#E2E8F0] dark:border-slate-800 shadow-sm space-y-4">
        <h2 className="font-semibold text-xs text-slate-400 uppercase tracking-wider">
          Security & Privacy
        </h2>

        {/* Biometric Toggle */}
        <div className="flex items-center justify-between py-2 border-b border-[#EDE9FE] dark:border-[#272138]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
              <Icons.Fingerprint className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-sm text-[#1E1B2E] dark:text-white">
                Biometric App Lock
              </span>
              <p className="text-xs text-[#7A7489] dark:text-purple-300/70">
                Require biometric authorization to open Spendora.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleToggleBiometric}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
              settings.biometricEnabled ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                settings.biometricEnabled ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Location Tagging */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <Icons.MapPin className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-sm text-[#1E1B2E] dark:text-white">
                Location Geotagging
              </span>
              <p className="text-xs text-[#7A7489] dark:text-purple-300/70">
                Attach merchant GPS location tags when adding transactions.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleToggleLocation}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
              settings.locationTaggingEnabled ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                settings.locationTaggingEnabled ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Auto-Categorization Merchant Rules */}
      <div className="bg-white dark:bg-[#13111C] rounded-lg p-5 border border-[#EDE9FE] dark:border-[#272138] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-sm text-[#1E1B2E] dark:text-white">
              Merchant Rules Engine
            </h2>
            <p className="text-xs text-[#7A7489] dark:text-purple-300/70">
              Pattern matching rules to normalize payees and auto-assign categories.
            </p>
          </div>
          <button
            onClick={() => setIsRuleModalOpen(true)}
            className="px-2.5 py-1.5 bg-purple-50 dark:bg-[#181524] text-purple-600 dark:text-purple-400 rounded-md text-xs font-medium hover:bg-purple-100 dark:hover:bg-[#272138] flex items-center gap-1 cursor-pointer transition-colors border border-purple-200 dark:border-[#2E2844]"
          >
            <Icons.Plus className="w-3.5 h-3.5" />
            New Rule
          </button>
        </div>

        <div className="divide-y divide-[#EDE9FE] dark:divide-[#272138]">
          {merchantRules.map((rule) => {
            const cat = categoryMap.get(rule.categoryId);
            return (
              <div key={rule.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200 bg-[#F1F5F9] dark:bg-slate-800 px-2 py-0.5 rounded">
                      {rule.pattern}
                    </span>
                    <Icons.ArrowRight className="w-3 h-3 text-slate-400" />
                    <span className="text-xs font-semibold text-[#1E293B] dark:text-white">
                      {rule.normalizedMerchant}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Category: {cat?.name || 'Groceries'}
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteRule(rule.id)}
                  className="p-1 rounded text-slate-400 hover:text-rose-600 cursor-pointer"
                >
                  <Icons.Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Data Backup & Export */}
      <div className="bg-white dark:bg-slate-900 rounded-lg p-5 border border-[#E2E8F0] dark:border-slate-800 shadow-sm space-y-4">
        <h2 className="font-semibold text-xs text-slate-400 uppercase tracking-wider">
          Data Portability & Backup
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={handleExportJson}
            className="p-3.5 rounded-lg border border-[#EDE9FE] dark:border-[#272138] hover:bg-purple-50/50 dark:hover:bg-[#181524] text-left transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2 text-[#1E1B2E] dark:text-white font-semibold text-xs">
              <Icons.Download className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              Export JSON Backup
            </div>
            <p className="text-[11px] text-[#7A7489] dark:text-purple-300/70 mt-1">
              Full snapshot of accounts, categories, budgets, and all transactions.
            </p>
          </button>

          <button
            onClick={handleExportCsv}
            className="p-3.5 rounded-lg border border-[#EDE9FE] dark:border-[#272138] hover:bg-purple-50/50 dark:hover:bg-[#181524] text-left transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2 text-[#1E1B2E] dark:text-white font-semibold text-xs">
              <Icons.FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Export CSV Spreadsheet
            </div>
            <p className="text-[11px] text-[#7A7489] dark:text-purple-300/70 mt-1">
              Compatible with Excel, Google Sheets, or Apple Numbers.
            </p>
          </button>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
          <label className="cursor-pointer text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1.5">
            <Icons.Upload className="w-4 h-4" />
            Restore from JSON file
            <input
              type="file"
              accept=".json"
              onChange={handleImportJsonFile}
              className="hidden"
            />
          </label>

          <button
            onClick={() => {
              if (confirm('Reset Spendora to a fresh state? All user accounts, budgets, and transactions will be cleared. System categories will remain intact.')) {
                onResetData();
                showToast('Reset to clean fresh installation');
              }
            }}
            className="text-xs font-medium text-rose-500 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Icons.RotateCcw className="w-3.5 h-3.5" />
            Reset to Fresh Installation
          </button>
        </div>
      </div>

      {/* About & Privacy Policy Link */}
      <div className="bg-white dark:bg-[#13111C] rounded-lg p-5 border border-[#EDE9FE] dark:border-[#272138] shadow-sm flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm text-[#1E1B2E] dark:text-white flex items-center gap-1.5">
            <Icons.ShieldCheck className="w-4 h-4 text-emerald-600" />
            Spendora Local-First Guarantee
          </h3>
          <p className="text-xs text-[#7A7489] dark:text-purple-300/70 mt-0.5">
            Your financial data, accounts, and SMS messages never leave this device.
          </p>
        </div>
        <button
          onClick={() => onNavigateTab('privacy')}
          className="px-3 py-1.5 rounded-md border border-[#EDE9FE] dark:border-[#2E2844] text-xs font-medium hover:bg-purple-50 dark:hover:bg-[#181524] text-[#4A4458] dark:text-purple-200 transition-colors cursor-pointer"
        >
          Privacy Policy
        </button>
      </div>

      {/* Add Rule Modal */}
      {isRuleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#13111C] rounded-xl max-w-sm w-full p-5 shadow-xl border border-[#EDE9FE] dark:border-[#272138] animate-in fade-in">
            <h2 className="text-sm font-bold text-[#1E1B2E] dark:text-white mb-4">
              New Merchant Rule
            </h2>

            <form onSubmit={handleAddRule} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-[#4A4458] dark:text-purple-300 mb-1">
                  Regex / Match Pattern
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TRADER JOE|SAFEWAY"
                  value={newPattern}
                  onChange={(e) => setNewPattern(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#FAF8FD] dark:bg-[#181524] border border-[#EDE9FE] dark:border-[#2E2844] rounded-md text-xs font-mono text-[#1E1B2E] dark:text-white focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#4A4458] dark:text-purple-300 mb-1">
                  Normalized Merchant Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Trader Joe's"
                  value={newNormalized}
                  onChange={(e) => setNewNormalized(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#FAF8FD] dark:bg-[#181524] border border-[#EDE9FE] dark:border-[#2E2844] rounded-md text-xs text-[#1E1B2E] dark:text-white focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#4A4458] dark:text-purple-300 mb-1">
                  Default Category
                </label>
                <select
                  value={newCategoryId}
                  onChange={(e) => setNewCategoryId(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#FAF8FD] dark:bg-[#181524] border border-[#EDE9FE] dark:border-[#2E2844] rounded-md text-xs text-[#1E1B2E] dark:text-white focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRuleModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-md text-xs font-medium text-[#6B647B] dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-[#181524] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-md bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium shadow-xs cursor-pointer"
                >
                  Save Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
