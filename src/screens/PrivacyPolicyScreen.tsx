import React from 'react';
import * as Icons from 'lucide-react';

interface PrivacyPolicyScreenProps {
  onBack: () => void;
}

export const PrivacyPolicyScreen: React.FC<PrivacyPolicyScreenProps> = ({ onBack }) => {
  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
      >
        <Icons.ArrowLeft className="w-4 h-4" />
        Back to Settings
      </button>

      <div className="bg-white dark:bg-[#13111C] rounded-3xl p-6 sm:p-8 border border-[#EDE9FE] dark:border-[#272138] shadow-xs space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-purple-100 dark:border-[#272138]">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Icons.ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-[#1E1B2E] dark:text-white">
              Spendora Privacy Policy & Security
            </h1>
            <p className="text-xs text-[#7A7489] dark:text-purple-300/70">
              Last updated: September 2026 • Local-First Architecture
            </p>
          </div>
        </div>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-[#1E1B2E] dark:text-white flex items-center gap-2">
            <Icons.Lock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            1. Zero Cloud Transmission of Financial SMS
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Spendora was built under the foundational principle that your private financial data belongs exclusively to you. All SMS parsing, regex classification, amounts, account balances, and merchant identifications are computed 100% locally on your device within the browser/device sandbox. At no point are your SMS bodies or bank transactions sent to any remote server or third-party cloud.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Icons.Database className="w-4 h-4 text-indigo-500" />
            2. Local-Only Storage
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            All database tables—including your accounts, custom categories, monthly budgets, and historical ledger—are persisted directly in your local environment. You have complete data portability and can export your entire database as an unencrypted JSON snapshot or CSV at any time.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Icons.EyeOff className="w-4 h-4 text-purple-500" />
            3. No Telemetry, No Analytics, No Advertisements
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Spendora contains zero analytics beacons, trackers, or commercial advertising SDKs. We do not profile your purchasing habits or sell financial leads.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Icons.Key className="w-4 h-4 text-amber-500" />
            4. Biometric & Passcode Protection
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            When enabled in settings, Spendora requires authentication before displaying sensitive balances, account numbers, or ledger histories to prevent unauthorized physical access.
          </p>
        </section>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-xs text-slate-400">
            Spendora • Crafted with privacy, precision, and financial clarity.
          </p>
        </div>
      </div>
    </div>
  );
};
