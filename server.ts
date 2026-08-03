import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client (Server-side only)
let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.error('Failed to initialize GoogleGenAI client:', err);
  }
}

// Default Categories & Budgets
interface CategoryBudget {
  id: string;
  name: string;
  budgetLimit: number;
  color: string;
  iconName: string;
}

let categories: CategoryBudget[] = [
  { id: '1', name: 'Dining Out', budgetLimit: 350, color: '#f59e0b', iconName: 'Utensils' },
  { id: '2', name: 'Groceries', budgetLimit: 500, color: '#10b981', iconName: 'ShoppingBag' },
  { id: '3', name: 'Utilities', budgetLimit: 250, color: '#3b82f6', iconName: 'Zap' },
  { id: '4', name: 'Transport', budgetLimit: 200, color: '#8b5cf6', iconName: 'Car' },
  { id: '5', name: 'Entertainment', budgetLimit: 200, color: '#ec4899', iconName: 'Film' },
  { id: '6', name: 'Shopping', budgetLimit: 300, color: '#14b8a6', iconName: 'Tag' },
  { id: '7', name: 'Subscriptions', budgetLimit: 100, color: '#6366f1', iconName: 'Repeat' },
  { id: '8', name: 'Health & Fitness', budgetLimit: 150, color: '#ef4444', iconName: 'Activity' },
];

// Local Machine Learning Classification Model (TF-IDF & Keyword N-gram engine with learned weight adjustments)
interface MLModelWeight {
  category: string;
  keywords: string[];
  weight: number;
}

let mlModelWeights: MLModelWeight[] = [
  { category: 'Dining Out', keywords: ['starbucks', 'coffee', 'cafe', 'restaurant', 'burger', 'pizza', 'sushi', 'diner', 'mcdonalds', 'chipotle', 'bar', 'bistro', 'food', 'taco', 'bakery'], weight: 1.2 },
  { category: 'Groceries', keywords: ['whole foods', 'trader joe', 'walmart', 'safeway', 'kroger', 'groceries', 'supermarket', 'costco', 'market', 'produce', 'target grocery', 'aldi'], weight: 1.2 },
  { category: 'Utilities', keywords: ['electric', 'water', 'power', 'internet', 'comcast', 'verizon', 'gas bill', 'sewer', 'trash', 'utility', 'energy', 'att bill'], weight: 1.2 },
  { category: 'Transport', keywords: ['uber', 'lyft', 'chevron', 'shell', 'gas station', 'subway', 'metro', 'transit', 'parking', 'toll', 'train ticket', 'exxon', 'bp'], weight: 1.2 },
  { category: 'Entertainment', keywords: ['cinema', 'movie', 'concert', 'steam', 'playstation', 'xbox', 'nintendo', 'bowling', 'ticketmaster', 'museum', 'golf'], weight: 1.2 },
  { category: 'Shopping', keywords: ['amazon', 'target', 'zara', 'nike', 'nordstrom', 'clothing', 'shoes', 'electronics', 'best buy', 'ikea', 'apple store'], weight: 1.2 },
  { category: 'Subscriptions', keywords: ['netflix', 'spotify', 'hulu', 'disney+', 'chatgpt', 'github', 'patreon', 'iCloud', 'youtube premium', 'nyt', 'wsj'], weight: 1.2 },
  { category: 'Health & Fitness', keywords: ['pharmacy', 'cvs', 'walgreens', 'gym', 'fitness', 'doctor', 'dentist', 'clinic', 'hospital', 'copay', 'vitamins'], weight: 1.2 },
];

// Initial Transactions
interface TransactionRecord {
  id: string;
  description: string;
  amount: number;
  predictedCategory: string;
  isCategoryManuallyOverridden: boolean;
  actualCategory?: string;
  confidence: number;
  reasoning: string;
  createdAt: string;
  paymentMethod: string;
  merchant: string;
  payerName: string;
  storeName: string;
}

let transactions: TransactionRecord[] = [
  // --- AUGUST 2026 ---
  {
    id: 'tx-aug-01',
    description: 'Starbucks Coffee - Morning Espresso',
    amount: 6.75,
    predictedCategory: 'Dining Out',
    isCategoryManuallyOverridden: false,
    confidence: 0.94,
    reasoning: 'TF-IDF keyword "starbucks" mapped to Dining Out.',
    createdAt: '2026-08-01T08:30:00.000Z',
    paymentMethod: 'Credit Card (Apple Pay)',
    merchant: 'Starbucks Coffee',
    payerName: 'Alex Johnson',
    storeName: 'Starbucks Reserve'
  },
  {
    id: 'tx-aug-02',
    description: 'Trader Joe\'s Grocery Shopping',
    amount: 142.30,
    predictedCategory: 'Groceries',
    isCategoryManuallyOverridden: false,
    confidence: 0.96,
    reasoning: 'Matched merchant "trader joe" to Groceries.',
    createdAt: '2026-08-01T14:15:00.000Z',
    paymentMethod: 'Debit Card',
    merchant: 'Trader Joe\'s',
    payerName: 'Alex Johnson',
    storeName: 'Trader Joe\'s Market'
  },
  
  // --- JULY 2026 ---
  {
    id: 'tx-jul-01',
    description: 'Apple Store - MacBook Air Accessory & Adapter',
    amount: 329.00,
    predictedCategory: 'Shopping',
    isCategoryManuallyOverridden: false,
    confidence: 0.98,
    reasoning: 'Matched "apple store" to Shopping.',
    createdAt: '2026-07-28T16:45:00.000Z',
    paymentMethod: 'Credit Card',
    merchant: 'Apple Store',
    payerName: 'Jordan Smith',
    storeName: 'Apple Store Fifth Ave'
  },
  {
    id: 'tx-jul-02',
    description: 'Trader Joe\'s Weekly Grocery Run',
    amount: 185.40,
    predictedCategory: 'Groceries',
    isCategoryManuallyOverridden: false,
    confidence: 0.96,
    reasoning: 'Matched "trader joe" to Groceries.',
    createdAt: '2026-07-22T11:20:00.000Z',
    paymentMethod: 'Debit Card',
    merchant: 'Trader Joe\'s',
    payerName: 'Alex Johnson',
    storeName: 'Trader Joe\'s Market'
  },
  {
    id: 'tx-jul-03',
    description: 'City Power & Light - July Utility Bill',
    amount: 135.20,
    predictedCategory: 'Utilities',
    isCategoryManuallyOverridden: false,
    confidence: 0.92,
    reasoning: 'Matched utility keyword.',
    createdAt: '2026-07-15T09:00:00.000Z',
    paymentMethod: 'Bank Transfer (ACH)',
    merchant: 'City Power & Light',
    payerName: 'Jordan Smith',
    storeName: 'City Utility Hub'
  },
  {
    id: 'tx-jul-04',
    description: 'Costco Wholesale Bulk Shopping',
    amount: 278.60,
    predictedCategory: 'Groceries',
    isCategoryManuallyOverridden: false,
    confidence: 0.95,
    reasoning: 'Matched "costco" to Groceries.',
    createdAt: '2026-07-10T13:30:00.000Z',
    paymentMethod: 'Credit Card',
    merchant: 'Costco Wholesale',
    payerName: 'Taylor Lee',
    storeName: 'Costco Wholesale #104'
  },
  {
    id: 'tx-jul-05',
    description: 'Uber Ride to Airport',
    amount: 54.20,
    predictedCategory: 'Transport',
    isCategoryManuallyOverridden: false,
    confidence: 0.96,
    reasoning: 'Matched "uber" to Transport.',
    createdAt: '2026-07-08T06:15:00.000Z',
    paymentMethod: 'Credit Card',
    merchant: 'Uber',
    payerName: 'Alex Johnson',
    storeName: 'Uber Rides'
  },
  {
    id: 'tx-jul-06',
    description: 'Equinox Gym - Monthly Membership Fee',
    amount: 180.00,
    predictedCategory: 'Health & Fitness',
    isCategoryManuallyOverridden: false,
    confidence: 0.94,
    reasoning: 'Matched "gym" to Health & Fitness.',
    createdAt: '2026-07-02T10:00:00.000Z',
    paymentMethod: 'Credit Card',
    merchant: 'Equinox Gym',
    payerName: 'Taylor Lee',
    storeName: 'Equinox Club'
  },

  // --- JUNE 2026 ---
  {
    id: 'tx-jun-01',
    description: 'Trader Joe\'s Grocery Shopping',
    amount: 112.80,
    predictedCategory: 'Groceries',
    isCategoryManuallyOverridden: false,
    confidence: 0.96,
    reasoning: 'Matched "trader joe" to Groceries.',
    createdAt: '2026-06-25T17:10:00.000Z',
    paymentMethod: 'Debit Card',
    merchant: 'Trader Joe\'s',
    payerName: 'Alex Johnson',
    storeName: 'Trader Joe\'s Market'
  },
  {
    id: 'tx-jun-02',
    description: 'Chipotle Mexican Grill - Family Lunch',
    amount: 48.90,
    predictedCategory: 'Dining Out',
    isCategoryManuallyOverridden: false,
    confidence: 0.93,
    reasoning: 'Matched "chipotle" to Dining Out.',
    createdAt: '2026-06-18T12:45:00.000Z',
    paymentMethod: 'Credit Card',
    merchant: 'Chipotle',
    payerName: 'Jordan Smith',
    storeName: 'Chipotle Grill'
  },
  {
    id: 'tx-jun-03',
    description: 'City Power & Light - June Electric Bill',
    amount: 98.40,
    predictedCategory: 'Utilities',
    isCategoryManuallyOverridden: false,
    confidence: 0.91,
    reasoning: 'Matched utility keyword.',
    createdAt: '2026-06-14T09:00:00.000Z',
    paymentMethod: 'Bank Transfer (ACH)',
    merchant: 'City Power & Light',
    payerName: 'Jordan Smith',
    storeName: 'City Utility Hub'
  },
  {
    id: 'tx-jun-04',
    description: 'Chevron Gas Station - Long Distance Refill',
    amount: 52.00,
    predictedCategory: 'Transport',
    isCategoryManuallyOverridden: false,
    confidence: 0.92,
    reasoning: 'Matched "chevron" to Transport.',
    createdAt: '2026-06-08T15:20:00.000Z',
    paymentMethod: 'Debit Card',
    merchant: 'Chevron',
    payerName: 'Taylor Lee',
    storeName: 'Chevron ExtraMile'
  },
  {
    id: 'tx-jun-05',
    description: 'Netflix & Spotify Streaming Bundle',
    amount: 25.98,
    predictedCategory: 'Subscriptions',
    isCategoryManuallyOverridden: false,
    confidence: 0.97,
    reasoning: 'Matched recurring streaming subscriptions.',
    createdAt: '2026-06-02T04:00:00.000Z',
    paymentMethod: 'Credit Card',
    merchant: 'Netflix / Spotify',
    payerName: 'Alex Johnson',
    storeName: 'Digital Subscriptions'
  }
];

// Persistent File Storage (.data/data.json)
const DATA_DIR = path.join(process.cwd(), '.data');
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch {}
}
const DATA_FILE = path.join(DATA_DIR, 'data.json');
const ROOT_DATA_FILE = path.join(process.cwd(), 'data.json');

function saveDataToDisk() {
  try {
    const dataToSave = {
      transactions,
      categories,
      mlModelWeights,
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save data to disk:', err);
  }
}

function loadDataFromDisk() {
  try {
    let targetPath = DATA_FILE;
    if (!fs.existsSync(DATA_FILE) && fs.existsSync(ROOT_DATA_FILE)) {
      targetPath = ROOT_DATA_FILE;
    }

    if (fs.existsSync(targetPath)) {
      const raw = fs.readFileSync(targetPath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.transactions)) {
        transactions = parsed.transactions;
      }
      if (Array.isArray(parsed.categories)) {
        categories = parsed.categories;
      }
      if (Array.isArray(parsed.mlModelWeights)) {
        mlModelWeights = parsed.mlModelWeights;
      }
      console.log(`Loaded ${transactions.length} transaction(s) and ${categories.length} category/categories from local disk (${targetPath}).`);
    } else {
      saveDataToDisk();
    }
  } catch (err) {
    console.error('Failed to load data from disk:', err);
  }
}

// Load persisted user data on startup
loadDataFromDisk();

// Helper: Predict category using Local ML + Gemini AI fallback
async function predictExpenseCategory(description: string, amount: number) {
  const cleanDesc = description.toLowerCase().trim();
  
  // First calculate local ML scores
  const scores: { category: string; score: number }[] = categories.map((cat) => {
    const weightObj = mlModelWeights.find((m) => m.category === cat.name);
    let matchScore = 0;
    if (weightObj) {
      weightObj.keywords.forEach((kw) => {
        if (cleanDesc.includes(kw)) {
          matchScore += 1.0 * weightObj.weight;
        }
      });
    }
    return { category: cat.name, score: matchScore };
  });

  scores.sort((a, b) => b.score - a.score);
  const bestLocal = scores[0];

  // If local ML has high confidence match
  if (bestLocal && bestLocal.score > 0.8) {
    const confidence = Math.min(0.98, 0.75 + bestLocal.score * 0.15);
    return {
      predictedCategory: bestLocal.category,
      confidence: parseFloat(confidence.toFixed(2)),
      reasoning: `Local ML.NET model matched keywords in "${description}" with weight score ${bestLocal.score.toFixed(1)}.`,
      method: 'ML_MODEL' as const,
      topScores: scores.slice(0, 3)
    };
  }

  // If Gemini API is available, try Gemini AI categorization
  if (aiClient) {
    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are an expense categorization model inside a .NET application.
Categorize this transaction into exactly ONE of these categories:
${categories.map(c => c.name).join(', ')}

Transaction Details:
Description: "${description}"
Amount: $${amount}

Return ONLY a JSON object with this exact structure:
{
  "predictedCategory": "Category Name",
  "confidence": 0.95,
  "reasoning": "Brief explanation why this category fits",
  "merchant": "Inferred merchant name"
}`,
        config: {
          responseMimeType: 'application/json'
        }
      });

      if (response.text) {
        const parsed = JSON.parse(response.text.trim());
        if (parsed.predictedCategory && categories.some(c => c.name === parsed.predictedCategory)) {
          return {
            predictedCategory: parsed.predictedCategory,
            confidence: parsed.confidence || 0.90,
            reasoning: parsed.reasoning || `Gemini AI classified transaction based on financial semantics.`,
            method: 'GEMINI_AI' as const,
            topScores: scores.slice(0, 3)
          };
        }
      }
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      if (errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED')) {
        console.log('Gemini API quota rate-limited. Gracefully using local ML keyword model.');
      } else {
        console.warn('Gemini prediction notice (using local fallback):', errMsg.substring(0, 100));
      }
    }
  }

  // Heuristic / Fallback
  let fallbackCategory = 'Shopping';
  if (amount > 100 && (cleanDesc.includes('bill') || cleanDesc.includes('service') || cleanDesc.includes('fee'))) {
    fallbackCategory = 'Utilities';
  } else if (cleanDesc.includes('food') || cleanDesc.includes('eat') || cleanDesc.includes('drink')) {
    fallbackCategory = 'Dining Out';
  } else if (cleanDesc.includes('gas') || cleanDesc.includes('ride') || cleanDesc.includes('car')) {
    fallbackCategory = 'Transport';
  }

  return {
    predictedCategory: fallbackCategory,
    confidence: 0.72,
    reasoning: `Rule-based classifier fallback selected "${fallbackCategory}" for transaction $${amount}.`,
    method: 'KEYWORD_WEIGHT' as const,
    topScores: scores.slice(0, 3)
  };
}

// REST API ROUTES

// 1. Predict Category API
app.post('/api/predict-category', async (req, res) => {
  try {
    const { description, amount } = req.body;
    if (!description || typeof amount !== 'number') {
      return res.status(400).json({ error: 'Description and amount are required.' });
    }
    const result = await predictExpenseCategory(description, amount);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to predict category' });
  }
});

// 2. Get Transactions
app.get('/api/transactions', (req, res) => {
  const { category, store, payer, search, page = '1', limit = '20', month, period, startDate, endDate } = req.query;
  let filtered = [...transactions];

  // Specific Month filter (e.g., '2026-08', '2026-07') or 'ALL'
  if (month && typeof month === 'string' && month !== 'ALL') {
    filtered = filtered.filter(t => t.createdAt && t.createdAt.startsWith(month));
  } else if (period || (startDate && endDate)) {
    // Optional period date filtering fallback
    const now = Date.now();
    let currentStart = 0;
    let currentEnd = now;

    if (period === 'weekly') {
      currentStart = now - 7 * 86400 * 1000;
    } else if (period === 'monthly') {
      currentStart = now - 30 * 86400 * 1000;
    } else if (period === 'custom' && startDate && endDate) {
      currentStart = new Date(startDate as string).getTime();
      currentEnd = new Date(endDate as string).getTime() + 86399999;
    }

    if (currentStart > 0) {
      filtered = filtered.filter(t => {
        const time = new Date(t.createdAt).getTime();
        return time >= currentStart && time <= currentEnd;
      });
    }
  }

  // Category filter
  if (category && typeof category === 'string' && category !== 'All') {
    filtered = filtered.filter(t => t.predictedCategory === category || t.actualCategory === category);
  }

  // Store / Market filter
  if (store && typeof store === 'string' && store !== 'All') {
    filtered = filtered.filter(t => (t.storeName && t.storeName === store) || (t.merchant && t.merchant === store));
  }

  // Payer Name filter
  if (payer && typeof payer === 'string' && payer !== 'All') {
    filtered = filtered.filter(t => t.payerName && t.payerName === payer);
  }

  // Search query filter
  if (search && typeof search === 'string' && search.trim() !== '') {
    const q = search.toLowerCase();
    filtered = filtered.filter(t => 
      t.description.toLowerCase().includes(q) || 
      (t.merchant && t.merchant.toLowerCase().includes(q)) ||
      (t.storeName && t.storeName.toLowerCase().includes(q)) ||
      (t.payerName && t.payerName.toLowerCase().includes(q)) ||
      t.predictedCategory.toLowerCase().includes(q)
    );
  }

  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const pageNum = parseInt(page as string, 10) || 1;
  const limitNum = parseInt(limit as string, 10) || 20;
  const startIndex = (pageNum - 1) * limitNum;
  const paginated = filtered.slice(startIndex, startIndex + limitNum);

  // Extract all unique stores and payers for dropdown list options
  const availableStores = Array.from(new Set(
    transactions.map(t => t.storeName || t.merchant).filter(Boolean) as string[]
  )).sort();

  const availablePayers = Array.from(new Set(
    transactions.map(t => t.payerName).filter(Boolean) as string[]
  )).sort();

  res.json({
    transactions: paginated,
    totalCount: filtered.length,
    page: pageNum,
    totalPages: Math.ceil(filtered.length / limitNum) || 1,
    availableStores,
    availablePayers
  });
});

// 3. Log New Transaction
app.post('/api/transactions', async (req, res) => {
  try {
    const { description, amount, category, paymentMethod, merchant, payerName, storeName } = req.body;
    if (!description || typeof amount !== 'number') {
      return res.status(400).json({ error: 'Description and amount are required.' });
    }

    let finalCategory = category;
    let confidence = 1.0;
    let reasoning = 'User explicitly selected category.';

    if (!finalCategory) {
      const pred = await predictExpenseCategory(description, amount);
      finalCategory = pred.predictedCategory;
      confidence = pred.confidence;
      reasoning = pred.reasoning;
    }

    const resolvedStore = storeName || merchant || description.split(' - ')[0] || 'General Store';

    const newTx: TransactionRecord = {
      id: `tx-${Date.now()}`,
      description,
      amount,
      predictedCategory: finalCategory,
      isCategoryManuallyOverridden: !!category,
      confidence,
      reasoning,
      createdAt: new Date().toISOString(),
      paymentMethod: paymentMethod || 'Credit Card',
      merchant: resolvedStore,
      payerName: payerName || 'Self',
      storeName: resolvedStore
    };

    transactions.unshift(newTx);
    saveDataToDisk();
    res.status(201).json(newTx);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save transaction' });
  }
});

// 4. Update Transaction (Full Field Editing / Category Correction / ML Feedback)
app.put('/api/transactions/:id', (req, res) => {
  const { id } = req.params;
  const { category, description, amount, payerName, storeName, paymentMethod, createdAt } = req.body;
  const index = transactions.findIndex(t => t.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  const tx = transactions[index];
  if (category && category !== tx.predictedCategory) {
    tx.actualCategory = category;
    tx.predictedCategory = category;
    tx.isCategoryManuallyOverridden = true;
    tx.reasoning = `Category updated by user feedback. ML model weights updated for key terms in "${tx.description}".`;

    const cleanWords = (description || tx.description).toLowerCase().split(/[\s-]+/).filter(w => w.length > 2);
    const modelWeightObj = mlModelWeights.find(m => m.category === category);
    if (modelWeightObj) {
      cleanWords.forEach(word => {
        if (!modelWeightObj.keywords.includes(word)) {
          modelWeightObj.keywords.push(word);
        }
      });
      modelWeightObj.weight += 0.1;
    }
  }

  if (description !== undefined) tx.description = description;
  if (typeof amount === 'number' && !isNaN(amount)) tx.amount = amount;
  if (payerName !== undefined) tx.payerName = payerName;
  if (storeName !== undefined) {
    tx.storeName = storeName;
    tx.merchant = storeName;
  }
  if (paymentMethod !== undefined) tx.paymentMethod = paymentMethod;
  if (createdAt !== undefined) tx.createdAt = createdAt;

  saveDataToDisk();
  res.json(tx);
});

// 5a. Delete All Transactions (Clear History)
app.delete('/api/transactions', (req, res) => {
  const count = transactions.length;
  transactions = [];
  saveDataToDisk();
  res.json({ success: true, count, message: 'All transactions cleared successfully.' });
});

// 5b. Delete Single Transaction
app.delete('/api/transactions/:id', (req, res) => {
  const { id } = req.params;
  const initialCount = transactions.length;
  transactions = transactions.filter(t => t.id !== id);
  const deleted = transactions.length < initialCount;
  saveDataToDisk();
  res.json({ success: deleted, id });
});

// 6. Analytics Summary Endpoint (with Month Selection & Category Filters)
app.get('/api/analytics/summary', (req, res) => {
  const { selectedMonth, storeCategory, payerCategory } = req.query;

  // Extract all unique available months (YYYY-MM) from transaction records
  const monthSet = new Set<string>();
  transactions.forEach(t => {
    if (t.createdAt) {
      const ym = t.createdAt.substring(0, 7);
      if (/^\d{4}-\d{2}$/.test(ym)) {
        monthSet.add(ym);
      }
    }
  });

  const currentYM = new Date().toISOString().substring(0, 7);
  monthSet.add(currentYM);
  const availableMonths = Array.from(monthSet).sort().reverse();

  const currentSelectedMonth = (selectedMonth as string) || availableMonths[0] || currentYM;

  let filteredTxs = [...transactions];
  if (currentSelectedMonth !== 'ALL') {
    filteredTxs = transactions.filter(t => t.createdAt && t.createdAt.startsWith(currentSelectedMonth));
  }

  // Calculate totals for filtered transactions
  const totalSpent = filteredTxs.reduce((sum, t) => sum + t.amount, 0);
  const transactionCount = filteredTxs.length;
  const avgTransaction = transactionCount > 0 ? totalSpent / transactionCount : 0;

  // Category breakdowns for filtered transactions
  const categoryTotals = categories.map(cat => {
    const catTxs = filteredTxs.filter(t => t.predictedCategory === cat.name || t.actualCategory === cat.name);
    const total = catTxs.reduce((sum, t) => sum + t.amount, 0);
    return {
      category: cat.name,
      total: parseFloat(total.toFixed(2)),
      count: catTxs.length,
      budgetLimit: cat.budgetLimit,
      color: cat.color
    };
  });

  const monthlyBudget = categories.reduce((sum, c) => sum + c.budgetLimit, 0);
  const totalBudgetSpentPercentage = monthlyBudget > 0 ? (totalSpent / monthlyBudget) * 100 : 0;

  // Merchant / Store breakdown for filtered transactions (supports category filter)
  let vendorTxs = [...filteredTxs];
  if (storeCategory && storeCategory !== 'All') {
    vendorTxs = filteredTxs.filter(t => (t.predictedCategory === storeCategory || t.actualCategory === storeCategory));
  }

  const merchantMap: Record<string, { total: number; count: number; items: Set<string> }> = {};
  vendorTxs.forEach(t => {
    const m = t.storeName || t.merchant || 'General Store';
    if (!merchantMap[m]) merchantMap[m] = { total: 0, count: 0, items: new Set() };
    merchantMap[m].total += t.amount;
    merchantMap[m].count += 1;
    if (t.description) merchantMap[m].items.add(t.description);
  });

  const topVendors = Object.entries(merchantMap)
    .map(([merchant, data]) => ({
      merchant,
      total: parseFloat(data.total.toFixed(2)),
      count: data.count,
      items: Array.from(data.items).slice(0, 5)
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // Payer breakdown for filtered transactions (supports category filter)
  let payerTxs = [...filteredTxs];
  if (payerCategory && payerCategory !== 'All') {
    payerTxs = filteredTxs.filter(t => (t.predictedCategory === payerCategory || t.actualCategory === payerCategory));
  }

  const payerMap: Record<string, { total: number; count: number; items: Set<string> }> = {};
  payerTxs.forEach(t => {
    const p = t.payerName || 'Unassigned';
    if (!payerMap[p]) payerMap[p] = { total: 0, count: 0, items: new Set() };
    payerMap[p].total += t.amount;
    payerMap[p].count += 1;
    if (t.description) payerMap[p].items.add(t.description);
  });

  const topPayers = Object.entries(payerMap)
    .map(([payer, data]) => ({
      payer,
      total: parseFloat(data.total.toFixed(2)),
      count: data.count,
      items: Array.from(data.items).slice(0, 5)
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  res.json({
    totalSpent: parseFloat(totalSpent.toFixed(2)),
    transactionCount,
    avgTransaction: parseFloat(avgTransaction.toFixed(2)),
    categoryTotals,
    monthlyBudget,
    totalBudgetSpentPercentage: parseFloat(totalBudgetSpentPercentage.toFixed(1)),
    aiInsights: [],
    topVendors,
    topPayers,
    availableMonths,
    selectedMonth: currentSelectedMonth
  });
});

// 7. Get & Update Categories
app.get('/api/categories', (req, res) => {
  res.json(categories);
});

app.put('/api/categories/:id', (req, res) => {
  const { id } = req.params;
  const { budgetLimit } = req.body;
  const cat = categories.find(c => c.id === id);
  if (!cat) return res.status(404).json({ error: 'Category not found' });
  if (typeof budgetLimit === 'number') {
    cat.budgetLimit = budgetLimit;
  }
  saveDataToDisk();
  res.json(cat);
});

// 8. ASP.NET Core AI Mentor Chatbot
app.post('/api/aspnet/ask-mentor', async (req, res) => {
  try {
    const { question, currentFile } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'Question is required.' });
    }

    if (!aiClient) {
      // Fallback response if Gemini API key isn't loaded
      return res.json({
        answer: `In C# / ASP.NET Core, ${question} is a core architecture pattern.

Key Concept Highlights:
• Dependency Injection (DI) allows services like DbContext or MLPredictionService to be loosely coupled.
• Async/Await prevents thread starvation on IIS/Kestrel servers during database or IO operations.
• Entity Framework Core provides LINQ-to-SQL translation with automatic Change Tracking.`,
        codeExample: `// Example C# ASP.NET Core Registration in Program.cs
builder.Services.AddScoped<IExpenseRepository, ExpenseRepository>();
builder.Services.AddSingleton<IPredictionService, MLPredictionService>();`
      });
    }

    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are a Senior .NET Architect and Data Science Mentor guiding a student building the "Smart Spending Log" ASP.NET Core Web API + ML.NET application.

The student asks: "${question}"
${currentFile ? `Current file context: ${currentFile}` : ''}

Provide a clear, engaging explanation covering:
1. Direct answer using C#/.NET terminology (Dependency Injection, Async/Await, EF Core, Controllers, DTOs, LINQ, Middleware).
2. Why this design pattern is chosen in production .NET engineering.
3. A concise, clean C# code snippet demonstrating the concept.`,
      config: {
        systemInstruction: 'Act as a Senior .NET Architect and Data Science Mentor. Be concise, highly educational, line-by-line clear, and encouraging.'
      }
    });

    res.json({
      answer: response.text || 'Unable to generate mentor response.',
      codeExample: null
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to contact mentor AI.' });
  }
});

// 9. Deep Analytics & Month-over-Month Comparison Endpoint
app.get('/api/analytics/deep', (req, res) => {
  const { month1: reqM1, month2: reqM2, selectedMonth: reqSelectedMonth, month: reqMonth } = req.query;

  // Find all unique months (YYYY-MM) in transactions
  const monthSet = new Set<string>();
  transactions.forEach(t => {
    if (t.createdAt) {
      const ym = t.createdAt.substring(0, 7); // 'YYYY-MM'
      if (/^\d{4}-\d{2}$/.test(ym)) {
        monthSet.add(ym);
      }
    }
  });

  const availableMonths = Array.from(monthSet).sort().reverse();
  const m1 = (reqM1 as string) || availableMonths[0] || new Date().toISOString().substring(0, 7);
  const m2 = (reqM2 as string) || availableMonths[1] || availableMonths[0] || new Date().toISOString().substring(0, 7);

  const scopeMonth = (reqSelectedMonth as string) || (reqMonth as string) || 'ALL';

  // Helper for formatting YYYY-MM to readable string e.g. "July 2026"
  const formatMonthLabel = (ymStr: string) => {
    if (ymStr === 'ALL') return 'All Time Aggregate';
    try {
      const [y, m] = ymStr.split('-').map(Number);
      const date = new Date(y, m - 1, 1);
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } catch {
      return ymStr;
    }
  };

  // Determine scoped transactions for payer & store breakdown
  let scopedTransactions = [...transactions];
  if (scopeMonth && scopeMonth !== 'ALL') {
    scopedTransactions = transactions.filter(t => t.createdAt && t.createdAt.startsWith(scopeMonth));
  }

  // 1. Payer Breakdown for scoped transactions
  const payerMap: Record<string, { totalSpent: number; count: number; catMap: Record<string, number>; storeMap: Record<string, number> }> = {};
  let grandTotal = 0;

  scopedTransactions.forEach(t => {
    const p = t.payerName || 'Self';
    grandTotal += t.amount;
    if (!payerMap[p]) {
      payerMap[p] = { totalSpent: 0, count: 0, catMap: {}, storeMap: {} };
    }
    payerMap[p].totalSpent += t.amount;
    payerMap[p].count += 1;

    const cat = t.predictedCategory || t.actualCategory || 'Uncategorized';
    payerMap[p].catMap[cat] = (payerMap[p].catMap[cat] || 0) + t.amount;

    const st = t.storeName || t.merchant || 'General Store';
    payerMap[p].storeMap[st] = (payerMap[p].storeMap[st] || 0) + t.amount;
  });

  const payerBreakdown = Object.entries(payerMap).map(([payerName, data]) => {
    const topCatEntry = Object.entries(data.catMap).sort((a, b) => b[1] - a[1])[0];
    const topStoreEntry = Object.entries(data.storeMap).sort((a, b) => b[1] - a[1])[0];

    return {
      payerName,
      totalSpent: parseFloat(data.totalSpent.toFixed(2)),
      count: data.count,
      percentageOfTotal: grandTotal > 0 ? parseFloat(((data.totalSpent / grandTotal) * 100).toFixed(1)) : 0,
      topCategory: topCatEntry ? topCatEntry[0] : 'None',
      topStore: topStoreEntry ? topStoreEntry[0] : 'None'
    };
  }).sort((a, b) => b.totalSpent - a.totalSpent);

  const topSpendingPayer = payerBreakdown[0] || null;

  // 2. Key Insights for scoped transactions
  let highestSinglePurchase: TransactionRecord | null = null;
  if (scopedTransactions.length > 0) {
    highestSinglePurchase = [...scopedTransactions].sort((a, b) => b.amount - a.amount)[0];
  }

  // Top spending store overall
  const storeTotalsMap: Record<string, { total: number; count: number }> = {};
  scopedTransactions.forEach(t => {
    const st = t.storeName || t.merchant || 'Unknown';
    if (!storeTotalsMap[st]) storeTotalsMap[st] = { total: 0, count: 0 };
    storeTotalsMap[st].total += t.amount;
    storeTotalsMap[st].count += 1;
  });

  const sortedStores = Object.entries(storeTotalsMap).sort((a, b) => b[1].total - a[1].total);
  const topSpendingStore = sortedStores[0] ? {
    storeName: sortedStores[0][0],
    totalSpent: parseFloat(sortedStores[0][1].total.toFixed(2)),
    count: sortedStores[0][1].count
  } : null;

  // Daily & Weekly Averages
  const datesSet = new Set<string>();
  transactions.forEach(t => {
    if (t.createdAt) datesSet.add(t.createdAt.substring(0, 10));
  });

  const activeDaysCount = Math.max(1, datesSet.size);
  const avgDailySpend = parseFloat((grandTotal / activeDaysCount).toFixed(2));
  const avgWeeklySpend = parseFloat((avgDailySpend * 7).toFixed(2));

  // 3. Month-over-Month Comparison
  const m1Txs = transactions.filter(t => t.createdAt && t.createdAt.startsWith(m1));
  const m2Txs = transactions.filter(t => t.createdAt && t.createdAt.startsWith(m2));

  const month1Total = m1Txs.reduce((sum, t) => sum + t.amount, 0);
  const month2Total = m2Txs.reduce((sum, t) => sum + t.amount, 0);
  const monthDiff = month1Total - month2Total;
  const monthPctChange = month2Total > 0 ? ((month1Total - month2Total) / month2Total) * 100 : (month1Total > 0 ? 100 : 0);

  // Category comparison between month1 and month2
  const categoryComparison = categories.map(cat => {
    const c1 = m1Txs.filter(t => (t.predictedCategory === cat.name || t.actualCategory === cat.name))
                    .reduce((sum, t) => sum + t.amount, 0);
    const c2 = m2Txs.filter(t => (t.predictedCategory === cat.name || t.actualCategory === cat.name))
                    .reduce((sum, t) => sum + t.amount, 0);
    const diff = c1 - c2;
    const pct = c2 > 0 ? ((c1 - c2) / c2) * 100 : (c1 > 0 ? 100 : 0);

    return {
      category: cat.name,
      color: cat.color,
      month1Total: parseFloat(c1.toFixed(2)),
      month2Total: parseFloat(c2.toFixed(2)),
      difference: parseFloat(diff.toFixed(2)),
      percentageChange: parseFloat(pct.toFixed(1))
    };
  });

  // 4. All Months History (for overall insights section)
  const allMonthsHistory = availableMonths.map(ym => {
    const monthTxs = transactions.filter(t => t.createdAt && t.createdAt.startsWith(ym));
    const totalSpent = monthTxs.reduce((sum, t) => sum + t.amount, 0);
    return {
      month: ym,
      monthLabel: formatMonthLabel(ym),
      totalSpent: parseFloat(totalSpent.toFixed(2)),
      count: monthTxs.length
    };
  });

  // 5. All-Time Category Breakdown
  const allTimeCategoryBreakdown = categories.map(cat => {
    const catTxs = transactions.filter(t => t.predictedCategory === cat.name || t.actualCategory === cat.name);
    const totalSpent = catTxs.reduce((sum, t) => sum + t.amount, 0);
    const percentageOfTotal = grandTotal > 0 ? (totalSpent / grandTotal) * 100 : 0;
    return {
      category: cat.name,
      color: cat.color,
      totalSpent: parseFloat(totalSpent.toFixed(2)),
      count: catTxs.length,
      percentageOfTotal: parseFloat(percentageOfTotal.toFixed(1))
    };
  }).sort((a, b) => b.totalSpent - a.totalSpent);

  res.json({
    scopeMonth,
    scopeTransactions: scopedTransactions,
    payerBreakdown,
    topSpendingPayer,
    highestSinglePurchase,
    topSpendingStore,
    avgDailySpend,
    avgWeeklySpend,
    totalAllTimeSpent: parseFloat(grandTotal.toFixed(2)),
    activeDaysCount,
    allMonthsHistory,
    allTimeCategoryBreakdown,
    monthComparison: {
      availableMonths,
      month1: m1,
      month2: m2,
      month1Label: formatMonthLabel(m1),
      month2Label: formatMonthLabel(m2),
      month1Total: parseFloat(month1Total.toFixed(2)),
      month2Total: parseFloat(month2Total.toFixed(2)),
      difference: parseFloat(monthDiff.toFixed(2)),
      percentageChange: parseFloat(monthPctChange.toFixed(1)),
      categoryComparison
    }
  });
});

// 10. Delete / Purge Transactions by Month
app.delete('/api/transactions/month/:monthStr', (req, res) => {
  const { monthStr } = req.params; // e.g., '2026-06'
  if (!monthStr || !/^\d{4}-\d{2}$/.test(monthStr)) {
    return res.status(400).json({ error: 'Invalid month format. Expected YYYY-MM.' });
  }

  const initialCount = transactions.length;
  transactions = transactions.filter(t => !t.createdAt || !t.createdAt.startsWith(monthStr));
  const deletedCount = initialCount - transactions.length;
  saveDataToDisk();

  res.json({
    deletedCount,
    remainingCount: transactions.length,
    message: `Successfully purged ${deletedCount} transaction(s) for ${monthStr}.`
  });
});

// Start Server Setup (Vite Middleware for Dev / Static Files for Prod)
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        watch: {
          ignored: ['**/.data/**', '**/data.json', '**/data*.json']
        }
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

start();
