import React, { useState, useEffect } from 'react';
import { Transaction, Category, Account, TransactionType, TransactionSource, ReviewStatus } from '../types';
import * as Icons from 'lucide-react';

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tx: any) => void;
  onDelete?: (id: string) => void;
  transaction?: Transaction | null;
  editingTransaction?: Transaction | null;
  categories: Category[];
  accounts: Account[];
  currencySymbol: string;
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  transaction: propTransaction,
  editingTransaction,
  categories,
  accounts,
  currencySymbol,
}) => {
  const transaction = editingTransaction !== undefined ? editingTransaction : propTransaction;
  const [amount, setAmount] = useState<string>('');
  const [type, setType] = useState<TransactionType>('DEBIT');
  const [merchant, setMerchant] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [accountId, setAccountId] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [locationName, setLocationName] = useState<string>('');
  const [isLocating, setIsLocating] = useState<boolean>(false);

  useEffect(() => {
    if (transaction) {
      setAmount(transaction.amount.toString());
      setType(transaction.type);
      setMerchant(transaction.merchant);
      setCategoryId(transaction.categoryId);
      setAccountId(transaction.accountId);
      setDateStr(new Date(transaction.timestamp).toISOString().substring(0, 16));
      setNote(transaction.note || '');
      setLocationName(transaction.location?.placeName || '');
    } else {
      setAmount('');
      setType('DEBIT');
      setMerchant('');
      setCategoryId(categories.find(c => c.type === 'EXPENSE')?.id || categories[0]?.id || '');
      setAccountId(accounts[0]?.id || '');
      setDateStr(new Date().toISOString().substring(0, 16));
      setNote('');
      setLocationName('');
    }
  }, [transaction, isOpen, categories, accounts]);

  if (!isOpen) return null;

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationName('Downtown Commercial District');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        setLocationName(`Lat: ${pos.coords.latitude.toFixed(3)}, Lng: ${pos.coords.longitude.toFixed(3)}`);
      },
      () => {
        setIsLocating(false);
        setLocationName('Market Street Plaza, CA');
      },
      { timeout: 4000 }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    const timestamp = dateStr ? new Date(dateStr).getTime() : Date.now();

    const updatedTx: Transaction = {
      id: transaction?.id || `tx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      amount: numAmount,
      type,
      merchant: merchant.trim() || (type === 'TRANSFER' ? 'Transfer' : 'Unspecified Payee'),
      categoryId: categoryId || categories[0]?.id || '',
      accountId: accountId || accounts[0]?.id || '',
      timestamp,
      note: note.trim() || undefined,
      source: transaction?.source || ('MANUAL' as TransactionSource),
      reviewStatus: transaction?.reviewStatus || ('CONFIRMED' as ReviewStatus),
      referenceNumber: transaction?.referenceNumber,
      smsAuditId: transaction?.smsAuditId,
      confidenceScore: transaction?.confidenceScore || 1.0,
      rawSmsBody: transaction?.rawSmsBody,
      location: locationName ? {
        latitude: 37.7749,
        longitude: -122.4194,
        placeName: locationName,
      } : transaction?.location,
    };

    onSave(updatedTx);
    onClose();
  };

  const filteredCategories = categories.filter(c => {
    if (type === 'TRANSFER') return c.type === 'TRANSFER';
    return c.type === (type === 'CREDIT' ? 'INCOME' : 'EXPENSE');
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#13111C] rounded-lg max-w-lg w-full p-5 shadow-xl border border-[#EDE9FE] dark:border-[#272138] animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-[#EDE9FE] dark:border-[#272138]">
          <h2 className="text-sm font-bold text-[#1E1B2E] dark:text-white flex items-center gap-2">
            <Icons.Receipt className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            {transaction ? 'Edit Transaction' : 'New Transaction'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded text-purple-400 hover:text-purple-700 dark:hover:text-purple-200 hover:bg-purple-50 dark:hover:bg-[#181524] cursor-pointer"
          >
            <Icons.X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-3.5 space-y-3.5">
          {/* Type Switcher */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-purple-50/60 dark:bg-[#181524] rounded-md border border-purple-100 dark:border-[#272138]">
            {(['DEBIT', 'CREDIT', 'TRANSFER'] as TransactionType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setType(t);
                  const matching = categories.find(c => c.type === (t === 'CREDIT' ? 'INCOME' : t === 'TRANSFER' ? 'TRANSFER' : 'EXPENSE'));
                  if (matching) setCategoryId(matching.id);
                }}
                className={`py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
                  type === t
                    ? t === 'DEBIT'
                      ? 'bg-white dark:bg-[#13111C] text-rose-600 dark:text-rose-400 shadow-xs'
                      : t === 'CREDIT'
                      ? 'bg-white dark:bg-[#13111C] text-emerald-600 dark:text-emerald-400 shadow-xs'
                      : 'bg-white dark:bg-[#13111C] text-purple-600 dark:text-purple-400 shadow-xs'
                    : 'text-[#6B647B] hover:text-purple-900 dark:text-purple-300/70 dark:hover:text-white'
                }`}
              >
                {t === 'DEBIT' ? 'Expense (-)' : t === 'CREDIT' ? 'Income (+)' : 'Transfer'}
              </button>
            ))}
          </div>

          {/* Amount and Merchant */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#4A4458] dark:text-purple-200/80 mb-1">
                Amount ({currencySymbol})
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400 font-bold text-xs">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-7 pr-3 py-1.5 bg-[#FAF8FD] dark:bg-[#181524] border border-[#EDE9FE] dark:border-[#2E2844] rounded-md text-[#1E1B2E] dark:text-white font-bold text-base focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#4A4458] dark:text-purple-200/80 mb-1">
                Merchant / Payee
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Whole Foods, Uber, Employer"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#FAF8FD] dark:bg-[#181524] border border-[#EDE9FE] dark:border-[#2E2844] rounded-md text-[#1E1B2E] dark:text-white text-xs focus:outline-hidden focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Category & Account */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#4A4458] dark:text-purple-200/80 mb-1">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#FAF8FD] dark:bg-[#181524] border border-[#EDE9FE] dark:border-[#2E2844] rounded-md text-[#1E1B2E] dark:text-white text-xs focus:outline-hidden focus:ring-1 focus:ring-purple-500"
              >
                {filteredCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#4A4458] dark:text-purple-200/80 mb-1">
                Account
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#FAF8FD] dark:bg-[#181524] border border-[#EDE9FE] dark:border-[#2E2844] rounded-md text-[#1E1B2E] dark:text-white text-xs focus:outline-hidden focus:ring-1 focus:ring-purple-500"
              >
                {accounts.length === 0 ? (
                  <option value="">No accounts added yet</option>
                ) : (
                  accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.accountNumber})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Date & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#4A4458] dark:text-purple-200/80 mb-1">
                Date & Time
              </label>
              <input
                type="datetime-local"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#FAF8FD] dark:bg-[#181524] border border-[#EDE9FE] dark:border-[#2E2844] rounded-md text-[#1E1B2E] dark:text-white text-xs focus:outline-hidden focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#4A4458] dark:text-purple-200/80 mb-1">
                Location (GPS / Place)
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="Optional place tag"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-[#FAF8FD] dark:bg-[#181524] border border-[#EDE9FE] dark:border-[#2E2844] rounded-md text-[#1E1B2E] dark:text-white text-xs focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                />
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={isLocating}
                  className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 dark:bg-[#181524] dark:hover:bg-[#201C30] rounded-md text-purple-700 dark:text-purple-300 text-xs flex items-center gap-1 shrink-0 cursor-pointer border border-purple-200 dark:border-[#2E2844]"
                  title="Detect Current Location"
                >
                  <Icons.MapPin className={`w-3.5 h-3.5 ${isLocating ? 'animate-bounce text-purple-600' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-[#4A4458] dark:text-purple-200/80 mb-1">
              Notes & Tags
            </label>
            <input
              type="text"
              placeholder="e.g. Business dinner with team, reimbursed later"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-1.5 bg-[#FAF8FD] dark:bg-[#181524] border border-[#EDE9FE] dark:border-[#2E2844] rounded-md text-[#1E1B2E] dark:text-white text-xs focus:outline-hidden focus:ring-1 focus:ring-purple-500"
            />
          </div>

          {/* Raw SMS Provenance info if originated from SMS */}
          {transaction?.rawSmsBody && (
            <div className="p-2.5 rounded-md bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 text-[11px] text-[#4A4458] dark:text-purple-200">
              <div className="flex items-center gap-1.5 font-semibold text-purple-700 dark:text-purple-300 mb-1">
                <Icons.Sparkles className="w-3 h-3" />
                Parsed from SMS (Confidence: {((transaction.confidenceScore || 0) * 100).toFixed(0)}%)
              </div>
              <p className="italic font-mono text-[10px] text-[#6B647B] dark:text-purple-300/80 bg-white dark:bg-[#13111C] p-1.5 rounded border border-[#EDE9FE] dark:border-[#272138]">
                "{transaction.rawSmsBody}"
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-[#EDE9FE] dark:border-[#272138]">
            {transaction && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Delete this transaction?')) {
                    onDelete(transaction.id);
                    onClose();
                  }
                }}
                className="px-3 py-1.5 rounded-md text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-medium flex items-center gap-1 cursor-pointer"
              >
                <Icons.Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-md border border-purple-200 dark:border-[#2E2844] text-[#4A4458] dark:text-purple-200 hover:bg-purple-50 dark:hover:bg-[#181524] text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-md bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium shadow-xs transition-colors cursor-pointer"
              >
                {transaction ? 'Update Transaction' : 'Save Transaction'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export const TransactionDialogs = EditTransactionModal;
