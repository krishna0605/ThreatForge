#!/bin/bash

# ThreatForge Secrets Rotation Helper
# Usage: ./scripts/rotate_secrets.sh

echo "=================================================="
echo "🛡️ ThreatForge Secrets Rotation Guide 🛡️"
echo "=================================================="
echo ""
echo "This script guides you through rotating your sensitive keys."
echo "Since we cannot automatically rotate 3rd party keys, follow these steps:"
echo ""

echo "1. SUPABASE SERVICE KEY"
echo "   - Go to your Supabase Dashboard > Project Settings > API"
echo "   - Under 'service_role' key, click 'Generate new secret' if available, or 'Reveal'."
echo "   - If you suspect a leak, roll the key in Supabase first."
echo "   - Update 'SUPABASE_KEY' in your backend/.env and frontend/.env.local"
echo ""
read -p "Press Enter when done with Supabase Key..."

echo "2. DATABASE PASSWORD"
echo "   - Go to Supabase Dashboard > Project Settings > Database"
echo "   - Reset the database password."
echo "   - Update 'DB_PASSWORD' and 'DATABASE_URL' in backend/.env"
echo ""
read -p "Press Enter when done with DB Password..."

echo "3. JWT SECRET KEY"
echo "   - Generate a new random strong string:"
echo "     openssl rand -hex 32"
echo "   - Update 'JWT_SECRET_KEY' in backend/.env"
echo "   - NOTE: This will invalidate all existing user sessions."
echo ""
read -p "Press Enter when done with JWT Secret..."

echo "4. ENCRYPTION KEY (MFA)"
echo "   - Generate a new Fernet key:"
echo "     python -c 'from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())'"
echo "   - Update 'ENCRYPTION_KEY' in backend/.env"
echo "   - ⚠️ WARNING: Changing this will make existing MFA secrets unreadable!"
echo "   - Only change this if you are prepared to reset everyone's MFA."
echo ""
read -p "Press Enter when done with Encryption Key..."

echo "5. CLEANUP GIT HISTORY (If leaked)"
echo "   - If .env was committed, you must rewrite git history."
echo "   - Recommended: BFG Repo-Cleaner or git-filter-repo"
echo "   - Command: bfg --delete-files .env"
echo ""

echo "=================================================="
echo "✅ Rotation Guide Complete. Restart your services!"
echo "   docker-compose down && docker-compose up -d --build"
echo "=================================================="
