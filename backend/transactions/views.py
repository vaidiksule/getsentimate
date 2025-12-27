import logging
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Transaction
from credits.models import MongoCreditAccount, MongoCreditTransaction

logger = logging.getLogger(__name__)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def transaction_summary(request):
    """
    Get credit summary for authenticated user.
    """
    try:
        user = request.user
        user_id = str(user.id)

        # Get credit account
        try:
            # Query by user reference, not user_id string
            from accounts.models import MongoUser

            mongo_user = MongoUser.objects(id=user.id).first()
            if mongo_user:
                credit_account = MongoCreditAccount.objects(user=mongo_user).first()
                credit_balance = credit_account.balance if credit_account else 0
            else:
                credit_balance = 0
        except Exception as account_error:
            logger.error(f"Error getting credit account: {account_error}")
            credit_balance = 0

        # Calculate totals from transactions (both new and legacy)
        new_transactions = Transaction.objects(user_id=user_id)

        # Also get legacy transactions
        legacy_transactions = []
        if mongo_user:
            legacy_transactions = MongoCreditTransaction.objects(user=mongo_user)

        # Track razorpay payment IDs to avoid duplicates
        razorpay_ids = set()

        # Calculate from new transactions
        # Only count purchases that have razorpay_payment_id
        total_purchased = sum(
            t.amount
            for t in new_transactions
            if t.type == "purchase" and t.razorpay_payment_id
        )

        # Track payment IDs to avoid counting duplicates from legacy
        for t in new_transactions:
            if t.razorpay_payment_id:
                razorpay_ids.add(t.razorpay_payment_id)

        total_bonus = sum(t.amount for t in new_transactions if t.type == "bonus")

        # Count number of analyses (not sum of amounts)
        total_used = sum(1 for t in new_transactions if t.type == "analysis")

        # Add legacy transactions (only if not duplicates)
        for lt in legacy_transactions:
            # Skip duplicates
            if lt.reference and lt.reference != "unknown":
                if any(pid in lt.reference for pid in razorpay_ids if pid):
                    continue  # Razorpay duplicate
                if any(
                    t.reference == lt.reference
                    for t in new_transactions
                    if t.reference != "unknown"
                ):
                    continue  # Analysis duplicate

            # Check for very close timestamps
            is_close_duplicate = False
            for nt in new_transactions:
                diff = abs((lt.created_at - nt.created_at).total_seconds())
                if diff < 1.0 and lt.amount == nt.amount:
                    is_close_duplicate = True
                    break

            if is_close_duplicate:
                continue

            # Only count ADD/TOPUP/PURCHASE with razorpay reference as purchases
            if lt.transaction_type in ["ADD", "TOPUP", "PURCHASE"]:
                if lt.reference and "razorpay_" in lt.reference:
                    total_purchased += lt.amount
            elif lt.transaction_type in ["ANALYSIS", "CONSUME"]:
                total_used += 1
            elif lt.transaction_type in ["INIT", "signup_bonus"]:
                total_bonus += lt.amount

        return Response(
            {
                "credit_balance": credit_balance,
                "bonus_credits": total_bonus,
                "total_purchased": total_purchased,
                "total_used": total_used,
            }
        )

    except Exception as e:
        logger.error(f"Error in transaction_summary: {e}", exc_info=True)
        return Response(
            {"error": "Failed to fetch transaction summary"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def transaction_list(request):
    """
    Get transaction history for authenticated user (last 20).
    Combines both new Transaction model and legacy MongoCreditTransaction.
    """
    try:
        user = request.user
        user_id = str(user.id)

        # Get new transactions
        new_transactions = Transaction.objects(user_id=user_id).order_by("-created_at")

        # Get legacy transactions
        legacy_transactions = []
        from accounts.models import MongoUser

        mongo_user = MongoUser.objects(id=user.id).first()
        if mongo_user:
            legacy_transactions = MongoCreditTransaction.objects(
                user=mongo_user
            ).order_by("-created_at")

        # Combine and format all transactions
        all_transactions = []

        # Track razorpay payment IDs to avoid duplicates
        razorpay_ids = set()

        # Add new transactions first
        for t in new_transactions:
            all_transactions.append(
                {
                    "type": t.type,
                    "amount": t.amount,
                    "description": t.description,
                    "created_at": t.created_at.strftime("%Y-%m-%d %H:%M"),
                    "razorpay_payment_id": t.razorpay_payment_id,
                    "timestamp": t.created_at,  # For sorting
                }
            )
            # Track payment IDs
            if t.razorpay_payment_id:
                razorpay_ids.add(t.razorpay_payment_id)

        # Add legacy transactions (skip duplicates)
        for lt in legacy_transactions:
            # Skip if this transaction has a reference that matches a new transaction
            # (especially for purchases or identified analyses)
            if lt.reference and lt.reference != "unknown":
                if any(pid in lt.reference for pid in razorpay_ids if pid):
                    continue  # Razorpay duplicate
                if any(
                    t.reference == lt.reference
                    for t in new_transactions
                    if t.reference != "unknown"
                ):
                    continue  # Analysis duplicate with same ID

            # Additional heuristic: check for very close timestamps for 'unknown' reference
            is_close_duplicate = False
            for nt in new_transactions:
                diff = abs((lt.created_at - nt.created_at).total_seconds())
                if (
                    diff < 1.0 and lt.amount == nt.amount
                ):  # within 1 second and same amount
                    is_close_duplicate = True
                    break

            if is_close_duplicate:
                continue

            # Map legacy types to new types
            if lt.transaction_type == "INIT":
                trans_type = "bonus"
                description = "Welcome bonus"
            elif lt.transaction_type in ["ADD", "TOPUP", "PURCHASE"]:
                trans_type = "purchase"
                description = lt.description or "Credit purchase"
            elif lt.transaction_type in ["ANALYSIS", "CONSUME"]:
                trans_type = "analysis"
                description = "YouTube video analysis"
            else:
                trans_type = "bonus"
                description = lt.description or lt.transaction_type

            all_transactions.append(
                {
                    "type": trans_type,
                    "amount": lt.amount,
                    "description": description,
                    "created_at": lt.created_at.strftime("%Y-%m-%d %H:%M"),
                    "razorpay_payment_id": None,
                    "timestamp": lt.created_at,  # For sorting
                }
            )

        # Sort by timestamp (newest first) and limit to 20
        all_transactions.sort(key=lambda x: x["timestamp"], reverse=True)
        all_transactions = all_transactions[:20]

        # Remove timestamp field before returning
        for t in all_transactions:
            del t["timestamp"]

        return Response(all_transactions)

    except Exception as e:
        print(f"Error in transaction_list: {e}")
        import traceback

        traceback.print_exc()
        return Response(
            {"error": "Failed to fetch transactions"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
