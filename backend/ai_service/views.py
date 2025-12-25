import json
import re
from django.http import JsonResponse
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response

from accounts.models import MongoUser
from .ai_service import ai_service
from credits.utils import consume_credits, InsufficientCreditsError


class URLAnalysisView(APIView):
    """Analyze YouTube URL by extracting video ID and redirecting to analysis"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            data = json.loads(request.body) if request.body else {}
            url = data.get('url')
            
            if not url:
                return Response(
                    {'error': 'URL is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Extract video ID from YouTube URL
            video_id = self._extract_video_id(url)
            
            if not video_id:
                return Response(
                    {'error': 'Invalid YouTube URL. Could not extract video ID.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Forward to the existing CommentAnalysisView
            # We can either redirect or call the analysis logic directly
            # For simplicity, we'll call the analysis logic directly here
            
            user = request.user
            
            # Check if user has sufficient credits
            try:
                consume_credits(user, 5, 'CONSUME', f'comment_analysis_{video_id}')
            except InsufficientCreditsError:
                return Response(
                    {'error': 'Insufficient credits. You need at least 5 credits to analyze comments.'},
                    status=status.HTTP_402_PAYMENT_REQUIRED
                )

            # Get analysis parameters
            analysis_type = data.get('analysis_type', 'sentiment')
            include_toxicity = data.get('include_toxicity', True)

            # Get comments from YouTube service
            from youtube_service.youtube_api_service import YouTubeAPIService
            youtube_service = YouTubeAPIService()
            
            if not user.youtube_access_token:
                return Response(
                    {'error': 'YouTube access token not found. Please connect your YouTube account first.'},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            comments = youtube_service.get_video_comments(video_id, user.youtube_access_token)
            
            if not comments:
                return Response(
                    {'error': 'No comments found for this video or unable to fetch comments.'},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Perform AI analysis
            analysis_result = ai_service.analyze_comments(
                comments=comments,
                analysis_type=analysis_type,
                include_toxicity=include_toxicity
            )

            return Response({
                'message': 'Analysis completed successfully',
                'video_id': video_id,
                'url': url,
                'analysis_type': analysis_type,
                'results': analysis_result,
                'comments_analyzed': len(comments),
                'credits_consumed': 5
            })

        except Exception as e:
            # Refund credits on error
            from credits.utils import add_credits
            add_credits(request.user, 5, 'REFUND', f'analysis_error_{video_id if "video_id" in locals() else "unknown"}')
            
            return Response(
                {'error': f'Analysis failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _extract_video_id(self, url):
        """Extract YouTube video ID from various URL formats"""
        patterns = [
            r'(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/)([a-zA-Z0-9_-]{11})',
            r'youtube\.com/watch\?.*v=([a-zA-Z0-9_-]{11})',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        
        return None


class CommentAnalysisView(APIView):
    """Analyze video comments using AI"""
    permission_classes = [IsAuthenticated]

    def post(self, request, video_id):
        try:
            user = request.user
            
            # Check if user has sufficient credits
            try:
                consume_credits(user, 5, 'CONSUME', f'comment_analysis_{video_id}')
            except InsufficientCreditsError:
                return Response(
                    {'error': 'Insufficient credits. You need at least 5 credits to analyze comments.'},
                    status=status.HTTP_402_PAYMENT_REQUIRED
                )

            # Get analysis parameters
            data = json.loads(request.body) if request.body else {}
            analysis_type = data.get('analysis_type', 'sentiment')
            include_toxicity = data.get('include_toxicity', True)

            # Get comments from YouTube service
            from youtube_service.youtube_api_service import YouTubeAPIService
            youtube_service = YouTubeAPIService()
            
            if not user.youtube_access_token:
                return Response(
                    {'error': 'YouTube access token not found. Please connect your YouTube account first.'},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            comments = youtube_service.get_video_comments(video_id, user.youtube_access_token)
            
            if not comments:
                return Response(
                    {'error': 'No comments found for this video or unable to fetch comments.'},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Perform AI analysis
            analysis_result = ai_service.analyze_comments(
                comments=comments,
                analysis_type=analysis_type,
                include_toxicity=include_toxicity
            )

            # Save analysis result to MongoDB (optional, based on user preferences)
            # This would require creating analysis models in the future

            return Response({
                'message': 'Analysis completed successfully',
                'video_id': video_id,
                'analysis_type': analysis_type,
                'results': analysis_result,
                'comments_analyzed': len(comments),
                'credits_consumed': 5
            })

        except Exception as e:
            # Refund credits on error
            from credits.utils import add_credits
            add_credits(request.user, 5, 'REFUND', f'analysis_error_{video_id}')
            
            return Response(
                {'error': f'Analysis failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AnalysisHistoryView(APIView):
    """Get analysis history for the current user"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            # This would typically fetch from a saved analysis collection
            # For now, return a placeholder response
            return Response({
                'message': 'Analysis history feature coming soon',
                'history': []
            })

        except Exception as e:
            return Response(
                {'error': 'Failed to get analysis history'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AnalysisStatusView(APIView):
    """Get status of an ongoing analysis"""
    permission_classes = [IsAuthenticated]

    def get(self, request, analysis_id):
        try:
            # This would typically check the status of an async analysis job
            # For now, return a placeholder response
            return Response({
                'message': 'Analysis status feature coming soon',
                'analysis_id': analysis_id,
                'status': 'completed',
                'progress': 100
            })

        except Exception as e:
            return Response(
                {'error': 'Failed to get analysis status'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
