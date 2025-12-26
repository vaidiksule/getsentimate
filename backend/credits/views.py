from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework import status
from django.core.paginator import Paginator

from .utils import (
    get_credit_balance,
    consume_credits,
    add_credits,
    InsufficientCreditsError,
)
from accounts.models import MongoUser
from .models import MongoCreditTransaction


@api_view(["GET"])
@permission_classes([AllowAny])
def credit_balance(request):
    """Get current credit balance for the authenticated Mongo user"""

    user = request.user

    # Ensure user is a MongoUser
    if not getattr(user, "is_authenticated", False):
        return JsonResponse({"error": "Authentication required"}, status=403)

    if not isinstance(user, MongoUser):
        try:
            user = MongoUser.objects(id=user.id).first()
        except Exception:
            user = None

    if not user:
        return JsonResponse({"error": "User not found"}, status=404)

    try:
        balance = get_credit_balance(user)
        return JsonResponse({"balance": balance})
    except Exception as e:
        return JsonResponse(
            {"error": f"Failed to get balance: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def consume_credits_view(request):
    """Consume credits for the authenticated Mongo user"""

    user = request.user

    # Ensure user is a MongoUser
    if not isinstance(user, MongoUser):
        try:
            user = MongoUser.objects(id=user.id).first()
        except Exception:
            user = None

    if not user:
        return JsonResponse({"error": "User not found"}, status=404)

    try:
        amount = request.data.get("amount", 1)
        if not isinstance(amount, int) or amount <= 0:
            return JsonResponse(
                {"error": "Amount must be a positive integer"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        new_balance = consume_credits(
            user,
            amount=amount,
            reference=request.data.get("reference"),
        )

        return JsonResponse({"balance": new_balance})

    except InsufficientCreditsError as e:
        return JsonResponse({"error": str(e)}, status=status.HTTP_402_PAYMENT_REQUIRED)
    except Exception as e:
        return JsonResponse(
            {"error": f"Failed to consume credits: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
@permission_classes([IsAdminUser])
def topup_credits(request):
    """Admin-only endpoint to top up user credits"""
    try:
        user_identifier = request.data.get("user_id") or request.data.get("user_email")
        amount = request.data.get("amount")
        reference = request.data.get("reference")

        if not user_identifier or not amount:
            return JsonResponse(
                {"error": "user_id/user_email and amount are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not isinstance(amount, int) or amount <= 0:
            return JsonResponse(
                {"error": "Amount must be a positive integer"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Find Mongo user by ID or email
        if user_identifier.isdigit():
            user = MongoUser.objects(id=user_identifier).first()
        else:
            user = MongoUser.objects(email=user_identifier).first()

        if not user:
            return JsonResponse(
                {"error": "User not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        new_balance = add_credits(
            user, amount=amount, transaction_type="TOPUP", reference=reference
        )

        return JsonResponse(
            {
                "user_id": str(user.id),
                "user_email": user.email,
                "new_balance": new_balance,
            }
        )

    except Exception as e:
        return JsonResponse(
            {"error": f"Failed to top up credits: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def credit_history(request):
    """Get credit transaction history for the authenticated Mongo user"""

    user = request.user

    # Ensure user is a MongoUser
    if not isinstance(user, MongoUser):
        try:
            user = MongoUser.objects(id=user.id).first()
        except Exception:
            user = None

    if not user:
        return JsonResponse({"error": "User not found"}, status=404)

    try:
        page = int(request.GET.get("page", 1))
        page_size = int(request.GET.get("page_size", 20))

        if page_size > 100:
            page_size = 100  # Limit page size

        transactions = MongoCreditTransaction.objects(user=user).order_by("-created_at")

        paginator = Paginator(transactions, page_size)
        page_obj = paginator.get_page(page)

        transaction_data = []
        for transaction in page_obj:
            transaction_data.append(
                {
                    "id": str(transaction.id),
                    "amount": transaction.amount,
                    "transaction_type": transaction.transaction_type,
                    "reference": transaction.reference,
                    "created_at": transaction.created_at.isoformat(),
                }
            )

        return JsonResponse(
            {
                "transactions": transaction_data,
                "pagination": {
                    "page": page,
                    "page_size": page_size,
                    "total": paginator.count,
                    "total_pages": paginator.num_pages,
                    "has_next": page_obj.has_next(),
                    "has_previous": page_obj.has_previous(),
                },
            }
        )

    except Exception as e:
        return JsonResponse(
            {"error": f"Failed to get transaction history: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_credit_history(request):
    """Admin endpoint to get credit transaction history for any Mongo user"""
    try:
        user_identifier = request.GET.get("user_id") or request.GET.get("user_email")
        page = int(request.GET.get("page", 1))
        page_size = int(request.GET.get("page_size", 20))

        if not user_identifier:
            return JsonResponse(
                {"error": "user_id or user_email is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if page_size > 100:
            page_size = 100

        # Find Mongo user
        if user_identifier.isdigit():
            user = MongoUser.objects(id=user_identifier).first()
        else:
            user = MongoUser.objects(email=user_identifier).first()

        if not user:
            return JsonResponse(
                {"error": "User not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        transactions = MongoCreditTransaction.objects(user=user).order_by("-created_at")

        paginator = Paginator(transactions, page_size)
        page_obj = paginator.get_page(page)

        transaction_data = []
        for transaction in page_obj:
            transaction_data.append(
                {
                    "id": transaction.id,
                    "amount": transaction.amount,
                    "transaction_type": transaction.transaction_type,
                    "reference": transaction.reference,
                    "created_at": transaction.created_at.isoformat(),
                }
            )

        return JsonResponse(
            {
                "user_id": user.id,
                "user_email": user.email,
                "transactions": transaction_data,
                "pagination": {
                    "page": page,
                    "page_size": page_size,
                    "total": paginator.count,
                    "total_pages": paginator.num_pages,
                    "has_next": page_obj.has_next(),
                    "has_previous": page_obj.has_previous(),
                },
            }
        )

    except Exception as e:
        return JsonResponse(
            {"error": f"Failed to get transaction history: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
