"""Integration Tests — Rules API Endpoints"""
import pytest
from unittest.mock import MagicMock, patch
from tests.conftest import TEST_USER_ID


class TestListRules:
    """Tests for GET /api/rules"""

    def test_list_rules_unauthenticated(self, client):
        response = client.get('/api/rules')
        assert response.status_code == 401

    @patch('app.api.rules.supabase')
    def test_list_rules_authenticated(self, mock_sb, client, auth_headers):
        mock_sb.table.return_value.select.return_value.eq.return_value \
            .or_.return_value.order.return_value.execute.return_value = MagicMock(data=[])
        response = client.get('/api/rules', headers=auth_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert 'rules' in data


class TestCreateRule:
    """Tests for POST /api/rules"""

    @patch('app.api.rules.yara_engine')
    @patch('app.api.rules.supabase')
    def test_create_rule_valid(self, mock_sb, mock_yara, client, auth_headers):
        mock_yara.validate_rule.return_value = {'valid': True, 'errors': []}
        mock_sb.table.return_value.insert.return_value.execute.return_value = MagicMock(data=[{
            'id': 'rule-123', 'name': 'test_rule', 'rule_content': 'rule test { condition: true }'
        }])
        response = client.post('/api/rules', json={
            'name': 'test_rule',
            'rule_content': 'rule test { condition: true }',
            'description': 'A test rule',
            'category': 'malware',
        }, headers=auth_headers)
        assert response.status_code in (200, 201)

    def test_create_rule_missing_content(self, client, auth_headers):
        response = client.post('/api/rules', json={
            'name': 'test_rule',
        }, headers=auth_headers)
        assert response.status_code == 400


class TestDeleteRule:
    """Tests for DELETE /api/rules/<id>"""

    @patch('app.api.rules.supabase')
    def test_delete_rule_success(self, mock_sb, client, auth_headers):
        # delete_rule uses .single().execute() and checks is_builtin + user_id
        rule_data = {
            'id': 'rule-1',
            'user_id': TEST_USER_ID,
            'is_builtin': False,
            'name': 'test_rule',
        }
        mock_sb.table.return_value.select.return_value.eq.return_value \
            .single.return_value.execute.return_value = MagicMock(data=rule_data)
        mock_sb.table.return_value.delete.return_value.eq.return_value \
            .execute.return_value = MagicMock()
        response = client.delete('/api/rules/rule-1', headers=auth_headers)
        assert response.status_code == 200


class TestValidateRule:
    """Tests for POST /api/rules/validate"""

    @patch('app.api.rules.yara_engine')
    def test_validate_rule_valid(self, mock_yara, client, auth_headers):
        mock_yara.validate_rule.return_value = {'valid': True, 'errors': []}
        response = client.post('/api/rules/validate', json={
            'rule_content': 'rule test { condition: true }',
        }, headers=auth_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert data['valid'] is True

    @patch('app.api.rules.yara_engine')
    def test_validate_rule_invalid(self, mock_yara, client, auth_headers):
        mock_yara.validate_rule.return_value = {'valid': False, 'errors': ['Syntax error']}
        response = client.post('/api/rules/validate', json={
            'rule_content': 'broken rule {',
        }, headers=auth_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert data['valid'] is False

    def test_validate_rule_missing_content(self, client, auth_headers):
        response = client.post('/api/rules/validate', json={}, headers=auth_headers)
        assert response.status_code == 400
