# Hackathon Demo Script

Use the **Call Simulator** page in the React dashboard to demonstrate these end-to-end flows to the judges.

### Prep
1. Go to **Knowledge Base**. Click "Sync Documents" to ensure ChromaDB is populated.
2. Go to **Call Simulator**.

---

### Demo 1: Order Status (Action Tool)
**Input:** `Where is my order 1023?`
**Expected Flow:**
1. System detects intent: `ORDER_STATUS`
2. System extracts `1023`
3. Tool `get_order_status` is triggered.
4. Reads from `orders.json`.
5. Agent responds with: "Your order 1023 is out for delivery and expected today by 7 PM."

---

### Demo 2: RAG Policy (Knowledge Base)
**Input:** `What is your refund policy?`
**Expected Flow:**
1. System detects intent: `FAQ_POLICY`
2. Tool `rag_query` is triggered.
3. Queries ChromaDB. Source `refund_policy.txt` is returned.
4. Agent responds based on the document text.

---

### Demo 3: Sentiment & Escalation
**Input:** `I am frustrated, connect me to a human.`
**Expected Flow:**
1. System detects sentiment: `frustrated`
2. System detects intent: `HUMAN_ESCALATION`
3. Tool `create_ticket` is triggered.
4. A high-priority ticket is logged in `tickets.json`.
5. Agent apologizes and confirms the escalation.
*Show judges the **Tickets** page where the new ticket immediately appears.*

---

### Demo 4: Booking a Callback
**Input:** `Book a callback tomorrow morning.`
**Expected Flow:**
1. System detects intent: `BOOK_CALLBACK`
2. Tool `book_callback` is triggered.
3. Callback logged in `callbacks.json`.
4. Agent confirms the scheduled time.
*Show judges the **Callbacks** page where the pending request is listed.*
