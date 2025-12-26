from django.urls import path
from . import views

app_name = "transactions"

urlpatterns = [
    path("summary/", views.transaction_summary, name="summary"),
    path("", views.transaction_list, name="list"),
]
