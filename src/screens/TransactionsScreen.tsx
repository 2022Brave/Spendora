import React, { useState, useMemo } from 'react';
import { Transaction, Category, Account, TransactionType, ReviewStatus } from '../types';
import { TransactionRowItem } from '../components/TransactionRowItem';
import * as Icons from 'lucide-react';

interface TransactionsScreenProps {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  currencySymbol: string;
  onOpenNewTransaction: () => void;
  onSelectTransaction: (tx: Transaction) => void;
  onApproveTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}

export const TransactionsScreen: React.FC<TransactionsScreenProps> = ({
  transactions,
  categories,
  accounts,
  currencySymbol,
  onOpenNewTransaction,
  onSelectTransaction,
  onApproveTransaction,
  onDeleteTransaction,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'DATE_DESC' | 'DATE_ASC' | 'AMOUNT_DESC' | 'AMOUNT_ASC'>('DATE_DESC');

  const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);
  const accountMap = useMemo(() => new Map(accounts.map(a => [a.id, a])), [accounts]);

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(tx => {
        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const merchantMatch = tx.merchant.toLowerCase().includes(q);
          const noteMatch = tx.note?.toLowerCase().includes(q);
          const refMatch = tx.referenceNumber?.toLowerCase().includes(q);
          const catName = categoryMap.get(tx.categoryId)?.name.toLowerCase().includes(q);
          if (!merchantMatch && !noteMatch && !refMatch && !catName) return false;
        }

        // Type filter
        if (selectedType !== 'ALL' && tx.type !== selectedType) {
          return false;
        }

        // Status filter
        if (selectedStatus !== 'ALL' && tx.reviewStatus !== selectedStatus) {
          return false;
        }

        // Category filter
        if (selectedCategoryId !== 'ALL' && tx.categoryId !== selectedCategoryId) {
          return false;
        }

        // Account filter
        if (selectedAccountId !== 'ALL' && tx.accountId !== selectedAccountId) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'DATE_DESC') return b.timestamp - a.timestamp;
        if (sortBy === 'DATE_ASC') return a.timestamp - b.timestamp;
        if (sortBy === 'AMOUNT_DESC') return b.amount - a.amount;
        if (sortBy === 'AMOUNT_ASC') return a.amount - b.amount;
        return 0;
      });
  }, [transactions, searchQuery, selectedType, selectedStatus, selectedCategoryId, selectedAccountId, sortBy, categoryMap]);

  // Group by date
  const groupedTransactions = useMemo(() => {
    const groups: { [dateStr: string]: Transaction[] } = {};
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();

    for (const tx of filteredTransactions) {
      const txDate = new Date(tx.timestamp).toDateString();
      let label = new Date(tx.timestamp).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
      if (txDate === today) label = 'Today';
      else if (txDate === yesterday) label = 'Yesterday';

      if (!groups[label]) groups[label] = [];
      groups[label].push(tx);
    }

    return groups;
  }, [filteredTransactions]);

  const totalFilteredSum = filteredTransactions.reduce((acc, t) => {
    return t.type === 'DEBIT' ? acc - t.amount : t.type === 'CREDIT' ? acc + t.amount : acc;
  }, 0);

  return (
    <div className="space-y-5 pb-16">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#1E293B] dark:text-white tracking-tight">
            Transactions
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {filteredTransactions.length} transaction{filteredTransactions.length === 1 ? '' : 's'} matching filters (Net: {totalFilteredSum >= 0 ? '+' : ''}{currencySymbol}{totalFilteredSum.toFixed(2)})
          </p>
        </div>

        <button
          onClick={onOpenNewTransaction}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md font-medium text-xs shadow-xs transition-colors shrink-0 cursor-pointer"
        >
          <Icons.Plus className="w-3.5 h-3.5" />
          Add Transaction
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-[#13111C] rounded-lg p-3.5 border border-[#EDE9FE] dark:border-[#272138] shadow-sm space-y-3">
        {/* Search input */}
        <div className="relative">
          <Icons.Search className="w-3.5 h-3.5 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by merchant, note, category or reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-8 py-1.5 bg-[#FAF8FD] dark:bg-[#181524] border border-[#EDE9FE] dark:border-[#2E2844] rounded-md text-[#1E1B2E] dark:text-white text-xs focus:outline-hidden focus:ring-1 focus:ring-purple-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-700 p-1 cursor-pointer"
            >
              <Icons.X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Filter row: Type pills & Dropdowns */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-0.5">
          {/* Type Switcher */}
          <div className="flex items-center gap-1 p-0.5 bg-purple-50/70 dark:bg-[#181524] rounded-md text-xs font-medium border border-purple-100 dark:border-[#272138]">
            {['ALL', 'DEBIT', 'CREDIT', 'TRANSFER'].map((t) => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  selectedType === t
                    ? 'bg-white dark:bg-[#13111C] text-purple-700 dark:text-purple-300 font-semibold shadow-2xs'
                    : 'text-[#6B647B] hover:text-purple-900 dark:hover:text-white'
                }`}
              >
                {t === 'ALL' ? 'All' : t === 'DEBIT' ? 'Expenses' : t === 'CREDIT' ? 'Income' : 'Transfers'}
              </button>
            ))}
          </div>

          {/* Secondary Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Status */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 bg-[#FAF8FD] dark:bg-[#181524] border border-[#EDE9FE] dark:border-[#2E2844] rounded-md text-[#4A4458] dark:text-purple-200 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PENDING_REVIEW">Pending Review</option>
            </select>

            {/* Category */}
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="px-2.5 py-1.5 bg-[#F8FAFC] dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-md text-slate-700 dark:text-slate-200 focus:outline-hidden max-w-[140px] truncate"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Account */}
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="px-2.5 py-1.5 bg-[#F8FAFC] dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-md text-slate-700 dark:text-slate-200 focus:outline-hidden max-w-[140px] truncate"
            >
              <option value="ALL">All Accounts</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 bg-[#F8FAFC] dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-md text-slate-700 dark:text-slate-200 focus:outline-hidden font-medium"
            >
              <option value="DATE_DESC">Newest First</option>
              <option value="DATE_ASC">Oldest First</option>
              <option value="AMOUNT_DESC">Highest Amount</option>
              <option value="AMOUNT_ASC">Lowest Amount</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Grouped List */}
      <div className="space-y-5">
        {Object.keys(groupedTransactions).length === 0 ? (
          <div className="bg-white dark:bg-[#13111C] rounded-lg p-10 text-center border border-[#EDE9FE] dark:border-[#272138] shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center mx-auto text-purple-600 dark:text-purple-400 mb-2">
              <Icons.Inbox className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-xs text-[#1E1B2E] dark:text-white">
              {transactions.length === 0 ? 'No Transactions Recorded' : 'No transactions match your search'}
            </h3>
            <p className="text-xs text-[#7A7489] dark:text-purple-300/70 max-w-sm mx-auto">
              {transactions.length === 0
                ? 'Your ledger is ready. Incoming bank SMS alerts or manual entries will appear here.'
                : 'Try adjusting the filter keywords, category selector, or add a new transaction.'}
            </p>
          </div>
        ) : (
          (Object.entries(groupedTransactions) as [string, Transaction[]][]).map(([dateLabel, txList]) => (
            <div key={dateLabel} className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {dateLabel}
                </span>
                <span className="text-[11px] text-slate-400">
                  {txList.length} transaction{txList.length === 1 ? '' : 's'}
                </span>
              </div>

              <div className="space-y-1.5">
                {txList.map((tx) => (
                  <TransactionRowItem
                    key={tx.id}
                    transaction={tx}
                    category={categoryMap.get(tx.categoryId)}
                    account={accountMap.get(tx.accountId)}
                    currencySymbol={currencySymbol}
                    onClick={onSelectTransaction}
                    onApprove={onApproveTransaction}
                    onDelete={() => onDeleteTransaction(tx.id)}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
