# backend/api/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('', views.health_check),  # Simple test endpoint
]
