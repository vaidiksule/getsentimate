from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from .models import Comment, Video, AnalysisSession
from .serializers import CommentSerializer, VideoSerializer, AnalysisSessionSerializer
from .services.youtube_service import YouTubeService
from .services.ai_service import AIService


@api_view(['GET'])
@permission_classes([AllowAny])
def test_connection(request):
    """Test endpoint for frontend connection"""
    return Response({
        "message": "Django API is working!",
        "status": "success",
        "version": "1.0.0"
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """Health check endpoint"""
    return Response({
        "status": "healthy",
        "service": "GetSentimate API",
        "database": "connected"
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def ai_service_status(request):
    """Check AI service availability and status"""
    try:
        ai_service = AIService()
        status_info = ai_service.get_service_status()
        
        return Response({
            "ai_services": status_info,
            "message": "AI service status retrieved successfully"
        })
    except Exception as e:
        return Response({
            "ai_services": {
                "openai_available": False,
                "gemini_available": False,
                "primary_service": "none"
            },
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def comments_list(request):
    """Get list of comments with optional filtering"""
    comments = Comment.objects.all()
    
    # Filter by video_id if provided
    video_id = request.query_params.get('video_id')
    if video_id:
        comments = comments.filter(video_id=video_id)
    
    # Filter by sentiment if provided
    sentiment = request.query_params.get('sentiment')
    if sentiment:
        comments = comments.filter(sentiment_label=sentiment)
    
    # Filter by toxicity if provided
    toxicity = request.query_params.get('toxicity')
    if toxicity:
        comments = comments.filter(toxicity_label=toxicity)
    
    serializer = CommentSerializer(comments, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def comment_detail(request, comment_id):
    """Get detailed information about a specific comment"""
    comment = get_object_or_404(Comment, comment_id=comment_id)
    serializer = CommentSerializer(comment)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([AllowAny])
def analyze_video(request):
    """Start analysis for a YouTube video"""
    video_id = request.data.get('video_id')
    if not video_id:
        return Response(
            {"error": "video_id is required"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if video already exists
    video, created = Video.objects.get_or_create(
        video_id=video_id,
        defaults={
            'title': request.data.get('title', ''),
            'channel_id': request.data.get('channel_id', ''),
            'channel_title': request.data.get('channel_title', ''),
        }
    )
    
    # Create analysis session
    session = AnalysisSession.objects.create(
        video=video,
        status='pending',
        total_comments=request.data.get('comment_count', 0)
    )
    
    # TODO: Trigger async analysis task
    # analyze_video_comments.delay(video_id, session.id)
    
    return Response({
        "message": "Analysis started",
        "session_id": session.id,
        "video_id": video_id,
        "status": "pending"
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def analysis_status(request, session_id):
    """Get analysis session status"""
    session = get_object_or_404(AnalysisSession, id=session_id)
    serializer = AnalysisSessionSerializer(session)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def video_analytics(request, video_id):
    """Get analytics summary for a video"""
    video = get_object_or_404(Video, video_id=video_id)
    comments = Comment.objects.filter(video_id=video_id)
    
    # Calculate analytics
    total_comments = comments.count()
    analyzed_comments = comments.filter(analyzed=True).count()
    
    sentiment_distribution = {
        'positive': comments.filter(sentiment_label='positive').count(),
        'negative': comments.filter(sentiment_label='negative').count(),
        'neutral': comments.filter(sentiment_label='neutral').count(),
    }
    
    toxicity_distribution = {
        'toxic': comments.filter(toxicity_label='toxic').count(),
        'non-toxic': comments.filter(toxicity_label='non-toxic').count(),
    }
    
    return Response({
        "video_id": video_id,
        "total_comments": total_comments,
        "analyzed_comments": analyzed_comments,
        "sentiment_distribution": sentiment_distribution,
        "toxicity_distribution": toxicity_distribution,
        "analysis_progress": (analyzed_comments / total_comments * 100) if total_comments > 0 else 0
    })


# New YouTube integration endpoints
@api_view(['POST'])
@permission_classes([AllowAny])
def fetch_youtube_comments(request):
    """Fetch comments from YouTube video URL"""
    url = request.data.get('url')
    if not url:
        return Response(
            {"error": "YouTube URL is required"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        youtube_service = YouTubeService()
        result = youtube_service.process_video_url(url)
        
        return Response({
            "message": "Comments fetched successfully",
            "video_id": result['video_id'],
            "total_comments": result['total_comments'],
            "video": VideoSerializer(result['video']).data,
            "comments_count": len(result['comments'])
        })
        
    except ValueError as e:
        return Response(
            {"error": str(e)}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {"error": f"Failed to fetch comments: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def analyze_comments(request):
    """Analyze comments for sentiment and toxicity"""
    # Handle both GET and POST requests
    if request.method == 'GET':
        video_id = request.query_params.get('video_id')
    else:
        video_id = request.data.get('video_id')
    
    if not video_id:
        return Response(
            {"error": "video_id is required"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Check if video exists
        try:
            video = Video.objects.get(video_id=video_id)
        except Video.DoesNotExist:
            return Response({
                "error": f"Video with ID {video_id} not found. Please fetch comments first using /api/youtube/fetch-comments/",
                "video_id": video_id
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Get all comments for this video
        all_comments = Comment.objects.filter(video_id=video_id)
        total_comments = all_comments.count()
        
        if total_comments == 0:
            return Response({
                "error": f"No comments found for video {video_id}. Please fetch comments first using /api/youtube/fetch-comments/",
                "video_id": video_id,
                "total_comments": 0
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Get unanalyzed comments
        unanalyzed_comments = all_comments.filter(analyzed=False)
        unanalyzed_count = unanalyzed_comments.count()
        
        if unanalyzed_count == 0:
            # All comments are already analyzed
            analyzed_comments = all_comments.filter(analyzed=True)
            analyzed_count = analyzed_comments.count()
            
            # Generate summary for all comments
            comment_texts = [c.text for c in all_comments]
            ai_service = AIService()
            summary_result = ai_service.summarize_comments(comment_texts)
            key_topics = ai_service.extract_key_topics(comment_texts)
            
            return Response({
                "message": "All comments already analyzed",
                "video_id": video_id,
                "total_comments": total_comments,
                "analyzed_count": analyzed_count,
                "unanalyzed_count": 0,
                "summary": summary_result.get('summary', ''),
                "key_topics": key_topics,
                "suggestions": summary_result.get('suggestions', []),
                "pain_points": summary_result.get('pain_points', [])
            })
        
        # Analyze unanalyzed comments
        ai_service = AIService()
        analyzed_count = 0
        
        for comment in unanalyzed_comments:
            try:
                # Analyze sentiment
                sentiment_result = ai_service.analyze_sentiment(comment.text)
                comment.sentiment_score = sentiment_result.get('sentiment_score', 0.0)
                comment.sentiment_label = sentiment_result.get('sentiment_label', 'neutral')
                
                # Analyze toxicity
                toxicity_result = ai_service.detect_toxicity(comment.text)
                comment.toxicity_score = toxicity_result.get('toxicity_score', 0.0)
                comment.toxicity_label = toxicity_result.get('toxicity_label', 'non-toxic')
                
                comment.analyzed = True
                comment.save()
                analyzed_count += 1
                
            except Exception as e:
                # Continue with next comment if one fails
                print(f"Error analyzing comment {comment.id}: {str(e)}")
                continue
        
        # Generate summary for all comments
        comment_texts = [c.text for c in all_comments]
        summary_result = ai_service.summarize_comments(comment_texts)
        key_topics = ai_service.extract_key_topics(comment_texts)
        
        # Update video with analysis metadata
        video.comments_analyzed = all_comments.filter(analyzed=True).count()
        video.save()
        
        return Response({
            "message": "Comments analyzed successfully",
            "video_id": video_id,
            "total_comments": total_comments,
            "analyzed_count": analyzed_count,
            "unanalyzed_count": unanalyzed_count - analyzed_count,
            "summary": summary_result.get('summary', ''),
            "key_topics": key_topics,
            "suggestions": summary_result.get('suggestions', []),
            "pain_points": summary_result.get('pain_points', [])
        })
        
    except Exception as e:
        return Response(
            {"error": f"Failed to analyze comments: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def video_info(request, video_id):
    """Get video information and metadata"""
    try:
        video = get_object_or_404(Video, video_id=video_id)
        serializer = VideoSerializer(video)
        
        # Get comment statistics
        comments = Comment.objects.filter(video_id=video_id)
        total_comments = comments.count()
        analyzed_comments = comments.filter(analyzed=True).count()
        
        return Response({
            "video": serializer.data,
            "total_comments": total_comments,
            "analyzed_comments": analyzed_comments,
            "analysis_progress": (analyzed_comments / total_comments * 100) if total_comments > 0 else 0
        })
        
    except Exception as e:
        return Response(
            {"error": f"Failed to get video info: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def debug_video_comments(request, video_id):
    """Debug endpoint to check comments for a video"""
    try:
        # Check if video exists
        try:
            video = Video.objects.get(video_id=video_id)
        except Video.DoesNotExist:
            return Response({
                "error": f"Video with ID {video_id} not found",
                "video_id": video_id
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Get all comments for this video
        all_comments = Comment.objects.filter(video_id=video_id)
        total_comments = all_comments.count()
        analyzed_comments = all_comments.filter(analyzed=True).count()
        unanalyzed_comments = all_comments.filter(analyzed=False).count()
        
        # Get sample comments
        sample_comments = all_comments[:5].values('id', 'author_name', 'text', 'analyzed', 'sentiment_label', 'toxicity_label')
        
        return Response({
            "video_id": video_id,
            "video_title": video.title,
            "total_comments": total_comments,
            "analyzed_comments": analyzed_comments,
            "unanalyzed_comments": unanalyzed_comments,
            "sample_comments": list(sample_comments)
        })
        
    except Exception as e:
        return Response(
            {"error": f"Failed to get debug info: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
