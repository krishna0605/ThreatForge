import os
import logging

logger = logging.getLogger('threatforge.redis')

# Initialize Redis client (optional — graceful if redis package not installed)
try:
    import redis
    redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
    try:
        redis_client = redis.from_url(redis_url, decode_responses=True)
    except Exception as e:
        logger.warning(f"Redis not available: {e}. Token revocation will be in-memory only.")
        redis_client = None
except ImportError:
    logger.warning("redis package not installed. Token revocation will be in-memory/Supabase only.")
    redis_client = None

def get_redis_client():
    return redis_client
