-- ============================================
-- Cybersecurity Threat AI — Initial Schema
-- Migration ID: 0000_initial_schema
-- Description: Baseline schema snapshot
-- ============================================

-- 1. CLEANUP: Drop tables created by SQLAlchemy to avoid conflicts
DROP TABLE IF EXISTS public.rule_matches CASCADE;
DROP TABLE IF EXISTS public.yara_rules CASCADE;
DROP TABLE IF EXISTS public.findings CASCADE;
DROP TABLE IF EXISTS public.scan_files CASCADE;
DROP TABLE IF EXISTS public.scans CASCADE;
DROP TABLE IF EXISTS public.api_keys CASCADE;
DROP TABLE IF EXISTS public.activity_logs CASCADE;
DROP TABLE IF EXISTS public.users CASCADE; -- SQLAlchemy's user table
-- Note: 'profiles' might exist if you ran previous SQL, we'll ensure it's correct below

-- 2. ENABLE EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================
-- USERS TABLE (Supabase Auth Integration)
-- =====================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret TEXT,
    recovery_codes JSONB,
    password_hash TEXT, -- Storing hash mainly for legacy/demo purposes if needed, otherwise Supabase Auth handles it
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
    finding_type TEXT NOT NULL CHECK (finding_type IN ('malware', 'steganography', 'network', 'yara', 'entropy', 'pe_header', 'strings')),
    severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
    title TEXT NOT NULL,
    description TEXT,
    confidence FLOAT,
    details JSONB DEFAULT '{}',
    remediation TEXT,
    detected_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- SHARED REPORTS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.shared_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scan_id UUID NOT NULL REFERENCES public.scans(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    share_token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
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
-- USER SESSIONS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    token_jti TEXT UNIQUE NOT NULL,
    browser TEXT,
    os TEXT,
    ip_address TEXT,
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    is_revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- SECURITY PREFERENCES TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.security_preferences (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_timeout_enabled BOOLEAN DEFAULT TRUE,
    session_timeout_minutes INTEGER DEFAULT 15,
    ip_whitelist_enabled BOOLEAN DEFAULT FALSE,
    audit_logging_enabled BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- IP WHITELIST TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.ip_whitelist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    cidr_range TEXT NOT NULL,
    label TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- AUDIT LOGS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id UUID,
    details JSONB DEFAULT '{}',
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- ROW LEVEL SECURITY (RLS)
-- =====================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yara_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rule_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ip_whitelist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Scans
CREATE POLICY "Users can view own scans" ON public.scans FOR SELECT USING (auth.uid() = user_id);
-- Allow INSERT if user_id matches auth.uid()
CREATE POLICY "Users can create scans" ON public.scans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own scans" ON public.scans FOR DELETE USING (auth.uid() = user_id);

-- Scan Files
CREATE POLICY "Users can view own scan files" ON public.scan_files FOR SELECT
    USING (scan_id IN (SELECT id FROM public.scans WHERE user_id = auth.uid()));
CREATE POLICY "Users can create scan files" ON public.scan_files FOR INSERT WITH CHECK (
    scan_id IN (SELECT id FROM public.scans WHERE user_id = auth.uid())
);

-- Findings
CREATE POLICY "Users can view own findings" ON public.findings FOR SELECT
    USING (scan_id IN (SELECT id FROM public.scans WHERE user_id = auth.uid()));
CREATE POLICY "Users can create findings" ON public.findings FOR INSERT WITH CHECK (
    scan_id IN (SELECT id FROM public.scans WHERE user_id = auth.uid())
);

-- YARA Rules
CREATE POLICY "Users can view own and builtin rules" ON public.yara_rules FOR SELECT
    USING (user_id = auth.uid() OR is_builtin = TRUE);
CREATE POLICY "Users can create rules" ON public.yara_rules FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own rules" ON public.yara_rules FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own rules" ON public.yara_rules FOR DELETE USING (auth.uid() = user_id);

-- Rule Matches
CREATE POLICY "Users can view rule matches" ON public.rule_matches FOR SELECT
    USING (finding_id IN (
        SELECT f.id FROM public.findings f
        JOIN public.scans s ON f.scan_id = s.id
        WHERE s.user_id = auth.uid()
    ));

-- API Keys
CREATE POLICY "Users can view/create own api keys" ON public.api_keys FOR ALL USING (auth.uid() = user_id);

-- Activity Logs
CREATE POLICY "Users can view own activity" ON public.activity_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create activity logs" ON public.activity_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User Sessions
CREATE POLICY "Users can view own sessions" ON public.user_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create sessions" ON public.user_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON public.user_sessions FOR UPDATE USING (auth.uid() = user_id);

-- Security Preferences
CREATE POLICY "Users can view own preferences" ON public.security_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can upsert own preferences" ON public.security_preferences FOR ALL USING (auth.uid() = user_id);

-- IP Whitelist
CREATE POLICY "Users can manage own whitelist" ON public.ip_whitelist FOR ALL USING (auth.uid() = user_id);

-- Audit Logs
CREATE POLICY "Users can view own audit logs" ON public.audit_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create audit logs" ON public.audit_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================
-- NOTIFICATION TABLES
-- =====================
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    email_threat_alerts BOOLEAN DEFAULT TRUE,
    email_scan_completions BOOLEAN DEFAULT TRUE,
    email_weekly_digest BOOLEAN DEFAULT FALSE,
    push_critical_alerts BOOLEAN DEFAULT TRUE,
    push_scan_updates BOOLEAN DEFAULT FALSE,
    push_subscription JSONB,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    channel TEXT NOT NULL DEFAULT 'in_app',
    title TEXT NOT NULL,
    message TEXT,
    metadata JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own notification prefs" ON public.notification_preferences FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create notifications" ON public.notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
