# SSL — Smart Spending Log
> **An Intelligent Hybrid AI/ML Expense Analytics Platform featuring Online Supervised Learning, Bayesian Term-Weight Retraining, and LLM-Powered Semantic Fallbacks.**



---

## 📌 Executive Summary

**SSL (Smart Spending Log)** is a full-stack financial tracking and predictive analytical dashboard designed to bridge **embedded lightweight Machine Learning** with modern **Generative AI**. 

Engineered with a **hybrid dual-engine classifier**, SSL categorizes financial transactions in sub-millisecond latency using local Statistical Term-Weight vectors. When encountering ambiguous, unseen, or domain-complex merchant descriptions, the engine smoothly triggers a **Google Gemini 2.5 Flash LLM zero-shot inference pipeline**. 

Every manual correction made by the user initiates an **Active Learning Reinforcement Loop**, incrementally tuning token weights in real-time and persisting the refined model parameters back to disk.

---

## 🧠 Machine Learning & AI Architecture

```
                                  ┌───────────────────────────┐
                                  │   New Expense Input       │
                                  │  (Description + Amount)   │
                                  └─────────────┬─────────────┘
                                                │
                                                ▼
                                  ┌───────────────────────────┐
                                  │   Tokenization & Clean    │
                                  │  n-gram Extraction (3+ch) │
                                  └─────────────┬─────────────┘
                                                │
                                                ▼
                                  ┌───────────────────────────┐
                                  │ Local ML Classifier       │
                                  │ Weighted Vector Scoring   │
                                  └─────────────┬─────────────┘
                                                │
                                       Confidence Score P(c|d)
                                                │
                       ┌────────────────────────┴────────────────────────┐
                       ▼                                                 ▼
             P(c|d) ≥ 0.65 (High)                              P(c|d) < 0.65 (Low)
       ┌───────────────────────────────┐               ┌───────────────────────────────┐
       │ Return Local ML Category      │               │ Trigger Gemini 2.5 LLM        │
       │ Fast Path (<1ms)              │               │ Zero-Shot Context Classifier  │
       └───────────────┬───────────────┘               └───────────────┬───────────────┘
                       │                                               │
                       └───────────────────────┬───────────────────────┘
                                               │
                                               ▼
                                 ┌───────────────────────────┐
                                 │ Display & Log Transaction │
                                 └─────────────┬─────────────┘
                                               │
                                    User Feedback Override?
                                               │
                                               ▼
                                 ┌───────────────────────────┐
                                 │ Active Online Retraining  │
                                 │ ΔW(w, c) += 1.5           │
                                 │ Persist Model to Data.json│
                                 └───────────────────────────┘
```

### 1. Local Supervised n-Gram Vector Classifier
The primary local engine utilizes a dictionary of category weight vectors $W(w, c)$, mapping extracted token strings $w \in D$ (minimum length $\ge 3$) to financial categories $c \in C$.

* **Token Scoring Function**:
  $$Score(c) = \sum_{w \in D} W(w, c)$$

* **Softmax Confidence Calculation**:
  $$P(c | D) = \frac{\exp(Score(c))}{\sum_{c' \in C} \exp(Score(c'))}$$

### 2. Zero-Shot Gemini LLM Fallback Pipeline
If the local model confidence $P(c | D) < \tau$ (where threshold $\tau = 0.65$), SSL executes an automated JSON-structured fallback query to **Google Gemini 2.5 Flash**. The LLM considers both textual semantics (e.g., *"Uber Eats Trip"* $\rightarrow$ *"Food & Dining"*) and monetary magnitude context to suggest the optimal classification.

### 3. Online Active Learning & Weight Persist
When a user manually modifies any transaction category in the interactive grid:
1. The engine extracts clean sub-tokens $w_1, w_2, \dots$ from the transaction description.
2. The weight vector for the selected target category $c_{target}$ is updated:
   $$W(w_i, c_{target}) \leftarrow W(w_i, c_{target}) + 1.5$$
3. Model weight state and transaction entries are serialized directly to `data.json` for persistent deployment.

---

## ✨ Key System Features

| Feature | Description | Architecture Component |
| :--- | :--- | :--- |
| 🏷️ **Hybrid Classification** | Dual-tier classification using Naïve n-gram local heuristics & Gemini LLM | `server.ts` / `predictExpenseCategory` |
| 📊 **Category-Filtered Analytics** | Filter Top Payers and Top Merchant Stores by specific expenditure categories | `AnalyticsDashboard.tsx` |
| ⏳ **Multi-Period Time Scope** | Toggle analytics across Lifetime Aggregate (`ALL`) or specific monthly horizons | `AnalyticsPage.tsx` |
| ✏️ **Full Grid CRUD Editing** | Direct inline mutation of Description, Payer, Store, Amount, Category, Date & Method | `TransactionGrid.tsx` |
| 💾 **Disk Serialization** | Instant local filesystem backup (`data.json`) ensuring 100% data retention | `server.ts` / `saveDataToDisk` |
| 📈 **Deep Month-over-Month** | Variance detection, category drift analysis, and budget overspend warnings | `AnalyticsPage.tsx` |

---

## 🛠️ Tech Stack

### **Frontend**
* **Framework**: React 18 with TypeScript
* **Styling**: Tailwind CSS
* **Icons**: Lucide React
* **Charts & Visualizations**: Recharts, D3.js
* **Animations**: Motion (`motion/react`)

### **Backend & Machine Learning**
* **Runtime**: Node.js + Express (TypeScript with `tsx` / `esbuild`)
* **AI Engine**: `@google/genai` (Google Gemini 2.5 Flash SDK)
* **Storage Engine**: Serialized File Buffer (`data.json`) with graceful fallback recovery

---

## 🚀 Getting Started

### Prerequisites
* **Node.js**: v18.x or higher
* **npm**: v9.x or higher
* **Gemini API Key** *(Optional, for LLM fallbacks)*: Defined in `.env` as `GEMINI_API_KEY`

### 1. Installation

```bash
# Clone repository
git clone https://github.com/your-username/smart-spending-log.git
cd smart-spending-log

# Install npm dependencies
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```env
GEMINI_API_KEY=your_google_gemini_api_key_here
PORT=3000
```

### 3. Running the Server

```bash
# Start development server (Node.js + Express + Vite middleware)
npm run dev
```

*The application will launch locally at `http://localhost:3000`.*

---

## 📡 REST API Reference

| Endpoint | Method | Payload / Params | Description |
| :--- | :--- | :--- | :--- |
| `/api/transactions` | `GET` | `?month=YYYY-MM` | Fetch transactions (all or month-scoped) |
| `/api/transactions` | `POST` | `{ description, amount, payerName, storeName, paymentMethod }` | Log expense with AI auto-classification |
| `/api/transactions/:id` | `PUT` | `{ description, amount, payerName, storeName, category, paymentMethod, createdAt }` | Update transaction & retrain ML weights |
| `/api/transactions/:id` | `DELETE` | `id` | Delete specific transaction record |
| `/api/analytics/summary` | `GET` | `?month=YYYY-MM` | Dashboard KPI summary & category totals |
| `/api/analytics/deep` | `GET` | `?selectedMonth=YYYY-MM&month1=YYYY-MM&month2=YYYY-MM` | Deep analytics, store/payer scopes & MoM comparison |

---
