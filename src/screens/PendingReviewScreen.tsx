import React from 'react';
import { Transaction, Category, Account } from '../types';
import * as Icons from 'lucide-react';

interface PendingReviewScreenProps {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  currencySymbol: string;
  onApprove: (tx: Transaction) => void;
  onApproveAll: () => void;
  onIgnore: (tx: Transaction) => void;
  onEdit: (tx: Transaction) => void;
  onChangeCategory: (tx: Transaction, newCategoryId: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const PendingReviewScreen: React.FC<PendingReviewScreenProps> = ({
  transactions,
  categories,
  accounts,
  currencySymbol,
  onApprove,
  onApproveAll,
  onIgnore,
  onEdit,
  onChangeCategory,
  onNavigateTab,
}) => {
  const pendingTransactions = transactions.filter(t => t.reviewStatus === 'PENDING_REVIEW');
  const categoryMap = new Map<string, Category>(categories.map(c => [c.id, c]));
  const accountMap = new Map<string, Account>(accounts.map(a => [a.id, a]));

  const highConfidenceCount = pendingTransactions.filter(t => (t.confidenceScore || 0) >= 0.85).length;

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#1E293B] dark:text-white tracking-tight">
              Pending Review
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              {pendingTransactions.length} Pending
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Incoming bank alerts parsed by Spendora’s on-device SMS engine.
          </p>
        </div>

        {pendingTransactions.length > 0 && (
          <div className="flex items-center gap-2">
            {highConfidenceCount > 0 && (
              <button
                onClick={onApproveAll}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-medium shadow-xs transition-colors cursor-pointer"
              >
                <Icons.CheckCheck className="w-3.5 h-3.5" />
                Approve All High Confidence ({highConfidenceCount})
              </button>
            )}
          </div>
        )}
      </div>

      {/* Empty Inbox State */}
      {pendingTransactions.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-lg p-10 text-center border border-[#E2E8F0] dark:border-slate-800 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-2xs">
            <Icons.CheckCheck className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-semibold text-[#1E293B] dark:text-white">
              Inbox is All Clear
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              All SMS and imported transactions have been reviewed and accounted for in your financial cycle.
            </p>
          </div>
          <div className="pt-2 flex flex-wrap justify-center gap-2.5">
            <button
              onClick={() => onNavigateTab('sms_import')}
              className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 dark:bg-[#181524] dark:hover:bg-[#272138] text-[#4A4458] dark:text-purple-200 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer border border-purple-200 dark:border-[#2E2844]"
            >
              <Icons.Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              Simulate Bank SMS
            </button>
            <button
              onClick={() => onNavigateTab('dashboard')}
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-xs font-medium shadow-xs transition-colors cursor-pointer"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3.5">
          {pendingTransactions.map((tx) => {
            const category = categoryMap.get(tx.categoryId);
            const account = accountMap.get(tx.accountId);
            const confidence = tx.confidenceScore || 0.8;
            const confidencePercent = Math.round(confidence * 100);

            const isHighConfidence = confidence >= 0.85;

            return (
              <div
                key={tx.id}
                className="bg-white dark:bg-[#13111C] rounded-lg p-4 border border-[#EDE9FE] dark:border-[#272138] shadow-xs space-y-3 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left: Merchant and Date */}
                  <div className="flex items-start gap-3">
                    <div
                      className="w-9 h-9 rounded flex items-center justify-center shrink-0 shadow-xs"
                      style={{
                        backgroundColor: `${category?.color || '#9333ea'}20`,
                        color: category?.color || '#9333ea',
                      }}
                    >
                      <Icons.AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-[#1E1B2E] dark:text-white">
                          {tx.merchant}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-medium ${
                            isHighConfidence
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                              : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                          }`}
                        >
                          {confidencePercent}% AI Match
                        </span>
                      </div>
                      <div className="text-xs text-[#6B647B] dark:text-purple-300/70 mt-0.5 flex items-center gap-2">
                        <span>{account?.name || 'Main Account'}</span>
                        <span>•</span>
                        <span>{new Date(tx.timestamp).toLocaleString()}</span>
                        {tx.referenceNumber && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-[10px]">Ref: {tx.referenceNumber}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount */}
                  <div className="text-left sm:text-right">
                    <div className="text-lg font-bold text-[#1E1B2E] dark:text-white">
                      -{currencySymbol}{tx.amount.toFixed(2)}
                    </div>
                    <span className="text-[11px] text-[#7A7489] dark:text-purple-400">Expense</span>
                  </div>
                </div>

                {/* Original SMS Snippet */}
                {tx.rawSmsBody && (
                  <div className="p-2.5 bg-[#FAF8FD] dark:bg-[#181524] rounded-md border border-[#EDE9FE] dark:border-[#272138] text-xs">
                    <div className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Icons.MessageSquare className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                      Original SMS Message
                    </div>
                    <p className="font-mono text-[11px] text-[#4A4458] dark:text-purple-200">
                      "{tx.rawSmsBody}"
                    </p>
                  </div>
                )}

                {/* Quick Category Confirmation Select & Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#E2E8F0] dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400 shrink-0">
                      Category:
                    </label>
                    <select
                      value={tx.categoryId}
                      onChange={(e) => onChangeCategory(tx, e.target.value)}
                      className="px-2.5 py-1 bg-[#F8FAFC] dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-md text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-hidden"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name} ({cat.type})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onIgnore(tx)}
                      className="px-2.5 py-1 rounded-md text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-[#F1F5F9] dark:hover:bg-slate-800 text-xs font-medium transition-colors cursor-pointer"
                    >
                      Ignore
                    </button>
                    <button
                      onClick={() => onEdit(tx)}
                      className="px-2.5 py-1 rounded-md border border-[#E2E8F0] dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-[#F1F5F9] dark:hover:bg-slate-800 text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Icons.Edit2 className="w-3 h-3" />
                      Edit Details
                    </button>
                    <button
                      onClick={() => onApprove(tx)}
                      className="px-3.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Icons.Check className="w-3.5 h-3.5" />
                      Confirm
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
