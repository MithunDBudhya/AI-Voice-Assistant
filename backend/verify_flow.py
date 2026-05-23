import requests
import json
import sys

BASE_URL = "http://127.0.0.1:8000"

def run_test(name, payload):
    print(f"\n==================================================")
    print(f"TEST: {name}")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    print(f"--------------------------------------------------")
    try:
        response = requests.post(f"{BASE_URL}/agent/respond", json=payload, timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"SUCCESS (200)")
            print(f"Intent detected: {data.get('intent')} (Confidence: {data.get('intent_confidence')})")
            print(f"Sentiment: {data.get('sentiment')} (Score: {data.get('sentiment_score')})")
            print(f"Tool used: {data.get('tool_used')}")
            print(f"Answer: {data.get('answer')}")
            print(f"Summary: {data.get('summary')}")
            print(f"Response Time: {data.get('response_time_ms')}ms")
            return data
        else:
            print(f"FAILED with status code {response.status_code}")
            print(response.text)
            return None
    except Exception as e:
        print(f"ERROR: {e}")
        return None

def verify_system():
    print("Verifying backend server health...")
    try:
        h = requests.get(f"{BASE_URL}/health", timeout=5)
        print(f"Health check status: {h.status_code} - {h.json()}")
    except Exception as e:
        print(f"Could not connect to backend server at {BASE_URL}. Ensure it is running: {e}")
        sys.exit(1)

    # Test 1: Phone lookup fallback
    test1 = run_test("Phone Lookup Fallback (Where is my order?)", {
        "caller_phone": "+919876543210",
        "message": "where is my order?"
    })
    
    # Test 2: 17-digit order lookup
    test2 = run_test("17-digit Order Lookup", {
        "caller_phone": "+919876543210",
        "message": "Track order 403-8756412-0983421"
    })

    # Test 3: RAG query for Prime Benefits
    test3 = run_test("RAG - Prime Benefits Query", {
        "caller_phone": "+919876543210",
        "message": "What are the benefits of Amazon Prime?"
    })

    # Test 4: RAG query for Delivered-but-not-received
    test4 = run_test("RAG - Package marked delivered but not received", {
        "caller_phone": "+919876543210",
        "message": "My package is marked delivered but not received"
    })

    # Test 5: Supervisor escalation (high frustration or direct request)
    test5 = run_test("Supervisor Escalation", {
        "caller_phone": "+919876543210",
        "message": "I am extremely angry, connect me to a supervisor right now! This is unacceptable!"
    })

    # Test 6: Callback Booking
    test6 = run_test("Callback Booking", {
        "caller_phone": "+919876543210",
        "message": "Can you book a callback for tomorrow morning?"
    })

    print("\n==================================================")
    print("VERIFICATION COMPLETED.")
    print("==================================================")

if __name__ == "__main__":
    verify_system()
