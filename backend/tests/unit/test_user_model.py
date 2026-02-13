"""Unit Tests — User Model"""
import pytest
import uuid
from app.models.user import UserModel
from pydantic import ValidationError


class TestUserFromDict:
    """Tests for UserModel.from_dict()"""

    def test_from_dict_full_data(self):
        uid = str(uuid.uuid4())
        data = {
            'id': uid,
            'email': 'test@example.com',
            'display_name': 'Test User',
            'role': 'admin',
            'avatar_url': 'https://example.com/avatar.png',
            'mfa_enabled': True,
            'mfa_secret': 'secret123',
            'created_at': '2024-01-01T00:00:00Z',
        }
        user = UserModel.from_dict(data)
        assert str(user.id) == uid
        assert user.email == 'test@example.com'
        assert user.display_name == 'Test User'
        assert user.role == 'admin'
        assert user.mfa_enabled is True

    def test_from_dict_minimal_data(self):
        uid = str(uuid.uuid4())
        data = {'id': uid, 'email': 'min@test.com', 'display_name': 'Min User'}
        user = UserModel.from_dict(data)
        assert str(user.id) == uid
        assert user.email == 'min@test.com'
        # Defaults
        assert user.role == 'analyst'
        assert user.mfa_enabled is False

    def test_from_dict_invalid_data(self):
        """Pydantic should raise ValidationError for missing required fields."""
        with pytest.raises(ValidationError):
            UserModel.from_dict({})

    def test_attribute_access(self):
        uid = str(uuid.uuid4())
        data = {
            'id': uid,
            'email': 'attr@test.com',
            'display_name': 'Attr Test',
            'role': 'analyst',
        }
        user = UserModel.from_dict(data)
        assert hasattr(user, 'id')
        assert hasattr(user, 'email')
        assert hasattr(user, 'display_name')
        assert hasattr(user, 'role')
