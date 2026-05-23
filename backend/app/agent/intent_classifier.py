import re
from typing import Tuple

# ── Intent Detection ────────────────────────────────────────────────────────

def detect_intent(message: str) -> Tuple[str, float]:
    """
    Classify the customer's intent from their message.
    Returns (intent_label, confidence_score 0.0-1.0).
    """
    msg_lower = message.lower()
    scores = {}

    # ORDER_STATUS — order keywords, or matching 17-digit/4-digit order numbers
    order_words = [
        "order", "where", "status", "track", "delivery", "package", "shipment", "item", "product",
        "ఆర్డర్", "ఎక్కడ", "ఆ హạOrder", "ಆರ್ಡರ್", "ಎಲ್ಲಿದೆ", "ಸ್ಥಿತಿ"
    ]
    has_order_id = bool(re.search(r'\b\d{3}-\d{7}-\d{7}\b|\b\d{17}\b|\b\d{4}\b', msg_lower))
    
    if any(w in msg_lower for w in order_words):
        scores["ORDER_STATUS"] = 0.96 if has_order_id else 0.85
    elif has_order_id:
        # If they just state an order number
        scores["ORDER_STATUS"] = 0.90

    # FAQ_POLICY
    faq_words = [
        "refund", "return", "warranty", "policy", "faq", "shipping", "exchange",
        "cancel", "cancellation", "money back", "how long", "how many days", "prime", "membership",
        "invoice", "tax invoice", "brand warranty", "acko", "oneassist",
        "రిఫండ్", "తిరిగి", "వాపసు", "ಮರುಪಾವತಿ", "ಹಿಂದಿರುಗಿ", "ವಾಪಸ್"
    ]
    if any(w in msg_lower for w in faq_words):
        scores["FAQ_POLICY"] = 0.88

    # COMPLAINT_REGISTRATION — formal complaint, distinct from escalation
    complaint_words = [
        "complaint", "complain", "register complaint", "file complaint",
        "bad experience", "poor service", "not satisfied", "dissatisfied",
        "unacceptable", "wrong product", "damaged", "broken", "defective",
        "money deducted", "failed payment", "upi failure"
    ]
    if any(w in msg_lower for w in complaint_words):
        scores["COMPLAINT_REGISTRATION"] = 0.89

    # BOOK_CALLBACK
    call_words = [
        "callback", "call me", "call me back", "schedule call", "schedule a call",
        "ring me", "tomorrow", "morning", "evening", "afternoon", "weekend",
        "కాల్ చేయండి", "రేపు", "ಕರೆ ಮಾಡಿ", "ನಾಳೆ"
    ]
    if any(w in msg_lower for w in call_words):
        scores["BOOK_CALLBACK"] = 0.85

    # HUMAN_ESCALATION — urgent, emotional, demand for human
    human_words = [
        "human", "manager", "executive", "supervisor", "speak to someone",
        "talk to a person", "real person", "agent", "not helpful", "useless bot",
        "మనిషి", "మేనేజర్", "కంప్లైంట్", "ಮ್ಯಾನೇಜರ್", "ದೂರು", "ಮಾನವ"
    ]
    if any(w in msg_lower for w in human_words):
        scores["HUMAN_ESCALATION"] = 0.92

    if not scores:
        return ("GENERAL", 0.5)

    best_intent = max(scores, key=scores.get)
    return (best_intent, scores[best_intent])


# ── Sentiment Detection ─────────────────────────────────────────────────────

def detect_sentiment(message: str) -> Tuple[str, float]:
    """
    Returns (sentiment_label, frustration_score 0.0-1.0).
    """
    msg_lower = message.lower()

    positive_words = ["thanks", "thank you", "great", "good", "helpful", "amazing", "excellent", "perfect", "love"]
    negative_words = [
        "angry", "frustrated", "frustrating", "disappointed", "disappointing",
        "bad", "useless", "worst", "terrible", "horrible", "complaint",
        "manager", "human", "called many times", "still waiting", "no response",
        "unacceptable", "ridiculous", "pathetic", "disgusting", "fed up",
        "sick of", "never again", "fraud", "scam"
    ]

    neg_count = sum(1 for w in negative_words if w in msg_lower)
    pos_count = sum(1 for w in positive_words if w in msg_lower)

    if neg_count >= 2:
        score = min(0.5 + (neg_count * 0.15), 1.0)
        return ("frustrated", score)
    elif neg_count == 1:
        return ("frustrated", 0.6)
    elif pos_count > 0:
        return ("positive", 0.8)
    else:
        return ("neutral", 0.5)


# ── Order ID Extraction ─────────────────────────────────────────────────────

def extract_order_id(message: str) -> str:
    """Extract order ID from message (supports Amazon 17-digit hyphenated, 17-digit plain, and 4-digit formats)."""
    # 17-digit with hyphens (e.g., 403-8756412-0983421)
    match_hyphen = re.search(r'\b\d{3}-\d{7}-\d{7}\b', message)
    if match_hyphen:
        return match_hyphen.group(0)
    
    # 17-digit plain (e.g., 40387564120983421)
    match_plain = re.search(r'\b\d{17}\b', message)
    if match_plain:
        # Re-format as hyphenated for DB lookup consistency
        p = match_plain.group(0)
        return f"{p[:3]}-{p[3:10]}-{p[10:]}"
        
    # 4-digit fallback for existing tests/simulator compatibility
    match_4 = re.search(r'\b\d{4}\b', message)
    if match_4:
        return match_4.group(0)
        
    return None
