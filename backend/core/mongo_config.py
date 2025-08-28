import os
from mongoengine import connect, disconnect
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

def connect_to_mongodb():
    """Connect to MongoDB using environment variables"""
    try:
        # Get MongoDB connection string from environment
        mongodb_uri = os.getenv('DATABASE_URL')
        
        if not mongodb_uri:
            logger.error("DATABASE_URL environment variable not set")
            return False
        
        # Extract database name from URI
        # Format: mongodb+srv://username:password@cluster.mongodb.net/database_name
        if '/' in mongodb_uri:
            db_name = mongodb_uri.split('/')[-1].split('?')[0]
        else:
            db_name = 'getsentimate'
        
        # Force database name to be 'getsentimate' for production
        db_name = 'getsentimate'
        
        # Connect to MongoDB
        connect(
            db=db_name,
            host=mongodb_uri,
            alias='default'
        )
        
        logger.info(f"Successfully connected to MongoDB database: {db_name}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {str(e)}")
        return False

def disconnect_from_mongodb():
    """Disconnect from MongoDB"""
    try:
        disconnect(alias='default')
        logger.info("Disconnected from MongoDB")
    except Exception as e:
        logger.error(f"Error disconnecting from MongoDB: {str(e)}")

def get_mongodb_connection():
    """Get current MongoDB connection status"""
    try:
        # Try to ping the database
        from mongoengine.connection import get_db
        db = get_db()
        db.command('ping')
        return True
    except Exception:
        return False

# MongoDB connection settings
MONGODB_SETTINGS = {
    'host': os.getenv('DATABASE_URL'),
    'db': 'getsentimate',  # Force production database name
    'alias': 'default',
    'connect': False,  # Don't connect automatically
}
