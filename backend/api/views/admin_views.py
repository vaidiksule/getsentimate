from django.shortcuts import render
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_metrics_summary(request):
    """
    Returns a summary of admin metrics.
    """
    total_users = User.objects.count()
    last_24h_signups = User.objects.filter(date_joined__gte=timezone.now() - timezone.timedelta(hours=24)).count()

    # Basic last login distribution
    last_login_distribution = {}
    one_week_ago = timezone.now() - timezone.timedelta(days=7)
    one_month_ago = timezone.now() - timezone.timedelta(days=30)

    last_login_distribution['last_24h'] = User.objects.filter(last_login__gte=timezone.now() - timezone.timedelta(hours=24)).count()
    last_login_distribution['last_week'] = User.objects.filter(last_login__gte=one_week_ago).count()
    last_login_distribution['last_month'] = User.objects.filter(last_login__gte=one_month_ago).count()
    last_login_distribution['older'] = User.objects.filter(last_login__lt=one_month_ago).count()

    return Response({
        'total_users': total_users,
        'last_24h_signups': last_24h_signups,
        'last_login_distribution': last_login_distribution,
    }, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def metrics_users(request):
    """
    Returns user metrics for the admin dashboard.
    """
    total_users = User.objects.count()
    active_users_7d = User.objects.filter(last_login__gte=timezone.now() - timezone.timedelta(days=7)).count()
    active_users_30d = User.objects.filter(last_login__gte=timezone.now() - timezone.timedelta(days=30)).count()

    return Response({
        'total_users': total_users,
        'active_users_7d': active_users_7d,
        'active_users_30d': active_users_30d,
    }, status=status.HTTP_200_OK)
