import re

def detect_intent(message: str) -> str:
    msg_lower = message.lower()
    
    # English, Telugu, Kannada keywords for Order Status
    order_words = ["order", "where", "status", "track", "delivery", "ఆర్డర్", "ఎక్కడ", "ఆ হಡರ", "ಆರ್ಡರ್", "ಎಲ್ಲಿದೆ", "ಸ್ಥಿತಿ"]
    if any(word in msg_lower for word in order_words) and bool(re.search(r'\d+', msg_lower)):
        return "ORDER_STATUS"
        
    # FAQ / Policy keywords
    faq_words = ["refund", "return", "warranty", "policy", "faq", "shipping", "రిఫండ్", "తిరిగి", "వాపసు", "ಮರುಪಾವತಿ", "ಹಿಂದಿರುಗಿ", "ವಾಪಸ್"]
    if any(word in msg_lower for word in faq_words):
        return "FAQ_POLICY"
        
    # Callback keywords
    call_words = ["callback", "call me", "schedule call", "tomorrow", "morning", "evening", "కాల్ చేయండి", "రేపు", "ಕರೆ ಮಾಡಿ", "ನಾಳೆ"]
    if any(word in msg_lower for word in call_words):
        return "BOOK_CALLBACK"
        
    # Human escalation keywords
    human_words = ["human", "manager", "executive", "agent", "complaint", "frustrated", "angry", "మనిషి", "మేనేజర్", "కంప్లైంట్", "ಮ್ಯಾನೇಜರ್", "ದೂರು", "ಮಾನವ"]
    if any(word in msg_lower for word in human_words):
        return "HUMAN_ESCALATION"
        
    return "GENERAL"

def detect_sentiment(message: str) -> str:
    msg_lower = message.lower()
    
    positive_words = ["thanks", "good", "great", "helpful"]
    negative_words = ["angry", "frustrated", "disappointed", "bad", "useless", "complaint", "manager", "human", "called many times"]
    
    if any(word in msg_lower for word in negative_words):
        return "frustrated"
        
    if any(word in msg_lower for word in positive_words):
        return "positive"
        
    return "neutral"

def extract_order_id(message: str) -> str:
    match = re.search(r'\b\d{4}\b', message)
    if match:
        return match.group(0)
    return None
