import dotenv from 'dotenv';
import express from "express";


dotenv.config();


const ENDPOINT = process.env.KLUTCH_ENDPOINT;
const CLIENT_ID = process.env.KLUTCH_CLIENT_ID;
const SECRET_KEY = process.env.KLUTCH_SECRET_KEY;
const CARD_ID = process.env.CARD_ID;


const app = express();




app.use(
  express.raw({ type: "application/json" })
);


app.post("/webhook", async (req, res) => {
  try {
    const payload = JSON.parse(req.body.toString("utf-8"));
    
    // Check if this is a transaction created event
    if (payload.event?._alloyCardType !== "com.alloycard.core.entities.transaction.TransactionItemCreatedEvent") {
      console.log("Ignoring non-transaction event:", payload.event?._alloyCardType);
      return res.status(200).send("ok");
    }

    const transactionId = payload.event.transaction.entityID;

    const token = await getToken();
    const {transaction, items} = await handleTransaction(transactionId, token);
    
    await saveItemCategories(transactionId, items, token);

    
    res.status(200).send("ok");

  } catch (err) {
    console.error("Error handling webhook:", err);
    res.status(500).send("Server error");
  }
});


async function gql(query, variables, token) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ query, variables })
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}


async function getToken() {
    const { createSessionToken } = await gql(
    `mutation($clientId:String,$secretKey:String){
       createSessionToken(clientId:$clientId, secretKey:$secretKey)
     }`,
    { clientId: CLIENT_ID, secretKey: SECRET_KEY }
  );
  const token = createSessionToken;
  return token
}


async function getAvailableCategories(token) {
  try {
    const { transactionCategories } = await gql(`
      query {
        transactionCategories {
          id
          name
        }
      }
    `, {}, token);

    return transactionCategories;
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}





async function handleTransaction(transactionId, token) {

  // Fetch available categories
  const availableCategories = await getAvailableCategories(token);
  const categoryNames = availableCategories.map(cat => cat.name);
  const categoryNameToId = Object.fromEntries(availableCategories.map(cat => [cat.name, cat.id]));

  // Fetch transaction details
  const { transaction } = await gql(`
    query($id: String!) {
      transaction(id: $id) {
        id
        amount
        transactionStatus
        declineReason
        cardPresent  
        items {
          id
          category {
            id
            name
          }
          description
          price
          quantity
        }
      }
    }
  `, { id: transactionId }, token);

  
  // Get categories from AI for each item
  const items = transaction.items || [];
  const categorizedItems = await Promise.all(
    items.map(async (item) => {
      const aiCategoryName = await getAICategory(item.description, categoryNames);
      return {
        ...item,
        aiCategory: {
          name: aiCategoryName,
          id: categoryNameToId[aiCategoryName] || null
        }
      };
    })
  );

  
  return { ...transaction, items: categorizedItems };
}


async function getAICategory(description, categoryOptions = []) {
  try {
    const categoryList = categoryOptions.length > 0 
      ? `\n\nAvailable categories: ${categoryOptions.join(", ")}`
      : "";

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a product categorization assistant. Respond with ONLY a single category name from the provided options for the given product description.${categoryList}`
          },
          {
            role: "user",
            content: `Categorize this product: ${description}`
          }
        ],
        temperature: 0.3,
        max_tokens: 10
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error getting AI category:", error);
    return null;
  }
}


async function saveItemCategories(transactionId, items, token) {
  try {
    for (const item of items) {
      if (item.aiCategory?.id) {
        await gql(`
          mutation($transactionId: String!, $itemId: String!, $categoryId: String!) {
            transaction(id: $transactionId) {
              item(id: $itemId) {
                change(categoryId: $categoryId) {
                  category {
                    id
                  }
                }
              }
            }
          }
        `, 
        {
          transactionId: transactionId,
          itemId: item.id,
          categoryId: item.aiCategory.id
        },
        token);
        
        console.log(`Updated item ${item.id} with category ${item.aiCategory.name} (${item.aiCategory.id})`);
      } else {
        console.warn(`Skipping item ${item.id} - no valid AI category assigned`);
      }
    }
  } catch (error) {
    console.error("Error saving item categories:", error);
    throw error;
  }
}






const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});