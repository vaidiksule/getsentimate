import razorpay
import json
from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from credits.utils import add_credits

# Initialize Razorpay client
client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

# Credit packages (amount in paise, credits to add)
CREDIT_PACKAGES = {
    "verify_live": {"amount": 100, "credits": 1, "name": "Live Verification"},
    "10_credits": {"amount": 9900, "credits": 10, "name": "10 Credits"},
    "30_credits": {"amount": 24900, "credits": 30, "name": "30 Credits"},
    "100_credits": {"amount": 69900, "credits": 100, "name": "100 Credits"},
}


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_order(request):
    """
    Create a Razorpay payment order for credit purchase.
    """
    try:
        data = json.loads(request.body)
        package_id = data.get("package_id")

        if package_id not in CREDIT_PACKAGES:
            return Response(
                {"error": "Invalid package selected"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        package = CREDIT_PACKAGES[package_id]

        # Create Razorpay order
        order_data = {
            "amount": package["amount"],
            "currency": "INR",
            "payment_capture": 1,
            "notes": {
                "user_id": str(request.user.id),
                "package_id": package_id,
                "credits": package["credits"],
                "business": "GetSentimate",
                "site": "https://getsentimate.com",
            },
        }

        order = client.order.create(order_data)

        return Response(
            {
                "order_id": order["id"],
                "amount": order["amount"],
                "currency": order["currency"],
                "package_name": package["name"],
                "credits": package["credits"],
            }
        )

    except Exception as e:
        print(f"Error creating order: {e}")
        return Response(
            {"error": "Failed to create payment order"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def verify_payment(request):
    """
    Verify Razorpay payment signature and add credits to user account.
    """
    try:
        data = json.loads(request.body)

        # Extract payment details
        razorpay_order_id = data.get("razorpay_order_id")
        razorpay_payment_id = data.get("razorpay_payment_id")
        razorpay_signature = data.get("razorpay_signature")

        if not all([razorpay_order_id, razorpay_payment_id, razorpay_signature]):
            return Response(
                {"error": "Missing payment details"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Verify payment signature
        params = {
            "razorpay_order_id": razorpay_order_id,
            "razorpay_payment_id": razorpay_payment_id,
            "razorpay_signature": razorpay_signature,
        }

        try:
            client.utility.verify_payment_signature(params)
        except razorpay.errors.SignatureVerificationError:
            print(f"Signature Verification Failed: {params}")
            return Response(
                {"error": "Invalid payment signature"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check for duplicate processing (idempotency)
        from transactions.models import MongoTransaction

        existing_tx = MongoTransaction.objects(
            reference=f"razorpay_{razorpay_payment_id}"
        ).first()
        if existing_tx:
            return Response(
                {
                    "status": "success",
                    "message": "Payment already processed",
                    "payment_id": razorpay_payment_id,
                }
            )

        # Fetch order details to get credits amount
        order = client.order.fetch(razorpay_order_id)
        credits_to_add = int(order.get("notes", {}).get("credits", 0))
        package_id = order.get("notes", {}).get("package_id", "unknown")

        if credits_to_add <= 0:
            return Response(
                {"error": "Invalid credit amount"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Add credits to user account
        user = request.user
        new_balance = add_credits(
            user,
            credits_to_add,
            transaction_type="ADD",
            reference=f"razorpay_{razorpay_payment_id}",
            description=f"Purchased {credits_to_add} credits",
        )

        return Response(
            {
                "status": "success",
                "message": f"Successfully added {credits_to_add} credits to your account",
                "credits_added": credits_to_add,
                "new_balance": new_balance,
                "payment_id": razorpay_payment_id,
                "package_id": package_id,
            }
        )

    except Exception as e:
        print(f"Error verifying payment: {e}")
        return Response(
            {"error": "Payment verification failed"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
@permission_classes([AllowAny])  # CSRF exempt and public
def razorpay_webhook(request):
    """
    Razorpay Webhook handler for production safety.
    """
    webhook_secret = settings.RAZORPAY_WEBHOOK_SECRET
    webhook_signature = request.headers.get("X-Razorpay-Signature")

    if not webhook_signature:
        return Response({"status": "failed", "error": "Missing signature"}, status=400)

    try:
        # Verify webhook signature
        client.utility.verify_webhook_signature(
            request.body.decode("utf-8"), webhook_signature, webhook_secret
        )

        data = json.loads(request.body)
        event = data.get("event")

        if event == "payment.captured":
            payment = data["payload"]["payment"]["entity"]
            payment_id = payment["id"]
            order_id = payment["order_id"]

            # Fetch order for notes
            order = client.order.fetch(order_id)
            user_id = order["notes"].get("user_id")
            credits_to_add = int(order["notes"].get("credits", 0))

            if user_id:
                from accounts.models import MongoUser
                from transactions.models import MongoTransaction

                user = MongoUser.objects(id=user_id).first()
                if user:
                    # Idempotency check
                    tx_ref = f"razorpay_{payment_id}"
                    if not MongoTransaction.objects(reference=tx_ref).first():
                        add_credits(
                            user,
                            credits_to_add,
                            transaction_type="ADD",
                            reference=tx_ref,
                            description=f"Purchased {credits_to_add} credits (Webhook)",
                        )
                        print(f"Webhook: Credited {credits_to_add} to {user.email}")

        return Response({"status": "success"})

    except razorpay.errors.SignatureVerificationError:
        print("Webhook signature verification failed")
        return Response({"status": "failed", "error": "Invalid signature"}, status=400)
    except Exception as e:
        print(f"Webhook error: {e}")
        return Response({"status": "failed", "error": str(e)}, status=500)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_packages(request):
    """
    Get available credit packages.
    """
    packages = []
    for package_id, details in CREDIT_PACKAGES.items():
        # Only show verify_live to developers if needed, or hide it from UI later
        # For now, let's keep it visible for the verification flow
        packages.append(
            {
                "id": package_id,
                "name": details["name"],
                "credits": details["credits"],
                "price": details["amount"] / 100,  # Convert paise to rupees
                "amount": details["amount"],  # Amount in paise for Razorpay
            }
        )

    return Response({"packages": packages})
