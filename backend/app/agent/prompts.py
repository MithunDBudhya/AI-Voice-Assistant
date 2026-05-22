def get_system_prompt(intent: str, context: str = "") -> str:
    base = (
        "You are a helpful customer support voice agent for an e-commerce company called SupportGenie. "
        "Keep your response to a maximum of 2 sentences. "
        "Be natural and suitable for spoken voice. "
        "Do not use markdown, formatting, or internal tool names. "
        "Do not hallucinate policies. "
        "IMPORTANT: You MUST reply in the EXACT same language that the user spoke to you in (e.g., if they speak Telugu, reply in Telugu; if Kannada, reply in Kannada; if English, reply in English)."
    )
    
    if intent == "ORDER_STATUS":
        return f"{base}\nContext: {context}\nProvide the order status directly. If not found, ask for a valid order ID."
    
    if intent == "FAQ_POLICY":
        return f"{base}\nContext from policy: {context}\nAnswer the question concisely based only on this policy."
    
    if intent == "HUMAN_ESCALATION":
        return f"{base}\nApologize briefly and confirm that you have created a high-priority ticket and are connecting them to a human manager."
        
    if intent == "BOOK_CALLBACK":
        return f"{base}\nConfirm that the callback has been successfully scheduled."
        
    return f"{base}\nAnswer naturally and try to help the customer."
