import os
import base64
from cryptography.fernet import Fernet
import logging

logger = logging.getLogger('threatforge.crypto')

# Startup check — warn immediately if ENCRYPTION_KEY is missing
if not os.getenv('ENCRYPTION_KEY'):
    logger.warning(
        "⚠️  ENCRYPTION_KEY is NOT set! MFA enrollment/verification will fail. "
        "Set ENCRYPTION_KEY in your environment variables."
    )

def get_cipher_suite():
    key = os.getenv('ENCRYPTION_KEY')
    if not key:
        logger.error("ENCRYPTION_KEY not found in environment variables.")
        # In production, this should raise an error to prevent insecure startup.
        # For dev, we might generate one or fail. Let's fail safe.
        raise ValueError("ENCRYPTION_KEY configuration is missing")
    
    # Ensure key is bytes
    if isinstance(key, str):
        key = key.encode()
    
    try:
        return Fernet(key)
    except Exception as e:
        logger.error(f"Invalid ENCRYPTION_KEY: {e}")
        raise

def encrypt_data(data: str) -> str:
    """Encrypt a string and return the base64 encoded ciphertext."""
    if not data:
        return None
    try:
        cipher = get_cipher_suite()
        encrypted = cipher.encrypt(data.encode())
        return base64.urlsafe_b64encode(encrypted).decode()
    except Exception as e:
        logger.error(f"Encryption failed: {e}")
        raise

def decrypt_data(token: str) -> str:
    """Decrypt a base64 encoded ciphertext."""
    if not token:
        return None
    try:
        cipher = get_cipher_suite()
        decoded_token = base64.urlsafe_b64decode(token)
        decrypted = cipher.decrypt(decoded_token)
        return decrypted.decode()
    except Exception as e:
        logger.error(f"Decryption failed: {e}")
        # Return None or raise? If decryption fails, we can't verify MFA.
        # Returning None is safer than crashing, but caller must handle it.
        return None
