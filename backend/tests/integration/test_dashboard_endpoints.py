"""Integration Tests — Dashboard API Endpoints"""
import pytest
from unittest.mock import MagicMock, patch


class TestDashboardStats:
    """Tests for GET /api/dashboard/stats"""

    def test_stats_unauthenticated(self, client):
        response = client.get('/api/dashboard/stats')
        assert response.status_code == 401

    @patch('app.api.dashboard.supabase')
    def test_stats_authenticated(self, mock_sb, client, auth_headers):
        # The stats endpoint makes multiple calls with different chains.
        # Use a single generic mock that returns valid data for any chain.
        generic_result = MagicMock()
        generic_result.data = []
        generic_result.count = 0

        # Wire up all possible chain endings to return the generic result
        tbl = mock_sb.table.return_value
        sel = tbl.select.return_value
        eq = sel.eq.return_value
        eq.execute.return_value = generic_result
        eq.gte.return_value.execute.return_value = generic_result
        eq.gte.return_value.lte.return_value.execute.return_value = generic_result
        eq.order.return_value.limit.return_value.execute.return_value = generic_result
        eq.limit.return_value.execute.return_value = generic_result
        eq.eq.return_value.execute.return_value = generic_result
        eq.eq.return_value.gte.return_value.execute.return_value = generic_result
        eq.eq.return_value.limit.return_value.execute.return_value = generic_result

        response = client.get('/api/dashboard/stats', headers=auth_headers)
        assert response.status_code == 200


class TestDashboardActivity:
    """Tests for GET /api/dashboard/activity"""

    @patch('app.api.dashboard.supabase')
    def test_activity_returns_data(self, mock_sb, client, auth_headers):
        mock_sb.table.return_value.select.return_value.eq.return_value \
            .gte.return_value.order.return_value.execute.return_value = MagicMock(data=[])
        response = client.get('/api/dashboard/activity', headers=auth_headers)
        assert response.status_code == 200


class TestThreatDistribution:
    """Tests for GET /api/dashboard/threat-distribution"""

    @patch('app.api.dashboard.supabase')
    def test_threat_distribution(self, mock_sb, client, auth_headers):
        mock_sb.table.return_value.select.return_value.eq.return_value \
            .execute.return_value = MagicMock(data=[])
        response = client.get('/api/dashboard/threat-distribution', headers=auth_headers)
        assert response.status_code == 200


class TestSecurityHealth:
    """Tests for GET /api/dashboard/security-health"""

    @patch('app.api.dashboard.supabase')
    def test_security_health(self, mock_sb, client, auth_headers):
        generic = MagicMock()
        generic.data = []
        generic.count = 0

        tbl = mock_sb.table.return_value
        sel = tbl.select.return_value
        eq = sel.eq.return_value
        eq.execute.return_value = generic
        eq.gte.return_value.execute.return_value = generic
        eq.limit.return_value.execute.return_value = generic
        eq.eq.return_value.execute.return_value = generic

        response = client.get('/api/dashboard/security-health', headers=auth_headers)
        assert response.status_code == 200


class TestSeverityBreakdown:
    """Tests for GET /api/dashboard/severity-breakdown"""

    @patch('app.api.dashboard.supabase')
    def test_severity_breakdown(self, mock_sb, client, auth_headers):
        mock_sb.table.return_value.select.return_value.eq.return_value \
            .execute.return_value = MagicMock(data=[])
        response = client.get('/api/dashboard/severity-breakdown', headers=auth_headers)
        assert response.status_code == 200


class TestSecurityActions:
    """Tests for GET /api/dashboard/security-actions"""

    @patch('app.api.dashboard.supabase')
    def test_security_actions(self, mock_sb, client, auth_headers):
        generic = MagicMock()
        generic.data = []
        generic.count = 0

        tbl = mock_sb.table.return_value
        sel = tbl.select.return_value
        eq = sel.eq.return_value
        eq.execute.return_value = generic
        eq.gte.return_value.execute.return_value = generic
        eq.limit.return_value.execute.return_value = generic
        eq.order.return_value.limit.return_value.execute.return_value = generic
        eq.eq.return_value.execute.return_value = generic
        eq.eq.return_value.limit.return_value.execute.return_value = generic

        response = client.get('/api/dashboard/security-actions', headers=auth_headers)
        assert response.status_code == 200
