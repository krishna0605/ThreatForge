import os
import base64
from cryptography.fernet import Fernet
import logging

logger = logging.getLogger('threatforge.crypto')


class CryptoError(Exception):
    """Base class for cryptographic operation failures."""


class CryptoConfigurationError(CryptoError):
    """Raised when encryption configuration is missing or invalid."""


class CryptoDecryptionError(CryptoError):
    """Raised when encrypted data cannot be decrypted."""


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
        raise CryptoConfigurationError("ENCRYPTION_KEY configuration is missing")

    # Ensure key is bytes
    if isinstance(key, str):
        key = key.encode()

    try:
        return Fernet(key)
    except Exception as exc:
        logger.error("Invalid ENCRYPTION_KEY configuration.")
        raise CryptoConfigurationError("ENCRYPTION_KEY configuration is invalid") from exc


def encrypt_data(data: str) -> str:
    """Encrypt a string and return the base64 encoded ciphertext."""
    if not data:
        return None
    try:
        cipher = get_cipher_suite()
        encrypted = cipher.encrypt(data.encode())
        return base64.urlsafe_b64encode(encrypted).decode()
    except Exception as exc:
        logger.error("Encryption failed.", extra={'error_type': type(exc).__name__})
        if isinstance(exc, CryptoError):
            raise
        raise CryptoError("Encryption failed") from exc


def decrypt_data(token: str) -> str:
    """Decrypt a base64 encoded ciphertext."""
    if not token:
        raise CryptoDecryptionError("Encrypted value is missing")
    try:
        cipher = get_cipher_suite()
        decoded_token = base64.urlsafe_b64decode(token)
        decrypted = cipher.decrypt(decoded_token)
        return decrypted.decode()
    except Exception as exc:
        logger.error("Decryption failed.", extra={'error_type': type(exc).__name__})
        if isinstance(exc, CryptoConfigurationError):
            raise
        raise CryptoDecryptionError("Encrypted value could not be decrypted") from exc
