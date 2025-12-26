from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
import logging
from .services.youtube import YouTubeFetchService
from .services.cleaner import CommentCleaner
from .services.analyzer import AnalysisService
from credits.models import MongoCreditAccount
from credits.utils import consume_credits

logger = logging.getLogger(__name__)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def analyze_video(request):
    """
    Single endpoint to analyze a video from URL.
    Input: { "youtube_url": "..." }
    """
    try:
        user = request.user

        # 0. Check Credits
        credit_account = MongoCreditAccount.objects(user=user).first()
        if not credit_account:
            # Should technically exist for all users, but handle edge case
            return Response(
                {"error": "Credit account not found. Please contact support."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if credit_account.balance < 1:
            return Response(
                {"error": "Insufficient credits. Please top up your account."},
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )

        url = request.data.get("youtube_url")
        comment_limit = request.data.get("comment_limit", 150)

        # Ensure comment_limit is within bounds [50, 500]
        try:
            comment_limit = min(max(int(comment_limit), 50), 500)
        except (TypeError, ValueError):
            comment_limit = 150

        if not url:
            return Response(
                {"error": "youtube_url is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        # 1. Fetch
        fetcher = YouTubeFetchService()
        logger.info(f"Fetching data for: {url} (limit: {comment_limit})")
        data = fetcher.fetch_video_data(url, max_comments=comment_limit)

        raw_comments = data["comments"]
        metadata = data["metadata"]

        if not raw_comments:
            return Response(
                {"error": "No comments found or comments are disabled."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 2. Clean
        cleaner = CommentCleaner()
        cleaned_comments = cleaner.clean_comments(raw_comments)
        # Ensure we only analyze up to the requested limit
        cleaned_comments = cleaned_comments[:comment_limit]
        logger.info(f"Cleaned {len(raw_comments)} -> {len(cleaned_comments)} comments")

        # 3. Analyze
        analyzer = AnalysisService()
        logger.info("Starting analysis...")
        analysis_result = analyzer.analyze(metadata, cleaned_comments)

        # 4. Deduct Credit (only if analysis succeeded)
        new_balance = consume_credits(
            user=user,
            amount=1,
            transaction_type="CONSUME",
            reference=metadata.get("video_id", "unknown"),
        )

        # 5. Construct Final Response
        response_data = {
            "metadata": metadata,
            "analysis": analysis_result,
            "sample_comments": raw_comments[:5],
            "credits_remaining": new_balance,
        }

        return Response(response_data)

    except Exception as e:
        logger.error(f"Analysis Failed: {e}")
        import traceback

        logger.error(traceback.format_exc())
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
