"""Fail-closed encryption helper tests."""
import pytest
from cryptography.fernet import Fernet

from app.utils.crypto import (
    CryptoConfigurationError,
    CryptoDecryptionError,
    decrypt_data,
    encrypt_data,
)


def test_encrypt_decrypt_round_trip(monkeypatch):
    monkeypatch.setenv('ENCRYPTION_KEY', Fernet.generate_key().decode('utf-8'))
    ciphertext = encrypt_data('totp-secret')
    assert ciphertext != 'totp-secret'
    assert decrypt_data(ciphertext) == 'totp-secret'


def test_missing_or_invalid_key_raises_typed_configuration_error(monkeypatch):
    monkeypatch.delenv('ENCRYPTION_KEY', raising=False)
    with pytest.raises(CryptoConfigurationError):
        decrypt_data('ciphertext')

    monkeypatch.setenv('ENCRYPTION_KEY', 'invalid-key')
    with pytest.raises(CryptoConfigurationError):
        decrypt_data('ciphertext')


@pytest.mark.parametrize('ciphertext', [None, '', 'malformed-ciphertext'])
def test_missing_or_malformed_ciphertext_raises(monkeypatch, ciphertext):
    monkeypatch.setenv('ENCRYPTION_KEY', Fernet.generate_key().decode('utf-8'))
    with pytest.raises(CryptoDecryptionError):
        decrypt_data(ciphertext)
