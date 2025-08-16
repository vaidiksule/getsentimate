import os
from datetime import datetime
from typing import Dict, List, Optional
from pymongo import MongoClient
from pymongo.errors import DuplicateKeyError
from django.conf import settings


class MongoDBService:
    """Service for MongoDB operations using PyMongo"""
    
    def __init__(self):
        """Initialize MongoDB connection"""
        self.database_url = os.getenv('DATABASE_URL')
        if not self.database_url:
            raise ValueError("DATABASE_URL environment variable is required")
        
        self.client = MongoClient(self.database_url)
        self.db_name = "getsentimatedb"
        self.db = self.client[self.db_name]
        
        # Initialize collections
        self.users_collection = self.db.users
        self.videos_collection = self.db.videos
        self.comments_collection = self.db.comments
        self.analysis_sessions_collection = self.db.analysis_sessions
        
        # Create indexes for better performance
        self._create_indexes()
    
    def _create_indexes(self):
        """Create database indexes for better performance"""
        try:
            # Users collection indexes
            self.users_collection.create_index("google_id", unique=True)
            self.users_collection.create_index("email")
            
            # Videos collection indexes
            self.videos_collection.create_index("video_id")
            self.videos_collection.create_index("user_id")
            self.videos_collection.create_index([("user_id", 1), ("created_at", -1)])
            
            # Comments collection indexes
            self.comments_collection.create_index("comment_id", unique=True)
            self.comments_collection.create_index("video_id")
            self.comments_collection.create_index("user_id")
            self.comments_collection.create_index([("video_id", 1), ("analyzed", 1)])
            
            # Analysis sessions indexes
            self.analysis_sessions_collection.create_index("video_id")
            self.analysis_sessions_collection.create_index("user_id")
            
        except Exception as e:
            print(f"Warning: Could not create all indexes: {e}")
    
    def create_or_update_user(self, user_data: Dict) -> Dict:
        """
        Create or update user profile in MongoDB
        
        Args:
            user_data: Dictionary containing user information
            
        Returns:
            User document from MongoDB
        """
        try:
            # Check if user exists by google_id
            existing_user = self.users_collection.find_one({"google_id": user_data.get("google_id")})
            
            if existing_user:
                # Update existing user
                update_data = {
                    "name": user_data.get("name"),
                    "email": user_data.get("email"),
                    "avatar": user_data.get("avatar"),
                    "last_active": datetime.utcnow()
                }
                
                self.users_collection.update_one(
                    {"google_id": user_data.get("google_id")},
                    {"$set": update_data}
                )

                return self.users_collection.find_one({"google_id": user_data.get("google_id")})
            else:
                # Create new user with default credits
                new_user = {
                    "google_id": user_data.get("google_id"),
                    "name": user_data.get("name"),
                    "email": user_data.get("email"),
                    "avatar": user_data.get("avatar"),
                    "credits": 5,  # Default credits for new users
                    "videos_fetched": 0,
                    "total_analyses": 0,
                    "account_joined_at": datetime.utcnow(),
                    "last_active": datetime.utcnow()
                }
                
                result = self.users_collection.insert_one(new_user)
                new_user["_id"] = result.inserted_id

                return new_user
                
        except Exception as e:
            raise Exception(f"Failed to create/update user: {str(e)}")
    
    def get_user_by_google_id(self, google_id: str) -> Optional[Dict]:
        """Get user by Google ID"""
        return self.users_collection.find_one({"google_id": google_id})
    
    def get_user_credits(self, google_id: str) -> int:
        """Get user's current credit balance"""
        user = self.get_user_by_google_id(google_id)
        return user.get("credits", 0) if user else 0
    
    def deduct_user_credits(self, google_id: str, amount: int = 1) -> bool:
        """
        Deduct credits from user account
        
        Returns:
            True if successful, False if insufficient credits
        """
        user = self.get_user_by_google_id(google_id)
        if not user or user.get("credits", 0) < amount:
            return False
        
        self.users_collection.update_one(
            {"google_id": google_id},
            {"$inc": {"credits": -amount}}
        )
        return True
    
    def store_video(self, video_data: Dict, user_google_id: str) -> str:
        """
        Store video in MongoDB linked to user
        
        Returns:
            Video ID from MongoDB
        """
        try:
            # Get user reference
            user = self.get_user_by_google_id(user_google_id)
            if not user:
                raise Exception("User not found")
            
            video_doc = {
                "video_id": video_data["video_id"],
                "title": video_data["title"],
                "channel_id": video_data["channel_id"],
                "channel_title": video_data["channel_title"],
                "published_at": video_data["published_at"],
                "view_count": video_data["view_count"],
                "like_count": video_data["like_count"],
                "comment_count": video_data["comment_count"],
                "user_id": user["_id"],
                "user_google_id": user_google_id,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "comments_analyzed": 0,
                "last_analyzed": None
            }
            
            # Use upsert to avoid duplicates
            self.videos_collection.update_one(
                {"video_id": video_data["video_id"], "user_google_id": user_google_id},
                {"$set": video_doc},
                upsert=True
            )
            
            # Increment user's videos_fetched count
            self.users_collection.update_one(
                {"google_id": user_google_id},
                {"$inc": {"videos_fetched": 1}}
            )
            
            return str(video_doc["video_id"])
            
        except Exception as e:
            raise Exception(f"Failed to store video: {str(e)}")
    
    def store_comments(self, comments_data: List[Dict], video_id: str, user_google_id: str) -> List[str]:
        """
        Store comments in MongoDB linked to video and user
        
        Returns:
            List of comment IDs from MongoDB
        """
        try:
            # Get user reference
            user = self.get_user_by_google_id(user_google_id)
            if not user:
                raise Exception("User not found")
            
            comment_ids = []
            
            for comment_data in comments_data:
                comment_doc = {
                    "comment_id": comment_data["comment_id"],
                    "video_id": video_id,
                    "channel_id": comment_data["channel_id"],
                    "author_name": comment_data["author_name"],
                    "author_channel_url": comment_data["author_channel_url"],
                    "text": comment_data["text"],
                    "like_count": comment_data["like_count"],
                    "published_at": comment_data["published_at"],
                    "user_id": user["_id"],
                    "user_google_id": user_google_id,
                    "sentiment_score": None,
                    "sentiment_label": None,
                    "toxicity_score": None,
                    "toxicity_label": None,
                    "summary": "",
                    "key_topics": [],
                    "suggestions": [],
                    "pain_points": [],
                    "analyzed": False,
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
                
                # Use upsert to avoid duplicates
                self.comments_collection.update_one(
                    {"comment_id": comment_data["comment_id"], "user_google_id": user_google_id},
                    {"$set": comment_doc},
                    upsert=True
                )
                
                comment_ids.append(comment_data["comment_id"])
            
            return comment_ids
            
        except Exception as e:
            raise Exception(f"Failed to store comments: {str(e)}")
    
    def get_user_videos(self, user_google_id: str) -> List[Dict]:
        """Get all videos for a specific user"""
        return list(self.videos_collection.find({"user_google_id": user_google_id}).sort("created_at", -1))
    
    def get_video_comments(self, video_id: str, user_google_id: str) -> List[Dict]:
        """Get all comments for a specific video and user"""
        return list(self.comments_collection.find({
            "video_id": video_id, 
            "user_google_id": user_google_id
        }).sort("published_at", -1))
    
    def update_comment_analysis(self, comment_id: str, analysis_data: Dict, user_google_id: str):
        """Update comment with analysis results"""
        update_data = {
            "sentiment_score": analysis_data.get("sentiment_score"),
            "sentiment_label": analysis_data.get("sentiment_label"),
            "toxicity_score": analysis_data.get("toxicity_score"),
            "toxicity_label": analysis_data.get("toxicity_label"),
            "analyzed": True,
            "updated_at": datetime.utcnow()
        }
        
        self.comments_collection.update_one(
            {"comment_id": comment_id, "user_google_id": user_google_id},
            {"$set": update_data}
        )
    
    def get_user_analytics(self, user_google_id: str, video_id: str = None) -> Dict:
        """Get analytics for user's videos and comments"""
        try:
            if video_id:
                # Get analytics for specific video
                comments = self.get_video_comments(video_id, user_google_id)
            else:
                # Get analytics for all user's videos
                videos = self.get_user_videos(user_google_id)
                video_ids = [v["video_id"] for v in videos]
                comments = list(self.comments_collection.find({
                    "user_google_id": user_google_id,
                    "video_id": {"$in": video_ids}
                }))
            
            total_comments = len(comments)
            analyzed_comments = len([c for c in comments if c.get("analyzed", False)])
            
            # Sentiment distribution
            sentiment_distribution = {
                "positive": len([c for c in comments if c.get("sentiment_label") == "positive"]),
                "negative": len([c for c in comments if c.get("sentiment_label") == "negative"]),
                "neutral": len([c for c in comments if c.get("sentiment_label") == "neutral"])
            }
            
            # Toxicity distribution
            toxicity_distribution = {
                "toxic": len([c for c in comments if c.get("toxicity_label") == "toxic"]),
                "non-toxic": len([c for c in comments if c.get("toxicity_label") == "non-toxic"])
            }
            
            return {
                "total_comments": total_comments,
                "analyzed_comments": analyzed_comments,
                "sentiment_distribution": sentiment_distribution,
                "toxicity_distribution": toxicity_distribution,
                "analysis_progress": (analyzed_comments / total_comments * 100) if total_comments > 0 else 0
            }
            
        except Exception as e:
            raise Exception(f"Failed to get analytics: {str(e)}")
    
    def close_connection(self):
        """Close MongoDB connection"""
        if hasattr(self, 'client'):
            self.client.close()
