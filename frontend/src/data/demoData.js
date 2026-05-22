export const demoSummary = {
  total_calls: 142,
  resolved_calls: 120,
  escalated_calls: 15,
  pending_callbacks: 7,
  resolution_rate: "84%",
  average_response_time: "1.2s",
};

export const demoCalls = [
  {
    call_id: "call_abc123",
    caller_phone: "+919999999999",
    message: "Where is my order 1023?",
    intent: "ORDER_STATUS",
    sentiment: "neutral",
    tool_used: "get_order_status",
    answer: "Your order 1023 is out for delivery and is expected today by 7 PM.",
    source: "orders.json",
    escalated: false,
    timestamp: new Date().toISOString()
  },
  {
    call_id: "call_xyz456",
    caller_phone: "+918888888888",
    message: "I am frustrated, connect me to a human.",
    intent: "HUMAN_ESCALATION",
    sentiment: "frustrated",
    tool_used: "create_ticket",
    answer: "I apologize for the frustration. I have created a high-priority ticket and our manager will contact you shortly.",
    source: null,
    escalated: true,
    timestamp: new Date(Date.now() - 3600000).toISOString()
  }
];

export const demoTickets = [
  {
    ticket_id: "TKT-1a2b3c4d",
    caller_phone: "+918888888888",
    reason: "Customer requested human escalation",
    priority: "High",
    transcript: "I am frustrated, connect me to a human.",
    status: "Open",
    timestamp: new Date(Date.now() - 3600000).toISOString()
  }
];

export const demoCallbacks = [
  {
    callback_id: "CB-9z8y7x6w",
    caller_phone: "+917777777777",
    preferred_time: "tomorrow morning",
    reason: "Customer requested a callback",
    status: "Pending",
    timestamp: new Date(Date.now() - 7200000).toISOString()
  }
];
