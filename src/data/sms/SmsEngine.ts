import { SmsParseResult, TransactionType, MerchantRule } from '../../types';

export class SmsEligibilityClassifier {
  private static readonly FINANCIAL_KEYWORDS = [
    'debited', 'credited', 'spent', 'paid', 'purchase', 'charged', 'withdrawn',
    'sent', 'received', 'transferred', 'payment of', 'txn of', 'card ending',
    'a/c ending', 'acct ending', 'account ending', 'inr', 'usd', '$', '€', '£', '₹',
    'rs.', 'rs ', 'vpa', 'pos', 'atm', 'deposit', 'direct deposit', 'auto-debit'
  ];

  private static readonly INELIGIBLE_KEYWORDS = [
    'otp', 'one time password', 'verification code', 'verify your', 'security code',
    'secret code', 'do not share', 'valid for', 'cashback offer', 'pre-approved loan',
    'discount code', 'flat 50% off', 'click here to win', 'promo code', 'bonus points'
  ];

  static isEligible(body: string, sender: string = ''): { eligible: boolean; reason: string } {
    const text = (body + ' ' + sender).toLowerCase();

    // Check for explicit OTP / promo keywords first
    for (const inelig of this.INELIGIBLE_KEYWORDS) {
      if (text.includes(inelig) && !text.includes('debited') && !text.includes('credited')) {
        return { eligible: false, reason: `Excluded due to OTP/Promotional keyword: "${inelig}"` };
      }
    }

    // Check for presence of financial keywords
    let matchCount = 0;
    for (const kw of this.FINANCIAL_KEYWORDS) {
      if (text.includes(kw)) {
        matchCount++;
      }
    }

    if (matchCount >= 1) {
      return { eligible: true, reason: `Matched financial patterns (${matchCount} signals)` };
    }

    return { eligible: false, reason: 'No financial transaction keywords detected' };
  }
}

export class SmsAmountExtractor {
  // Regexes matching amounts with currency symbols or prefix/suffix patterns
  private static readonly AMOUNT_REGEXES = [
    /(?:spent|charged|debited|paid|credited|received|purchase of|txn of|payment of)\s*(?:of)?\s*(?:(?:USD|\$|EUR|€|GBP|£|INR|Rs\.?|₹)\s*)?([0-9,]+\.[0-9]{2})/i,
    /(?:(?:USD|\$|EUR|€|GBP|£|INR|Rs\.?|₹)\s*)([0-9,]+(?:\.[0-9]{2})?)/i,
    /([0-9,]+\.[0-9]{2})\s*(?:USD|EUR|GBP|INR|Rs\.?|dollars|spent|debited|credited)/i,
  ];

  static extract(body: string): { amount?: number; currency?: string } {
    for (const regex of this.AMOUNT_REGEXES) {
      const match = body.match(regex);
      if (match && match[1]) {
        const cleanStr = match[1].replace(/,/g, '');
        const amount = parseFloat(cleanStr);
        if (!isNaN(amount) && amount > 0) {
          // Detect currency
          let currency = '$';
          if (body.includes('₹') || /INR|Rs/i.test(body)) currency = '₹';
          else if (body.includes('€') || /EUR/i.test(body)) currency = '€';
          else if (body.includes('£') || /GBP/i.test(body)) currency = '£';
          return { amount, currency };
        }
      }
    }
    return {};
  }
}

export class SmsMerchantExtractor {
  private static readonly MERCHANT_REGEXES = [
    /(?:at|to|info:|vpa:|spent on|merchant:)\s+([A-Za-z0-9\s'’.\-*&#]+?)(?=\s+(?:on|with|using|for|ref|card|a\/c|bal|avl|if|available|\.|\n|$))/i,
    /(?:at|to)\s+([A-Za-z0-9\s'’.\-*&#]+?)(?=[.,\n]|$)/i,
    /(?:from)\s+([A-Za-z0-9\s'’.\-*&#]+?)(?=\s+(?:posted|credited|deposited|on|for|\.|$))/i,
  ];

  static extract(body: string, merchantRules: MerchantRule[] = []): string {
    // 1. Check user-defined rules first
    for (const rule of merchantRules) {
      try {
        const regex = new RegExp(rule.pattern, 'i');
        if (regex.test(body)) {
          return rule.normalizedMerchant;
        }
      } catch {
        // Skip invalid regex
      }
    }

    // 2. Try generic regex patterns
    for (const regex of this.MERCHANT_REGEXES) {
      const match = body.match(regex);
      if (match && match[1]) {
        let name = match[1].trim();
        // Clean up common noise
        name = name.replace(/^(the|a)\s+/i, '');
        name = name.replace(/\s+(card|acct|ending|on|ref).*$/i, '');
        if (name.length >= 2 && name.length <= 40) {
          return name;
        }
      }
    }

    return 'Unknown Merchant';
  }
}

export class SmsAccountExtractor {
  private static readonly ACCOUNT_PATTERNS = [
    /(?:card|a\/c|acct|account)\s*(?:no\.?|ending|in)?\s*(?:xx|x|\*{2,4})?\s*([0-9]{4})/i,
    /(?:ending in|ending with)\s*([0-9]{4})/i,
    /(?:xx|x|\*){2,4}([0-9]{4})/i,
  ];

  static extract(body: string): string | undefined {
    for (const pattern of this.ACCOUNT_PATTERNS) {
      const match = body.match(pattern);
      if (match && match[1]) {
        return `•••• ${match[1]}`;
      }
    }
    return undefined;
  }
}

export class SmsTypeClassifier {
  static classify(body: string): TransactionType {
    const text = body.toLowerCase();
    if (text.includes('credited') || text.includes('deposited') || text.includes('direct deposit') || text.includes('received') || text.includes('refund')) {
      return 'CREDIT';
    }
    if (text.includes('transfer to') || text.includes('sent to own') || text.includes('transferred to account')) {
      return 'TRANSFER';
    }
    return 'DEBIT'; // Default for debited, spent, charged, paid, purchase
  }
}

export class SmsReferenceExtractor {
  private static readonly REF_PATTERNS = [
    /(?:ref|rrn|txn|utr|id|auth)\s*(?:no\.?|id|code|#)?\s*[:\-]?\s*([A-Za-z0-9]{6,20})/i,
    /([A-Z0-9]{10,20})/i,
  ];

  static extract(body: string): string | undefined {
    for (const pattern of this.REF_PATTERNS) {
      const match = body.match(pattern);
      if (match && match[1] && !/^(ending|debited|credited|account|balance)/i.test(match[1])) {
        return match[1];
      }
    }
    return undefined;
  }
}

export class SmsEngine {
  static parseSms(body: string, sender: string = '', rules: MerchantRule[] = []): SmsParseResult {
    const reasons: string[] = [];

    // Step 1: Eligibility check
    const eligibility = SmsEligibilityClassifier.isEligible(body, sender);
    if (!eligibility.eligible) {
      return {
        isEligible: false,
        confidenceScore: 0.1,
        reasons: [eligibility.reason],
      };
    }
    reasons.push(eligibility.reason);

    // Step 2: Amount extraction
    const amountResult = SmsAmountExtractor.extract(body);
    if (amountResult.amount) {
      reasons.push(`Extracted amount: ${amountResult.currency || '$'}${amountResult.amount.toFixed(2)}`);
    } else {
      reasons.push('Could not detect monetary amount');
    }

    // Step 3: Merchant extraction
    const merchant = SmsMerchantExtractor.extract(body, rules);
    if (merchant !== 'Unknown Merchant') {
      reasons.push(`Identified merchant: ${merchant}`);
    } else {
      reasons.push('Merchant name was ambiguous or unknown');
    }

    // Step 4: Account digits
    const accountDigits = SmsAccountExtractor.extract(body);
    if (accountDigits) {
      reasons.push(`Detected account: ${accountDigits}`);
    }

    // Step 5: Type classification
    const transactionType = SmsTypeClassifier.classify(body);
    reasons.push(`Classified transaction as ${transactionType}`);

    // Step 6: Reference ID
    const referenceNumber = SmsReferenceExtractor.extract(body);
    if (referenceNumber) {
      reasons.push(`Found reference ID: ${referenceNumber}`);
    }

    // Step 7: Confidence calculation
    let score = 0.2; // Base eligibility
    if (amountResult.amount) score += 0.35;
    if (merchant !== 'Unknown Merchant') score += 0.25;
    if (accountDigits) score += 0.1;
    if (referenceNumber) score += 0.05;
    if (transactionType) score += 0.05;

    const confidenceScore = Math.min(1.0, Math.max(0.1, Number(score.toFixed(2))));

    return {
      isEligible: true,
      amount: amountResult.amount,
      currency: amountResult.currency,
      merchant,
      accountDigits,
      transactionType,
      referenceNumber,
      dateStr: new Date().toLocaleDateString(),
      confidenceScore,
      reasons,
    };
  }
}

export const SAMPLE_SMS_DATASET: Array<{ bank: string; body: string; sender: string }> = [
  {
    bank: 'Chase Bank',
    sender: 'CHASE-ALERT',
    body: 'Chase: Card ending in 7241 debited USD 64.30 at WHOLE FOODS MARKET on 09/04. Avail Bal: $4,756.20.',
  },
  {
    bank: 'American Express',
    sender: 'AMEX',
    body: 'Amex Alert: $142.80 spent at TARGET STORE #0831 on Card ending 1008 on 09/03. Ref: AMX-94821.',
  },
  {
    bank: 'Apple Card',
    sender: 'APPLE',
    body: 'Apple Card: Approved $12.50 at BLUE BOTTLE COFFEE on 09/04 with Apple Pay. Ref #APL-8821.',
  },
  {
    bank: 'Bank of America',
    sender: 'BOFA-TXN',
    body: 'Bank of America alert: Your checking account ending in 7241 has a debit of $85.00 for SHELL OIL on 09/04.',
  },
  {
    bank: 'HDFC Bank',
    sender: 'HDFCBK',
    body: 'Alert: Rs 1,450.00 spent on your HDFC Bank Card ending 1008 at SWIGGY on 04-SEP-26. Avl Lmt: Rs 78,550.00.',
  },
  {
    bank: 'Wells Fargo',
    sender: 'WF-ALERTS',
    body: 'Wells Fargo: Direct deposit of $3,200.00 from GLOBAL TECH INC posted to A/c ending 7241 on 09/01.',
  },
  {
    bank: 'Citibank',
    sender: 'CITI-TXN',
    body: 'Citi Alert: Purchase of $28.90 on Citi Card ending 8912 at UBER *TRIP on 09/04. Ref: CIT-55120.',
  },
  {
    bank: 'Capital One',
    sender: 'CAPONE',
    body: 'Capital One: A charge of $34.20 was authorized at WALMART SUPERCENTER on 09/04 with card ending 1008.',
  },
  {
    bank: 'Non-Financial (OTP)',
    sender: 'GOOGLE',
    body: 'G-748291 is your Google verification code. Do not share this code with anyone.',
  },
  {
    bank: 'Promotional Spam',
    sender: 'PROMO',
    body: 'Special offer! Get flat 40% off on your next flight booking with code FLYBIG. Click http://fly.to now.',
  },
];
