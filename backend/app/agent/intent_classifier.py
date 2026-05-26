import re
from typing import Tuple

# ── Intent Detection ────────────────────────────────────────────────────────

def detect_intent(message: str) -> Tuple[str, float]:
    """
    Classify the customer's intent from their message.
    Returns (intent_label, confidence_score 0.0-1.0).
    Supports English, Hindi (Devanagari + Roman), Telugu, Kannada.
    """
    msg_lower = message.lower()
    scores = {}

    # ORDER_STATUS — order keywords, or matching 17-digit/4-digit order numbers
    order_words = [
        # English
        "order", "where", "status", "track", "delivery", "package", "shipment", "item", "product",
        "dispatch", "shipped", "courier", "out for delivery", "delivered", "transit",
        # Telugu
        "ఆర్డర్", "ఎక్కడ", "డెలివరీ", "ట్రాక్", "స్టేటస్", "పార్సెల్", "పంపారు",
        # Kannada
        "ಆರ್ಡರ್", "ಎಲ್ಲಿದೆ", "ಸ್ಥಿತಿ", "ಡೆಲಿವರಿ", "ಟ್ರ್ಯಾಕ್", "ಪ್ಯಾಕೇಜ್",
        # Hindi Devanagari
        "ऑर्डर", "कहाँ", "कहां", "डिलीवरी", "स्थिति", "ट्रैक", "पैकेज", "शिपमेंट",
        "ट्रैकिंग", "डिस्पैच", "कूरियर", "पार्सल", "सामान", "भेजा", "पहुंचा", "मिला",
        "नहीं मिला", "नहीं आया", "देर हो", "कब आएगा", "कब पहुंचेगा", "अभी तक नहीं",
        # Hindi transliteration
        "order kahan", "delivery kab", "mera order", "kahan hai", "track karo",
        "order status", "kab aayega", "kab milega", "abhi tak nahi", "deliver nahi",
        "mera saman", "parcel kahan", "shipment kahan", "courier kahan"
    ]
    has_order_id = bool(re.search(r'\b\d{3}-\d{7}-\d{7}\b|\b\d{17}\b|\b\d{4}\b', msg_lower))

    if any(w in msg_lower for w in order_words):
        scores["ORDER_STATUS"] = 0.96 if has_order_id else 0.85
    elif has_order_id:
        scores["ORDER_STATUS"] = 0.90

    # FAQ_POLICY
    faq_words = [
        # English
        "refund", "return", "warranty", "policy", "faq", "shipping", "exchange",
        "cancel", "cancellation", "money back", "how long", "how many days", "prime", "membership",
        "invoice", "tax invoice", "brand warranty", "acko", "oneassist", "payment",
        "emi", "cash on delivery", "cod", "upi", "benefits", "cost", "price", "charge",
        # Telugu
        "రిఫండ్", "తిరిగి", "వాపసు", "రిటర్న్", "రద్దు", "సభ్యత్వం", "చెల్లింపు",
        # Kannada
        "ಮರುಪಾವತಿ", "ಹಿಂದಿರುಗಿ", "ವಾಪಸ್", "ರದ್ದು", "ಸದಸ್ಯತ್ವ", "ಪಾವತಿ",
        # Hindi Devanagari
        "रिफंड", "वापसी", "पॉलिसी", "कैंसल", "रिटर्न", "वारंटी", "प्राइम", "सदस्यता",
        "शिपिंग", "शुल्क", "भुगतान", "ईएमआई", "कैश ऑन डिलीवरी", "यूपीआई",
        "पैसे वापस", "पेमेंट", "मेंबरशिप", "फायदे", "कीमत", "चार्ज", "इनवॉइस",
        "ब्रांड वारंटी", "एक्सचेंज", "बदलना", "कितने दिन", "कितने समय",
        # Hindi transliteration
        "refund kab", "paisa wapas", "cancel karna", "return karna", "policy kya",
        "prime membership", "payment failed", "upi fail", "paisa kata", "paise wapas",
        "wapas karna", "kitne din", "kitna samay", "membership kya", "fayde kya",
        "charge kyu", "payment kaise", "emi kaise"
    ]
    if any(w in msg_lower for w in faq_words):
        scores["FAQ_POLICY"] = 0.88

    # COMPLAINT_REGISTRATION — formal complaint, distinct from escalation
    complaint_words = [
        # English
        "complaint", "complain", "register complaint", "file complaint",
        "bad experience", "poor service", "not satisfied", "dissatisfied",
        "unacceptable", "wrong product", "damaged", "broken", "defective",
        "money deducted", "failed payment", "upi failure", "fraud", "missing item",
        "empty box", "wrong item", "not working", "stopped working",
        # Telugu
        "ఫిర్యాదు", "పాడైంది", "తప్పు వస్తువు", "దెబ్బతింది",
        # Kannada
        "ದೂರು", "ಹಾಳಾಗಿದೆ", "ತಪ್ಪು ವಸ್ತು", "ಮುರಿದಿದೆ",
        # Hindi Devanagari
        "शिकायत", "खराब", "टूटा", "डैमेज", "गलत", "पैसे कटे", "पेमेंट फेल",
        "गलत प्रोडक्ट", "टूटा हुआ", "खाली बॉक्स", "सामान नहीं था", "काम नहीं कर रहा",
        "बंद हो गया", "नकली", "धोखाधड़ी", "चोरी", "नुकसान", "बर्बाद",
        "दर्ज करना", "रिपोर्ट", "समस्या", "परेशानी",
        # Hindi transliteration
        "shikayat", "complaint darj", "paisa kata", "tuta hua", "galat product",
        "kharab nikla", "naqli", "dhokha", "nuqsaan", "khaali box", "kuch nahi tha",
        "kaam nahi karta", "band ho gaya", "missing", "wrong item aaya"
    ]
    if any(w in msg_lower for w in complaint_words):
        scores["COMPLAINT_REGISTRATION"] = 0.89

    # BOOK_CALLBACK
    call_words = [
        # English
        "callback", "call me", "call me back", "schedule call", "schedule a call",
        "ring me", "tomorrow", "morning", "evening", "afternoon", "weekend",
        "please call", "want a call", "need a call",
        # Telugu
        "కాల్ చేయండి", "రేపు", "మళ్ళీ కాల్",
        # Kannada
        "ಕರೆ ಮಾಡಿ", "ನಾಳೆ", "ಮರಳಿ ಕರೆ",
        # Hindi Devanagari
        "कॉल करो", "वापस कॉल", "कल", "सुबह", "शाम", "कॉलबैक",
        "कल सुबह", "कल शाम", "मुझे कॉल", "फोन करो", "बात करनी है",
        "दोपहर", "रात को", "वापस फोन",
        # Hindi transliteration
        "call karo", "call back karo", "kal subah", "mujhe call karo",
        "phone karo", "baat karni hai", "kal sham", "subah call", "callback chahiye",
        "mujhe phone karo", "wapas call karo"
    ]
    if any(w in msg_lower for w in call_words):
        scores["BOOK_CALLBACK"] = 0.85

    # HUMAN_ESCALATION — urgent, emotional, demand for human
    human_words = [
        # English
        "human", "manager", "executive", "supervisor", "speak to someone",
        "talk to a person", "real person", "agent", "not helpful", "useless bot",
        "transfer me", "connect me", "escalate", "i want a human",
        # Telugu
        "మనిషి", "మేనేజర్", "కంప్లైంట్", "సూపర్‌వైజర్",
        # Kannada
        "ಮ್ಯಾನೇಜರ್", "ದೂರು", "ಮಾನವ", "ಸೂಪರ್‌ವೈಸರ್",
        # Hindi Devanagari
        "मैनेजर", "इंसान", "असली इंसान", "सुपरवाइजर", "किसी से बात",
        "बेकार", "ट्रांसफर", "किसी से मिलाओ", "वरिष्ठ", "अधिकारी",
        "नाराज", "बहुत परेशान", "बर्दाश्त नहीं", "बहुत गुस्सा",
        # Hindi transliteration
        "manager se baat", "human chahiye", "supervisor bulao", "insaan se baat",
        "bot nahi chahiye", "transfer karo", "kisi se baat", "real person chahiye",
        "bahut gussa", "bahut naraaz", "bardaasht nahi", "ye nahi chalta"
    ]
    if any(w in msg_lower for w in human_words):
        scores["HUMAN_ESCALATION"] = 0.92

    if not scores:
        return ("GENERAL", 0.5)

    best_intent = max(scores, key=scores.get)
    return (best_intent, scores[best_intent])


# ── Language Detection ───────────────────────────────────────────────────────

def detect_language(message: str) -> str:
    """
    Detect the primary language of the message.
    Returns: 'hi' (Hindi), 'te' (Telugu), 'kn' (Kannada), 'en' (English/default).
    Uses Unicode block ranges for script detection.
    """
    devanagari_count = sum(1 for c in message if '\u0900' <= c <= '\u097F')
    telugu_count = sum(1 for c in message if '\u0C00' <= c <= '\u0C7F')
    kannada_count = sum(1 for c in message if '\u0C80' <= c <= '\u0CFF')

    max_count = max(devanagari_count, telugu_count, kannada_count)

    if max_count == 0:
        # Check Roman transliteration patterns for Hindi
        msg_lower = message.lower()
        hindi_roman_markers = [
            "mera", "meri", "kahan", "kab", "kaise", "kyun", "kya", "nahi",
            "hai", "hain", "aur", "lekin", "abhi", "abhi tak", "hua", "gaya",
            "chahiye", "milega", "aayega", "karo", "karna", "wapas", "paisa"
        ]
        if sum(1 for w in hindi_roman_markers if w in msg_lower) >= 2:
            return 'hi-roman'
        return 'en'

    if devanagari_count >= max_count:
        return 'hi'
    elif telugu_count >= max_count:
        return 'te'
    elif kannada_count >= max_count:
        return 'kn'
    return 'en'


# ── Sentiment Detection ─────────────────────────────────────────────────────

def detect_sentiment(message: str) -> Tuple[str, float]:
    """
    Returns (sentiment_label, frustration_score 0.0-1.0).
    Supports English, Hindi Devanagari, and Hindi transliteration.
    """
    msg_lower = message.lower()

    positive_words = [
        # English
        "thanks", "thank you", "great", "good", "helpful", "amazing", "excellent",
        "perfect", "love", "wonderful", "fantastic", "appreciate", "satisfied",
        "happy", "pleased", "resolved", "working", "fast", "quick",
        # Hindi Devanagari
        "धन्यवाद", "शुक्रिया", "अच्छा", "बहुत अच्छा", "बढ़िया", "शानदार",
        "खुश", "संतुष्ट", "मददगार", "जल्दी", "ठीक है", "ठीक हो गया",
        # Hindi transliteration
        "shukriya", "bahut accha", "theek hai", "shukriya", "bahut badhiya",
        "khush hoon", "satisfied hoon", "helpful tha", "jaldi solve hua"
    ]
    negative_words = [
        # English
        "angry", "frustrated", "frustrating", "disappointed", "disappointing",
        "bad", "useless", "worst", "terrible", "horrible", "complaint",
        "manager", "human", "called many times", "still waiting", "no response",
        "unacceptable", "ridiculous", "pathetic", "disgusting", "fed up",
        "sick of", "never again", "fraud", "scam", "cheated", "robbed",
        "not working", "broken", "damaged", "lied", "false promise",
        # Hindi Devanagari
        "गुस्सा", "बेकार", "बहुत बुरा", "धोखा", "घटिया", "नाराज",
        "परेशान", "बर्दाश्त नहीं", "झूठ", "बेवकूफी", "लूट", "ठगा",
        "बहुत गलत", "बिल्कुल गलत", "बहुत गुस्सा", "बर्बाद", "खराब सेवा",
        "कभी नहीं", "पहली और आखिरी", "बहुत खराब", "घोर", "निराश",
        # Hindi transliteration
        "bahut bura", "gussa", "bekar", "dhoka", "ghatiya", "pagal kar diya",
        "bahut naraaz", "bardaasht nahi", "jhooth", "loota", "thaga",
        "bahut galat", "bilkul galat", "barbad", "khraab service",
        "kabhi nahi", "bahut kharaab", "nirash", "bahut gussa"
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
