import logging
from ..utils.redis_client import get_redis_client


logger = logging.getLogger('threatforge.auth_service')

# Standard JWT expiration is usually 15-60 mins for access tokens.
# We should set the redis key expiry slightly longer to be safe.
# Refresh tokens might last days, so we need to handle that.
# For simplicity, we'll default to 24 hours if not specified.
DEFAULT_REVOKE_TTL = 86400


def revoke_token(jti: str, expires_in: int = None):
    """
    Revoke a JWT by adding its JTI to the blocklist (Redis).

    :param jti: The JWT ID to revoke.
    :param expires_in: Time in seconds until the token expires.
                       If None, uses a default safe TTL.
    """
    redis_client = get_redis_client()
    if not redis_client:
        logger.warning("Redis unavailable. Token revocation skipped (in-memory only for this instance).")
        # In a real production without Redis, we might use a DB table, but for now we warn.
        # We could also use the in-memory set from extensions.py as a fallback for single-instance checks.
        from ..extensions import revoked_tokens
        revoked_tokens.add(jti)
        return

    try:
        ttl = expires_in if expires_in is not None else DEFAULT_REVOKE_TTL
        redis_client.setex(f"revoked_token:{jti}", ttl, "true")
        logger.info(f"Token {jti} revoked.")
    except Exception as e:
        logger.error(f"Failed to revoke token in Redis: {e}")


def is_token_revoked(jti: str) -> bool:
    """
    Check if a JWT ID is in the blocklist.
    Checks:
    1. In-memory set (fastest)
    2. Redis (fast)
    3. Supabase 'user_sessions' (slow, persistent)
    """
    # 1. Check in-memory fallback first
    from ..extensions import revoked_tokens
    if jti in revoked_tokens:
        return True

    # 2. Check Redis
    redis_client = get_redis_client()
    if redis_client:
        try:
            if redis_client.exists(f"revoked_token:{jti}"):
                revoked_tokens.add(jti)  # Cache in memory
                return True
        except Exception as e:
            logger.error(f"Failed to check token revocation status in Redis: {e}")

    # 3. Check Supabase (Fallback for server restarts / persistence)
    # This ensures that if Redis is flushed, we still respect 'Revoked' sessions in DB
    try:
        from ..supabase_client import supabase
        response = supabase.table('user_sessions') \
            .select('is_revoked') \
            .eq('token_jti', jti) \
            .limit(1) \
            .execute()

        if response.data and response.data[0].get('is_revoked'):
            # It's revoked in DB, so let's cache it
            revoked_tokens.add(jti)
            if redis_client:
                # Also populate Redis for next time
                redis_client.setex(f"revoked_token:{jti}", DEFAULT_REVOKE_TTL, "true")
            return True

    except Exception as e:
        logger.error(f"Failed to check token revocation in Supabase: {e}")

    return False
