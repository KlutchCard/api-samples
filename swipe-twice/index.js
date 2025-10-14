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


app.post("/webhook/klutch", (req, res) => {
  try {
    const payload = JSON.parse(req.body.toString("utf-8"));
    
    // Check if this is a transaction created event
    if (payload.event?._alloyCardType !== "com.alloycard.core.entities.transaction.TransactionCreatedEvent") {
      console.log("Ignoring non-transaction event:", payload.event?._alloyCardType);
      return res.status(200).send("ok");
    }

    const transactionId = payload.event.transaction.entityID;

    
    // Process transaction asynchronously to not block webhook response
    handleTransaction(transactionId).catch(err => {
      console.error("Error processing transaction:", transactionId, err);
    });

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

async function main() {
  const token = await getToken()
  createTransactionRule(token)
}


async function createTransactionRule(token)  {

  const queryVar = {
    name: `swipe_twice_rule`,
    displayName: `Swipe Twice`,
    cards: [CARD_ID], 
    spec: {
      specType: "TimeOfDayTransactionRule",
      startTime: "20:00:00",
      endTime: "07:00:00",
      filters: [
            {
                field: "CARD_PRESENT",
                operator: "EQUALS",
                value: '"CARD_NOT_PRESENT"'
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


async function handleTransaction(transactionId) {

  const token = await getToken()

  // Fetch transaction details
  const { transaction } = await gql(`
    query($id: String!) {
      transaction(id: $id) {
        id
        amount
        transactionStatus
        declineReason
        cardPresent  
      }
    }
  `, { id: transactionId }, token);

  if (transaction.transactionStatus == "DECLINED" && transaction.declineReason.includes("Swipe Twice")) {
    await temorarilyDisableRule(token, 5 * 60)
  }

  console.log("Processed transaction:", transaction);
  return transaction;
}


async function temorarilyDisableRule(token, duration) {
  const {transactionRule} = await gql(`
      mutation($name: String, $duration: Int) {
        transactionRule(name: $name) {
          disableFor(durationInSeconds: $duration) {
            id
          }
        }
      }
    `, {name: "swipe_twice_rule", duration}, token )   

  return transactionRule
}

main().catch(err => {
  console.error("Error", err.message);
  process.exit(1);
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});