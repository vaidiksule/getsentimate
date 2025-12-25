from django.urls import path
from . import views

app_name = 'credits'

urlpatterns = [
    path('', views.credit_balance, name='credit_balance'),  # Root endpoint for credit balance
    path('balance/', views.credit_balance, name='credit_balance'),
    path('consume/', views.consume_credits_view, name='consume_credits'),
    path('topup/', views.topup_credits, name='topup_credits'),
    path('history/', views.credit_history, name='credit_history'),
]
