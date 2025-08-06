from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.http import JsonResponse

@api_view(['GET'])
def test_connection(request):
    return Response({"message": "Django is working!"})


def health_check(request):
    return JsonResponse({"status": "API working"})
