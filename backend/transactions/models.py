from mongoengine import Document, fields
from datetime import datetime


class Transaction(Document):
    """
    Transaction model for tracking credit purchases, bonuses, and usage.
    """

    user_id = fields.StringField(required=True, max_length=255)
    type = fields.StringField(
        required=True, choices=["purchase", "bonus", "analysis"], max_length=20
    )
    amount = fields.IntField(
        required=True
    )  # Positive for purchase/bonus, negative for analysis
    description = fields.StringField(required=True, max_length=500)
    reference = fields.StringField(max_length=255, null=True)
    razorpay_payment_id = fields.StringField(max_length=255, null=True)
    created_at = fields.DateTimeField(default=datetime.utcnow)

    meta = {
        "collection": "transactions",
        "indexes": [
            "user_id",
            "-created_at",  # Descending order for latest first
        ],
        "ordering": ["-created_at"],
    }

    def __str__(self):
        return f"{self.user_id} - {self.type} - {self.amount} credits"
