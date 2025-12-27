from accounts.models import MongoUser
from .models import MongoCreditAccount, MongoCreditTransaction


class InsufficientCreditsError(Exception):
    """Raised when user doesn't have enough credits for an operation"""

    pass


def get_credit_balance(user):
    """Get current credit balance for a user"""
    try:
        # Ensure user is a MongoUser
        if not isinstance(user, MongoUser):
            user = MongoUser.objects(id=user.id).first()

        account = MongoCreditAccount.objects(user=user).first()
        if account:
            return account.balance
        else:
            # Create credit account if it doesn't exist
            account = MongoCreditAccount.objects.create(user=user, balance=20)
            MongoCreditTransaction.objects.create(
                user=user,
                amount=20,
                balance_after=20,
                transaction_type="INIT",
                reference="signup_bonus",
            )
            return 20
    except Exception as e:
        print(f"Error getting credit balance: {e}")
        return 0


def consume_credits(user, amount=1, transaction_type="ANALYSIS", reference=None):
    """
    Atomically consume credits from a user's account
    """
    if amount <= 0:
        raise ValueError("Amount must be positive")

    try:
        if not isinstance(user, MongoUser):
            user = MongoUser.objects(id=user.id).first()

        # Atomically find and decrement balance if enough credits exist
        account = MongoCreditAccount.objects(user=user, balance__gte=amount).modify(
            inc__balance=-amount, new=True
        )

        if not account:
            # Check if it was missing account or just insufficient balance
            total_account = MongoCreditAccount.objects(user=user).first()
            if not total_account:
                # Should technically exist for all users, but heal if missing
                MongoCreditAccount.objects.create(user=user, balance=0)
                raise InsufficientCreditsError(f"Insufficient credits: 0 < {amount}")
            else:
                raise InsufficientCreditsError(
                    f"Insufficient credits: {total_account.balance} < {amount}"
                )

        new_balance = account.balance

        # 1. Legacy Logging
        MongoCreditTransaction.objects.create(
            user=user,
            amount=-amount,
            balance_after=new_balance,
            transaction_type=transaction_type,
            reference=reference,
        )

        # 2. Modern Logging (UI)
        from transactions.models import Transaction

        tx_type = "analysis"
        if transaction_type == "CONSUME":
            tx_type = "analysis"

        Transaction(
            user_id=str(user.id),
            type=tx_type,
            amount=-amount,
            description="YouTube video analysis"
            if tx_type == "analysis"
            else f"Credits used ({transaction_type})",
            reference=reference,
        ).save()

        return account.balance
    except InsufficientCreditsError:
        raise
    except Exception as e:
        print(f"Error consuming credits: {e}")
        raise


def add_credits(
    user, amount, transaction_type="TOPUP", reference=None, description=None
):
    """
    Atomically add credits to a user's account
    """
    if amount <= 0:
        raise ValueError("Amount must be positive")

    try:
        if not isinstance(user, MongoUser):
            user = MongoUser.objects(id=user.id).first()

        account = MongoCreditAccount.objects(user=user).modify(
            upsert=True, new=True, inc__balance=amount
        )

        # 1. Legacy Logging
        MongoCreditTransaction.objects.create(
            user=user,
            amount=amount,
            balance_after=account.balance,
            transaction_type=transaction_type,
            reference=reference,
        )

        # 2. Modern Logging (UI)
        from transactions.models import Transaction

        tx_type = "bonus"
        if transaction_type in ["TOPUP", "ADD", "PURCHASE"]:
            tx_type = "purchase"
        elif transaction_type in ["INIT", "signup_bonus"]:
            tx_type = "bonus"

        Transaction(
            user_id=str(user.id),
            type=tx_type,
            amount=amount,
            description=description
            or (
                f"Purchased {amount} credits"
                if tx_type == "purchase"
                else f"Bonus credits: {amount}"
            ),
            reference=reference,
            razorpay_payment_id=reference
            if "razorpay" in (reference or "").lower()
            else None,
        ).save()

        return account.balance
    except Exception as e:
        print(f"Error adding credits: {e}")
        raise


def reserve_credits(user, amount=1, reference=None):
    """
    Reserve credits for an async operation (can be refunded later)

    Args:
        user: The user to reserve credits from
        amount: Number of credits to reserve
        reference: Optional reference string

    Returns:
        int: New balance after reservation
    """
    return consume_credits(user, amount, "RESERVED", reference)


def refund_credits(user, amount, reference=None):
    """
    Refund previously consumed/reserved credits

    Args:
        user: The user to refund credits to
        amount: Number of credits to refund
        reference: Optional reference string

    Returns:
        int: New balance after refund
    """
    return add_credits(user, amount, "REFUND", reference)
