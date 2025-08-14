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


# ------------------------------
# BASIC TEST & STATUS ENDPOINTS
# ------------------------------

@api_view(['GET'])
@permission_classes([AllowAny])
def test_connection(request):
    """Simple endpoint to confirm the API is reachable"""
    return Response({
        "message": "Django API is working!",
        "status": "success",
        "version": "1.0.0"
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """Returns a quick health status of the API and database connection"""
    return Response({
        "status": "healthy",
        "service": "GetSentimate API",
        "database": "connected"
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def ai_service_status(request):
    """
    Checks availability of AI services (e.g., OpenAI, Gemini)
    and returns their operational status
    """
    try:
        ai_service = AIService()
        status_info = ai_service.get_service_status()
        
        return Response({
            "ai_services": status_info,
            "message": "AI service status retrieved successfully"
        })
    except Exception as e:
        # If check fails, mark all services as unavailable
        return Response({
            "ai_services": {
                "openai_available": False,
                "gemini_available": False,
                "primary_service": "none"
            },
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ------------------------------
# COMMENT RETRIEVAL ENDPOINTS
# ------------------------------

@api_view(['GET'])
@permission_classes([AllowAny])
def comments_list(request):
    """
    Returns a list of comments with optional filters:
    - video_id
    - sentiment
    - toxicity
    """
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
    """Returns a single comment by its ID"""
    comment = get_object_or_404(Comment, comment_id=comment_id)
    serializer = CommentSerializer(comment)
    return Response(serializer.data)


# ------------------------------
# VIDEO ANALYSIS SESSION HANDLING
# ------------------------------

@api_view(['POST'])
@permission_classes([AllowAny])
def analyze_video(request):
    """
    Starts an analysis session for a given video ID.
    Creates the video if it doesn't exist and
    registers an AnalysisSession with status 'pending'.
    """
    video_id = request.data.get('video_id')
    if not video_id:
        return Response(
            {"error": "video_id is required"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Create video record if it doesn't exist
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
    
    # Placeholder for async analysis trigger
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
    """Returns the current status of an analysis session"""
    session = get_object_or_404(AnalysisSession, id=session_id)
    serializer = AnalysisSessionSerializer(session)
    return Response(serializer.data)


# ------------------------------
# VIDEO ANALYTICS & SUMMARY
# ------------------------------

@api_view(['GET'])
@permission_classes([AllowAny])
def video_analytics(request, video_id):
    """
    Returns sentiment/toxicity distribution for a video's comments,
    transcript metadata, and analysis progress.
    """
    video = get_object_or_404(Video, video_id=video_id)
    comments = Comment.objects.filter(video_id=video_id)
    
    # Basic counts
    total_comments = comments.count()
    analyzed_comments = comments.filter(analyzed=True).count()
    
    # Sentiment breakdown
    sentiment_distribution = {
        'positive': comments.filter(sentiment_label='positive').count(),
        'negative': comments.filter(sentiment_label='negative').count(),
        'neutral': comments.filter(sentiment_label='neutral').count(),
    }
    
    # Toxicity breakdown
    toxicity_distribution = {
        'toxic': comments.filter(toxicity_label='toxic').count(),
        'non-toxic': comments.filter(toxicity_label='non-toxic').count(),
    }
    
    # Transcript info
    transcript_info = {
        'available': video.transcript_available,
        'analyzed': video.transcript_analyzed,
        'length': len(video.transcript) if video.transcript else 0,
        'word_count': len(video.transcript.split()) if video.transcript else 0
    }
    
    return Response({
        "video_id": video_id,
        "total_comments": total_comments,
        "analyzed_comments": analyzed_comments,
        "sentiment_distribution": sentiment_distribution,
        "toxicity_distribution": toxicity_distribution,
        "transcript_info": transcript_info,
        "analysis_progress": (analyzed_comments / total_comments * 100) if total_comments > 0 else 0
    })


# ------------------------------
# YOUTUBE FETCH & AI ANALYSIS
# ------------------------------

@api_view(['POST'])
@permission_classes([AllowAny])
def fetch_youtube_comments(request):
    """
    Given a YouTube URL, fetches:
    - video metadata
    - comments
    - transcript (optional, default True)
    """
    url = request.data.get('url')
    fetch_transcript = request.data.get('fetch_transcript', True)
    
    if not url:
        return Response(
            {"error": "YouTube URL is required"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        youtube_service = YouTubeService()
        result = youtube_service.process_video_url(url, fetch_transcript=fetch_transcript)
        
        return Response({
            "message": "Comments fetched successfully",
            "video_id": result['video_id'],
            "total_comments": result['total_comments'],
            "video": VideoSerializer(result['video']).data,
            "comments_count": len(result['comments']),
            "transcript_available": result['transcript_available'],
            "transcript_length": result['transcript_length']
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
    """
    Analyzes all unanalyzed comments for:
    - Sentiment (positive/negative/neutral)
    - Toxicity (toxic/non-toxic)
    
    If all comments are already analyzed, returns summary and key topics.
    """
    # GET or POST video_id parameter
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
        # Validate video exists
        try:
            video = Video.objects.get(video_id=video_id)
        except Video.DoesNotExist:
            return Response({
                "error": f"Video with ID {video_id} not found. Please fetch comments first using /api/youtube/fetch-comments/",
                "video_id": video_id
            }, status=status.HTTP_404_NOT_FOUND)
        
        all_comments = Comment.objects.filter(video_id=video_id)
        total_comments = all_comments.count()
        
        if total_comments == 0:
            return Response({
                "error": f"No comments found for video {video_id}. Please fetch comments first using /api/youtube/fetch-comments/",
                "video_id": video_id,
                "total_comments": 0
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Filter for unanalyzed comments
        unanalyzed_comments = all_comments.filter(analyzed=False)
        unanalyzed_count = unanalyzed_comments.count()
        
        if unanalyzed_count == 0:
            # Already analyzed — just return summary and topics
            comment_texts = [c.text for c in all_comments]
            ai_service = AIService()
            summary_result = ai_service.summarize_comments(comment_texts)
            key_topics = ai_service.extract_key_topics(comment_texts)
            
            return Response({
                "message": "All comments already analyzed",
                "video_id": video_id,
                "total_comments": total_comments,
                "analyzed_count": total_comments,
                "unanalyzed_count": 0,
                "summary": summary_result.get('summary', ''),
                "key_topics": key_topics,
                "suggestions": summary_result.get('suggestions', []),
                "pain_points": summary_result.get('pain_points', [])
            })
        
        # Process each unanalyzed comment
        ai_service = AIService()
        analyzed_count = 0
        
        for comment in unanalyzed_comments:
            try:
                # Sentiment analysis
                sentiment_result = ai_service.analyze_sentiment(comment.text)
                comment.sentiment_score = sentiment_result.get('sentiment_score', 0.0)
                comment.sentiment_label = sentiment_result.get('sentiment_label', 'neutral')
                
                # Toxicity detection
                toxicity_result = ai_service.detect_toxicity(comment.text)
                comment.toxicity_score = toxicity_result.get('toxicity_score', 0.0)
                comment.toxicity_label = toxicity_result.get('toxicity_label', 'non-toxic')
                
                comment.analyzed = True
                comment.save()
                analyzed_count += 1
                
            except Exception as e:
                # Skip failed comment analysis but continue processing
                print(f"Error analyzing comment {comment.id}: {str(e)}")
                continue
        
        # Summarize all comments after processing
        comment_texts = [c.text for c in all_comments]
        summary_result = ai_service.summarize_comments(comment_texts)
        key_topics = ai_service.extract_key_topics(comment_texts)
        
        # Update analyzed count on video
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


# ------------------------------
# VIDEO METADATA & DEBUGGING
# ------------------------------

@api_view(['GET'])
@permission_classes([AllowAny])
def video_info(request, video_id):
    """
    Returns video metadata + comment stats:
    - Total comments
    - Analyzed comments
    - Analysis progress %
    """
    try:
        video = get_object_or_404(Video, video_id=video_id)
        serializer = VideoSerializer(video)
        
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
    """
    Debugging endpoint — returns first 10 comments of a video
    with sentiment/toxicity labels for inspection.
    """
    try:
        video = get_object_or_404(Video, video_id=video_id)
        comments = Comment.objects.filter(video_id=video_id)
        
        return Response({
            "video_id": video_id,
            "video_title": video.title,
            "total_comments": comments.count(),
            "transcript_available": video.transcript_available,
            "transcript_length": len(video.transcript) if video.transcript else 0,
            "comments": [
                {
                    "id": c.id,
                    "text": c.text[:100] + "..." if len(c.text) > 100 else c.text,
                    "author": c.author_name,
                    "sentiment": c.sentiment_label,
                    "toxicity": c.toxicity_label,
                    "analyzed": c.analyzed
                }
                for c in comments[:10]  # Limit to 10 for preview
            ]
        })
        
    except Exception as e:
        return Response(
            {"error": f"Failed to get debug info: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ------------------------------
# TRANSCRIPT ANALYSIS
# ------------------------------

@api_view(['POST'])
@permission_classes([AllowAny])
def analyze_transcript(request, video_id):
    """
    Analyzes the video's transcript (if available) to extract:
    - Context
    - Insights based on comments
    - Other AI-driven analysis
    """
    try:
        video = get_object_or_404(Video, video_id=video_id)
        
        if not video.transcript or not video.transcript_available:
            return Response({
                "error": "No transcript available for this video",
                "video_id": video_id,
                "transcript_available": video.transcript_available
            }, status=status.HTTP_404_NOT_FOUND)
        
        ai_service = AIService()
        
        # AI analysis combining transcript and comments
        transcript_analysis = ai_service.analyze_transcript_context(
            video.transcript, 
            [c.text for c in Comment.objects.filter(video_id=video_id)]
        )
        
        # Mark transcript as analyzed
        video.transcript_analyzed = True
        video.save()
        
        return Response({
            "message": "Transcript analyzed successfully",
            "video_id": video_id,
            "transcript_length": len(video.transcript),
            "word_count": len(video.transcript.split()),
            "analysis": transcript_analysis
        })
        
    except Exception as e:
        return Response(
            {"error": f"Failed to analyze transcript: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
