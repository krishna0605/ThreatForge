# 🛡️ Cybersecurity Threat AI — Phase 2: Foundation Implementation Plan

> **Context for AI Model**: Phase 1 (scaffolding) is COMPLETE. All 3 directories (`frontend/`, `backend/`, `ml-service/`) are created with folder structures and dependencies installed. This plan covers the NEXT step: implementing the actual working features for the foundation layer.
>
> **Project Root**: `c:\Users\Admin\Desktop\ThreatForge`
> **Tech Stack**: Next.js 14 (TypeScript) + Flask (Python 3.11) + Supabase + Hugging Face Spaces

---

## 📋 What Has Already Been Done (DO NOT REPEAT)

- ✅ `frontend/` — Next.js 14 project initialized with all npm dependencies installed
- ✅ `backend/` — Flask project structure with `requirements.txt`, all Python module stubs created
- ✅ `ml-service/` — ML inference service structure with `app.py` and all module stubs
- ✅ All page files exist as placeholder stubs (e.g., `export default function DashboardPage() { return <div>...</div> }`)
- ✅ All backend API endpoint files exist as stubs with `# TODO` comments
- ✅ All model files exist with full SQLAlchemy column definitions
- ✅ Root configs: `.env.example`, `docker-compose.yml`, `.gitattributes`, CI/CD workflows, `README.md`

---

## 🎯 Phase 2 Goal: Make the App Actually Work

Build the **foundation layer** so a user can:
1. Visit the landing page and see a polished, premium UI
2. Sign up / Log in with email/password
3. See a dashboard with navigation (sidebar + navbar)
4. Navigate between pages using the sidebar

This phase focuses on: **Supabase DB setup → Auth backend → Auth frontend → Dashboard layout → Landing page**

---

## Step 1: Supabase Database Setup

### 1.1 Create the SQL Migration File

**Create file**: `backend/supabase-setup.sql`

This SQL file will be run in the Supabase SQL Editor (Dashboard → SQL Editor → New Query → paste and run).

```sql
-- ============================================
-- Cybersecurity Threat AI — Supabase Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================
-- USERS TABLE
-- =====================
-- Note: Supabase Auth handles user creation via auth.users
-- This table stores additional profile data
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret TEXT,
    role TEXT DEFAULT 'analyst' CHECK (role IN ('admin', 'analyst', 'viewer')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- SCANS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed')),
    scan_type TEXT DEFAULT 'full',
    total_files INTEGER DEFAULT 0,
    threats_found INTEGER DEFAULT 0,
    duration_seconds FLOAT,
    options JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- =====================
-- SCAN FILES TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.scan_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scan_id UUID NOT NULL REFERENCES public.scans(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    file_hash_sha256 TEXT,
    mime_type TEXT,
    file_size INTEGER,
    entropy FLOAT,
    storage_path TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- FINDINGS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.findings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scan_id UUID NOT NULL REFERENCES public.scans(id) ON DELETE CASCADE,
    scan_file_id UUID REFERENCES public.scan_files(id) ON DELETE SET NULL,
    finding_type TEXT NOT NULL CHECK (finding_type IN ('malware', 'steganography', 'network', 'yara', 'entropy', 'pe_header')),
    severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
    title TEXT NOT NULL,
    description TEXT,
    confidence FLOAT,
    details JSONB DEFAULT '{}',
    remediation TEXT,
    detected_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- YARA RULES TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.yara_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'custom',
    severity TEXT DEFAULT 'medium' CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    rule_content TEXT NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    is_builtin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- RULE MATCHES TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.rule_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    finding_id UUID NOT NULL REFERENCES public.findings(id) ON DELETE CASCADE,
    rule_id UUID REFERENCES public.yara_rules(id) ON DELETE SET NULL,
    rule_name TEXT NOT NULL,
    matched_strings JSONB DEFAULT '[]'
);

-- =====================
-- API KEYS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    key_hash TEXT NOT NULL,
    key_prefix TEXT NOT NULL,
    label TEXT,
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- ACTIVITY LOGS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id UUID,
    metadata JSONB DEFAULT '{}',
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- INDEXES
-- =====================
CREATE INDEX IF NOT EXISTS idx_scans_user_id ON public.scans(user_id);
CREATE INDEX IF NOT EXISTS idx_scans_status ON public.scans(status);
CREATE INDEX IF NOT EXISTS idx_scans_created_at ON public.scans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scan_files_scan_id ON public.scan_files(scan_id);
CREATE INDEX IF NOT EXISTS idx_findings_scan_id ON public.findings(scan_id);
CREATE INDEX IF NOT EXISTS idx_findings_severity ON public.findings(severity);
CREATE INDEX IF NOT EXISTS idx_yara_rules_user_id ON public.yara_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);

-- =====================
-- ROW LEVEL SECURITY
-- =====================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yara_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rule_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read/update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Scans: Users can CRUD their own scans
CREATE POLICY "Users can view own scans" ON public.scans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create scans" ON public.scans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own scans" ON public.scans FOR DELETE USING (auth.uid() = user_id);

-- Scan Files: Users can view files from their own scans
CREATE POLICY "Users can view own scan files" ON public.scan_files FOR SELECT
    USING (scan_id IN (SELECT id FROM public.scans WHERE user_id = auth.uid()));

-- Findings: Users can view findings from their own scans
CREATE POLICY "Users can view own findings" ON public.findings FOR SELECT
    USING (scan_id IN (SELECT id FROM public.scans WHERE user_id = auth.uid()));

-- YARA Rules: Users can CRUD their own rules + view builtin rules
CREATE POLICY "Users can view own and builtin rules" ON public.yara_rules FOR SELECT
    USING (user_id = auth.uid() OR is_builtin = TRUE);
CREATE POLICY "Users can create rules" ON public.yara_rules FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own rules" ON public.yara_rules FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own rules" ON public.yara_rules FOR DELETE USING (auth.uid() = user_id);

-- API Keys: Users can CRUD their own keys
CREATE POLICY "Users can view own api keys" ON public.api_keys FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create api keys" ON public.api_keys FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own api keys" ON public.api_keys FOR DELETE USING (auth.uid() = user_id);

-- Activity Logs: Users can view their own activity
CREATE POLICY "Users can view own activity" ON public.activity_logs FOR SELECT USING (auth.uid() = user_id);

-- Rule Matches: Users can view matches from their own findings
CREATE POLICY "Users can view own rule matches" ON public.rule_matches FOR SELECT
    USING (finding_id IN (
        SELECT f.id FROM public.findings f
        JOIN public.scans s ON f.scan_id = s.id
        WHERE s.user_id = auth.uid()
    ));

-- =====================
-- TRIGGER: Auto-create profile on signup
-- =====================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, display_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================
-- TRIGGER: Auto-update updated_at
-- =====================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_yara_rules_updated_at
    BEFORE UPDATE ON public.yara_rules
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
```

### 1.2 Configure Supabase Environment Variables

After running the SQL above in Supabase Dashboard, get your credentials from **Supabase → Settings → API** and update/create a `.env.local` file:

**Create file**: `frontend/.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key
BACKEND_URL=http://localhost:5000
```

**Create file**: `backend/.env`

```env
SECRET_KEY=generate-a-random-secret-key-here
JWT_SECRET_KEY=generate-another-random-key-here
DATABASE_URL=postgresql://postgres:your-password@db.your-project-id.supabase.co:5432/postgres
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=eyJ...your-service-role-key
ML_SERVICE_URL=http://localhost:7860
CORS_ORIGINS=http://localhost:3000
REDIS_URL=redis://localhost:6379/0
```

---

## Step 2: Implement Auth Backend (Flask)

### 2.1 Update `backend/app/api/auth.py`

**REPLACE the entire contents** of `backend/app/api/auth.py` with a fully working implementation:

```python
"""Auth Endpoints — Full Implementation"""
from flask import request, jsonify
from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity, get_jwt
)
from werkzeug.security import generate_password_hash, check_password_hash
import pyotp
from datetime import datetime, timezone

from . import api_bp
from ..extensions import db, limiter
from ..models.user import User
from ..models.activity_log import ActivityLog


@api_bp.route('/auth/signup', methods=['POST'])
@limiter.limit("5/minute")
def signup():
    """Register a new user."""
    data = request.get_json()

    if not data:
        return jsonify({'error': 'Request body required'}), 400

    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    display_name = data.get('display_name', '')

    # Validation
    if not email or '@' not in email:
        return jsonify({'error': 'Valid email is required'}), 400
    if len(password) < 8:
        return jsonify({'error': 'Password must be at least 8 characters'}), 400

    # Check if user exists
    existing = User.query.filter_by(email=email).first()
    if existing:
        return jsonify({'error': 'Email already registered'}), 409

    # Create user
    user = User(
        email=email,
        password_hash=generate_password_hash(password),
        display_name=display_name or email.split('@')[0],
        role='analyst',
    )
    db.session.add(user)
    db.session.commit()

    # Generate tokens
    access_token = create_access_token(identity=user.id)
    refresh_token = create_refresh_token(identity=user.id)

    # Log activity
    log = ActivityLog(user_id=user.id, action='signup', ip_address=request.remote_addr)
    db.session.add(log)
    db.session.commit()

    return jsonify({
        'message': 'Account created successfully',
        'user': {
            'id': user.id,
            'email': user.email,
            'display_name': user.display_name,
            'role': user.role,
        },
        'access_token': access_token,
        'refresh_token': refresh_token,
    }), 201


@api_bp.route('/auth/login', methods=['POST'])
@limiter.limit("10/minute")
def login():
    """Authenticate user and return JWT."""
    data = request.get_json()

    if not data:
        return jsonify({'error': 'Request body required'}), 400

    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({'error': 'Invalid email or password'}), 401

    # Check MFA
    if user.mfa_enabled:
        totp_code = data.get('totp_code')
        if not totp_code:
            return jsonify({
                'mfa_required': True,
                'message': 'MFA verification required',
            }), 200
        totp = pyotp.TOTP(user.mfa_secret)
        if not totp.verify(totp_code):
            return jsonify({'error': 'Invalid TOTP code'}), 401

    # Generate tokens
    access_token = create_access_token(identity=user.id)
    refresh_token = create_refresh_token(identity=user.id)

    # Log activity
    log = ActivityLog(user_id=user.id, action='login', ip_address=request.remote_addr)
    db.session.add(log)
    db.session.commit()

    return jsonify({
        'user': {
            'id': user.id,
            'email': user.email,
            'display_name': user.display_name,
            'role': user.role,
            'avatar_url': user.avatar_url,
            'mfa_enabled': user.mfa_enabled,
        },
        'access_token': access_token,
        'refresh_token': refresh_token,
    }), 200


@api_bp.route('/auth/me', methods=['GET'])
@jwt_required()
def get_me():
    """Get current user profile."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    return jsonify({
        'id': user.id,
        'email': user.email,
        'display_name': user.display_name,
        'role': user.role,
        'avatar_url': user.avatar_url,
        'mfa_enabled': user.mfa_enabled,
        'created_at': user.created_at.isoformat() if user.created_at else None,
    }), 200


@api_bp.route('/auth/logout', methods=['POST'])
@jwt_required()
def logout():
    """Invalidate current session."""
    user_id = get_jwt_identity()
    log = ActivityLog(user_id=user_id, action='logout', ip_address=request.remote_addr)
    db.session.add(log)
    db.session.commit()
    return jsonify({'message': 'Logged out successfully'}), 200


@api_bp.route('/auth/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh JWT token."""
    identity = get_jwt_identity()
    access_token = create_access_token(identity=identity)
    return jsonify({'access_token': access_token}), 200


@api_bp.route('/auth/forgot-password', methods=['POST'])
@limiter.limit("3/minute")
def forgot_password():
    """Send password reset email (placeholder)."""
    data = request.get_json()
    email = data.get('email', '').strip().lower() if data else ''
    # TODO: Implement actual email sending via Supabase or Resend
    return jsonify({'message': 'If an account exists, a password reset email has been sent'}), 200


@api_bp.route('/auth/mfa/enroll', methods=['POST'])
@jwt_required()
def mfa_enroll():
    """Enable 2FA for user. Returns TOTP secret and QR URI."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    secret = pyotp.random_base32()
    totp = pyotp.TOTP(secret)
    provisioning_uri = totp.provisioning_uri(name=user.email, issuer_name='CyberThreatAI')

    # Store secret temporarily (will be confirmed in verify step)
    user.mfa_secret = secret
    db.session.commit()

    return jsonify({
        'secret': secret,
        'qr_uri': provisioning_uri,
        'message': 'Scan the QR code with your authenticator app, then verify with a code',
    }), 200


@api_bp.route('/auth/mfa/verify', methods=['POST'])
@jwt_required()
def mfa_verify():
    """Verify TOTP code and enable MFA."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json()
    totp_code = data.get('totp_code', '') if data else ''

    if not user.mfa_secret:
        return jsonify({'error': 'MFA not enrolled. Call /auth/mfa/enroll first'}), 400

    totp = pyotp.TOTP(user.mfa_secret)
    if not totp.verify(totp_code):
        return jsonify({'error': 'Invalid TOTP code'}), 401

    user.mfa_enabled = True
    db.session.commit()

    return jsonify({'message': 'MFA enabled successfully'}), 200


# Add a health check endpoint
@api_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({'status': 'healthy', 'service': 'backend-api'}), 200
```

### 2.2 Update `backend/app/extensions.py` — Add Flask-SQLAlchemy Import

The current `extensions.py` uses `flask_sqlalchemy` but we need to make sure it's installed. It should already be in `requirements.txt` via `SQLAlchemy`. But you also need `flask-sqlalchemy`:

**Add to `backend/requirements.txt`** (append this line):
```
Flask-SQLAlchemy==3.1.1
```

---

## Step 3: Implement Auth Frontend (Next.js)

### 3.1 Create Auth Context Provider

**Create file**: `frontend/src/lib/AuthContext.tsx`

This is the CENTRAL auth state manager. It wraps the entire app and provides user info + auth methods to all components.

```tsx
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface User {
  id: string;
  email: string;
  display_name: string;
  role: string;
  avatar_url?: string;
  mfa_enabled: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; mfa_required?: boolean }>;
  signup: (email: string, password: string, displayName: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved auth on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('access_token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (data.mfa_required) {
        return { success: false, mfa_required: true };
      }

      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }

      setUser(data.user);
      setToken(data.access_token);
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  }, []);

  const signup = useCallback(async (email: string, password: string, displayName: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, display_name: displayName }),
      });
      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || 'Signup failed' };
      }

      setUser(data.user);
      setToken(data.access_token);
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  }, []);

  const logout = useCallback(() => {
    if (token) {
      fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  }, [token]);

  return (
    <AuthContext.Provider value={{
      user, token, isLoading,
      isAuthenticated: !!user && !!token,
      login, signup, logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

### 3.2 Update Root Layout to Include AuthProvider

**Modify file**: `frontend/src/app/layout.tsx`

Wrap the `{children}` with `<AuthProvider>`. The layout should import Bootstrap CSS globally and include the AuthProvider:

```tsx
import type { Metadata } from "next";
import 'bootstrap/dist/css/bootstrap.min.css';
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";

export const metadata: Metadata = {
  title: "Cybersecurity Threat AI",
  description: "AI-Powered Threat Detection Platform — Detect malware, steganography, and network threats",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-bs-theme="dark">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

### 3.3 Implement Login Page

**REPLACE**: `frontend/src/app/(auth)/login/page.tsx`

Build a polished, dark-themed login page with email/password form, validation, error handling, and redirect to dashboard on success. Use Bootstrap 5 classes. Include:
- Dark glassmorphism card with backdrop blur
- Animated shield logo/icon at top
- Email and password input fields with validation
- "Remember me" checkbox
- "Forgot password?" link
- "Sign up" link at bottom
- Loading spinner on submit
- Error toast/alert on failure
- Redirect to `/dashboard` on success using `useRouter().push('/dashboard')`
- Framer Motion fade-in animation on the card

### 3.4 Implement Signup Page

**REPLACE**: `frontend/src/app/(auth)/signup/page.tsx`

Similar to login but with:
- Display name field (required)
- Email field
- Password field with strength indicator
- Confirm password field
- "Already have an account? Log in" link
- Same dark glassmorphism styling as login

### 3.5 Create Protected Route Wrapper

**Create file**: `frontend/src/components/auth/ProtectedRoute.tsx`

```tsx
'use client';

import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
```

### 3.6 Create Dashboard Layout

**Create file**: `frontend/src/app/(dashboard)/layout.tsx`

This layout wraps ALL dashboard routes and provides the sidebar + navbar:

```tsx
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardShell from '@/components/layout/DashboardShell';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <DashboardShell>
        {children}
      </DashboardShell>
    </ProtectedRoute>
  );
}
```

### 3.7 Create DashboardShell Component (Sidebar + Navbar)

**Create file**: `frontend/src/components/layout/DashboardShell.tsx`

This is the main layout component with:
- **Collapsible sidebar** (left, 260px wide, dark themed)
  - Logo at top
  - Navigation links with icons:
    - 📊 Dashboard → `/dashboard`
    - 🔍 Scans → `/scans`
    - 📜 YARA Rules → `/rules`
    - 🌍 Threat Map → `/threats/map`
    - 📰 Threat Feed → `/threats/feed`
    - 📄 Reports → `/reports`
    - ⚙️ Settings → `/settings`
  - Active link highlighted
  - Collapse button for mobile
- **Top navbar** (right section)
  - Breadcrumb or page title
  - Search bar (placeholder)
  - Notification bell icon
  - User avatar/name dropdown → Profile, Settings, Logout
- **Main content area** (right, fills remaining space)
  - Renders `{children}`
  - Padding and scroll

Use Bootstrap 5 classes for layout. Use `'use client'` directive. Use `usePathname()` from `next/navigation` to determine the active link. Use `useAuth()` to get user info and `logout()` function.

**DESIGN REQUIREMENTS**:
- Dark theme: background `#0d1117`, sidebar `#161b22`, cards `#1c2128`
- Accent color: `#58a6ff` (blue) for active links and primary buttons
- Subtle border: `1px solid rgba(255,255,255,0.1)` on sidebar and cards
- Smooth transitions on sidebar collapse (300ms ease)
- Icons: Use emoji or Bootstrap Icons (add `bootstrap-icons` npm package if needed)

---

## Step 4: Implement Landing Page

### 4.1 Full Landing Page

**REPLACE**: `frontend/src/app/(public)/page.tsx` (the one in the `(public)` route group)

Also **REPLACE**: `frontend/src/app/page.tsx` (the root page — this is the actual landing page that Next.js serves at `/`)

The landing page should be a PREMIUM, dark-themed, modern cybersecurity landing page with:

1. **Hero Section**
   - Large headline: "AI-Powered Threat Detection Platform"
   - Subheadline about malware, steganography, network threats
   - Two CTA buttons: "Get Started Free" (→ `/signup`) and "View Demo" (→ `/dashboard`)
   - Animated background with subtle grid/particle effect (CSS only, no heavy libraries)
   - Framer Motion entrance animations

2. **Features Grid** (3 columns × 2 rows)
   - 🔬 Malware Detection — ML-based file scanning
   - 🖼️ Steganography Detection — Hidden data finder
   - 📡 Network Anomaly Detection — Traffic analysis
   - 📜 YARA Rules — Custom detection rules
   - 📊 Real-time Dashboard — Live analytics
   - 🌍 Global Threat Map — Threat visualization
   - Each card: icon, title, description, subtle hover glow effect

3. **Stats Section**
   - "Trusted by security researchers worldwide"
   - Counter stats (e.g., "10K+ scans", "99.2% accuracy", "50+ YARA rules")

4. **Footer**
   - Links: About, GitHub, Docs, Privacy, Terms
   - Copyright notice

**DESIGN REQUIREMENTS**:
- Dark theme matching dashboard (#0d1117 background)
- Gradient accents: blue (#58a6ff) to purple (#bc8cff)
- Glassmorphism cards with `backdrop-filter: blur(10px)` and semi-transparent backgrounds
- Smooth scroll behavior
- Responsive: works on mobile and desktop
- Framer Motion animations: fade-in-up on scroll for each section
- Use Bootstrap 5 grid system

---

## Step 5: Update Global Styles

### 5.1 Replace `frontend/src/app/globals.css`

Replace the default Next.js globals.css with a comprehensive dark theme:

```css
:root {
  --bg-primary: #0d1117;
  --bg-secondary: #161b22;
  --bg-card: #1c2128;
  --text-primary: #e6edf3;
  --text-secondary: #8b949e;
  --accent-blue: #58a6ff;
  --accent-purple: #bc8cff;
  --accent-green: #3fb950;
  --accent-red: #f85149;
  --accent-orange: #d29922;
  --border-color: rgba(255, 255, 255, 0.1);
  --shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  --radius: 12px;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}

/* Scrollbar */
::-webkit-scrollbar {
  width: 8px;
}
::-webkit-scrollbar-track {
  background: var(--bg-secondary);
}
::-webkit-scrollbar-thumb {
  background: var(--text-secondary);
  border-radius: 4px;
}

/* Glassmorphism Card */
.glass-card {
  background: rgba(22, 27, 34, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}

/* Gradient Text */
.gradient-text {
  background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Primary Button */
.btn-cyber {
  background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple));
  color: white;
  border: none;
  padding: 12px 28px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
  cursor: pointer;
}
.btn-cyber:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(88, 166, 255, 0.3);
  color: white;
}

/* Outline Button */
.btn-cyber-outline {
  background: transparent;
  color: var(--accent-blue);
  border: 1px solid var(--accent-blue);
  padding: 12px 28px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
  cursor: pointer;
}
.btn-cyber-outline:hover {
  background: rgba(88, 166, 255, 0.1);
  color: var(--accent-blue);
  transform: translateY(-2px);
}

/* Feature Card */
.feature-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  padding: 24px;
  transition: all 0.3s ease;
}
.feature-card:hover {
  border-color: var(--accent-blue);
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(88, 166, 255, 0.15);
}

/* Sidebar */
.sidebar {
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  width: 260px;
  min-height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 100;
  transition: transform 0.3s ease;
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 20px;
  color: var(--text-secondary);
  text-decoration: none;
  border-radius: 8px;
  margin: 2px 12px;
  transition: all 0.2s ease;
}
.sidebar-link:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
}
.sidebar-link.active {
  background: rgba(88, 166, 255, 0.1);
  color: var(--accent-blue);
}

/* Main Content Area */
.main-content {
  margin-left: 260px;
  min-height: 100vh;
  padding: 0;
}

/* Top Navbar */
.top-navbar {
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  padding: 12px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* Stat Cards */
.stat-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  padding: 20px;
}

/* Severity badges */
.badge-critical { background-color: var(--accent-red); }
.badge-high { background-color: var(--accent-orange); }
.badge-medium { background-color: #d29922; }
.badge-low { background-color: var(--accent-green); }
.badge-info { background-color: var(--accent-blue); }

/* Animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fadeInUp 0.6s ease forwards;
}

/* Responsive */
@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
  }
  .sidebar.open {
    transform: translateX(0);
  }
  .main-content {
    margin-left: 0;
  }
}
```

### 5.2 Add Google Fonts (Inter)

**Modify**: `frontend/src/app/layout.tsx` — Add the Inter font import from `next/font/google`:

```tsx
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

// Then add className={inter.className} to the <body> tag
```

---

## Step 6: Implement Dashboard Overview Page

### 6.1 Replace Dashboard Page

**REPLACE**: `frontend/src/app/(dashboard)/dashboard/page.tsx`

Build the main dashboard with:
1. **Welcome header** with user name and date
2. **4 stat cards** in a row:
   - Total Scans (with icon 🔍)
   - Threats Found (with icon 🚨)
   - Clean Files (with icon ✅)
   - Critical Alerts (with icon ⚠️)
   - Each card: large number, label, subtle color accent
3. **2 charts** in a row:
   - Threat Distribution (Pie/Doughnut chart using Chart.js + react-chartjs-2)
   - Scan Activity over 7 days (Line chart)
4. **2 sections** in a row:
   - Severity Breakdown (Horizontal bar chart)
   - Recent Scans (Table with 5 most recent scans)
5. **Threat Map Preview** at the bottom (placeholder for now, just a dark card with "Threat Map Coming Soon")

Use `useAuth()` to get the user's display name.

For Chart.js, you MUST register the chart components:
```tsx
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement } from 'chart.js';
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement);
```

Use **mock data** for now (hardcoded numbers and chart data). The charts will be connected to real API data in a later phase.

**DESIGN**: Follow the dark theme color scheme. Charts should use the accent colors (blue, purple, green, red, orange) on dark backgrounds.

---

## Step 7: Run and Verify

### 7.1 Start the Frontend

```powershell
cd c:\Users\Admin\Desktop\ThreatForge\frontend
npm run dev
```

Open `http://localhost:3000` in the browser and verify:
- ✅ Landing page renders with premium dark theme
- ✅ Click "Get Started Free" → navigates to `/signup`
- ✅ Sign up form works (may fail if backend not running — that's OK)
- ✅ Login page renders correctly
- ✅ Dashboard layout has sidebar + navbar (if you navigate directly to `/dashboard`)

### 7.2 Start the Backend (requires Python venv)

```powershell
cd c:\Users\Admin\Desktop\ThreatForge\backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -c "from app import create_app; app = create_app(); app.run(debug=True, port=5000)"
```

Verify:
- ✅ `http://localhost:5000/api/health` returns `{"status": "healthy"}`
- ✅ POST to `http://localhost:5000/api/auth/signup` creates a user
- ✅ POST to `http://localhost:5000/api/auth/login` returns JWT tokens

### 7.3 Full Flow Test

1. Start both frontend and backend
2. Go to `http://localhost:3000`
3. Click "Get Started Free"
4. Fill in signup form → should redirect to `/dashboard`
5. See dashboard with sidebar, navbar, stat cards, and charts
6. Click "Logout" → should redirect to login page
7. Login with the same credentials → should return to dashboard

---

## ⚠️ Important Notes for the Executing AI Model

1. **File Paths**: All paths are relative to `c:\Users\Admin\Desktop\ThreatForge`. The project uses Windows paths.

2. **Existing Files**: Many files already exist as stubs. You need to REPLACE their contents, not create new files. Use `replace_file_content` or `write_to_file` with `Overwrite: true`.

3. **Dependencies**: All npm packages are already installed in `frontend/`. Python packages need `pip install -r requirements.txt` in a virtual environment.

4. **'use client'**: Any Next.js component that uses React hooks (`useState`, `useEffect`, `useContext`), event handlers, or browser APIs MUST have `'use client'` as the FIRST line.

5. **Bootstrap**: Bootstrap 5 CSS must be imported in `layout.tsx`: `import 'bootstrap/dist/css/bootstrap.min.css'`

6. **Chart.js**: You MUST register Chart.js components before using them. See Step 6.1.

7. **Dark Theme**: The ENTIRE app uses a dark theme. Do NOT use any light backgrounds. Background should be `#0d1117`, cards `#1c2128`, sidebar `#161b22`.

8. **Don't Touch ml-service Yet**: The ML service does not need changes in this phase. It will be implemented in Phase 3.

9. **Authentication Flow**: The auth uses JWT tokens stored in localStorage. The `AuthContext` provider manages all auth state. Every dashboard page is wrapped by `ProtectedRoute` via the dashboard layout.

10. **The landing page at the root `/` route**: The file `frontend/src/app/page.tsx` is the landing page served at `/`. The `(public)` route group's `page.tsx` handles additional public routes, but the ROOT `page.tsx` is the main landing page.
