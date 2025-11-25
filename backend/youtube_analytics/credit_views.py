from django.shortcuts import get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework import status
from django.contrib.auth import get_user_model
from django.core.paginator import Paginator
from django.db.utils import IntegrityError

from .credit_utils import (
    get_credit_balance, 
    consume_credits, 
    add_credits, 
    InsufficientCreditsError
)
from .models import CreditTransaction

User = get_user_model()


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def credit_balance(request):
    """Get current credit balance"""
    print(f"Credit balance request - Session key: {request.session.session_key}")
    print(f"Credit balance request - User authenticated: {request.user.is_authenticated}")
    print(f"Credit balance request - User ID: {request.user.id if hasattr(request.user, 'id') else 'No user'}")
    print(f"Credit balance request - Headers: {dict(request.headers)}")
    
    # Handle cross-domain session ID
    session_id_from_header = request.headers.get('X-Session-ID')
    print(f"Credit balance - Session ID from header: {session_id_from_header}")
    
    if session_id_from_header:
        # Try to load session using the provided session ID
        from django.contrib.sessions.backends.db import SessionStore
        try:
            session = SessionStore(session_key=session_id_from_header)
            print(f"Credit balance - Session exists: {session.exists(session_id_from_header)}")
            
            if session.exists(session_id_from_header):
                session_data = session.load()
                print(f"Credit balance - Session data: {session_data}")
                user_id = session_data.get('_auth_user_id')
                print(f"Credit balance - User ID from session: {user_id}")
                
                if user_id:
                    from django.contrib.auth import get_user_model
                    User = get_user_model()
                    user = User.objects.get(id=user_id)
                    
                    # Create a new session for this domain
                    from django.contrib.auth import login
                    login(request, user, backend='django.contrib.auth.backends.ModelBackend')
                    
                    print(f"Cross-domain auth successful for credits endpoint: {user.email}")
                    print(f"After login - User authenticated: {request.user.is_authenticated}")
                    print(f"After login - User ID: {request.user.id}")
        except Exception as e:
            print(f"Cross-domain session error in credits: {e}")
    
    print(f"Final check - User authenticated: {request.user.is_authenticated}")
    
    if not request.user.is_authenticated:
        print("User is not authenticated, returning 403")
        return JsonResponse({'error': 'Authentication required'}, status=403)
    
    try:
        balance = get_credit_balance(request.user)
        return JsonResponse({'balance': balance})
    except Exception as e:
        return JsonResponse(
            {'error': f'Failed to get balance: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def consume_credits_view(request):
    """Consume credits"""
    # Handle cross-domain session ID
    session_id_from_header = request.headers.get('X-Session-ID')
    if session_id_from_header:
        # Try to load session using the provided session ID
        from django.contrib.sessions.backends.db import SessionStore
        try:
            session = SessionStore(session_key=session_id_from_header)
            if session.exists(session_id_from_header):
                session_data = session.load()
                user_id = session_data.get('_auth_user_id')
                if user_id:
                    from django.contrib.auth import get_user_model
                    User = get_user_model()
                    user = User.objects.get(id=user_id)
                    
                    # Create a new session for this domain
                    from django.contrib.auth import login
                    login(request, user, backend='django.contrib.auth.backends.ModelBackend')
                    
                    print(f"Cross-domain auth successful for consume credits: {user.email}")
        except Exception as e:
            print(f"Cross-domain session error in consume credits: {e}")
    
    try:
        amount = request.data.get('amount', 1)
        if not isinstance(amount, int) or amount <= 0:
            return JsonResponse(
                {'error': 'Amount must be a positive integer'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        new_balance = consume_credits(
            request.user, 
            amount=amount, 
            reference=request.data.get('reference')
        )
        
        return JsonResponse({'balance': new_balance})
        
    except InsufficientCreditsError as e:
        return JsonResponse(
            {'error': str(e)}, 
            status=status.HTTP_402_PAYMENT_REQUIRED
        )
    except Exception as e:
        return JsonResponse(
            {'error': f'Failed to consume credits: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAdminUser])
def topup_credits(request):
    """Admin-only endpoint to top up user credits"""
    try:
        user_identifier = request.data.get('user_id') or request.data.get('user_email')
        amount = request.data.get('amount')
        reference = request.data.get('reference')
        
        if not user_identifier or not amount:
            return JsonResponse(
                {'error': 'user_id/user_email and amount are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not isinstance(amount, int) or amount <= 0:
            return JsonResponse(
                {'error': 'Amount must be a positive integer'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Find user by ID or email
        if user_identifier.isdigit():
            user = get_object_or_404(User, id=int(user_identifier))
        else:
            user = get_object_or_404(User, email=user_identifier)
        
        new_balance = add_credits(
            user, 
            amount=amount, 
            transaction_type='TOPUP',
            reference=reference
        )
        
        return JsonResponse({
            'user_id': user.id,
            'user_email': user.email,
            'new_balance': new_balance
        })
        
    except Exception as e:
        return JsonResponse(
            {'error': f'Failed to top up credits: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def credit_history(request):
    """Get credit transaction history for the authenticated user"""
    # Handle cross-domain session ID
    session_id_from_header = request.headers.get('X-Session-ID')
    if session_id_from_header:
        # Try to load session using the provided session ID
        from django.contrib.sessions.backends.db import SessionStore
        try:
            session = SessionStore(session_key=session_id_from_header)
            if session.exists(session_id_from_header):
                session_data = session.load()
                user_id = session_data.get('_auth_user_id')
                if user_id:
                    from django.contrib.auth import get_user_model
                    User = get_user_model()
                    user = User.objects.get(id=user_id)
                    
                    # Create a new session for this domain
                    from django.contrib.auth import login
                    login(request, user, backend='django.contrib.auth.backends.ModelBackend')
                    
                    print(f"Cross-domain auth successful for credit history: {user.email}")
        except Exception as e:
            print(f"Cross-domain session error in credit history: {e}")
    
    try:
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 20))
        
        if page_size > 100:
            page_size = 100  # Limit page size
        
        transactions = CreditTransaction.objects.filter(user=request.user)
        
        paginator = Paginator(transactions, page_size)
        page_obj = paginator.get_page(page)
        
        transaction_data = []
        for transaction in page_obj:
            transaction_data.append({
                'id': transaction.id,
                'amount': transaction.amount,
                'transaction_type': transaction.transaction_type,
                'reference': transaction.reference,
                'created_at': transaction.created_at.isoformat()
            })
        
        return JsonResponse({
            'transactions': transaction_data,
            'pagination': {
                'page': page,
                'page_size': page_size,
                'total': paginator.count,
                'total_pages': paginator.num_pages,
                'has_next': page_obj.has_next(),
                'has_previous': page_obj.has_previous()
            }
        })
        
    except Exception as e:
        return JsonResponse(
            {'error': f'Failed to get transaction history: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_credit_history(request):
    """Admin endpoint to get credit transaction history for any user"""
    try:
        user_identifier = request.GET.get('user_id') or request.GET.get('user_email')
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 20))
        
        if not user_identifier:
            return JsonResponse(
                {'error': 'user_id or user_email is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if page_size > 100:
            page_size = 100
        
        # Find user
        if user_identifier.isdigit():
            user = get_object_or_404(User, id=int(user_identifier))
        else:
            user = get_object_or_404(User, email=user_identifier)
        
        transactions = CreditTransaction.objects.filter(user=user)
        
        paginator = Paginator(transactions, page_size)
        page_obj = paginator.get_page(page)
        
        transaction_data = []
        for transaction in page_obj:
            transaction_data.append({
                'id': transaction.id,
                'amount': transaction.amount,
                'transaction_type': transaction.transaction_type,
                'reference': transaction.reference,
                'created_at': transaction.created_at.isoformat()
            })
        
        return JsonResponse({
            'user_id': user.id,
            'user_email': user.email,
            'transactions': transaction_data,
            'pagination': {
                'page': page,
                'page_size': page_size,
                'total': paginator.count,
                'total_pages': paginator.num_pages,
                'has_next': page_obj.has_next(),
                'has_previous': page_obj.has_previous()
            }
        })
        
    except Exception as e:
        return JsonResponse(
            {'error': f'Failed to get transaction history: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
