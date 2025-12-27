import bcrypt
from django.core.management.base import BaseCommand
from accounts.models import MongoUser, MongoUserPreference
from credits.utils import add_credits


class Command(BaseCommand):
    help = "Creates a temporary test user for Razorpay verification"

    def handle(self, *args, **options):
        email = "razorpay-test@getsentimate.com"
        password = "TestFlow@9900"

        # Hash password with bcrypt
        hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode(
            "utf-8"
        )

        # Check if user exists
        user = MongoUser.objects(email=email).first()
        if user:
            self.stdout.write(
                self.style.WARNING(
                    f"User {email} already exists. Updating password and provider."
                )
            )
            user.password = hashed
            user.auth_provider = "local"
            user.save()
        else:
            user = MongoUser(
                username="razorpay_test",
                email=email,
                first_name="Razorpay",
                last_name="Test",
                auth_provider="local",
                password=hashed,
                is_active=True,
            )
            user.save()

            # Create default preferences
            try:
                MongoUserPreference.objects.get_or_create(user=user)
            except Exception:
                pass

            # Add initial credits
            add_credits(user, 20, "INIT", "razorpay_test_bonus")

            self.stdout.write(
                self.style.SUCCESS(f"Successfully created test user: {email}")
            )

        self.stdout.write(self.style.SUCCESS("Razorpay test user is ready."))
