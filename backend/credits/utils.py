from accounts.models import MongoUser
from accounts.backends import MongoBackend
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
                transaction_type='INIT',
                reference='signup_bonus'
            )
            return 20
    except Exception as e:
        print(f"Error getting credit balance: {e}")
        return 0


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
    
    try:
        # Ensure user is a MongoUser
        if not isinstance(user, MongoUser):
            user = MongoUser.objects(id=user.id).first()
        
        # Get or create credit account
        account = MongoCreditAccount.objects(user=user).first()
        if not account:
            account = MongoCreditAccount.objects.create(user=user, balance=0)
        
        if account.balance < amount:
            raise InsufficientCreditsError(f"Insufficient credits: {account.balance} < {amount}")
        
        # Deduct credits
        new_balance = account.balance - amount
        account.balance = new_balance
        account.save()
        
        # Create transaction record
        MongoCreditTransaction.objects.create(
            user=user,
            amount=-amount,
            balance_after=new_balance,
            transaction_type=transaction_type,
            reference=reference
        )
        
        return account.balance
    except InsufficientCreditsError:
        raise
    except Exception as e:
        print(f"Error consuming credits: {e}")
        raise


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
    
    try:
        # Ensure user is a MongoUser
        if not isinstance(user, MongoUser):
            user = MongoUser.objects(id=user.id).first()
        
        # Get or create credit account
        account = MongoCreditAccount.objects(user=user).modify(
            upsert=True,
            new=True,
            inc__balance=amount
        )
        
        # Create transaction record
        MongoCreditTransaction.objects.create(
            user=user,
            amount=amount,
            balance_after=account.balance,
            transaction_type=transaction_type,
            reference=reference
        )
        
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
