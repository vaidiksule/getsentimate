from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from ..services.youtube_service import YouTubeService
from ..services.ai_service import AIService
from ..services.mongodb_service import MongoDBService
from ..serializers import VideoSerializer, AnalysisSessionSerializer
from django.shortcuts import get_object_or_404


# -----------------------
# Basic connectivity / health check endpoints
# -----------------------

@api_view(['GET'])
@permission_classes([AllowAny])
def test_connection(request):
    """Simple test endpoint to confirm that the Django API is reachable by the frontend."""
    return Response({
        "message": "Django API is working!",
        "status": "success",
        "version": "1.0.0"
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """Returns the health status of the API and database connection."""
    return Response({
        "status": "healthy",
        "service": "GetSentimate API",
        "database": "connected"
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def ai_service_status(request):
    """
    Checks if the AI service (e.g., Gemini or another model) is available.
    Returns status and availability information.
    """
    try:
        ai_service = AIService()
        status_info = ai_service.get_service_status()
        
        return Response({
            "ai_services": status_info,
            "message": "AI service status retrieved successfully"
        })
    except Exception as e:
        # Fallback if AI service check fails
        return Response({
            "ai_services": {
                "gemini_available": False,
                "primary_service": "none"
            },
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# -----------------------
# Comment retrieval & filtering
# -----------------------

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def comments_list(request):
    """
    Retrieves a list of comments from MongoDB for the authenticated user.
    Supports optional query parameters:
      - video_id: Filter comments for a specific video
      - sentiment: Filter by sentiment label
      - toxicity: Filter by toxicity label
    """
    try:
        user_google_id = request.user.google_id
        if not user_google_id:
            return Response(
                {"error": "User profile not properly configured"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        mongo_service = MongoDBService()
        
        # Get user's videos
        user_videos = mongo_service.get_user_videos(user_google_id)
        video_ids = [v['video_id'] for v in user_videos]
        
        # Get comments for user's videos
        comments = []
        for video_id in video_ids:
            video_comments = mongo_service.get_video_comments(video_id, user_google_id)
            comments.extend(video_comments)
        
        # Apply filters
        video_id_filter = request.query_params.get('video_id')
        if video_id_filter:
            comments = [c for c in comments if c['video_id'] == video_id_filter]
        
        sentiment_filter = request.query_params.get('sentiment')
        if sentiment_filter:
            comments = [c for c in comments if c.get('sentiment_label') == sentiment_filter]
        
        toxicity_filter = request.query_params.get('toxicity')
        if toxicity_filter:
            comments = [c for c in comments if c.get('toxicity_label') == toxicity_filter]
        
        mongo_service.close_connection()
        
        return Response(comments)
        
    except Exception as e:
        return Response(
            {"error": f"Failed to get comments: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def comment_detail(request, comment_id):
    """Retrieves detailed information for a single comment by ID for the authenticated user."""
    try:
        user_google_id = request.user.google_id
        if not user_google_id:
            return Response(
                {"error": "User profile not properly configured"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        mongo_service = MongoDBService()
        
        # Get user's videos
        user_videos = mongo_service.get_user_videos(user_google_id)
        video_ids = [v['video_id'] for v in user_videos]
        
        # Find comment in user's videos
        comment = None
        for video_id in video_ids:
            video_comments = mongo_service.get_video_comments(video_id, user_google_id)
            comment = next((c for c in video_comments if c['comment_id'] == comment_id), None)
            if comment:
                break
        
        mongo_service.close_connection()
        
        if not comment:
            return Response(
                {"error": "Comment not found or access denied"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        return Response(comment)
        
    except Exception as e:
        return Response(
            {"error": f"Failed to get comment: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# -----------------------
# Video analysis endpoints
# -----------------------

# @api_view(['POST'])
# @permission_classes([IsAuthenticated])
# def analyze_video(request):
#     """
#     Starts the analysis process for a given YouTube video.
#     Creates or retrieves a Video entry, then creates an AnalysisSession.
#     """

    
#     video_id = request.data.get('video_id')
#     if not video_id:
#         return Response(
#             {"error": "video_id is required"}, 
#             status=status.HTTP_400_BAD_REQUEST
#         )
    
#     # Create or get existing video entry
#     video, created = Video.objects.get_or_create(
#         video_id=video_id,
#         defaults={
#             'title': request.data.get('title', ''),
#             'channel_id': request.data.get('channel_id', ''),
#             'channel_title': request.data.get('channel_title', ''),
#         }
#     )
    
#     # Create new analysis session for this video
#     session = AnalysisSession.objects.create(
#         video=video,
#         status='pending',
#         total_comments=request.data.get('comment_count', 0)
#     )
    
#     # Async analysis task would be triggered here
#     return Response({
#         "message": "Analysis started",
#         "session_id": session.id,
#         "video_id": video_id,
#         "status": "pending"
#     })

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def analyze_video(request):
    """
    Starts the analysis process for a given YouTube video.
    Creates or retrieves a Video entry, then creates an AnalysisSession in MongoDB.
    """
    video_id = request.data.get("video_id")
    if not video_id:
        return Response(
            {"error": "video_id is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    mongo_service = MongoDBService()
    try:
        # Check if video exists
        video = mongo_service.get_video_by_id(video_id)

        if not video:
            # Create new video entry
            video_data = {
                "video_id": video_id,
                "title": request.data.get("title", ""),
                "channel_id": request.data.get("channel_id", ""),
                "channel_title": request.data.get("channel_title", ""),
            }
            mongo_service.insert_video(video_data)
            video = video_data

        # Create a new analysis session
        session_data = {
            "video_id": video_id,
            "status": "pending",
            "total_comments": request.data.get("comment_count", 0),
        }
        session_id = mongo_service.insert_analysis_session(session_data)

        return Response(
            {
                "message": "Analysis started",
                "session_id": str(session_id),
                "video_id": video_id,
                "status": "pending",
            },
            status=status.HTTP_201_CREATED,
        )

    except Exception as e:
        return Response(
            {"error": f"Failed to analyze video: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
    finally:
        mongo_service.close_connection()


# @api_view(['GET'])
# @permission_classes([AllowAny])
# def analysis_status(request, session_id):
#     """Returns the status of a specific AnalysisSession."""
#     session = get_object_or_404(AnalysisSession, id=session_id)
#     serializer = AnalysisSessionSerializer(session)
#     return Response(serializer.data)


@api_view(["GET"])
@permission_classes([AllowAny])
def analysis_status(request, session_id):
    """
    Returns the status of a specific AnalysisSession (from MongoDB).
    """
    mongo_service = MongoDBService()
    try:
        session = mongo_service.get_analysis_session_by_id(session_id)

        if not session:
            return Response(
                {"error": "Analysis session not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Convert ObjectId to string for JSON serialization
        session["_id"] = str(session["_id"])

        return Response(session, status=status.HTTP_200_OK)

    except Exception as e:
        return Response(
            {"error": f"Failed to fetch session status: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
    finally:
        mongo_service.close_connection()


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def video_analytics(request, video_id):
    """
    Returns analytics summary for a specific video:
      - Total comments
      - Analyzed comments
      - Sentiment distribution
      - Toxicity distribution
      - Progress percentage
    Requires authentication and uses MongoDB.
    """
    try:
        # Get user's Google ID from the request
        user_google_id = request.user.google_id
        if not user_google_id:
            return Response(
                {"error": "User profile not properly configured"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get analytics from MongoDB
        mongo_service = MongoDBService()
        analytics = mongo_service.get_user_analytics(user_google_id, video_id)
        mongo_service.close_connection()
        
        return Response(analytics)
        
    except Exception as e:
        return Response(
            {"error": f"Failed to get video analytics: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# -----------------------
# YouTube integration endpoints
# -----------------------

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def fetch_youtube_comments(request):
    """
    Fetches comments for a given YouTube video URL.
    Requires authentication and stores data in MongoDB linked to user.
    """
    url = request.data.get('url')
    
    if not url:
        return Response(
            {"error": "YouTube URL is required"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Get user's Google ID from the request
        user_google_id = request.user.google_id
        if not user_google_id:
            return Response(
                {"error": "User profile not properly configured"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user has credits
        mongo_service = MongoDBService()
        user_credits = mongo_service.get_user_credits(user_google_id)
        
        if user_credits < 1:
            return Response(
                {"error": "Insufficient credits. You need at least 1 credit to fetch comments."}, 
                status=status.HTTP_402_PAYMENT_REQUIRED
            )
        
        # Process video with YouTube service
        youtube_service = YouTubeService()
        result = youtube_service.process_video_url(url, user_google_id, fetch_transcript=False)
        
        # Deduct 1 credit for fetching comments
        mongo_service.deduct_user_credits(user_google_id, 1)
        
        # Get updated user info
        updated_user = mongo_service.get_user_by_google_id(user_google_id)
        mongo_service.close_connection()
        
        return Response({
            "message": "Comments fetched successfully",
            "video_id": result['video_id'],
            "total_comments": result['total_comments'],
            "video_data": result['video_data'],
            "comments_count": result['comments_count'],
            "credits_remaining": updated_user['credits'],
            "credits_used": 1
        })
        
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response(
            {"error": f"Failed to fetch comments: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def analyze_comments(request):
    """
    Analyzes all comments for a given video:
      - Sentiment analysis
      - Toxicity detection
      - Summarization
      - Key topics extraction
    Requires authentication and uses MongoDB.
    """
    # Determine how video_id was sent (GET or POST)
    if request.method == 'GET':
        video_id = request.query_params.get('video_id')
    else:
        video_id = request.data.get('video_id')
    
    if not video_id:
        return Response({"error": "video_id is required"}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Get user's Google ID from the request
        user_google_id = request.user.google_id
        if not user_google_id:
            return Response(
                {"error": "User profile not properly configured"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user has credits for analysis
        mongo_service = MongoDBService()
        user_credits = mongo_service.get_user_credits(user_google_id)
        
        if user_credits < 1:
            return Response(
                {"error": "Insufficient credits. You need at least 1 credit to analyze comments."}, 
                status=status.HTTP_402_PAYMENT_REQUIRED
            )
        
        # Get comments from MongoDB for this user and video
        comments = mongo_service.get_video_comments(video_id, user_google_id)
        total_comments = len(comments)
        
        if total_comments == 0:
            mongo_service.close_connection()
            return Response({
                "error": f"No comments found for video {video_id}. Please fetch comments first using /api/youtube/fetch-comments/",
                "video_id": video_id,
                "total_comments": 0
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Find comments that have not yet been analyzed
        unanalyzed_comments = [c for c in comments if not c.get('analyzed', False)]
        unanalyzed_count = len(unanalyzed_comments)
        
        # If all comments are analyzed, just return summary & topics
        if unanalyzed_count == 0:
            comment_texts = [c['text'] for c in comments]
            ai_service = AIService()
            summary_result = ai_service.summarize_comments(comment_texts)
            key_topics = ai_service.extract_key_topics(comment_texts)
            
            mongo_service.close_connection()
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
        
        # Otherwise, analyze remaining comments
        ai_service = AIService()
        analyzed_count = 0
        
        for comment in unanalyzed_comments:
            try:
                # Sentiment analysis
                sentiment_result = ai_service.analyze_sentiment(comment['text'])
                toxicity_result = ai_service.detect_toxicity(comment['text'])
                
                # Update comment in MongoDB
                analysis_data = {
                    'sentiment_score': sentiment_result.get('sentiment_score', 0.0),
                    'sentiment_label': sentiment_result.get('sentiment_label', 'neutral'),
                    'toxicity_score': toxicity_result.get('toxicity_score', 0.0),
                    'toxicity_label': toxicity_result.get('toxicity_label', 'non-toxic'),
                }
                
                mongo_service.update_comment_analysis(
                    comment['comment_id'], 
                    analysis_data, 
                    user_google_id
                )
                analyzed_count += 1
                
            except Exception as e:
                # Skip this comment if analysis fails
                print(f"Error analyzing comment {comment['comment_id']}: {str(e)}")
                continue
        
        # Generate summary and topics for all comments
        comment_texts = [c['text'] for c in comments]
        summary_result = ai_service.summarize_comments(comment_texts)
        key_topics = ai_service.extract_key_topics(comment_texts)
        
        # Deduct 1 credit for analysis
        mongo_service.deduct_user_credits(user_google_id, 1)
        
        # Get updated user info
        updated_user = mongo_service.get_user_by_google_id(user_google_id)
        mongo_service.close_connection()
        
        return Response({
            "message": "Comments analyzed successfully",
            "video_id": video_id,
            "total_comments": total_comments,
            "analyzed_count": analyzed_count,
            "unanalyzed_count": unanalyzed_count - analyzed_count,
            "summary": summary_result.get('summary', ''),
            "key_topics": key_topics,
            "suggestions": summary_result.get('suggestions', []),
            "pain_points": summary_result.get('pain_points', []),
            "credits_remaining": updated_user['credits'],
            "credits_used": 1
        })
        
    except Exception as e:
        return Response(
            {"error": f"Failed to analyze comments: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# -----------------------
# Video info & debugging
# -----------------------

# @api_view(['GET'])
# @permission_classes([AllowAny])
# def video_info(request, video_id):
#     """
#     Returns video metadata and analysis progress:
#       - Total comments
#       - Analyzed comments
#       - Progress percentage
#     """
#     try:
#         video = get_object_or_404(Video, video_id=video_id)
#         serializer = VideoSerializer(video)
        
#         comments = Comment.objects.filter(video_id=video_id)
#         total_comments = comments.count()
#         analyzed_comments = comments.filter(analyzed=True).count()
        
#         return Response({
#             "video": serializer.data,
#             "total_comments": total_comments,
#             "analyzed_comments": analyzed_comments,
#             "analysis_progress": (analyzed_comments / total_comments * 100) if total_comments > 0 else 0
#         })
        
#     except Exception as e:
#         return Response(
#             {"error": f"Failed to get video info: {str(e)}"}, 
#             status=status.HTTP_500_INTERNAL_SERVER_ERROR
#         )
@api_view(["GET"])
@permission_classes([AllowAny])
def video_info(request, video_id):
    """
    Returns video metadata and analysis progress from MongoDB:
      - Total comments
      - Analyzed comments
      - Progress percentage
    """
    mongo_service = MongoDBService()
    try:
        # Fetch video metadata
        video = mongo_service.get_video_by_id(video_id)
        if not video:
            return Response(
                {"error": "Video not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Fetch comment stats
        total_comments = mongo_service.count_comments(video_id)
        analyzed_comments = mongo_service.count_comments(video_id, analyzed=True)

        return Response({
            "video": {
                "video_id": video.get("video_id"),
                "title": video.get("title"),
                "channel_id": video.get("channel_id"),
                "channel_title": video.get("channel_title"),
            },
            "total_comments": total_comments,
            "analyzed_comments": analyzed_comments,
            "analysis_progress": (analyzed_comments / total_comments * 100) if total_comments > 0 else 0
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response(
            {"error": f"Failed to get video info: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
    finally:
        mongo_service.close_connection()


# @api_view(['GET'])
# @permission_classes([AllowAny])
# def debug_video_comments(request, video_id):
#     """
#     Debugging endpoint that returns the first 10 comments for a video
#     (shortened text, sentiment, toxicity) to help with inspection.
#     """
#     try:
#         video = get_object_or_404(Video, video_id=video_id)
#         comments = Comment.objects.filter(video_id=video_id)
        
#         return Response({
#             "video_id": video_id,
#             "video_title": video.title,
#             "total_comments": comments.count(),
#             "comments": [
#                 {
#                     "id": c.id,
#                     "text": c.text[:100] + "..." if len(c.text) > 100 else c.text,
#                     "author": c.author_name,
#                     "sentiment": c.sentiment_label,
#                     "toxicity": c.toxicity_label,
#                     "analyzed": c.analyzed
#                 }
#                 for c in comments[:10]  # Show only first 10 for debugging purposes
#             ]
#         })
        
#     except Exception as e:
#         return Response(
#             {"error": f"Failed to get debug info: {str(e)}"}, 
#             status=status.HTTP_500_INTERNAL_SERVER_ERROR
#         )
@api_view(["GET"])
@permission_classes([AllowAny])
def debug_video_comments(request, video_id):
    """
    Debug endpoint that returns the first 10 comments for a video
    (shortened text, sentiment, toxicity) to help with inspection.
    """
    mongo_service = MongoDBService()
    try:
        # Fetch video metadata
        video = mongo_service.get_video_by_id(video_id)
        if not video:
            return Response(
                {"error": "Video not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Fetch first 10 comments
        comments_cursor = mongo_service.get_comments(video_id, limit=10)
        comments = list(comments_cursor)

        return Response({
            "video_id": video_id,
            "video_title": video.get("title"),
            "total_comments": mongo_service.count_comments(video_id),
            "comments": [
                {
                    "id": str(c.get("_id")),
                    "text": (c.get("text", "")[:100] + "...") if len(c.get("text", "")) > 100 else c.get("text", ""),
                    "author": c.get("author_name"),
                    "sentiment": c.get("sentiment_label"),
                    "toxicity": c.get("toxicity_label"),
                    "analyzed": c.get("analyzed", False)
                }
                for c in comments
            ]
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response(
            {"error": f"Failed to get debug info: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
    finally:
        mongo_service.close_connection()

# -----------------------
# User Profile & Credit Management
# -----------------------

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    """
    Get current user's profile information including credits and statistics.
    """
    try:
        user_google_id = request.user.google_id
        if not user_google_id:
            return Response(
                {"error": "User profile not properly configured"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        mongo_service = MongoDBService()
        user_data = mongo_service.get_user_by_google_id(user_google_id)
        mongo_service.close_connection()
        
        if not user_data:
            return Response(
                {"error": "User not found in database"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        return Response({
            "google_id": user_data.get("google_id"),
            "name": user_data.get("name"),
            "email": user_data.get("email"),
            "avatar": user_data.get("avatar"),
            "credits": user_data.get("credits", 0),
            "videos_fetched": user_data.get("videos_fetched", 0),
            "total_analyses": user_data.get("total_analyses", 0),
            "account_joined_at": user_data.get("account_joined_at"),
            "last_active": user_data.get("last_active")
        })
        
    except Exception as e:
        return Response(
            {"error": f"Failed to get user profile: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_videos(request):
    """
    Get all videos fetched by the current user.
    """
    try:
        user_google_id = request.user.google_id
        if not user_google_id:
            return Response(
                {"error": "User profile not properly configured"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        mongo_service = MongoDBService()
        videos = mongo_service.get_user_videos(user_google_id)
        mongo_service.close_connection()
        
        # Format video data for response
        formatted_videos = []
        for video in videos:
            formatted_videos.append({
                "video_id": video.get("video_id"),
                "title": video.get("title"),
                "channel_title": video.get("channel_title"),
                "view_count": video.get("view_count"),
                "comment_count": video.get("comment_count"),
                "created_at": video.get("created_at"),
                "last_analyzed": video.get("last_analyzed")
            })
        
        return Response({
            "videos": formatted_videos,
            "total_videos": len(formatted_videos)
        })
        
    except Exception as e:
        return Response(
            {"error": f"Failed to get user videos: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_credits(request):
    """
    Get current user's credit balance.
    """
    try:
        user_google_id = request.user.google_id
        if not user_google_id:
            return Response(
                {"error": "User profile not properly configured"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        mongo_service = MongoDBService()
        credits = mongo_service.get_user_credits(user_google_id)
        mongo_service.close_connection()
        
        return Response({
            "credits": credits,
            "can_analyze": credits >= 1,
            "can_fetch": credits >= 1
        })
        
    except Exception as e:
        return Response(
            {"error": f"Failed to get user credits: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
