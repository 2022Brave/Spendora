/**
 * Spendora Data Models and Types
 * Replicates the Spendora Android Room Entities, Enums, and Domain Models
 */

export type AccountType = 
  | 'CHECKING' 
  | 'SAVINGS' 
  | 'CREDIT_CARD' 
  | 'CASH' 
  | 'INVESTMENT' 
  | 'WALLET';

export type CategoryType = 
  | 'EXPENSE' 
  | 'INCOME' 
  | 'TRANSFER';

export type TransactionType = 
  | 'DEBIT' 
  | 'CREDIT' 
  | 'TRANSFER';

export type TransactionSource = 
  | 'MANUAL' 
  | 'SMS' 
  | 'IMPORT';

export type ReviewStatus = 
  | 'CONFIRMED' 
  | 'PENDING_REVIEW' 
  | 'IGNORED';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  accountNumber: string; // Masked digits, e.g. "•••• 4821"
  institutionName: string;
  isDefault: boolean;
  color: string;
  icon: string;
}

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  icon: string; // Lucide icon name
  color: string; // Hex or Tailwind color string
  isSystem: boolean;
}

export interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  period: 'CYCLE' | 'MONTHLY';
  warningThreshold: number; // e.g. 0.8 (80%)
}

export interface TransactionLocation {
  latitude: number;
  longitude: number;
  placeName?: string;
  city?: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  accountId: string;
  timestamp: number; // Unix epoch ms
  merchant: string;
  note?: string;
  source: TransactionSource;
  reviewStatus: ReviewStatus;
  referenceNumber?: string;
  smsAuditId?: string;
  location?: TransactionLocation;
  confidenceScore?: number;
  rawSmsBody?: string;
}

export interface FinancialCycle {
  cycleType: 'CALENDAR_MONTH' | 'CUSTOM_PAYCHECK';
  startDay: number; // e.g. 1 or 25
  startDate: string; // ISO format YYYY-MM-DD
  endDate: string; // ISO format YYYY-MM-DD
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  totalBudget: number;
  remainingBudget: number;
  daysRemaining: number;
  totalDays: number;
  dailySafeToSpend: number;
  cycleLabel: string;
  percentElapsed: number;
}

export interface MerchantRule {
  id: string;
  pattern: string;
  categoryId: string;
  defaultAccountId?: string;
  normalizedMerchant: string;
  isRegex: boolean;
  priority: number;
}

export interface SmsAudit {
  id: string;
  rawBody: string;
  sender: string;
  timestamp: number;
  parseStatus: 'PARSED' | 'FAILED' | 'IGNORED';
  extractedAmount?: number;
  extractedMerchant?: string;
  extractedAccount?: string;
  extractedDate?: string;
  extractedType?: TransactionType;
  confidenceScore: number;
  transactionId?: string;
}

export interface AppSettings {
  cycleStartDay: number; // 1 to 28
  cycleType: 'CALENDAR_MONTH' | 'CUSTOM_PAYCHECK';
  currencySymbol: string;
  currencyCode: string;
  biometricEnabled: boolean;
  isLocked: boolean;
  locationTaggingEnabled: boolean;
  themeMode: 'light' | 'dark' | 'system';
  autoConfirmHighConfidence: boolean;
  budgetRollover: boolean;
}

export interface SmsParseResult {
  isEligible: boolean;
  amount?: number;
  currency?: string;
  merchant?: string;
  accountDigits?: string;
  transactionType?: TransactionType;
  referenceNumber?: string;
  dateStr?: string;
  confidenceScore: number;
  reasons: string[];
}
