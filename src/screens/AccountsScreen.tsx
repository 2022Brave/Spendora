import React, { useState } from 'react';
import { Account, AccountType } from '../types';
import * as Icons from 'lucide-react';

interface AccountsScreenProps {
  accounts: Account[];
  currencySymbol: string;
  onSaveAccount: (account: Account) => void;
  onDeleteAccount: (accountId: string) => void;
  onTransfer: (fromAccountId: string, toAccountId: string, amount: number, note?: string) => void;
}

export const AccountsScreen: React.FC<AccountsScreenProps> = ({
  accounts,
  currencySymbol,
  onSaveAccount,
  onDeleteAccount,
  onTransfer,
}) => {
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // Account form state
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('CHECKING');
  const [balance, setBalance] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [color, setColor] = useState('#1d4ed8');

  // Transfer form state
  const [fromAccId, setFromAccId] = useState('');
  const [toAccId, setToAccId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNote, setTransferNote] = useState('');

  const totalAssets = accounts
    .filter(a => a.balance > 0)
    .reduce((acc, a) => acc + a.balance, 0);

  const totalLiabilities = accounts
    .filter(a => a.balance < 0)
    .reduce((acc, a) => acc + Math.abs(a.balance), 0);

  const netWorth = totalAssets - totalLiabilities;

  const handleOpenAddAccount = () => {
    setEditingAccount(null);
    setName('');
    setType('CHECKING');
    setBalance('0.00');
    setAccountNumber('•••• ' + Math.floor(1000 + Math.random() * 9000));
    setInstitutionName('');
    setColor('#1d4ed8');
    setIsAccountModalOpen(true);
  };

  const handleOpenEditAccount = (acc: Account) => {
    setEditingAccount(acc);
    setName(acc.name);
    setType(acc.type);
    setBalance(acc.balance.toString());
    setAccountNumber(acc.accountNumber);
    setInstitutionName(acc.institutionName);
    setColor(acc.color);
    setIsAccountModalOpen(true);
  };

  const handleSaveAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const balNum = parseFloat(balance);
    if (isNaN(balNum)) return;

    const acc: Account = {
      id: editingAccount?.id || `acc_${Date.now()}`,
      name: name.trim() || 'New Account',
      type,
      balance: balNum,
      accountNumber: accountNumber.trim() || '•••• 0000',
      institutionName: institutionName.trim() || 'Financial Institution',
      isDefault: editingAccount?.isDefault || false,
      color,
      icon: type === 'SAVINGS' ? 'PiggyBank' : type === 'CREDIT_CARD' ? 'CreditCard' : type === 'CASH' ? 'Banknote' : 'Landmark',
    };

    onSaveAccount(acc);
    setIsAccountModalOpen(false);
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(transferAmount);
    if (isNaN(amountNum) || amountNum <= 0 || !fromAccId || !toAccId || fromAccId === toAccId) {
      return;
    }

    onTransfer(fromAccId, toAccId, amountNum, transferNote.trim() || undefined);
    setIsTransferModalOpen(false);
    setTransferAmount('');
    setTransferNote('');
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#1E293B] dark:text-white tracking-tight">
            Accounts & Balances
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Connected banks, credit cards, and cash wallets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setFromAccId(accounts[0]?.id || '');
              setToAccId(accounts[1]?.id || '');
              setIsTransferModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-[#13111C] border border-[#EDE9FE] dark:border-[#272138] hover:bg-purple-50 dark:hover:bg-[#181524] text-[#4A4458] dark:text-purple-200 rounded-md font-medium text-xs shadow-xs transition-colors cursor-pointer"
          >
            <Icons.ArrowLeftRight className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            Transfer Funds
          </button>
          <button
            onClick={handleOpenAddAccount}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md font-medium text-xs shadow-xs transition-colors cursor-pointer"
          >
            <Icons.Plus className="w-3.5 h-3.5" />
            Add Account
          </button>
        </div>
      </div>

      {/* Net Worth Summary Card */}
      <div className="bg-white dark:bg-[#13111C] rounded-lg p-5 border border-[#EDE9FE] dark:border-[#272138] shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Combined Liquid Net
            </span>
            <div className="text-2xl font-bold text-[#1E293B] dark:text-white mt-0.5">
              {currencySymbol}{netWorth.toFixed(2)}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Across {accounts.length} active account{accounts.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="border-t md:border-t-0 md:border-l border-[#E2E8F0] dark:border-slate-800 pt-4 md:pt-0 md:pl-6">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Total Deposits & Cash
            </span>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              +{currencySymbol}{totalAssets.toFixed(2)}
            </div>
          </div>

          <div className="border-t md:border-t-0 md:border-l border-[#E2E8F0] dark:border-slate-800 pt-4 md:pt-0 md:pl-6">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Credit Card Balances
            </span>
            <div className="text-xl font-bold text-slate-700 dark:text-slate-300 mt-0.5">
              -{currencySymbol}{totalLiabilities.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Accounts Cards Grid */}
      {accounts.length === 0 ? (
        <div className="bg-white dark:bg-[#13111C] rounded-lg p-10 border border-[#EDE9FE] dark:border-[#272138] text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 mx-auto flex items-center justify-center">
            <Icons.Landmark className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="font-semibold text-sm text-[#1E1B2E] dark:text-white">
              No Accounts Connected
            </h3>
            <p className="text-xs text-[#7A7489] dark:text-purple-300/70 mt-1">
              Add your bank accounts, credit cards, or cash wallets to track balances and auto-match parsed SMS transactions.
            </p>
          </div>
          <button
            onClick={handleOpenAddAccount}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
          >
            <Icons.Plus className="w-3.5 h-3.5" />
            Add First Account
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc) => {
            const isNegative = acc.balance < 0;
            const isCredit = acc.type === 'CREDIT_CARD';

            return (
              <div
                key={acc.id}
                className="bg-white dark:bg-[#13111C] rounded-lg p-4 border border-[#EDE9FE] dark:border-[#272138] shadow-xs hover:border-purple-300 dark:hover:border-purple-800/60 transition-colors flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded flex items-center justify-center shadow-xs text-white font-bold shrink-0"
                        style={{ backgroundColor: acc.color }}
                      >
                        {acc.type === 'SAVINGS' ? (
                          <Icons.PiggyBank className="w-4 h-4" />
                        ) : acc.type === 'CREDIT_CARD' ? (
                          <Icons.CreditCard className="w-4 h-4" />
                        ) : acc.type === 'CASH' ? (
                          <Icons.Banknote className="w-4 h-4" />
                        ) : (
                          <Icons.Landmark className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-xs text-[#1E1B2E] dark:text-white truncate max-w-[160px]">
                          {acc.name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                          <span>{acc.institutionName}</span>
                          <span>•</span>
                          <span className="font-mono text-[11px]">{acc.accountNumber}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditAccount(acc)}
                        className="p-1 rounded text-[#7A7489] hover:text-purple-600 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-[#181524] cursor-pointer"
                      >
                        <Icons.Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {accounts.length > 1 && (
                        <button
                          onClick={() => {
                            if (confirm(`Remove account "${acc.name}"?`)) {
                              onDeleteAccount(acc.id);
                            }
                          }}
                          className="p-1 rounded text-[#7A7489] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                        >
                          <Icons.Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-purple-50 dark:border-[#201B30]">
                    <span className="text-[11px] text-[#7A7489] dark:text-purple-300/70 font-semibold uppercase tracking-wider">
                      {isCredit ? 'Current Balance Due' : 'Available Balance'}
                    </span>
                    <div
                      className={`text-xl font-bold mt-0.5 ${
                        isCredit
                          ? 'text-[#1E1B2E] dark:text-white'
                          : isNegative
                          ? 'text-rose-600'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {currencySymbol}{Math.abs(acc.balance).toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-[#EDE9FE] dark:border-[#272138]">
                  <span className="capitalize">{acc.type.replace('_', ' ').toLowerCase()}</span>
                  {acc.isDefault && (
                    <span className="px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 font-medium text-[10px]">
                      Primary
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Account Add/Edit Modal */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#13111C] rounded-xl max-w-md w-full p-5 shadow-xl border border-[#EDE9FE] dark:border-[#272138] animate-in fade-in zoom-in-95">
            <h2 className="text-sm font-bold text-[#1E1B2E] dark:text-white mb-4 flex items-center gap-2">
              <Icons.Landmark className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              {editingAccount ? 'Edit Account' : 'Add Financial Account'}
            </h2>

            <form onSubmit={handleSaveAccountSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-[#4A4458] dark:text-purple-300 mb-1">
                  Account Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chase Total Checking"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#FAF8FD] dark:bg-[#181524] border border-[#EDE9FE] dark:border-[#2E2844] rounded-md text-xs text-[#1E1B2E] dark:text-white focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#4A4458] dark:text-purple-300 mb-1">
                    Account Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as AccountType)}
                    className="w-full px-3 py-1.5 bg-[#FAF8FD] dark:bg-[#181524] border border-[#EDE9FE] dark:border-[#2E2844] rounded-md text-xs text-[#1E1B2E] dark:text-white focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                  >
                    <option value="CHECKING">Checking</option>
                    <option value="CREDIT_CARD">Credit Card</option>
                    <option value="SAVINGS">Savings</option>
                    <option value="CASH">Cash / Wallet</option>
                    <option value="INVESTMENT">Investment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#4A4458] dark:text-purple-300 mb-1">
                    Current Balance ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#FAF8FD] dark:bg-[#181524] border border-[#EDE9FE] dark:border-[#2E2844] rounded-md text-xs font-bold text-[#1E1B2E] dark:text-white focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#4A4458] dark:text-purple-300 mb-1">
                    Institution / Bank
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Chase, Amex, Apple"
                    value={institutionName}
                    onChange={(e) => setInstitutionName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#FAF8FD] dark:bg-[#181524] border border-[#EDE9FE] dark:border-[#2E2844] rounded-md text-xs text-[#1E1B2E] dark:text-white focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#4A4458] dark:text-purple-300 mb-1">
                    Account Digits
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. •••• 7241"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#FAF8FD] dark:bg-[#181524] border border-[#EDE9FE] dark:border-[#2E2844] rounded-md text-xs text-[#1E1B2E] dark:text-white font-mono focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#4A4458] dark:text-purple-300 mb-1.5">
                  Card Theme Color
                </label>
                <div className="flex items-center gap-2">
                  {['#9333ea', '#7e22ce', '#6b21a8', '#059669', '#d97706', '#dc2626'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                        color === c ? 'scale-110 ring-2 ring-offset-2 ring-purple-500' : 'opacity-80'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAccountModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-md text-xs font-medium text-[#6B647B] dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-[#181524] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-md bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium shadow-xs cursor-pointer"
                >
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Funds Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#13111C] rounded-xl max-w-md w-full p-5 shadow-xl border border-[#EDE9FE] dark:border-[#272138] animate-in fade-in zoom-in-95">
            <h2 className="text-sm font-bold text-[#1E1B2E] dark:text-white mb-4 flex items-center gap-2">
              <Icons.ArrowLeftRight className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              Transfer Between Accounts
            </h2>

            <form onSubmit={handleTransferSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#4A4458] dark:text-purple-300 mb-1">
                    From Account
                  </label>
                  <select
                    value={fromAccId}
                    onChange={(e) => setFromAccId(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#FAF8FD] dark:bg-[#181524] border border-[#EDE9FE] dark:border-[#2E2844] rounded-md text-xs text-[#1E1B2E] dark:text-white focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({currencySymbol}{a.balance.toFixed(0)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#4A4458] dark:text-purple-300 mb-1">
                    To Account
                  </label>
                  <select
                    value={toAccId}
                    onChange={(e) => setToAccId(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#FAF8FD] dark:bg-[#181524] border border-[#EDE9FE] dark:border-[#2E2844] rounded-md text-xs text-[#1E1B2E] dark:text-white focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({currencySymbol}{a.balance.toFixed(0)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#4A4458] dark:text-purple-300 mb-1">
                  Transfer Amount ({currencySymbol})
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#FAF8FD] dark:bg-[#181524] border border-[#EDE9FE] dark:border-[#2E2844] rounded-md font-bold text-sm text-[#1E1B2E] dark:text-white focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#4A4458] dark:text-purple-300 mb-1">
                  Reference / Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Credit card monthly payment"
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#FAF8FD] dark:bg-[#181524] border border-[#EDE9FE] dark:border-[#2E2844] rounded-md text-xs text-[#1E1B2E] dark:text-white focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-md text-xs font-medium text-[#6B647B] dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-[#181524] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-md bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium shadow-xs cursor-pointer"
                >
                  Confirm Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
