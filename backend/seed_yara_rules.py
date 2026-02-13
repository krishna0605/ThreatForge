"""
One-time script to seed built-in YARA rules into Supabase.
Run: python seed_yara_rules.py
"""
import os, glob, uuid
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_KEY'))

YARA_DIR = os.path.join(os.path.dirname(__file__), 'yara_rules')
CATEGORY_MAP = {
    'malware': 'malware',
    'network': 'network',
    'packer': 'packer',
    'suspicious': 'suspicious',
}

def seed():
    inserted = 0
    skipped = 0
    
    for yar_file in glob.glob(os.path.join(YARA_DIR, '**', '*.yar'), recursive=True):
        # Determine category from parent directory name
        parent_dir = os.path.basename(os.path.dirname(yar_file))
        category = CATEGORY_MAP.get(parent_dir, 'general')
        
        with open(yar_file, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        rule_name = os.path.splitext(os.path.basename(yar_file))[0]
        
        # Check if rule already exists
        existing = supabase.table('yara_rules').select('id').eq('name', rule_name).eq('is_builtin', True).execute()
        if existing.data:
            print(f'  ⏭ Skipping (exists): {rule_name}')
            skipped += 1
            continue
        
        # Insert rule
        supabase.table('yara_rules').insert({
            'id': str(uuid.uuid4()),
            'name': rule_name,
            'rule_content': content,
            'category': category,
            'severity': 'medium',
            'is_enabled': True,
            'is_builtin': True,
        }).execute()
        
        print(f'  ✅ Seeded: {rule_name} ({category})')
        inserted += 1
    
    print(f'\nDone! Inserted: {inserted}, Skipped: {skipped}')

if __name__ == '__main__':
    seed()
