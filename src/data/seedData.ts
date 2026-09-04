import { Account, Category, Budget, Transaction, MerchantRule, AppSettings } from '../types';

export const SEED_CATEGORIES: Category[] = [
  { id: 'cat_groceries', name: 'Groceries', type: 'EXPENSE', icon: 'ShoppingCart', color: '#10b981', isSystem: true },
  { id: 'cat_dining', name: 'Food & Dining', type: 'EXPENSE', icon: 'Utensils', color: '#f59e0b', isSystem: true },
  { id: 'cat_housing', name: 'Housing & Rent', type: 'EXPENSE', icon: 'Home', color: '#6366f1', isSystem: true },
  { id: 'cat_utilities', name: 'Bills & Utilities', type: 'EXPENSE', icon: 'Zap', color: '#06b6d4', isSystem: true },
  { id: 'cat_transport', name: 'Transportation', type: 'EXPENSE', icon: 'Car', color: '#3b82f6', isSystem: true },
  { id: 'cat_entertainment', name: 'Entertainment', type: 'EXPENSE', icon: 'Film', color: '#8b5cf6', isSystem: true },
  { id: 'cat_shopping', name: 'Shopping', type: 'EXPENSE', icon: 'ShoppingBag', color: '#ec4899', isSystem: true },
  { id: 'cat_health', name: 'Health & Medical', type: 'EXPENSE', icon: 'HeartPulse', color: '#ef4444', isSystem: true },
  { id: 'cat_subscriptions', name: 'Subscriptions', type: 'EXPENSE', icon: 'RefreshCw', color: '#14b8a6', isSystem: true },
  { id: 'cat_travel', name: 'Travel', type: 'EXPENSE', icon: 'Plane', color: '#f97316', isSystem: true },
  { id: 'cat_salary', name: 'Salary / Paycheck', type: 'INCOME', icon: 'Wallet', color: '#22c55e', isSystem: true },
  { id: 'cat_freelance', name: 'Freelance / Consulting', type: 'INCOME', icon: 'Briefcase', color: '#3b82f6', isSystem: true },
  { id: 'cat_investments', name: 'Investments & Dividends', type: 'INCOME', icon: 'TrendingUp', color: '#8b5cf6', isSystem: true },
  { id: 'cat_transfer', name: 'Account Transfer', type: 'TRANSFER', icon: 'ArrowLeftRight', color: '#64748b', isSystem: true },
];

export const SEED_ACCOUNTS: Account[] = [];

export const SEED_BUDGETS: Budget[] = [];

export const SEED_MERCHANT_RULES: MerchantRule[] = [
  { id: 'r1', pattern: 'WHOLEFDS|TRADER JOE|SAFEWAY|KROGER|COSTCO', categoryId: 'cat_groceries', normalizedMerchant: 'Groceries', isRegex: true, priority: 10 },
  { id: 'r2', pattern: 'UBER EATS|DOORDASH|GRUBHUB|STARBUCKS|CHIPOTLE|SWEETGREEN', categoryId: 'cat_dining', normalizedMerchant: 'Dining', isRegex: true, priority: 10 },
  { id: 'r3', pattern: 'UBER TRIP|LYFT|SHELL|CHEVRON|EXXON', categoryId: 'cat_transport', normalizedMerchant: 'Transit', isRegex: true, priority: 10 },
  { id: 'r4', pattern: 'NETFLIX|SPOTIFY|APPLE.COM/BILL|PRIME VIDEO|YOUTUBE', categoryId: 'cat_subscriptions', normalizedMerchant: 'Subscription', isRegex: true, priority: 10 },
  { id: 'r5', pattern: 'AMAZON|TARGET|BEST BUY|ZARA|UNIQLO', categoryId: 'cat_shopping', normalizedMerchant: 'Retail Shopping', isRegex: true, priority: 10 },
];

export const DEFAULT_APP_SETTINGS: AppSettings = {
  cycleStartDay: 1, // 1st of each month (or 25th for payday cycle)
  cycleType: 'CALENDAR_MONTH',
  currencySymbol: '$',
  currencyCode: 'USD',
  biometricEnabled: false,
  isLocked: false,
  locationTaggingEnabled: true,
  themeMode: 'light',
  autoConfirmHighConfidence: false,
  budgetRollover: true,
};

export const SEED_TRANSACTIONS: Transaction[] = [];

