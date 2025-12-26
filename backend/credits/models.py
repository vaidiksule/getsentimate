from mongoengine import Document, StringField, IntField, DateTimeField, ReferenceField
from datetime import datetime
from accounts.models import MongoUser


class MongoCreditAccount(Document):
    """MongoDB credit account model"""

    user = ReferenceField(MongoUser, required=True, unique=True)
    balance = IntField(default=0)  # Non-negative balance

    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)

    meta = {"collection": "credit_accounts", "indexes": ["user"]}

    def __str__(self):
        return f"CreditAccount({self.user.username}: {self.balance})"


class MongoCreditTransaction(Document):
    """MongoDB credit transaction model"""

    user = ReferenceField(MongoUser, required=True)
    amount = IntField(required=True)  # Positive for credits, negative for consumption
    balance_after = IntField(required=True)  # Balance after this transaction
    transaction_type = StringField(
        max_length=20, required=True
    )  # 'INIT', 'ADD', 'CONSUME'
    description = StringField(max_length=200)
    reference = StringField(max_length=100)  # Add missing reference field
    related_video_id = StringField(max_length=50)
    related_channel_id = StringField(max_length=50)

    created_at = DateTimeField(default=datetime.utcnow)

    meta = {
        "collection": "credit_transactions",
        "indexes": ["user", "transaction_type", "created_at"],
    }

    def __str__(self):
        return f"CreditTransaction({self.user.username}: {self.amount} -> {self.balance_after})"
