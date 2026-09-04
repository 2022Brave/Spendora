import React from 'react';
import { Transaction, Category, Account } from '../types';
import * as Icons from 'lucide-react';

interface TransactionRowItemProps {
  transaction: Transaction;
  category?: Category;
  account?: Account;
  currencySymbol: string;
  onClick?: (tx: Transaction) => void;
  onApprove?: (tx: Transaction) => void;
  onDelete?: (tx: Transaction) => void;
  compact?: boolean;
}

export const TransactionRowItem: React.FC<TransactionRowItemProps> = ({
  transaction,
  category,
  account,
  currencySymbol,
  onClick,
  onApprove,
  onDelete,
  compact = false,
}) => {
  // Dynamically get Lucide icon or fallback
  const iconName = (category?.icon || 'DollarSign') as keyof typeof Icons;
  const IconComponent = (Icons[iconName] as React.ElementType) || Icons.DollarSign;

  const isDebit = transaction.type === 'DEBIT';
  const isCredit = transaction.type === 'CREDIT';
  const isTransfer = transaction.type === 'TRANSFER';
  const isPending = transaction.reviewStatus === 'PENDING_REVIEW';

  const dateFormatted = new Date(transaction.timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const timeFormatted = new Date(transaction.timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      onClick={() => onClick && onClick(transaction)}
      className={`group relative flex items-center justify-between p-3 rounded-md transition-colors border ${
        isPending
          ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 hover:bg-amber-50 dark:hover:bg-amber-950/30'
          : 'bg-white dark:bg-[#13111C] border-[#EDE9FE] dark:border-[#272138] hover:border-purple-300 dark:hover:border-purple-800 hover:bg-purple-50/30 dark:hover:bg-[#181524] shadow-xs'
      } cursor-pointer`}
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Category Icon Badge */}
        <div
          className="w-8 h-8 rounded flex items-center justify-center shrink-0 shadow-xs"
          style={{
            backgroundColor: `${category?.color || '#9333ea'}18`,
            color: category?.color || '#9333ea',
          }}
        >
          <IconComponent className="w-4 h-4" />
        </div>

        {/* Merchant & Details */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-xs text-[#1E1B2E] dark:text-white truncate">
              {transaction.merchant}
            </span>
            {isPending && (
              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-medium bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                Review Needed
              </span>
            )}
            {transaction.source === 'SMS' && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-medium text-purple-400 dark:text-purple-400">
                <Icons.MessageSquare className="w-2.5 h-2.5 text-purple-500" />
                SMS
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-[#6B647B] dark:text-purple-300/70">
            <span>{category?.name || 'Uncategorized'}</span>
            <span>•</span>
            <span className="truncate max-w-[110px] sm:max-w-[150px]">
              {account?.name || 'Main Account'} {account?.accountNumber ? `(${account.accountNumber})` : ''}
            </span>
            {!compact && (
              <>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:inline">{dateFormatted}, {timeFormatted}</span>
              </>
            )}
            {transaction.location && (
              <span className="hidden md:inline-flex items-center gap-0.5 text-purple-400 dark:text-purple-400" title={transaction.location.placeName}>
                <Icons.MapPin className="w-3 h-3 text-purple-500" />
                {transaction.location.city || 'Tagged'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Amount and Actions */}
      <div className="flex items-center gap-2.5 shrink-0 ml-3">
        <div className="text-right">
          <div
            className={`font-semibold text-xs sm:text-sm ${
              isDebit
                ? 'text-[#1E1B2E] dark:text-white'
                : isCredit
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-purple-600 dark:text-purple-400'
            }`}
          >
            {isDebit ? '-' : isCredit ? '+' : ''}
            {currencySymbol}
            {transaction.amount.toFixed(2)}
          </div>
          {compact && (
            <div className="text-[10px] text-slate-400 dark:text-slate-500">
              {dateFormatted}
            </div>
          )}
        </div>

        {/* Quick Pending Approve Button */}
        {isPending && onApprove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onApprove(transaction);
            }}
            className="p-1 rounded bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 transition-colors border border-emerald-200 dark:border-emerald-800 cursor-pointer"
            title="Approve Transaction"
          >
            <Icons.Check className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Delete button (visible on hover) */}
        {onDelete && !isPending && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(transaction);
            }}
            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500 transition-opacity cursor-pointer"
            title="Delete Transaction"
          >
            <Icons.Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
