"""Database Seeding Script"""
import uuid
import click
from datetime import datetime, timezone, timedelta
from flask.cli import with_appcontext
from werkzeug.security import generate_password_hash
from .supabase_client import supabase

@click.command('seed-db')
@with_appcontext
def seed_db_command():
    """Populate database with sample data for development."""
    print("🌱 Seeding database...")
    
    # 1. Get or Create Test User
    user_id = None
    
    # First, check if ANY user exists to use as a fallback (to avoid rate limits on generic "admin" accounts)
    try:
        existing_users = supabase.table('profiles').select('id, email').limit(1).execute()
        if existing_users.data:
            user = existing_users.data[0]
            user_id = user['id']
            print(f"   Found existing user: {user.get('email')} ({user_id})")
            print("   Using this user to seed data (avoiding new account creation).")
    except Exception as e:
        print(f"   ⚠️ Error checking existing profiles: {e}")

    if not user_id:
        # No user found, try to create one (with random email to avoid collision/limits if possible)
        random_suffix = str(uuid.uuid4())[:8]
        email = f"admin_{random_suffix}@threatforge.local"
        
        try:
            print(f"   Attempting to create Auth user: {email}")
            auth_res = supabase.auth.sign_up({
                "email": email,
                "password": "password123",
                "options": {
                    "data": {
                        "display_name": "Chief Analyst"
                    }
                }
            })
            
            if auth_res.user:
                user_id = auth_res.user.id
                print(f"   Auth user created: {user_id}")
                
                # Upsert profile
                supabase.table('profiles').upsert({
                    'id': user_id,
                    'email': email,
                    'display_name': 'Chief Analyst',
                    'role': 'admin',
                    'password_hash': generate_password_hash('password123'),
                    'created_at': datetime.now(timezone.utc).isoformat()
                }).execute()
            else:
                print("   ⚠️ Auth signup returned no user.")
        
        except Exception as e:
            print(f"   ⚠️ Could not create user via Auth API: {e}")

    if not user_id:
        print("   ❌ No user available (creation failed and no existing users). Skipping seeded data.")
        return

    # 2. Seed Scans
    scans = []
    all_findings = []
    statuses = ['completed', 'completed', 'completed', 'failed', 'running']
    types = ['full', 'quick', 'full', 'full', 'quick']
    
    for i in range(5):
        scan_id = str(uuid.uuid4())
        created_at = datetime.now(timezone.utc) - timedelta(days=i, hours=2)
        status = statuses[i]
        
        scans.append({
            'id': scan_id,
            'user_id': user_id,
            'status': status,
            'scan_type': types[i],
            'total_files': 1,
            'threats_found': 2 if status == 'completed' and i % 2 == 0 else 0,
            'duration_seconds': 45.5 if status == 'completed' else 0,
            'created_at': created_at.isoformat(),
            'completed_at': (created_at + timedelta(minutes=1)).isoformat() if status == 'completed' else None
        })
        
        # Seed Findings for completed scans
        if status == 'completed' and i % 2 == 0:
            all_findings.extend(get_sample_findings(scan_id))

    if scans:
        supabase.table('scans').insert(scans).execute()
        print(f"   Seeded {len(scans)} scans")

    if all_findings:
        supabase.table('findings').insert(all_findings).execute()
        print(f"   Seeded {len(all_findings)} findings")

    # 3. Seed Activity Logs
    logs = [
        {'action': 'login', 'created_at': (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()},
        {'action': 'view_dashboard', 'created_at': (datetime.now(timezone.utc) - timedelta(minutes=45)).isoformat()},
        {'action': 'create_scan', 'created_at': (datetime.now(timezone.utc) - timedelta(minutes=30)).isoformat()},
        {'action': 'download_report', 'created_at': (datetime.now(timezone.utc) - timedelta(minutes=10)).isoformat()},
    ]
    for log in logs:
        log['user_id'] = user_id
        log['ip_address'] = '127.0.0.1'
    
    supabase.table('activity_logs').insert(logs).execute()
    print(f"   Seeded {len(logs)} activity logs")
    
    print("✅ Database seeding complete!")

def get_sample_findings(scan_id):
    """Helper to get sample findings for a scan."""
    return [
        {
            'scan_id': scan_id,
            'finding_type': 'malware',
            'severity': 'high',
            'title': 'Suspicious OLE Object',
            'description': 'Detected embedded OLE object with high entropy.',
            'confidence': 0.89,
            'detected_at': datetime.now(timezone.utc).isoformat()
        },
        {
            'scan_id': scan_id,
            'finding_type': 'yara',
            'severity': 'medium',
            'title': 'Packer Detected',
            'description': 'Signature matches common UPX packer.',
            'confidence': 0.95,
            'detected_at': datetime.now(timezone.utc).isoformat()
        }
    ]
