export interface Transaction {
  id: string;
  description: string;
  amount: number;
  predictedCategory: string;
  isCategoryManuallyOverridden?: boolean;
  actualCategory?: string;
  confidence: number;
  reasoning: string;
  createdAt: string; // ISO date string
  paymentMethod?: string;
  merchant?: string;
  payerName?: string;
  storeName?: string;
}

export interface Category {
  id: string;
  name: string;
  budgetLimit: number;
  color: string;
  iconName: string;
}

export interface AnalyticsSummary {
  totalSpent: number;
  transactionCount: number;
  avgTransaction: number;
  categoryTotals: {
    category: string;
    total: number;
    count: number;
    budgetLimit: number;
    color: string;
  }[];
  monthlyBudget: number;
  totalBudgetSpentPercentage: number;
  aiInsights: string[];
  topVendors: { merchant: string; total: number; count: number; items?: string[] }[];
  topPayers: { payer: string; total: number; count: number; items?: string[] }[];
  availableMonths: string[];
  selectedMonth: string;
  // Period Comparison Data (Optional)
  periodType?: 'monthly' | 'weekly' | 'custom';
  periodLabel?: string;
  currentPeriodSpent?: number;
  previousPeriodSpent?: number;
  spentDifference?: number;
  spentPercentageChange?: number;
}

export interface PredictCategoryRequest {
  description: string;
  amount: number;
}

export interface PredictCategoryResponse {
  predictedCategory: string;
  confidence: number;
  reasoning: string;
  method: 'ML_MODEL' | 'GEMINI_AI' | 'KEYWORD_WEIGHT';
  topScores: { category: string; score: number }[];
}

export interface PayerAnalytics {
  payerName: string;
  totalSpent: number;
  count: number;
  percentageOfTotal: number;
  topCategory: string;
  topStore: string;
}

export interface MonthComparisonData {
  availableMonths: string[];
  month1: string;
  month2: string;
  month1Label: string;
  month2Label: string;
  month1Total: number;
  month2Total: number;
  difference: number;
  percentageChange: number;
  categoryComparison: {
    category: string;
    color: string;
    month1Total: number;
    month2Total: number;
    difference: number;
    percentageChange: number;
  }[];
}

export interface MonthHistoryItem {
  month: string;
  monthLabel: string;
  totalSpent: number;
  count: number;
}

export interface AllTimeCategoryItem {
  category: string;
  color: string;
  totalSpent: number;
  count: number;
  percentageOfTotal: number;
}

export interface DeepAnalyticsData {
  payerBreakdown: PayerAnalytics[];
  topSpendingPayer: PayerAnalytics | null;
  highestSinglePurchase: Transaction | null;
  topSpendingStore: {
    storeName: string;
    totalSpent: number;
    count: number;
  } | null;
  avgDailySpend: number;
  avgWeeklySpend: number;
  totalAllTimeSpent: number;
  activeDaysCount: number;
  allMonthsHistory: MonthHistoryItem[];
  allTimeCategoryBreakdown: AllTimeCategoryItem[];
  monthComparison: MonthComparisonData;
}

export interface DotNetCodeFile {
  id: string;
  filename: string;
  filepath: string;
  language: string;
  title: string;
  conceptBadge: string;
  description: string;
  code: string;
  lineAnnotations: Record<number, { title: string; explanation: string; conceptKey: string }>;
}

export interface PipelineExecutionStep {
  stepNumber: number;
  stageName: string;
  component: string;
  codeSnippet: string;
  lineHighlight: number;
  description: string;
  csharpDetails: string;
}

export interface DotNetMentorMessage {
  id: string;
  sender: 'user' | 'mentor';
  text: string;
  codeSnippet?: string;
  timestamp: string;
}
