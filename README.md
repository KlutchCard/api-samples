# Klutch API Samples

Welcome to the Klutch API samples repository! This collection contains practical tutorials and code examples demonstrating how to leverage the Klutch API to build innovative financial control features.

## 📚 Tutorials

### 1. Differential Budget
**Location:** `differential-budget/`

Learn how to intelligently allocate budget across spending categories. This tutorial demonstrates:
- Querying transactions and spending data via GraphQL
- Categorizing transaction data to understand spending patterns
- Creating dynamic transaction rules that enforce budget limits
- Allocating monthly payments proportionally across spending categories based on historical data

**Use Case:** Automatically enforce spending limits across different merchant categories (e.g., dining, shopping, entertainment) based on user-defined budget allocation.

**Key Features:**
- Accesses transaction history and spending categories
- Calculates spending percentages per category
- Creates transaction rules to enforce budget limits

### 2. Swipe Twice
**Location:** `swipe-twice/`

Implement a smart control mechanism that adds friction to high-risk transactions. This tutorial shows:
- Setting up webhook handlers to monitor transaction events in real-time
- Detecting e-commerce transactions during specific time windows
- Automatically declining transactions on first attempt and allowing retry
- Preventing impulsive purchases by requiring customer confirmation

**Use Case:** Decline e-commerce transactions at night on the first attempt, requiring the user to "swipe twice" (retry) to prevent late-night impulse purchases.

**Key Features:**
- Real-time transaction event processing
- Time-aware transaction handling
- Transaction decline and approval logic

### 3. AI Product Categorization
**Location:** `ai-product-categorization/`

Leverage AI to automatically categorize products and enrich transaction data. This tutorial covers:
- Setting up webhook handlers for transaction creation events
- Using AI models to analyze transaction details and categorize products
- Storing AI-generated categorization data back to Klutch
- Enhancing transaction records with merchant and product insights

**Use Case:** Automatically categorize products from transactions, providing users with better spending insights and enabling smarter financial controls.

**Key Features:**
- Webhook-based transaction processing
- AI-powered product classification
- Transaction enrichment with categorization data

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- Klutch API credentials (Client ID, Secret Key, Endpoint)
- Environment variables configured

### Setup

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd api-samples
   ```

2. **Configure environment variables:**
   Create a `.env` file in the root or in each tutorial directory:
   ```
   KLUTCH_ENDPOINT=<your-endpoint>
   KLUTCH_CLIENT_ID=<your-client-id>
   KLUTCH_SECRET_KEY=<your-secret-key>
   CARD_ID=<your-card-id>
   ```

3. **Install dependencies for a tutorial:**
   ```bash
   cd <tutorial-folder>
   npm install
   ```

4. **Run the tutorial:**
   ```bash
   npm start
   ```

## 📖 Documentation

Each tutorial folder contains:
- `index.js` or `differential-budget.js` - Main tutorial code
- `package.json` - Dependencies and scripts
- Comments explaining key API interactions

For detailed Klutch API documentation, visit [Klutch API Docs](https://klutch.com/docs).

## 💡 Tips

- Start with **Differential Budget** if you want to learn how to query and manipulate transaction data
- Try **Swipe Twice** to understand real-time webhook processing
- Explore **AI Product Categorization** to see advanced transaction enrichment

## 📝 License

These samples are provided as-is for educational purposes.

