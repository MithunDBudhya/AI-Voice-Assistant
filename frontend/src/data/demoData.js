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
    caller_phone: "+919876543210",
    message: "Where is my order 403-8756412-0983421?",
    intent: "ORDER_STATUS",
    sentiment: "neutral",
    tool_used: "get_order_status",
    answer: "Your Amazon India order 403-8756412-0983421 is out for delivery with ATS (Amazon Transportation Services) and is expected today by 7 PM.",
    source: "orders.json",
    escalated: false,
    timestamp: new Date().toISOString(),
    pipeline_trace: {
      stt: { latency_ms: 98.4, transcript: "Where is my order 403-8756412-0983421?" },
      intent: { intent: "ORDER_STATUS", sentiment: "neutral", sentiment_score: 0.2, confidence: 0.96 },
      rag: {
        embedding_time_ms: 11.2,
        search_time_ms: 2.1,
        query_vector: [0.0345, -0.1245, 0.0891, -0.0543, 0.0211],
        matches: [
          { source: "delivery_policy.txt", score: 0.78, text: "Amazon India orders are managed via Amazon Transportation Services." }
        ]
      },
      llm: {
        model: "llama-3.1-8b-instant",
        latency_ms: 184.2,
        prompt_tokens: 142,
        completion_tokens: 35,
        total_tokens: 177,
        system_prompt: "You are the official Amazon India Customer Support AI Assistant..."
      },
      tool: {
        tool_used: "get_order_status",
        inputs: { order_id: "403-8756412-0983421" },
        outputs: {
          order_id: "403-8756412-0983421",
          product: "OnePlus 12 5G Smart Phone",
          status: "Out for delivery",
          expected_delivery: "Today by 7 PM",
          courier: "ATS (Amazon Transportation Services)"
        }
      },
      tts: { latency_ms: 82.5 }
    }
  },
  {
    call_id: "call_xyz456",
    caller_phone: "+918888888888",
    message: "I want to speak with an Amazon manager immediately.",
    intent: "HUMAN_ESCALATION",
    sentiment: "frustrated",
    tool_used: "create_ticket",
    answer: "I apologize for the frustration. I have created a high-priority escalation ticket and an Amazon India support supervisor will call you within the hour.",
    source: null,
    escalated: true,
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    pipeline_trace: {
      stt: { latency_ms: 112.5, transcript: "I want to speak with an Amazon manager immediately." },
      intent: { intent: "HUMAN_ESCALATION", sentiment: "frustrated", sentiment_score: 0.85, confidence: 0.94 },
      rag: {
        embedding_time_ms: 14.5,
        search_time_ms: 3.1,
        query_vector: [-0.0123, -0.0456, 0.0789, 0.1245, -0.0634],
        matches: [
          { source: "complaint_policy.txt", score: 0.54, text: "High priority tickets require supervisor review and are resolved within 2-4 hours." }
        ]
      },
      llm: {
        model: "llama-3.1-8b-instant",
        latency_ms: 220.4,
        prompt_tokens: 172,
        completion_tokens: 38,
        total_tokens: 210,
        system_prompt: "You are the official Amazon India Customer Support AI Assistant..."
      },
      tool: {
        tool_used: "create_ticket",
        inputs: { caller_phone: "+918888888888", priority: "High", escalation: true },
        outputs: {
          ticket_id: "TKT-4038756",
          status: "Open",
          priority: "High"
        }
      },
      tts: { latency_ms: 110.2 }
    }
  }
];

export const demoTickets = [
  {
    ticket_id: "TKT-4038756",
    caller_phone: "+918888888888",
    reason: "Customer requested urgent supervisor escalation",
    priority: "High",
    transcript: "I want to speak with an Amazon manager immediately.",
    status: "Open",
    timestamp: new Date(Date.now() - 3600000).toISOString()
  }
];

export const demoCallbacks = [
  {
    callback_id: "CB-4039001",
    caller_phone: "+919876543210",
    preferred_time: "tomorrow morning (9 AM - 12 PM)",
    reason: "Customer requested a callback regarding refund timeline",
    status: "Pending",
    timestamp: new Date(Date.now() - 7200000).toISOString()
  }
];
