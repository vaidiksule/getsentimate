from django.db import transaction
from django.contrib.auth import get_user_model
from .models import CreditAccount, CreditTransaction


class InsufficientCreditsError(Exception):
    """Raised when user doesn't have enough credits for an operation"""
    pass


def get_credit_balance(user):
    """Get current credit balance for a user"""
    try:
        account = user.credit_account
        return account.balance
    except CreditAccount.DoesNotExist:
        # Create credit account if it doesn't exist
        with transaction.atomic():
            account = CreditAccount.objects.create(user=user, balance=20)
            CreditTransaction.objects.create(
                user=user,
                amount=20,
                transaction_type='INIT',
                reference='retroactive_signup_bonus'
            )
        return 20


def consume_credits(user, amount=1, transaction_type='ANALYSIS', reference=None):
    """
    Atomically consume credits from a user's account
    
    Args:
        user: The user to consume credits from
        amount: Number of credits to consume (default: 1)
        transaction_type: Type of transaction (default: 'ANALYSIS')
        reference: Optional reference string
    
    Returns:
        int: New balance after consumption
    
    Raises:
        InsufficientCreditsError: If user doesn't have enough credits
    """
    if amount <= 0:
        raise ValueError("Amount must be positive")
    
    with transaction.atomic():
        # Lock the credit account to prevent race conditions
        account = CreditAccount.objects.select_for_update().get(user=user)
        
        if account.balance < amount:
            raise InsufficientCreditsError(f"Insufficient credits: {account.balance} < {amount}")
        
        # Deduct credits
        account.balance -= amount
        account.save()
        
        # Create transaction record
        CreditTransaction.objects.create(
            user=user,
            amount=-amount,
            transaction_type=transaction_type,
            reference=reference
        )
        
        return account.balance


def add_credits(user, amount, transaction_type='TOPUP', reference=None):
    """
    Atomically add credits to a user's account
    
    Args:
        user: The user to add credits to
        amount: Number of credits to add
        transaction_type: Type of transaction (default: 'TOPUP')
        reference: Optional reference string
    
    Returns:
        int: New balance after addition
    """
    if amount <= 0:
        raise ValueError("Amount must be positive")
    
    with transaction.atomic():
        # Lock the credit account to prevent race conditions
        account, created = CreditAccount.objects.select_for_update().get_or_create(
            user=user,
            defaults={'balance': 0}
        )
        
        # Add credits
        account.balance += amount
        account.save()
        
        # Create transaction record
        CreditTransaction.objects.create(
            user=user,
            amount=amount,
            transaction_type=transaction_type,
            reference=reference
        )
        
        return account.balance


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
    return consume_credits(user, amount, 'RESERVED', reference)


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
    return add_credits(user, amount, 'REFUND', reference)
