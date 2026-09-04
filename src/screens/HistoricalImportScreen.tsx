import React, { useState } from 'react';
import { SmsEngine, SAMPLE_SMS_DATASET } from '../data/sms/SmsEngine';
import { Transaction, Category, Account, MerchantRule, SmsAudit } from '../types';
import * as Icons from 'lucide-react';

interface HistoricalImportScreenProps {
  categories: Category[];
  accounts: Account[];
  merchantRules: MerchantRule[];
  currencySymbol: string;
  onAddTransaction: (tx: Transaction) => void;
  onLogSmsAudit?: (audit: SmsAudit) => void;
  onNavigateTab: (tab: string) => void;
}

export const HistoricalImportScreen: React.FC<HistoricalImportScreenProps> = ({
  categories,
  accounts,
  merchantRules,
  currencySymbol,
  onAddTransaction,
  onLogSmsAudit,
  onNavigateTab,
}) => {
  const [smsInput, setSmsInput] = useState(SAMPLE_SMS_DATASET[0].body);
  const [senderInput, setSenderInput] = useState(SAMPLE_SMS_DATASET[0].sender);
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);

  // Batch import progress state
  const [isBatchImporting, setIsBatchImporting] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ total: number; processed: number; parsed: number } | null>(null);

  // Parse current SMS live
  const parseResult = SmsEngine.parseSms(smsInput, senderInput, merchantRules);

  const handleSelectPreset = (index: number) => {
    setSelectedPresetIndex(index);
    setSmsInput(SAMPLE_SMS_DATASET[index].body);
    setSenderInput(SAMPLE_SMS_DATASET[index].sender);
  };

  const handleImportCurrent = (autoConfirm: boolean) => {
    if (!parseResult.isEligible || !parseResult.amount) {
      alert('This SMS was not identified as an eligible financial debit or credit.');
      return;
    }

    // Match or fallback to category
    let matchedCat = categories.find(c =>
      c.type === (parseResult.transactionType === 'CREDIT' ? 'INCOME' : 'EXPENSE') &&
      c.name.toLowerCase().includes(parseResult.merchant?.toLowerCase() || '')
    );
    if (!matchedCat) {
      matchedCat = categories.find(c => c.type === (parseResult.transactionType === 'CREDIT' ? 'INCOME' : 'EXPENSE')) || categories[0];
    }

    // Match or fallback to account
    const matchedAccount = accounts.find(a =>
      parseResult.accountDigits && a.accountNumber.includes(parseResult.accountDigits.replace(/[^0-9]/g, ''))
    ) || accounts[0];

    const newTx: Transaction = {
      id: `tx_sms_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      amount: parseResult.amount,
      type: parseResult.transactionType || 'DEBIT',
      merchant: parseResult.merchant || 'SMS Payee',
      categoryId: matchedCat?.id || categories[0]?.id || 'cat_groceries',
      accountId: matchedAccount?.id || accounts[0]?.id || '',
      timestamp: Date.now(),
      note: `Parsed from SMS sender: ${senderInput}`,
      source: 'SMS',
      reviewStatus: autoConfirm ? 'CONFIRMED' : 'PENDING_REVIEW',
      referenceNumber: parseResult.referenceNumber,
      confidenceScore: parseResult.confidenceScore,
      rawSmsBody: smsInput,
    };

    onAddTransaction(newTx);

    if (onLogSmsAudit) {
      const audit: SmsAudit = {
        id: `audit_${Date.now()}`,
        rawBody: smsInput,
        sender: senderInput,
        timestamp: Date.now(),
        parseStatus: 'PARSED',
        extractedAmount: parseResult.amount,
        extractedMerchant: parseResult.merchant,
        extractedAccount: parseResult.accountDigits,
        extractedDate: parseResult.dateStr,
        extractedType: parseResult.transactionType,
        confidenceScore: parseResult.confidenceScore,
        transactionId: newTx.id,
      };
      onLogSmsAudit(audit);
    }

    if (autoConfirm) {
      alert(`Success! Confirmed ${currencySymbol}${parseResult.amount.toFixed(2)} at ${parseResult.merchant} into transactions.`);
    } else {
      alert(`Imported to Pending Review queue with ${Math.round(parseResult.confidenceScore * 100)}% confidence.`);
      onNavigateTab('pending');
    }
  };

  const handleStartBatchScan = () => {
    setIsBatchImporting(true);
    const total = SAMPLE_SMS_DATASET.length;
    let processed = 0;
    let parsedCount = 0;

    setBatchProgress({ total, processed: 0, parsed: 0 });

    const interval = setInterval(() => {
      if (processed < total) {
        const item = SAMPLE_SMS_DATASET[processed];
        const res = SmsEngine.parseSms(item.body, item.sender, merchantRules);
        if (res.isEligible && res.amount) {
          parsedCount++;
          // Add to pending review
          const matchedCat = categories.find(c => c.type === (res.transactionType === 'CREDIT' ? 'INCOME' : 'EXPENSE')) || categories[0];
          const matchedAcc = accounts.find(a => res.accountDigits && a.accountNumber.includes(res.accountDigits.replace(/[^0-9]/g, ''))) || accounts[0];

          const tx: Transaction = {
            id: `tx_batch_${Date.now()}_${processed}`,
            amount: res.amount,
            type: res.transactionType || 'DEBIT',
            merchant: res.merchant || 'SMS Payee',
            categoryId: matchedCat?.id || categories[0]?.id || 'cat_groceries',
            accountId: matchedAcc?.id || accounts[0]?.id || '',
            timestamp: Date.now() - (processed * 3600 * 1000),
            source: 'IMPORT',
            reviewStatus: res.confidenceScore >= 0.9 ? 'CONFIRMED' : 'PENDING_REVIEW',
            referenceNumber: res.referenceNumber,
            confidenceScore: res.confidenceScore,
            rawSmsBody: item.body,
          };
          onAddTransaction(tx);
        }
        processed++;
        setBatchProgress({ total, processed, parsed: parsedCount });
      } else {
        clearInterval(interval);
        setIsBatchImporting(false);
      }
    }, 250);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-[#1E1B2E] dark:text-white tracking-tight">
              SMS Engine & Intelligence
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              100% On-Device
            </span>
          </div>
          <p className="text-xs text-[#7A7489] dark:text-purple-300/70 mt-0.5">
            Test and simulate Spendora’s regex and heuristic bank SMS parser.
          </p>
        </div>

        <button
          onClick={handleStartBatchScan}
          disabled={isBatchImporting}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50 shrink-0"
        >
          <Icons.Inbox className={`w-4 h-4 ${isBatchImporting ? 'animate-spin' : ''}`} />
          {isBatchImporting ? 'Scanning SMS Inbox...' : 'Simulate Historical Inbox Scan'}
        </button>
      </div>

      {/* Batch Import Progress Box */}
      {batchProgress && (
        <div className="p-4 bg-white dark:bg-[#13111C] rounded-2xl border border-[#EDE9FE] dark:border-[#272138] shadow-2xs space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#1E1B2E] dark:text-purple-200 flex items-center gap-2">
              <Icons.RefreshCw className={`w-3.5 h-3.5 ${isBatchImporting ? 'animate-spin text-purple-500' : 'text-emerald-500'}`} />
              {isBatchImporting ? 'Scanning Sample Bank Alerts...' : 'Batch Import Complete!'}
            </span>
            <span className="text-[#7A7489] dark:text-purple-300/70">
              {batchProgress.processed} / {batchProgress.total} messages ({batchProgress.parsed} parsed)
            </span>
          </div>
          <div className="w-full h-2 bg-purple-50 dark:bg-[#181524] rounded-full overflow-hidden border border-purple-100 dark:border-[#272138]">
            <div
              className="h-full bg-purple-600 transition-all duration-200 rounded-full"
              style={{ width: `${(batchProgress.processed / batchProgress.total) * 100}%` }}
            />
          </div>
          {!isBatchImporting && (
            <div className="pt-2 flex items-center justify-between">
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                Imported {batchProgress.parsed} financial transactions to Spendora!
              </span>
              <button
                onClick={() => onNavigateTab('pending')}
                className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                Go to Pending Review
                <Icons.ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Parser Test Bench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input & Presets */}
        <div className="lg:col-span-6 bg-white dark:bg-[#13111C] rounded-3xl p-5 border border-[#EDE9FE] dark:border-[#272138] shadow-xs space-y-4">
          <h2 className="font-bold text-base text-[#1E1B2E] dark:text-white flex items-center gap-2">
            <Icons.Terminal className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            SMS Test Bench
          </h2>

          {/* Sample Bank Buttons */}
          <div>
            <label className="block text-xs font-semibold text-[#6B647B] dark:text-purple-300 mb-1.5">
              Load Bank Alert Presets:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_SMS_DATASET.map((sample, idx) => (
                <button
                  key={sample.bank}
                  type="button"
                  onClick={() => handleSelectPreset(idx)}
                  className={`px-2.5 py-1 text-xs rounded-lg transition-all cursor-pointer ${
                    selectedPresetIndex === idx
                      ? 'bg-purple-600 text-white font-bold shadow-2xs'
                      : 'bg-purple-50/70 dark:bg-[#181524] text-[#4A4458] dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-[#272138]'
                  }`}
                >
                  {sample.bank}
                </button>
              ))}
            </div>
          </div>

          {/* Sender Header Input */}
          <div>
            <label className="block text-xs font-semibold text-[#4A4458] dark:text-purple-300 mb-1">
              Sender Header / ID
            </label>
            <input
              type="text"
              value={senderInput}
              onChange={(e) => setSenderInput(e.target.value)}
              className="w-full px-3 py-2 bg-[#FAF8FD] dark:bg-[#181524] border border-[#EDE9FE] dark:border-[#2E2844] rounded-xl text-xs font-mono text-[#1E1B2E] dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* SMS Body Textarea */}
          <div>
            <label className="block text-xs font-semibold text-[#4A4458] dark:text-purple-300 mb-1">
              Raw SMS Message Content
            </label>
            <textarea
              rows={4}
              value={smsInput}
              onChange={(e) => setSmsInput(e.target.value)}
              placeholder="Paste any bank transaction or OTP alert here..."
              className="w-full p-3 bg-[#FAF8FD] dark:bg-[#181524] border border-[#EDE9FE] dark:border-[#2E2844] rounded-xl text-xs font-mono text-[#1E1B2E] dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-purple-100 dark:border-[#272138]">
            <button
              onClick={() => handleImportCurrent(false)}
              disabled={!parseResult.isEligible || !parseResult.amount}
              className="px-4 py-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 rounded-xl text-xs font-bold transition-all border border-amber-200 dark:border-amber-800 disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
            >
              <Icons.Inbox className="w-3.5 h-3.5" />
              Send to Pending Review
            </button>
            <button
              onClick={() => handleImportCurrent(true)}
              disabled={!parseResult.isEligible || !parseResult.amount}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
            >
              <Icons.Check className="w-3.5 h-3.5" />
              Direct Confirm
            </button>
          </div>
        </div>

        {/* Right: Live Parser Extraction Results */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Icons.Cpu className="w-4 h-4 text-purple-500" />
              Extraction Pipeline
            </h2>
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  parseResult.isEligible
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                    : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                }`}
              >
                {parseResult.isEligible ? 'Eligible Transaction' : 'Filtered / Ineligible'}
              </span>
            </div>
          </div>

          {/* Extracted Fields Table */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Extracted Amount
              </span>
              <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                {parseResult.amount !== undefined ? `${parseResult.currency || '$'}${parseResult.amount.toFixed(2)}` : '—'}
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Payee / Merchant
              </span>
              <div className="text-base font-bold text-slate-900 dark:text-white mt-1 truncate">
                {parseResult.merchant || '—'}
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Account Identified
              </span>
              <div className="text-sm font-bold font-mono text-slate-900 dark:text-white mt-1">
                {parseResult.accountDigits || 'Default Account'}
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Type / Flow
              </span>
              <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                {parseResult.transactionType || 'DEBIT'}
              </div>
            </div>
          </div>

          {/* Confidence Meter */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Confidence Score
              </span>
              <span className="font-bold text-slate-900 dark:text-white">
                {Math.round(parseResult.confidenceScore * 100)}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  parseResult.confidenceScore >= 0.85
                    ? 'bg-emerald-500'
                    : parseResult.confidenceScore >= 0.6
                    ? 'bg-amber-400'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${Math.round(parseResult.confidenceScore * 100)}%` }}
              />
            </div>
          </div>

          {/* Decision Signals Log */}
          <div className="space-y-1.5 pt-2">
            <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">
              Classifier Audit Trail
            </span>
            <div className="space-y-1 max-h-36 overflow-y-auto">
              {parseResult.reasons.map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-[#4A4458] dark:text-purple-200">
                  <Icons.CheckCircle2 className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                  <span>{r}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
