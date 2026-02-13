"""Unit Tests — Notification Service"""
import os
import pytest
from unittest.mock import patch, MagicMock


class TestGetUserPrefs:
    """Tests for _get_user_prefs()"""

    @patch('app.services.notifications.supabase')
    def test_returns_defaults_when_no_db_row(self, mock_sb):
        from app.services.notifications import _get_user_prefs
        # No rows returned
        mock_sb.table.return_value.select.return_value.eq.return_value \
            .limit.return_value.execute.return_value.data = []
        prefs = _get_user_prefs('user-1')
        # Should return defaults
        assert prefs['email_threat_alerts'] is True
        assert prefs['push_critical_alerts'] is True

    @patch('app.services.notifications.supabase')
    def test_returns_db_prefs_when_exists(self, mock_sb):
        from app.services.notifications import _get_user_prefs
        db_row = {
            'email_threat_alerts': False,
            'email_scan_completions': True,
            'email_weekly_digest': True,
            'push_critical_alerts': False,
            'push_scan_updates': True,
            'push_subscription': None,
        }
        mock_sb.table.return_value.select.return_value.eq.return_value \
            .limit.return_value.execute.return_value.data = [db_row]
        prefs = _get_user_prefs('user-1')
        assert prefs['email_threat_alerts'] is False
        assert prefs['push_critical_alerts'] is False

    @patch('app.services.notifications.supabase')
    def test_returns_defaults_on_exception(self, mock_sb):
        from app.services.notifications import _get_user_prefs
        mock_sb.table.return_value.select.return_value.eq.return_value \
            .limit.return_value.execute.side_effect = Exception("DB error")
        prefs = _get_user_prefs('user-1')
        assert prefs['email_threat_alerts'] is True


class TestSendEmail:
    """Tests for _send_email()"""

    def test_send_email_no_api_key(self):
        from app.services.notifications import _send_email
        with patch.dict(os.environ, {'RESEND_API_KEY': ''}, clear=False):
            # Should not raise — just skips if no API key
            result = _send_email('test@test.com', 'Subject', '<p>Body</p>')
            assert result is False

    def test_send_email_with_api_key(self):
        """_send_email imports resend inside the function, so we mock at module level."""
        import importlib
        mock_resend = MagicMock()
        with patch.dict(os.environ, {'RESEND_API_KEY': 'test-key'}):
            with patch.dict('sys.modules', {'resend': mock_resend}):
                from app.services.notifications import _send_email
                _send_email('test@test.com', 'Subject', '<p>Body</p>')
                mock_resend.Emails.send.assert_called_once()


class TestNotifyScanComplete:
    """Tests for notify_scan_complete()"""

    @patch('app.services.notifications.supabase')
    def test_saves_in_app_notification(self, mock_sb):
        from app.services.notifications import notify_scan_complete
        # Return prefs with email disabled
        mock_sb.table.return_value.select.return_value.eq.return_value \
            .limit.return_value.execute.return_value.data = [{
                'email_threat_alerts': False,
                'email_scan_completions': False,
                'email_weekly_digest': False,
                'push_critical_alerts': False,
                'push_scan_updates': False,
                'push_subscription': None,
            }]
        mock_sb.table.return_value.insert.return_value.execute.return_value = MagicMock()

        # Use correct kwarg name: 'filename' not 'file_name'
        notify_scan_complete(
            user_id='user-1',
            scan_id='scan-1',
            filename='test.exe',
            total_findings=3,
            threat_level='high',
        )
        # Should have called insert to save the notification
        mock_sb.table.return_value.insert.assert_called()
