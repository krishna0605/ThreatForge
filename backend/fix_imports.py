"""
Script to remove unused imports (F401).
"""
import os

REMOVE_LINES = {
    # __init__.py
    ('app/__init__.py', 8),
    ('app/__init__.py', 17),
    ('app/__init__.py', 18),
    # api_keys.py
    ('app/api/api_keys.py', 2),
    ('app/api/api_keys.py', 3),
    # dashboard.py
    ('app/api/dashboard.py', 4),
    # notifications_api.py
    ('app/api/notifications_api.py', 3),
    # rules.py
    ('app/api/rules.py', 6),
    ('app/api/rules.py', 7),
    ('app/api/rules.py', 12),
    # scans.py
    ('app/api/scans.py', 6),
    ('app/api/scans.py', 8),
    ('app/api/scans.py', 16),
    # security.py
    ('app/api/security.py', 3),
    ('app/api/security.py', 6),
    # shared.py
    ('app/api/shared.py', 6),
    # threats.py
    # ('app/api/threats.py', 2),  # SKIP: needs replace, handled manually
    ('app/api/threats.py', 3),
    # middleware/correlation.py
    ('app/middleware/correlation.py', 4),
    # models/base.py
    ('app/models/base.py', 3),
    # models/yara_rule.py
    ('app/models/yara_rule.py', 3),
    # schemas/auth.py
    ('app/schemas/auth.py', 1),
    # services/auth_service.py
    ('app/services/auth_service.py', 3),
    # services/notifications.py
    ('app/services/notifications.py', 4),
    # services/scanner.py
    ('app/services/scanner.py', 6),
    # services/threat_intel.py
    ('app/services/threat_intel.py', 2),
    # services/yara_engine.py
    ('app/services/yara_engine.py', 2),
    ('app/services/yara_engine.py', 4),
}

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.read().splitlines()
    
    norm_path = filepath.replace('\\', '/')
    new_lines = []
    modified = False
    
    for i, line in enumerate(lines, 1):
        if (norm_path, i) in REMOVE_LINES:
            modified = True
            continue # Skip this line
        new_lines.append(line)
        
    if modified:
        with open(filepath, 'w', encoding='utf-8', newline='\n') as f:
            f.write('\n'.join(new_lines) + '\n')
        print(f"Fixed imports in {filepath}")

def main():
    root = 'app'
    for dirpath, _, filenames in os.walk(root):
        for filename in filenames:
            if filename.endswith('.py'):
                process_file(os.path.join(dirpath, filename))

if __name__ == '__main__':
    main()
