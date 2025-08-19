# Import necessary modules
from copyreg import constructor  # Used for pickling/unpickling objects, though not directly used in this code
from rest_framework.decorators import api_view, permission_classes  # Decorators for defining API views and permissions
from rest_framework.permissions import IsAuthenticated, AllowAny  # Permissions for restricting or allowing access
from rest_framework.response import Response  # For returning HTTP responses
from rest_framework import status  # HTTP status codes for responses
from ..services.youtube_service import YouTubeService  # Custom service for interacting with YouTube API
from ..services.ai_service import AIService  # Custom service for AI-based comment analysis
from ..services.mongodb_service import MongoDBService  # Custom service for MongoDB operations
from ..serializers import VideoSerializer, AnalysisSessionSerializer  # Serializers for data validation/serialization
from django.shortcuts import get_object_or_404  # Utility to fetch objects or return 404
from datetime import datetime  # For handling timestamps

# -----------------------
# Basic connectivity / health check endpoints
# -----------------------

@api_view(['GET'])  # Decorator to specify this is a GET endpoint
@permission_classes([AllowAny])  # Allows unauthenticated access to this endpoint
def test_connection(request):
    """
    Simple test endpoint to confirm that the Django API is reachable by the frontend.
    Returns a JSON response with a success message and API version.
    """
    return Response({
        "message": "Django API is working!",  # Confirmation message
        "status": "success",  # Status indicator
        "version": "1.0.0"  # API version for tracking
    })

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Returns the health status of the API and database connection.
    Used to verify that the API is operational and can connect to the database.
    """
    return Response({
        "status": "healthy",  # Indicates API is functioning
        "service": "GetSentimate API",  # Name of the API service
        "database": "connected"  # Confirms database connectivity
    })

@api_view(['GET'])
@permission_classes([AllowAny])
def ai_service_status(request):
    """
    Checks if the AI service (e.g., Gemini or another model) is available.
    Returns status and availability information for the AI service.
    """
    try:
        ai_service = AIService()  # Initialize AI service instance
        status_info = ai_service.get_service_status()  # Fetch AI service status
        
        return Response({
            "ai_services": status_info,  # AI service availability details
            "message": "AI service status retrieved successfully"  # Success message
        })
    except Exception as e:
        # Handle any errors during AI service check
        return Response({
            "ai_services": {
                "gemini_available": False,  # Fallback status if check fails
                "primary_service": "none"  # Indicates no active AI service
            },
            "error": str(e)  # Include error message
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)  # Return 500 error

# -----------------------
# Comment retrieval & filtering
# -----------------------

@api_view(['GET'])
@permission_classes([IsAuthenticated])  # Requires user authentication
def comments_list(request):
    """
    Retrieves a list of comments from MongoDB for the authenticated user.
    Supports optional query parameters:
      - video_id: Filter comments for a specific video
      - sentiment: Filter by sentiment label (e.g., positive, negative)
      - toxicity: Filter by toxicity label (e.g., toxic, non-toxic)
    Returns a list of filtered comments.
    """
    try:
        user_google_id = request.user.google_id  # Get user's Google ID from auth
        if not user_google_id:
            return Response(
                {"error": "User profile not properly configured"}, 
                status=status.HTTP_400_BAD_REQUEST
            )  # Return 400 if Google ID is missing
        
        mongo_service = MongoDBService()  # Initialize MongoDB service
        
        # Get all videos associated with the user
        user_videos = mongo_service.get_user_videos(user_google_id)
        video_ids = [v['video_id'] for v in user_videos]  # Extract video IDs
        
        # Fetch comments for all user videos
        comments = []
        for video_id in video_ids:
            video_comments = mongo_service.get_video_comments(video_id, user_google_id)
            comments.extend(video_comments)  # Aggregate comments
        
        # Apply filters based on query parameters
        video_id_filter = request.query_params.get('video_id')
        if video_id_filter:
            comments = [c for c in comments if c['video_id'] == video_id_filter]  # Filter by video ID
        
        sentiment_filter = request.query_params.get('sentiment')
        if sentiment_filter:
            comments = [c for c in comments if c.get('sentiment_label') == sentiment_filter]  # Filter by sentiment
        
        toxicity_filter = request.query_params.get('toxicity')
        if toxicity_filter:
            comments = [c for c in comments if c.get('toxicity_label') == toxicity_filter]  # Filter by toxicity
        
        mongo_service.close_connection()  # Close MongoDB connection
        
        return Response(comments)  # Return filtered comments
        
    except Exception as e:
        return Response(
            {"error": f"Failed to get comments: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )  # Handle errors with 500 status

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def comment_detail(request, comment_id):
    """
    Retrieves detailed information for a single comment by ID for the authenticated user.
    Ensures the comment belongs to a video the user has access to.
    """
    try:
        user_google_id = request.user.google_id  # Get user's Google ID
        if not user_google_id:
            return Response(
                {"error": "User profile not properly configured"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        mongo_service = MongoDBService()  # Initialize MongoDB service
        
        # Get user's videos
        user_videos = mongo_service.get_user_videos(user_google_id)
        print(user_videos, "USERrrrrr")
        video_ids = [v['video_id'] for v in user_videos]  # Extract video IDs

        print("got user video_ids", video_ids)
        
        # Search for the comment in user's videos
        comment = None
        for video_id in video_ids:
            video_comments = mongo_service.get_video_comments(video_id, user_google_id)
            comment = next((c for c in video_comments if c['comment_id'] == comment_id), None)
            if comment:
                break  # Exit loop if comment is found
        
        mongo_service.close_connection()  # Close MongoDB connection
        
        if not comment:
            return Response(
                {"error": "Comment not found or access denied"}, 
                status=status.HTTP_404_NOT_FOUND
            )  # Return 404 if comment not found or inaccessible
        
        print("COMMENT: ", comment)  # Debug output
        print(type(comment))  # Debug output
        return Response(comment)  # Return comment details
        
    except Exception as e:
        print("here")
        return Response(
            {"error": f"Failed to get comment: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# -----------------------
# Video analysis endpoints
# -----------------------

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def analyze_video(request):
    """
    Starts the analysis process for a given YouTube video.
    Steps:
    1. Validates video_id and user authentication
    2. Deducts user credits
    3. Fetches video metadata and comments
    4. Analyzes comments using AI service
    5. Stores results and creates an analysis session
    Returns session details upon success.
    """
    video_id = request.data.get('video_id')  # Extract video_id from request body
    if not video_id:
        return Response(
            {"error": "video_id is required"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user_google_id = request.user.google_id  # Get user's Google ID
        if not user_google_id:
            return Response(
                {"error": "User profile not properly configured"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        mongo_service = MongoDBService()  # Initialize MongoDB service
        youtube_service = YouTubeService()  # Initialize YouTube service
        ai_service = AIService()  # Initialize AI service
        
        # Check and deduct user credits
        if not mongo_service.deduct_user_credits(user_google_id, 1):
            mongo_service.close_connection()
            return Response(
                {"error": "Insufficient credits to analyze video"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Fetch and store video metadata
        video_data = youtube_service.get_video_metadata(video_id)
        stored_video_id = mongo_service.store_video(video_data, user_google_id)
        
        # Fetch and store comments (up to 50)
        comments_data = youtube_service.fetch_video_comments(video_id, max_results=50)
        comment_ids = mongo_service.store_comments(comments_data, video_id, user_google_id)
        
        # Analyze comments using AI service
        comment_texts = [c['text'] for c in comments_data]
        analysis_results = ai_service.analyze_comment_batch(comment_texts)
        
        # Update comments with analysis results
        for comment_id, analysis_data in zip(comment_ids, analysis_results):
            mongo_service.update_comment_analysis(comment_id, analysis_data, user_google_id)
        
        # Generate and store summary of comments
        summary_data = ai_service.summarize_comments(comment_texts)
        mongo_service.update_video_summary(video_id, user_google_id, summary_data)
        
        # Create analysis session record
        session_data = {
            "video_id": video_id,
            "user_google_id": user_google_id,
            "status": "completed",
            "comment_count": len(comment_ids),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        session_id = mongo_service.analysis_sessions_collection.insert_one(session_data).inserted_id
        
        # Update video analysis metadata
        mongo_service.videos_collection.update_one(
            {"video_id": video_id, "user_google_id": user_google_id},
            {
                "$set": {
                    "comments_analyzed": len(comment_ids),
                    "last_analyzed": datetime.utcnow()
                }
            }
        )
        
        # Increment user's total analyses count
        mongo_service.users_collection.update_one(
            {"google_id": user_google_id},
            {"$inc": {"total_analyses": 1}}
        )
        
        mongo_service.close_connection()  # Close MongoDB connection
        
        return Response({
            "session_id": str(session_id),
            "video_id": video_id,
            "status": "completed",
            "comment_count": len(comment_ids)
        })
        
    except Exception as e:
        mongo_service.close_connection()
        return Response(
            {"error": f"Failed to analyze video: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analysis_status(request, session_id):
    """
    Retrieves the status of an analysis session for the authenticated user.
    Returns session details if found and accessible.
    """
    try:
        user_google_id = request.user.google_id
        if not user_google_id:
            return Response(
                {"error": "User profile not properly configured"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        mongo_service = MongoDBService()
        # Find session by ID and user
        session = mongo_service.analysis_sessions_collection.find_one({
            "_id": session_id,
            "user_google_id": user_google_id
        })
        
        mongo_service.close_connection()
        
        if not session:
            return Response(
                {"error": "Analysis session not found or access denied"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        return Response({
            "session_id": str(session["_id"]),
            "video_id": session["video_id"],
            "status": session["status"],
            "comment_count": session.get("comment_count", 0),
            "created_at": session["created_at"]
        })
        
    except Exception as e:
        return Response(
            {"error": f"Failed to get analysis status: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def video_analytics(request, video_id):
    """
    Retrieves analytics for a specific video, including sentiment, toxicity, and summary.
    Ensures the video belongs to the authenticated user.
    """
    try:
        user_google_id = request.user.google_id
        if not user_google_id:
            return Response(
                {"error": "User profile not properly configured"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        mongo_service = MongoDBService()
        
        # Fetch video metadata
        video = mongo_service.get_video_by_id(video_id)
        if not video or video["user_google_id"] != user_google_id:
            mongo_service.close_connection()
            return Response(
                {"error": "Video not found or access denied"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Fetch analytics data
        analytics = mongo_service.get_user_analytics(user_google_id, video_id)
        
        mongo_service.close_connection()
        
        return Response({
            "video_id": video_id,
            "title": video.get("title"),
            "summary": video.get("summary", "No summary available"),
            "analytics": analytics
        })
        
    except Exception as e:
        mongo_service.close_connection()
        return Response(
            {"error": f"Failed to get video analytics: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def fetch_youtube_comments(request):
    """
    Fetches comments for a YouTube video by URL and stores them in MongoDB.
    Deducts user credits before processing.
    """
    try:
        user_google_id = request.user.google_id
        if not user_google_id:
            return Response(
                {"error": "User profile not properly configured"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        video_url = request.data.get('video_url')
        if not video_url:
            return Response(
                {"error": "video_url is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        youtube_service = YouTubeService()
        mongo_service = MongoDBService()
        
        # Check and deduct user credits
        if not mongo_service.deduct_user_credits(user_google_id, 1):
            mongo_service.close_connection()
            return Response(
                {"error": "Insufficient credits to fetch comments"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Process video URL and fetch comments
        result = youtube_service.process_video_url(video_url, user_google_id)
        
        mongo_service.close_connection()
        
        return Response({
            "video_id": result["video_id"],
            "video_title": result["video_data"]["title"],
            "channel_title": result["video_data"]["channel_title"],
            "total_comments": result["total_comments"],
            "status": "Comments fetched and stored successfully"
        })
        
    except Exception as e:
        mongo_service.close_connection()
        return Response(
            {"error": f"Failed to fetch comments: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def analyze_comments(request):
    """
    Analyzes unanalyzed comments for a given video.
    Steps:
    1. Validates video_id and user authentication
    2. Deducts user credits
    3. Analyzes unanalyzed comments using AI service
    4. Stores results and creates an analysis session
    """
    try:
        user_google_id = request.user.google_id
        if not user_google_id:
            return Response(
                {"error": "User profile not properly configured"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        video_id = request.data.get('video_id')
        if not video_id:
            return Response(
                {"error": "video_id is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        mongo_service = MongoDBService()
        ai_service = AIService()
        
        # Check and deduct user credits
        if not mongo_service.deduct_user_credits(user_google_id, 1):
            mongo_service.close_connection()
            return Response(
                {"error": "Insufficient credits to analyze comments"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Fetch unanalyzed comments
        comments = mongo_service.get_video_comments(video_id, user_google_id)
        unanalyzed_comments = [c for c in comments if not c.get("analyzed", False)]
        
        if not unanalyzed_comments:
            mongo_service.close_connection()
            return Response({
                "video_id": video_id,
                "status": "No unanalyzed comments found",
                "analyzed_comments": 0
            })
        
        # Analyze comments
        comment_texts = [c["text"] for c in unanalyzed_comments]
        comment_ids = [c["comment_id"] for c in unanalyzed_comments]
        analysis_results = ai_service.analyze_comment_batch(comment_texts)
        
        # Update comments with analysis results
        for comment_id, analysis_data in zip(comment_ids, analysis_results):
            mongo_service.update_comment_analysis(comment_id, analysis_data, user_google_id)
        
        # Generate and store summary
        summary_data = ai_service.summarize_comments(comment_texts)
        mongo_service.update_video_summary(video_id, user_google_id, summary_data)
        
        # Create analysis session
        session_data = {
            "video_id": video_id,
            "user_google_id": user_google_id,
            "status": "completed",
            "comment_count": len(comment_ids),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        session_id = mongo_service.analysis_sessions_collection.insert_one(session_data).inserted_id
        
        # Update video analysis metadata
        mongo_service.videos_collection.update_one(
            {"video_id": video_id, "user_google_id": user_google_id},
            {
                "$set": {
                    "comments_analyzed": len(comment_ids),
                    "last_analyzed": datetime.utcnow()
                }
            }
        )
        
        # Increment user's total analyses
        mongo_service.users_collection.update_one(
            {"google_id": user_google_id},
            {"$inc": {"total_analyses": 1}}
        )
        
        mongo_service.close_connection()
        
        return Response({
            "session_id": str(session_id),
            "video_id": video_id,
            "status": "completed",
            "analyzed_comments": len(comment_ids)
        })
        
    except Exception as e:
        mongo_service.close_connection()
        return Response(
            {"error": f"Failed to analyze comments: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def video_info(request, video_id):
    """
    Retrieves metadata for a specific YouTube video.
    Ensures the video belongs to the authenticated user.
    """
    try:
        user_google_id = request.user.google_id
        if not user_google_id:
            return Response(
                {"error": "User profile not properly configured"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        mongo_service = MongoDBService()
        video = mongo_service.get_video_by_id(video_id)
        
        if not video or video["user_google_id"] != user_google_id:
            mongo_service.close_connection()
            return Response(
                {"error": "Video not found or access denied"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        mongo_service.close_connection()
        
        return Response({
            "video_id": video["video_id"],
            "title": video["title"],
            "channel_title": video["channel_title"],
            "view_count": video["view_count"],
            "like_count": video["like_count"],
            "comment_count": video["comment_count"],
            "published_at": video["published_at"],
            "last_analyzed": video.get("last_analyzed")
        })
        
    except Exception as e:
        mongo_service.close_connection()
        return Response(
            {"error": f"Failed to get video info: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(["GET"])
@permission_classes([AllowAny])
def debug_video_comments(request, video_id):
    """
    Debug endpoint to inspect the first 10 comments for a video.
    Returns shortened comment text, sentiment, toxicity, and analysis status.
    Accessible without authentication for debugging purposes.
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
        comments_cursor = mongo_service.get_video_comments(video_id, video["user_google_id"])
        comments = list(comments_cursor)[:10]

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
    Retrieves the authenticated user's profile information, including credits and statistics.
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
    Retrieves all videos fetched by the authenticated user.
    Returns video metadata and analysis status.
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
    Retrieves the authenticated user's credit balance.
    Indicates whether the user has enough credits for analysis or fetching.
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