import React, { useState, useEffect, useMemo } from 'react';
import {
  Transaction,
  Category,
  Account,
  Budget,
  AppSettings,
  MerchantRule,
  SmsAudit,
} from './types';
import { SpendoraStorage } from './data/storage/SpendoraStorage';
import { FinancialCycleCalculator } from './data/engine/FinancialCycleCalculator';

// Screens
import { DashboardScreen } from './screens/DashboardScreen';
import { TransactionsScreen } from './screens/TransactionsScreen';
import { BudgetsScreen } from './screens/BudgetsScreen';
import { PendingReviewScreen } from './screens/PendingReviewScreen';
import { AnalyticsScreen } from './screens/AnalyticsScreen';
import { AccountsScreen } from './screens/AccountsScreen';
import { HistoricalImportScreen } from './screens/HistoricalImportScreen';
import { CategoriesScreen } from './screens/CategoriesScreen';
import { FinancialCycleSettingsScreen } from './screens/FinancialCycleSettingsScreen';
import { MoreSettingsScreen } from './screens/MoreSettingsScreen';
import { PrivacyPolicyScreen } from './screens/PrivacyPolicyScreen';

// Dialogs
import { TransactionDialogs } from './components/TransactionDialogs';
import { SpendoraLogo } from './components/SpendoraLogo';

// Icons
import * as Icons from 'lucide-react';

export default function App() {
  // Primary State
  const [transactions, setTransactions] = useState<Transaction[]>(() => SpendoraStorage.getTransactions());
  const [categories, setCategories] = useState<Category[]>(() => SpendoraStorage.getCategories());
  const [accounts, setAccounts] = useState<Account[]>(() => SpendoraStorage.getAccounts());
  const [budgets, setBudgets] = useState<Budget[]>(() => SpendoraStorage.getBudgets());
  const [settings, setSettings] = useState<AppSettings>(() => SpendoraStorage.getSettings());
  const [merchantRules, setMerchantRules] = useState<MerchantRule[]>(() => SpendoraStorage.getMerchantRules());

  // Navigation
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Add / Edit Transaction Dialog State
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Biometric lock state (if enabled)
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    const s = SpendoraStorage.getSettings();
    return s.biometricEnabled;
  });

  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('spendora_theme');
    return saved === 'dark';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('spendora_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('spendora_theme', 'light');
    }
  }, [isDarkMode]);

  // Sync state changes to SpendoraStorage
  const updateTransactions = (newTxList: Transaction[]) => {
    setTransactions(newTxList);
    SpendoraStorage.saveTransactions(newTxList);
  };

  const updateCategories = (newCatList: Category[]) => {
    setCategories(newCatList);
    SpendoraStorage.saveCategories(newCatList);
  };

  const updateAccounts = (newAccList: Account[]) => {
    setAccounts(newAccList);
    SpendoraStorage.saveAccounts(newAccList);
  };

  const updateBudgets = (newBudgetList: Budget[]) => {
    setBudgets(newBudgetList);
    SpendoraStorage.saveBudgets(newBudgetList);
  };

  const updateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    SpendoraStorage.saveSettings(newSettings);
  };

  const updateMerchantRules = (newRules: MerchantRule[]) => {
    setMerchantRules(newRules);
    SpendoraStorage.saveMerchantRules(newRules);
  };

  // Dynamic Financial Cycle calculations
  const financialCycle = useMemo(() => {
    return FinancialCycleCalculator.calculateCycle(settings, transactions, budgets);
  }, [settings, transactions, budgets]);

  // Counts
  const pendingCount = useMemo(() => {
    return transactions.filter(t => t.reviewStatus === 'PENDING_REVIEW').length;
  }, [transactions]);

  // Handlers for Transactions
  const handleSaveTransaction = (txData: Partial<Transaction>) => {
    if (editingTransaction) {
      // Edit existing
      const updated = transactions.map(t =>
        t.id === editingTransaction.id ? ({ ...t, ...txData } as Transaction) : t
      );
      updateTransactions(updated);
    } else {
      // Create new
      const newTx: Transaction = {
        id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        amount: txData.amount || 0,
        type: txData.type || 'DEBIT',
        merchant: txData.merchant || 'Merchant',
        categoryId: txData.categoryId || categories[0]?.id || 'cat_food',
        accountId: txData.accountId || accounts[0]?.id || 'acc_checking',
        timestamp: txData.timestamp || Date.now(),
        note: txData.note,
        source: 'MANUAL',
        reviewStatus: 'CONFIRMED',
      };
      updateTransactions([newTx, ...transactions]);

      // Adjust account balance
      const acc = accounts.find(a => a.id === newTx.accountId);
      if (acc) {
        const delta = newTx.type === 'CREDIT' ? newTx.amount : -newTx.amount;
        const updatedAccounts = accounts.map(a =>
          a.id === acc.id ? { ...a, balance: a.balance + delta } : a
        );
        updateAccounts(updatedAccounts);
      }
    }
    setEditingTransaction(null);
  };

  const handleDeleteTransaction = (txId: string) => {
    const tx = transactions.find(t => t.id === txId);
    if (!tx) return;

    // Reverse account balance effect if confirmed
    if (tx.reviewStatus === 'CONFIRMED') {
      const acc = accounts.find(a => a.id === tx.accountId);
      if (acc) {
        const delta = tx.type === 'CREDIT' ? -tx.amount : tx.amount;
        const updatedAccounts = accounts.map(a =>
          a.id === acc.id ? { ...a, balance: a.balance + delta } : a
        );
        updateAccounts(updatedAccounts);
      }
    }

    updateTransactions(transactions.filter(t => t.id !== txId));
  };

  const handleApproveTransaction = (tx: Transaction) => {
    const updated = transactions.map(t =>
      t.id === tx.id ? { ...t, reviewStatus: 'CONFIRMED' as const } : t
    );
    updateTransactions(updated);

    // Adjust account balance
    const acc = accounts.find(a => a.id === tx.accountId);
    if (acc) {
      const delta = tx.type === 'CREDIT' ? tx.amount : -tx.amount;
      const updatedAccounts = accounts.map(a =>
        a.id === acc.id ? { ...a, balance: a.balance + delta } : a
      );
      updateAccounts(updatedAccounts);
    }
  };

  const handleApproveAllPending = () => {
    const pending = transactions.filter(t => t.reviewStatus === 'PENDING_REVIEW' && (t.confidenceScore || 0) >= 0.85);
    const updated = transactions.map(t => {
      if (t.reviewStatus === 'PENDING_REVIEW' && (t.confidenceScore || 0) >= 0.85) {
        return { ...t, reviewStatus: 'CONFIRMED' as const };
      }
      return t;
    });
    updateTransactions(updated);

    // Adjust balances
    const accCopy = [...accounts];
    for (const tx of pending) {
      const accIdx = accCopy.findIndex(a => a.id === tx.accountId);
      if (accIdx !== -1) {
        const delta = tx.type === 'CREDIT' ? tx.amount : -tx.amount;
        accCopy[accIdx] = { ...accCopy[accIdx], balance: accCopy[accIdx].balance + delta };
      }
    }
    updateAccounts(accCopy);
  };

  const handleIgnoreTransaction = (tx: Transaction) => {
    const updated = transactions.map(t =>
      t.id === tx.id ? { ...t, reviewStatus: 'IGNORED' as const } : t
    );
    updateTransactions(updated);
  };

  const handleChangeTxCategory = (tx: Transaction, newCategoryId: string) => {
    const updated = transactions.map(t =>
      t.id === tx.id ? { ...t, categoryId: newCategoryId } : t
    );
    updateTransactions(updated);
  };

  // Budgets Handlers
  const handleSaveBudget = (budget: Budget) => {
    const existing = budgets.find(b => b.categoryId === budget.categoryId);
    if (existing) {
      updateBudgets(budgets.map(b => (b.categoryId === budget.categoryId ? budget : b)));
    } else {
      updateBudgets([...budgets, budget]);
    }
  };

  const handleDeleteBudget = (budgetId: string) => {
    updateBudgets(budgets.filter(b => b.id !== budgetId));
  };

  // Accounts Handlers
  const handleSaveAccount = (account: Account) => {
    const existing = accounts.find(a => a.id === account.id);
    if (existing) {
      updateAccounts(accounts.map(a => (a.id === account.id ? account : a)));
    } else {
      updateAccounts([...accounts, account]);
    }
  };

  const handleDeleteAccount = (accountId: string) => {
    updateAccounts(accounts.filter(a => a.id !== accountId));
  };

  const handleTransferFunds = (fromAccId: string, toAccId: string, amount: number, note?: string) => {
    const fromAcc = accounts.find(a => a.id === fromAccId);
    const toAcc = accounts.find(a => a.id === toAccId);
    if (!fromAcc || !toAcc) return;

    // Create 2 transaction records (Debit transfer out, Credit transfer in)
    const outTx: Transaction = {
      id: `tx_trf_out_${Date.now()}`,
      amount,
      type: 'TRANSFER',
      merchant: `Transfer to ${toAcc.name}`,
      categoryId: 'cat_transfer',
      accountId: fromAccId,
      timestamp: Date.now(),
      note: note || `Transfer to ${toAcc.name}`,
      source: 'MANUAL',
      reviewStatus: 'CONFIRMED',
    };

    const inTx: Transaction = {
      id: `tx_trf_in_${Date.now() + 1}`,
      amount,
      type: 'TRANSFER',
      merchant: `Transfer from ${fromAcc.name}`,
      categoryId: 'cat_transfer',
      accountId: toAccId,
      timestamp: Date.now(),
      note: note || `Transfer from ${fromAcc.name}`,
      source: 'MANUAL',
      reviewStatus: 'CONFIRMED',
    };

    updateTransactions([outTx, inTx, ...transactions]);

    // Update balances
    const updatedAccounts = accounts.map(a => {
      if (a.id === fromAccId) return { ...a, balance: a.balance - amount };
      if (a.id === toAccId) return { ...a, balance: a.balance + amount };
      return a;
    });
    updateAccounts(updatedAccounts);
  };

  // Categories Handlers
  const handleSaveCategory = (cat: Category) => {
    const existing = categories.find(c => c.id === cat.id);
    if (existing) {
      updateCategories(categories.map(c => (c.id === cat.id ? cat : c)));
    } else {
      updateCategories([...categories, cat]);
    }
  };

  const handleDeleteCategory = (categoryId: string) => {
    updateCategories(categories.filter(c => c.id !== categoryId));
  };

  // Reset to demo data
  const handleResetData = () => {
    SpendoraStorage.resetToDefaultSeed();
    setTransactions(SpendoraStorage.getTransactions());
    setCategories(SpendoraStorage.getCategories());
    setAccounts(SpendoraStorage.getAccounts());
    setBudgets(SpendoraStorage.getBudgets());
    setSettings(SpendoraStorage.getSettings());
    setMerchantRules(SpendoraStorage.getMerchantRules());
  };

  // Biometric Unlock Overlay
  if (isLocked) {
    return (
      <div className="min-h-screen bg-[#0E0C15] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-3xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center mb-6 shadow-2xl animate-pulse">
          <Icons.Fingerprint className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-black tracking-tight mb-2">
          Spendora Secured
        </h1>
        <p className="text-xs text-purple-300/70 max-w-xs mb-8">
          Biometric lock is active. Authenticate to view your financial cycle and accounts.
        </p>
        <button
          onClick={() => setIsLocked(false)}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-purple-900/40 transition-all flex items-center gap-2 cursor-pointer"
        >
          <Icons.Unlock className="w-4 h-4" />
          Unlock Spendora
        </button>
      </div>
    );
  }

  // Navigation Items
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Icons.LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: Icons.Receipt },
    { id: 'budgets', label: 'Budgets', icon: Icons.PiggyBank },
    { id: 'pending', label: 'Pending Review', icon: Icons.AlertCircle, badge: pendingCount },
    { id: 'analytics', label: 'Analytics', icon: Icons.BarChart3 },
    { id: 'accounts', label: 'Accounts', icon: Icons.Landmark },
    { id: 'historical_import', label: 'SMS Engine', icon: Icons.Cpu },
    { id: 'cycle_settings', label: 'Cycle Settings', icon: Icons.CalendarSync },
    { id: 'categories', label: 'Categories', icon: Icons.Tag },
    { id: 'settings', label: 'Settings', icon: Icons.Settings },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8FD] dark:bg-[#09080F] text-[#1E1B2E] dark:text-purple-50 flex flex-col font-sans transition-colors duration-200">
      {/* Top Header Bar */}
      <header className="h-14 bg-white dark:bg-[#13111C] border-b border-[#EDE9FE] dark:border-[#272138] flex items-center justify-between px-4 sm:px-6 shrink-0 sticky top-0 z-30">
        <div className="w-full max-w-7xl mx-auto flex items-center justify-between">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-3 cursor-pointer select-none group"
            >
              <SpendoraLogo size={34} />
              <div className="flex items-center">
                <span className="font-bold text-lg tracking-tight text-[#1E1B2E] dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  Spendora
                </span>
                <div className="h-4 w-[1px] bg-purple-200 dark:bg-purple-900/60 mx-2 hidden sm:block" />
                <span className="text-xs text-purple-700/70 dark:text-purple-300/70 font-medium hidden sm:inline">
                  Personal Finance
                </span>
              </div>
            </div>

            {/* Payday Cycle Badge Indicator */}
            <div
              onClick={() => setActiveTab('cycle_settings')}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-purple-50/70 dark:bg-purple-950/40 hover:bg-purple-100/70 dark:hover:bg-purple-900/40 rounded-md text-xs font-medium text-purple-900 dark:text-purple-200 transition-colors cursor-pointer border border-purple-200/80 dark:border-purple-900/50"
            >
              <Icons.Clock className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>{financialCycle.daysRemaining} days left in cycle</span>
            </div>
          </div>

          {/* Header Action Controls */}
          <div className="flex items-center gap-2">
            {/* Approved Themes Selector: Black + Purple & White + Purple */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-purple-50 dark:bg-[#181524] text-purple-800 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-[#201C30] border border-purple-200 dark:border-[#2E2844] transition-colors cursor-pointer"
              title={isDarkMode ? 'Current: Black + Purple theme. Click for White + Purple' : 'Current: White + Purple theme. Click for Black + Purple'}
            >
              {isDarkMode ? (
                <>
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                  <span className="hidden sm:inline">Black + Purple</span>
                  <Icons.Moon className="w-3.5 h-3.5 text-purple-300" />
                </>
              ) : (
                <>
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                  <span className="hidden sm:inline">White + Purple</span>
                  <Icons.Sun className="w-3.5 h-3.5 text-purple-600" />
                </>
              )}
            </button>

            {/* Quick SMS Import shortcut button */}
            <button
              onClick={() => setActiveTab('historical_import')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-900 dark:text-purple-200 bg-purple-50/60 dark:bg-[#181524] hover:bg-purple-100/80 dark:hover:bg-[#201C30] rounded-md border border-purple-200/80 dark:border-[#2E2844] transition-colors cursor-pointer"
            >
              <Icons.MessageSquareText className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              Test SMS
            </button>

            {/* Pending Inbox Badge */}
            <button
              onClick={() => setActiveTab('pending')}
              className="relative p-1.5 rounded-md text-purple-900 dark:text-purple-200 hover:bg-purple-50 dark:hover:bg-[#181524] border border-transparent hover:border-purple-200 dark:hover:border-[#2E2844] transition-colors cursor-pointer"
              title="Pending Review Inbox"
            >
              <Icons.Bell className="w-4 h-4" />
              {pendingCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-purple-600 text-white font-bold text-[9px] rounded-full flex items-center justify-center shadow-xs">
                  {pendingCount}
                </span>
              )}
            </button>

            {/* Quick Add Expense Modal Trigger */}
            <button
              onClick={() => {
                setEditingTransaction(null);
                setIsAddTxOpen(true);
              }}
              className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-3.5 py-1.5 rounded-md text-xs font-medium shadow-xs transition-colors cursor-pointer"
            >
              <Icons.Plus className="w-3.5 h-3.5" />
              <span>Add Transaction</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container Layout (Sidebar on Desktop + Content Area) */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex gap-6">
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden lg:block w-64 shrink-0 space-y-5">
          {/* Navigation links */}
          <div className="bg-white dark:bg-[#13111C] rounded-lg p-3 border border-[#EDE9FE] dark:border-[#272138] shadow-sm space-y-3">
            <div className="text-[10px] font-bold text-purple-400 dark:text-purple-400 uppercase tracking-wider px-2">
              Menu
            </div>
            <nav className="space-y-0.5">
              {navItems.map((item) => {
                const IconComp = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 font-semibold border border-purple-200 dark:border-purple-800/80'
                        : 'text-[#4A4458] dark:text-purple-200/70 hover:bg-purple-50/50 dark:hover:bg-[#181524] hover:text-purple-900 dark:hover:text-white font-medium border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <IconComp className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span
                        className={`px-1.5 py-0.2 text-[10px] font-bold rounded ${
                          isActive
                            ? 'bg-purple-600 text-white'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Quick Payday Cycle Summary Card */}
          <div className="bg-white dark:bg-[#13111C] rounded-lg p-4 border border-[#EDE9FE] dark:border-[#272138] shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-purple-400 dark:text-purple-400 uppercase tracking-wider">
                Current Cycle
              </span>
              <button
                onClick={() => setActiveTab('cycle_settings')}
                className="text-[11px] font-medium text-purple-600 dark:text-purple-400 hover:underline"
              >
                Change
              </button>
            </div>
            <div className="font-semibold text-sm text-[#1E1B2E] dark:text-white">
              {financialCycle.cycleLabel}
            </div>
            <div className="text-xs text-[#6B647B] dark:text-purple-300/70 pt-1 border-t border-purple-50 dark:border-[#221D32] flex items-center justify-between">
              <span>Daily Safe Spend:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {settings.currencySymbol}{financialCycle.dailySafeToSpend.toFixed(2)}
              </span>
            </div>
          </div>
        </aside>

        {/* Dynamic Screen Content */}
        <main className="flex-1 min-w-0">
          {activeTab === 'dashboard' && (
            <DashboardScreen
              financialCycle={financialCycle}
              transactions={transactions}
              categories={categories}
              accounts={accounts}
              currencySymbol={settings.currencySymbol}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onAddExpense={() => {
                setEditingTransaction(null);
                setIsAddTxOpen(true);
              }}
              onApprovePending={handleApproveTransaction}
              onEditTransaction={(tx) => {
                setEditingTransaction(tx);
                setIsAddTxOpen(true);
              }}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionsScreen
              transactions={transactions}
              categories={categories}
              accounts={accounts}
              currencySymbol={settings.currencySymbol}
              onAddTransaction={() => {
                setEditingTransaction(null);
                setIsAddTxOpen(true);
              }}
              onEditTransaction={(tx) => {
                setEditingTransaction(tx);
                setIsAddTxOpen(true);
              }}
              onDeleteTransaction={handleDeleteTransaction}
              onApproveTransaction={handleApproveTransaction}
            />
          )}

          {activeTab === 'budgets' && (
            <BudgetsScreen
              budgets={budgets}
              categories={categories}
              transactions={transactions}
              financialCycle={financialCycle}
              currencySymbol={settings.currencySymbol}
              onSaveBudget={handleSaveBudget}
              onDeleteBudget={handleDeleteBudget}
            />
          )}

          {activeTab === 'pending' && (
            <PendingReviewScreen
              transactions={transactions}
              categories={categories}
              accounts={accounts}
              currencySymbol={settings.currencySymbol}
              onApprove={handleApproveTransaction}
              onApproveAll={handleApproveAllPending}
              onIgnore={handleIgnoreTransaction}
              onEdit={(tx) => {
                setEditingTransaction(tx);
                setIsAddTxOpen(true);
              }}
              onChangeCategory={handleChangeTxCategory}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsScreen
              financialCycle={financialCycle}
              transactions={transactions}
              categories={categories}
              budgets={budgets}
              currencySymbol={settings.currencySymbol}
            />
          )}

          {activeTab === 'accounts' && (
            <AccountsScreen
              accounts={accounts}
              currencySymbol={settings.currencySymbol}
              onSaveAccount={handleSaveAccount}
              onDeleteAccount={handleDeleteAccount}
              onTransfer={handleTransferFunds}
            />
          )}

          {activeTab === 'historical_import' && (
            <HistoricalImportScreen
              categories={categories}
              accounts={accounts}
              merchantRules={merchantRules}
              currencySymbol={settings.currencySymbol}
              onAddTransaction={(tx) => updateTransactions([tx, ...transactions])}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'categories' && (
            <CategoriesScreen
              categories={categories}
              transactions={transactions}
              onSaveCategory={handleSaveCategory}
              onDeleteCategory={handleDeleteCategory}
            />
          )}

          {activeTab === 'cycle_settings' && (
            <FinancialCycleSettingsScreen
              settings={settings}
              financialCycle={financialCycle}
              onSaveSettings={updateSettings}
            />
          )}

          {activeTab === 'settings' && (
            <MoreSettingsScreen
              settings={settings}
              merchantRules={merchantRules}
              categories={categories}
              onSaveSettings={updateSettings}
              onSaveMerchantRules={updateMerchantRules}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onResetData={handleResetData}
            />
          )}

          {activeTab === 'privacy' && (
            <PrivacyPolicyScreen onBack={() => setActiveTab('settings')} />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-[#13111C]/95 backdrop-blur-md border-t border-[#EDE9FE] dark:border-[#272138] px-2 py-1.5 flex items-center justify-around shadow-sm">
        {[
          { id: 'dashboard', label: 'Home', icon: Icons.LayoutDashboard },
          { id: 'transactions', label: 'Ledger', icon: Icons.Receipt },
          { id: 'budgets', label: 'Budgets', icon: Icons.PiggyBank },
          { id: 'pending', label: 'Inbox', icon: Icons.AlertCircle, badge: pendingCount },
          { id: 'accounts', label: 'Accounts', icon: Icons.Landmark },
          { id: 'settings', label: 'More', icon: Icons.Menu },
        ].map((mItem) => {
          const MIcon = mItem.icon;
          const isAct = activeTab === mItem.id;
          return (
            <button
              key={mItem.id}
              onClick={() => setActiveTab(mItem.id)}
              className={`relative flex flex-col items-center py-1 px-2.5 rounded-md transition-colors cursor-pointer ${
                isAct
                  ? 'text-purple-600 dark:text-purple-400 font-semibold'
                  : 'text-[#6B647B] hover:text-purple-900 dark:text-purple-300/70 dark:hover:text-white'
              }`}
            >
              <div className="relative">
                <MIcon className="w-5 h-5" />
                {mItem.badge !== undefined && mItem.badge > 0 && (
                  <span className="absolute -top-1 -right-2 w-3.5 h-3.5 bg-amber-500 text-white font-bold text-[8px] rounded-full flex items-center justify-center">
                    {mItem.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5">{mItem.label}</span>
            </button>
          );
        })}
      </div>

      {/* Add / Edit Transaction Modal */}
      <TransactionDialogs
        isOpen={isAddTxOpen}
        editingTransaction={editingTransaction}
        categories={categories}
        accounts={accounts}
        currencySymbol={settings.currencySymbol}
        onClose={() => {
          setIsAddTxOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveTransaction}
      />
    </div>
  );
}
