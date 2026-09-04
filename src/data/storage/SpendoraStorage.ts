import {
  Account,
  Category,
  Budget,
  Transaction,
  MerchantRule,
  SmsAudit,
  AppSettings,
} from '../../types';
import {
  SEED_ACCOUNTS,
  SEED_CATEGORIES,
  SEED_BUDGETS,
  SEED_MERCHANT_RULES,
  SEED_TRANSACTIONS,
  DEFAULT_APP_SETTINGS,
} from '../seedData';

const KEYS = {
  ACCOUNTS: 'spendora_accounts_v2',
  CATEGORIES: 'spendora_categories_v2',
  BUDGETS: 'spendora_budgets_v2',
  TRANSACTIONS: 'spendora_transactions_v2',
  MERCHANT_RULES: 'spendora_rules_v2',
  SMS_AUDITS: 'spendora_sms_audits_v2',
  SETTINGS: 'spendora_settings_v2',
};

// Clean up legacy v1 storage that had mock transactions or fabricated balances
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    [
      'spendora_accounts_v1',
      'spendora_budgets_v1',
      'spendora_transactions_v1',
      'spendora_sms_audits_v1',
    ].forEach((k) => localStorage.removeItem(k));
  }
} catch {
  // Ignore in non-browser environments
}

export class SpendoraStorage {
  static getAccounts(): Account[] {
    try {
      const data = localStorage.getItem(KEYS.ACCOUNTS);
      return data ? JSON.parse(data) : SEED_ACCOUNTS;
    } catch {
      return SEED_ACCOUNTS;
    }
  }

  static saveAccounts(accounts: Account[]): void {
    localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(accounts));
  }

  static getCategories(): Category[] {
    try {
      const data = localStorage.getItem(KEYS.CATEGORIES);
      return data ? JSON.parse(data) : SEED_CATEGORIES;
    } catch {
      return SEED_CATEGORIES;
    }
  }

  static saveCategories(categories: Category[]): void {
    localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(categories));
  }

  static getBudgets(): Budget[] {
    try {
      const data = localStorage.getItem(KEYS.BUDGETS);
      return data ? JSON.parse(data) : SEED_BUDGETS;
    } catch {
      return SEED_BUDGETS;
    }
  }

  static saveBudgets(budgets: Budget[]): void {
    localStorage.setItem(KEYS.BUDGETS, JSON.stringify(budgets));
  }

  static getTransactions(): Transaction[] {
    try {
      const data = localStorage.getItem(KEYS.TRANSACTIONS);
      return data ? JSON.parse(data) : SEED_TRANSACTIONS;
    } catch {
      return SEED_TRANSACTIONS;
    }
  }

  static saveTransactions(transactions: Transaction[]): void {
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }

  static getMerchantRules(): MerchantRule[] {
    try {
      const data = localStorage.getItem(KEYS.MERCHANT_RULES);
      return data ? JSON.parse(data) : SEED_MERCHANT_RULES;
    } catch {
      return SEED_MERCHANT_RULES;
    }
  }

  static saveMerchantRules(rules: MerchantRule[]): void {
    localStorage.setItem(KEYS.MERCHANT_RULES, JSON.stringify(rules));
  }

  static getSmsAudits(): SmsAudit[] {
    try {
      const data = localStorage.getItem(KEYS.SMS_AUDITS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static saveSmsAudits(audits: SmsAudit[]): void {
    localStorage.setItem(KEYS.SMS_AUDITS, JSON.stringify(audits));
  }

  static getSettings(): AppSettings {
    try {
      const data = localStorage.getItem(KEYS.SETTINGS);
      return data ? { ...DEFAULT_APP_SETTINGS, ...JSON.parse(data) } : DEFAULT_APP_SETTINGS;
    } catch {
      return DEFAULT_APP_SETTINGS;
    }
  }

  static saveSettings(settings: AppSettings): void {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  }

  /**
   * Complete JSON Backup Export
   */
  static exportFullBackup(): string {
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      accounts: this.getAccounts(),
      categories: this.getCategories(),
      budgets: this.getBudgets(),
      transactions: this.getTransactions(),
      merchantRules: this.getMerchantRules(),
      settings: this.getSettings(),
    };
    return JSON.stringify(backup, null, 2);
  }

  /**
   * Complete JSON Backup Restore
   */
  static importFullBackup(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.accounts) this.saveAccounts(parsed.accounts);
      if (parsed.categories) this.saveCategories(parsed.categories);
      if (parsed.budgets) this.saveBudgets(parsed.budgets);
      if (parsed.transactions) this.saveTransactions(parsed.transactions);
      if (parsed.merchantRules) this.saveMerchantRules(parsed.merchantRules);
      if (parsed.settings) this.saveSettings(parsed.settings);
      return true;
    } catch (e) {
      console.error('Failed to restore backup', e);
      return false;
    }
  }

  /**
   * Reset to initial demo seed data
   */
  static resetToSeed(): void {
    this.saveAccounts(SEED_ACCOUNTS);
    this.saveCategories(SEED_CATEGORIES);
    this.saveBudgets(SEED_BUDGETS);
    this.saveTransactions(SEED_TRANSACTIONS);
    this.saveMerchantRules(SEED_MERCHANT_RULES);
    this.saveSmsAudits([]);
    this.saveSettings(DEFAULT_APP_SETTINGS);
  }

  static resetToDefaultSeed(): void {
    this.resetToSeed();
  }

  /**
   * Export Transactions to CSV
   */
  static exportTransactionsCsv(): string {
    const txs = this.getTransactions();
    const categories = this.getCategories();
    const accounts = this.getAccounts();

    const catMap = new Map(categories.map(c => [c.id, c.name]));
    const accMap = new Map(accounts.map(a => [a.id, a.name]));

    const headers = ['Date', 'Merchant', 'Type', 'Amount', 'Category', 'Account', 'Source', 'Status', 'RefNumber', 'Notes'];
    const rows = txs.map(t => {
      const date = new Date(t.timestamp).toLocaleDateString();
      const catName = catMap.get(t.categoryId) || 'Uncategorized';
      const accName = accMap.get(t.accountId) || 'Unknown Account';
      return [
        `"${date}"`,
        `"${t.merchant.replace(/"/g, '""')}"`,
        `"${t.type}"`,
        t.amount.toFixed(2),
        `"${catName}"`,
        `"${accName}"`,
        `"${t.source}"`,
        `"${t.reviewStatus}"`,
        `"${t.referenceNumber || ''}"`,
        `"${(t.note || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }
}
