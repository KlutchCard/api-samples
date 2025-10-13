import dotenv from "dotenv";

dotenv.config();

const ENDPOINT = process.env.KLUTCH_ENDPOINT;
const CLIENT_ID = process.env.KLUTCH_CLIENT_ID;
const SECRET_KEY = process.env.KLUTCH_SECRET_KEY;

async function gql(query, variables, token) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

async function main() {
  const { createSessionToken } = await gql(
    `mutation($clientId:String,$secretKey:String){
       createSessionToken(clientId:$clientId, secretKey:$secretKey)
     }`,
    { clientId: CLIENT_ID, secretKey: SECRET_KEY }
  );
  const token = createSessionToken;

  const categories = await getCategories(token);

  const spendPerCategories = await getSpendPerCategory(token);

  const paymentsLastMonth = await getPaymentLastMonth(token)

  const spendPercentages = calculateSpendPercentages(spendPerCategories);
  const attributedPayments = attributePaymentsToCategories(categories, spendPercentages, paymentsLastMonth);

  for (const budget of attributedPayments) {
    createTransactionRule(budget, categories, token)
  }

}

async function createTransactionRule(budget, categories, token)  {

  const cat = categories.find(c => c.id == budget.id)

  const queryVar = {
    name: `diff_budget_${budget.id}`,
    displayName: `Budget for ${budget.id}`,
    cards: [], //all cards
    spec: {
      specType: "AccumulatingOverPeriodTransactionRule",
      period: "MONTH",
      amount: budget.value * 1.10,
        filters: [
            {
                field: "MCC",
                operator: "CONTAINS",
                value: cat.mccs
            }
        ]
    }
  }

  const {createTransactionRule} = await gql(`
      mutation($name: String, $displayName: String, $cardIds: [String], $spec: TransactionRuleSpecInput) {
        createTransactionRule(name: $name, displayName: $displayName,  cardIds: $cardIds, spec: $spec) {        
          id
          name        
      }
    }`, queryVar, token)
  return createTransactionRule
}

function calculateSpendPercentages(spendPerCategories) {
  const total = spendPerCategories.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) return Object.fromEntries(spendPerCategories.map(s => [s.key, 0]));
  return Object.fromEntries(
    spendPerCategories.map(s => [s.key, s.value / total])
  );
}


function attributePaymentsToCategories(categories, spendPercentages, paymentsLastMonth) {
    return categories.map(c => ({
      id: c.id,
      name: c.name,
      value: (spendPercentages[c.id] ?? 0) * paymentsLastMonth
    }));
}

async function getCategories(token) {
  const { transactionCategories } = await gql(`
    query  {
      transactionCategories {
          id
          name          
          mccs
      }
    }`,null,token);
  return transactionCategories;
}

async function getSpendPerCategory(token) {
  const now = new Date();
  const startDate = new Date(now.getFullYear(),now.getMonth(), 1).toISOString();

  const endDate = now.toISOString();

  const queryVars = {
    filter: {
      transactionStatus: ["PENDING", "SETTLED"],
      transactionTypes: ["CHARGE"],
      startDate,
      endDate,
    },
    groupByProperty: "CATEGORY",
    operation: "SUM",
  };

  const { groupTransactions } = await gql(`
    query($filter: TransactionFilter, $groupByProperty: TransactionGroupByProperty, $operation: GroupByOperation) {
          groupTransactions(filter: $filter, groupByProperty: $groupByProperty, operation: $operation) {
            key
            value
          }          
    }
    `,
    queryVars,
    token
  );
  return groupTransactions;
}

async function getPaymentLastMonth(token) {
  const now = new Date();
  const startDate = new Date(now.getFullYear(),now.getMonth() - 1, 1).toISOString();
  const endDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const queryVars = {
    filter: {
      transactionStatus: ["SETTLED"],
      transactionTypes: ["PAYMENT"],
      startDate,
      endDate,
    }
  };


  const {sumTransactions} = await gql(
    `
      query($filter: TransactionFilter) {
        sumTransactions(filter: $filter) 
      }`,
    queryVars,token);
  
  return sumTransactions * -1
}



main().catch((err) => {
  console.error("Error", err.message);
  process.exit(1);
});
