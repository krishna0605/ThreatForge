"""YARA Rule Engine Service"""
import os
import re
import tempfile
from typing import List, Dict, Any

try:
    import yara
    YARA_AVAILABLE = True
except ImportError:
    YARA_AVAILABLE = False


class YaraEngine:
    """Compile and match YARA rules against files."""

    def __init__(self, rules_directory: str = None):
        self.rules_directory = rules_directory
        self.compiled_rules = None

    def compile_rules_from_sources(self, rules_list: List[Dict[str, str]]) -> bool:
        """
        Compile YARA rules from a list of {name, content} dicts.
        Returns True if compilation succeeded.
        """
        if not YARA_AVAILABLE:
            return False

        sources = {}
        for rule in rules_list:
            namespace = rule.get('name', 'default')
            # Sanitize namespace to be a valid identifier if needed, mostly yara handles strings ok map keys
            sources[namespace] = rule['content']

        try:
            self.compiled_rules = yara.compile(sources=sources)
            return True
        except yara.SyntaxError:
            return False

    def match_file(self, file_path: str, rules_list: List[Dict[str, str]] = None) -> List[Dict[str, Any]]:
        """Match a file against compiled or provided YARA rules."""
        if not YARA_AVAILABLE:
            return self._fallback_match(file_path, rules_list or [])

        if rules_list:
            self.compile_rules_from_sources(rules_list)

        if not self.compiled_rules:
            # If no rules provided and none compiled, return empty
            return []

        try:
            matches = self.compiled_rules.match(file_path)
            results = []
            for match in matches:
                matched_strings = []
                for s in match.strings:
                    for instance in s.instances:
                        matched_strings.append({
                            'offset': instance.offset,
                            'identifier': s.identifier,
                            'data': instance.matched_data.hex()[:100],
                        })
                results.append({
                    'rule_name': match.rule,
                    'namespace': match.namespace,
                    'tags': list(match.tags),
                    'matched_strings': matched_strings,
                })
            return results
        except Exception as e:
            return [{'error': str(e)}]

    def validate_rule(self, rule_content: str) -> Dict[str, Any]:
        """Validate YARA rule syntax."""
        if not YARA_AVAILABLE:
            return self._fallback_validate(rule_content)

        try:
            yara.compile(source=rule_content)
            return {'valid': True, 'errors': []}
        except yara.SyntaxError as e:
            return {'valid': False, 'errors': [str(e)]}
        except Exception as e:
            return {'valid': False, 'errors': [f'Unexpected error: {str(e)}']}

    def test_rule(self, rule_content: str, file_path: str) -> List[Dict[str, Any]]:
        """Test a single rule against a file."""
        temp_rules = [{'name': 'test_rule', 'content': rule_content}]
        return self.match_file(file_path, temp_rules)

    @staticmethod
    def _fallback_validate(rule_content: str) -> Dict[str, Any]:
        """Basic regex validation when yara-python is not available."""
        errors = []
        if not re.search(r'rule\s+\w+', rule_content):
            errors.append('Missing rule declaration (expected: rule RuleName { ... })')
        if rule_content.count('{') != rule_content.count('}'):
            errors.append('Mismatched braces')
        if 'condition:' not in rule_content:
            errors.append('Missing condition section')
        return {'valid': len(errors) == 0, 'errors': errors, 'fallback': True}

    @staticmethod
    def _fallback_match(file_path: str, rules_list: List[Dict[str, str]]) -> List[Dict[str, Any]]:
        """Basic string matching fallback when yara-python is unavailable."""
        results = []
        try:
            with open(file_path, 'rb') as f:
                content = f.read()
            for rule in rules_list:
                # Very basic extraction of double-quoted strings in strings section
                # This is a fallback and not a full parser
                string_matches = re.findall(
                    r'strings:\s*(.*?)(?:condition:|$)',
                    rule.get('content', ''), re.DOTALL
                )
                if string_matches:
                    for match_block in string_matches:
                        # Find $var = "string" patterns
                        patterns = re.findall(r'\$\w+\s*=\s*"([^"]+)"', match_block)
                        for pattern in patterns:
                            if pattern.encode() in content:
                                results.append({
                                    'rule_name': rule.get('name', 'unknown'),
                                    'namespace': 'fallback',
                                    'tags': [],
                                    'matched_strings': [{'identifier': pattern, 'data': pattern.encode().hex()}],
                                })
        except Exception:
            pass
        return results
