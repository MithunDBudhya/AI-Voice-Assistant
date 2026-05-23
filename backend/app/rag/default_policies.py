import os
from app.config import settings

POLICIES = {
    "refund_policy.txt": """AMAZON INDIA REFUND POLICY — OFFICIAL REFERENCE
Last Updated: May 2026

1. GENERAL REFUND PROCESS
Refunds are processed automatically once a return is picked up or received at the fulfillment center. The time taken for the refund to reflect in the customer's account depends on the payment method:
- Credit Card / Debit Card: 3 to 5 business days.
- Net Banking: 2 to 4 business days.
- UPI (Unified Payments Interface): 2 to 24 hours.
- Amazon Pay Balance: Instant (within 2 hours).
- Cash on Delivery (COD): Refunded to bank account via National Electronic Funds Transfer (NEFT) in 3 to 5 business days, or instantly credited as Amazon Pay Balance.

2. LATE REFUNDS
If a refund has not been credited within the specified timeframe, the customer should first check if their bank has placed a hold on the transaction. If it has been more than 7 business days since the refund confirmation email, support agents must escalate the query and obtain a Bank Reference Number (ARN/RRN) for the customer.
""",

    "return_policy.txt": """AMAZON INDIA RETURN POLICY — CATEGORY GUIDELINES
Last Updated: May 2026

1. PRODUCT CATEGORIES RETURN WINDOWS
Different products have specific return windows on Amazon India:
- Mobiles & Electronics: 10-day return window. Most devices are eligible for replacement only if found defective.
- Apparel & Fashion: 30-day return window. Fully eligible for exchange, size swap, or full refund.
- Home & Kitchen: 10-day return window for appliances and furniture.
- Groceries & Daily Needs: Non-returnable. If damaged, a refund can be issued without returning the item.

2. VERIFICATION CHECKS
When a return agent arrives to collect an item:
- For smartphones, the agent will verify the IMEI and serial numbers match the order.
- The product must be returned with all original tags, accessories, and user manuals.
""",

    "replacement_policy.txt": """AMAZON INDIA REPLACEMENT POLICY — DEFECTIVE ITEMS
Last Updated: May 2026

1. REPLACEMENT RULES
If a product arrives damaged, defective, or is not as described, the customer can request a free replacement.
- The replacement item will be shipped at no extra cost using standard shipping.
- The replacement order is initiated only after the original product is successfully picked up or returned.
- If the original product is out of stock, a full refund will be processed to the original payment method instead of a replacement.
""",

    "shipping_policy.txt": """AMAZON INDIA SHIPPING POLICY — FEES AND SPEEDS
Last Updated: May 2026

1. SHIPPING SPEEDS & COSTS
Eligible Amazon India customers can choose from:
- One-Day Delivery: Free for Prime members. Non-Prime members pay ₹150.
- Two-Day Delivery: Free for Prime members. Non-Prime members pay ₹120.
- Standard Delivery (2-4 days): Free for Prime members. Non-Prime members get free shipping on orders above ₹499, otherwise pay ₹40.
- Same-Day Delivery: Metro regions only. Free for Prime members for orders above ₹499.
""",

    "cancellation_policy.txt": """AMAZON INDIA CANCELLATION POLICY — PRE-DISPATCH GUIDELINES
Last Updated: May 2026

1. CANCELLATION TIMEFRAME
Customers can cancel items or orders before they enter the shipping process.
- If the order has not been dispatched, cancellation is free and instant, and refunds are initiated immediately.
- Once the package is dispatched, the order cannot be cancelled directly from the app. Customers must refuse delivery when the ATS courier agent attempts drop-off. Once delivery is refused, the package returns to the center and a refund is triggered.
""",

    "warranty_policy.txt": """AMAZON INDIA WARRANTY POLICY — MANUFACTURER ASSISTANCE
Last Updated: May 2026

1. BRAND & BRAND WARRANTY
Products sold on Amazon India may carry a manufacturer warranty.
- Warranty Period: Usually 1 year for electronics and appliances.
- Warranty Claim: The customer must contact the authorized brand service center with the purchase invoice (available for download in the "Your Orders" section).
- Amazon Warranty Assistance: For specific brand partners, Amazon provides direct replacement support within the first 30 days of purchase if the manufacturer fails to resolve issues.
""",

    "delivery_delay_policy.txt": """AMAZON INDIA DELIVERY DELAY POLICY
Last Updated: May 2026

1. UNEXPECTED TRANSIT DELAYS
Occasionally, ATS shipments experience delays due to regional logistics, weather disruptions, or high volume.
- Auto-Notification: The estimated delivery date is revised automatically in the tracking details.
- Shipping Fee Refund: If a guaranteed delivery date is missed for a paid shipping order, the delivery fee is refunded to the customer's account.
- Compensation Voucher: For Prime delivery delays exceeding 48 hours, support agents may issue a ₹50 promotional credit voucher as a goodwill gesture.
""",

    "prime_membership_policy.txt": """AMAZON INDIA PRIME MEMBERSHIP POLICY
Last Updated: May 2026

1. FEES AND PLANS
- Monthly Plan: ₹299 per month.
- Annual Plan: ₹1,499 per year.
- Shopping Benefits: Free One-Day, Two-Day, and Same-Day delivery on eligible products.
- Digital Benefits: Unlimited streaming on Prime Video, ad-free music on Prime Music, free eBooks on Prime Reading, and early access (24 hours) to sale events.
""",

    "payment_failure_policy.txt": """AMAZON INDIA PAYMENT FAILURE POLICY — DOUBLE DEDUCTION HELP
Last Updated: May 2026

1. FAILED TRANSACTIONS AND DEDUCTIONS
If a payment fails during checkout but the customer's bank account or credit card is charged:
- Automatic Refund: The payment gateway detects the failed order and initiates a reversal.
- Timelines: Reversals occur within 24-48 hours for UPI, and 3-5 business days for banks.
- Support Verification: Customers are requested to wait 24 hours. Support agents do not create refund tickets for failed orders until the transaction status is finalized.
""",

    "damaged_product_policy.txt": """AMAZON INDIA DAMAGED PRODUCT POLICY
Last Updated: May 2026

1. REPORTING DAMAGE IN TRANSIT
- Timeframe: Physical damage discovered post-delivery must be reported within 10 days of package delivery.
- Evidence Requirements: For high-value goods (mobiles, laptops, TVs), customers must provide photos of the damaged item and the shipping label on the package box. Unboxing videos are recommended but not mandatory unless fraud is suspected.
- Free Replacement: Amazon India processes a replacement once the damage is verified.
""",

    "escalation_policy.txt": """AMAZON INDIA SUPPORT ESCALATION POLICY
Last Updated: May 2026

1. SUPPORT ESCALATION TIERS
- Tier 1 Support: General customer care agents. Handles FAQs, refunds, tracking, and cancellations.
- Tier 2 Supervisor: Escalate when a customer is highly frustrated, demands supervisor assistance, or has an unresolved payment dispute. Reaches back in 30 minutes.
- Tier 3 Grievance Desk: Reserved for legal, safety, or severe customer disputes. Resolution takes 3-5 business days.
""",

    "callback_policy.txt": """AMAZON INDIA CALLBACK BOOKING RULES
Last Updated: May 2026

1. BOOKING SCHEDULING
- Callback Option: Customers can request a call from an agent through the contact center.
- Availability: Callbacks are scheduled between 8:00 AM and 8:00 PM.
- Agent Verification: The agent will call the registered phone number. If the call is missed, the agent will attempt two more times at 15-minute intervals. If all fail, the ticket is set to pending and the customer must reschedule.
""",

    "complaint_policy.txt": """AMAZON INDIA COMPLAINT REGISTRATION AND HANDLING
Last Updated: May 2026

1. COMPLAINT PROCEDURES
If a customer is dissatisfied with a product, delivery agent behavior, or support resolution, they can file a formal complaint.
- Ticket Creation: A support ticket (TKT-XXXXXXXX) is generated.
- High Priority: Assigned to billing errors, missing deliveries, or delivery agent misconduct.
- Resolution Period: Standard resolution is 24-48 hours. Legal or extreme disputes take 3-5 days.
""",

    "delivery_exception_policy.txt": """AMAZON INDIA DELIVERY EXCEPTION POLICY
Last Updated: May 2026

1. EXCEPTION CATEGORIES
ATS delivery agents face exceptions like:
- Customer Unavailable: Agent makes 3 delivery attempts on consecutive days.
- Incorrect Address: The customer is contacted via phone to update coordinates.
- Gate Security Restriction: Packages can be left with society guards or at the reception desk with the customer's prior SMS permission.
""",

    "lost_package_policy.txt": """AMAZON INDIA LOST PACKAGE IN TRANSIT POLICY
Last Updated: May 2026

1. DEFINING LOST PACKAGES
A package is declared lost in transit if:
- Tracking shows no movement or updates for more than 5 consecutive business days.
- The estimated delivery date has passed by more than 48 hours and the package is untraceable.
- Support action: Support agents will trigger a full refund or a free replacement immediately.
""",

    "late_refund_policy.txt": """AMAZON INDIA LATE REFUND INVESTIGATION
Last Updated: May 2026

1. BANK DELAYS AND INVESTIGATION
If a refund is processed by Amazon but not received in the customer's bank within 5 business days:
- Acquirer Reference Number (ARN): Amazon support provides an ARN code.
- Bank Tracking: The customer can share the ARN with their bank branch to trace the credit.
- Bank Hold: Often banks place refunds in a temporary settlement pool; the ARN resolves this.
""",

    "fraud_detection_policy.txt": """AMAZON INDIA FRAUD DETECTION AND RISK MANAGEMENT
Last Updated: May 2026

1. PREVENTING FRAUDULENT TRANSACTIONS
- Address Verification: System flags accounts ordering high-value products to unverified addresses.
- COD Limitations: Cash on Delivery is disabled for accounts with a high return-to-origin (RTO) rate.
- Order Cancellation: Suspicious orders are placed on hold for 24 hours. Customers must upload identity proof or the order is automatically cancelled.
""",

    "escalation_levels_policy.txt": """AMAZON INDIA SUPPORT RESOLUTION LEVELS
Last Updated: May 2026

1. TIMELINES BY LEVEL
- Level 1 (Customer Support Agent): Real-time chat/voice help. Resolves 85% of cases.
- Level 2 (Shift Supervisor): Escalation response within 30 minutes. Resolves complex return/refund cases.
- Level 3 (Grievance Officer): Resolves severe legal, policy, and account disputes in 3-5 business days.
""",

    "customer_verification_policy.txt": """AMAZON INDIA CUSTOMER VERIFICATION RULES
Last Updated: May 2026

1. SECURITY CHECKS BEFORE ACCOUNT CHANGES
To prevent unauthorized access and data breaches, support agents must verify the caller:
- Required Info: Caller's full name, registered email address, or phone number.
- Transaction Verification: For order details, the customer must confirm the last 4 digits of the card used, or the order date and item name.
- OTP Verification: A One-Time Password (OTP) is sent to the registered mobile for high-risk changes (e.g., email or shipping address update).
""",

    "regional_restrictions_policy.txt": """AMAZON INDIA REGIONAL DELIVERY RESTRICTIONS
Last Updated: May 2026

1. RESTRICTED DELIVERY AND CODES
- Non-Serviceable PIN Codes: Remote mountainous areas or specific border zones.
- Restricted Goods: Flight transport safety regulations ban liquids, batteries, and aerosols from air shipments to North-East India and Jammu & Kashmir. These must be shipped via surface cargo, extending delivery times by 5-7 days.
- Local Restrictions: Selected PIN codes have restrictions on high-value COD orders.
"""
}

def write_default_policies():
    docs_dir = settings.KNOWLEDGE_BASE_DIR
    os.makedirs(docs_dir, exist_ok=True)
    
    # Write each policy if not present
    for filename, content in POLICIES.items():
        file_path = os.path.join(docs_dir, filename)
        # Always write or overwrite if missing
        if not os.path.exists(file_path):
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(content.strip())
            print(f"Created default policy file: {filename}")
