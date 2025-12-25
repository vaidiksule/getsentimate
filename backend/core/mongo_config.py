import os
import logging
from mongoengine import connect
from mongoengine.connection import get_db

logger = logging.getLogger(__name__)

# 🔒 Singleton flag (VERY IMPORTANT)
_CONNECTED = False


def connect_to_mongodb():
    """
    Connect to MongoDB ONCE per process.
    Never disconnect in a web server.
    """
    global _CONNECTED

    if _CONNECTED:
        return True

    mongodb_uri = os.getenv("DATABASE_URL")
    if not mongodb_uri:
        logger.error("DATABASE_URL environment variable not set")
        return False

    try:
        connect(
            db="getsentimate",
            host=mongodb_uri,
            alias="default",
            connectTimeoutMS=30000,
            socketTimeoutMS=30000,
            serverSelectionTimeoutMS=30000,
            retryWrites=True,
            w="majority",
        )

        # 🔍 Ping once to verify
        db = get_db()
        db.command("ping")

        _CONNECTED = True
        logger.info("MongoDB connected (singleton)")
        return True

    except Exception as e:
        logger.exception(f"MongoDB connection failed: {e}")
        return False


def get_mongodb_connection():
    """Health check"""
    try:
        db = get_db()
        db.command("ping")
        return True
    except Exception:
        return False
