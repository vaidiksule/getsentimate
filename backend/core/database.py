import os
from urllib.parse import urlparse
from pymongo import MongoClient


def get_mongodb_connection():
    """
    Create MongoDB connection using DATABASE_URL from environment.
    Returns MongoDB client and database name.
    """
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise ValueError("DATABASE_URL environment variable is required")

    # Parse the MongoDB connection string
    parsed_url = urlparse(database_url)

    # Extract database name from path (remove leading slash)
    database_name = parsed_url.path[1:] if parsed_url.path else "getsentimatedb"

    # Create MongoDB client
    client = MongoClient(database_url)

    return client, database_name


def get_database():
    """
    Get MongoDB database instance.
    """
    client, database_name = get_mongodb_connection()
    return client[database_name]


def close_mongodb_connection():
    """
    Close MongoDB connection.
    """
    client, _ = get_mongodb_connection()
    client.close()
