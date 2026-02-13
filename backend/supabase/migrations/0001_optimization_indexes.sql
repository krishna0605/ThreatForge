-- ============================================
-- Cybersecurity Threat AI — Optimization Indexes
-- Migration ID: 0001_optimization_indexes
-- Description: Indexes for performance and filtering
-- ============================================

-- 1. Scan Filtering & Ordering
-- Needed for: "Get my recent completed scans"
CREATE INDEX IF NOT EXISTS idx_scans_user_status_created 
    ON public.scans(user_id, status, created_at DESC);

-- 2. Scan Files Lookup
-- Needed for: "Get files for this scan" (Join optimization)
CREATE INDEX IF NOT EXISTS idx_scan_files_scan_id 
    ON public.scan_files(scan_id);

-- 3. Findings & Reporting
-- Needed for: "Count findings by severity for this user's scans"
CREATE INDEX IF NOT EXISTS idx_findings_scan_severity 
    ON public.findings(scan_id, severity);

-- 4. Rule Matches
-- Needed for: "Show me all matches for this finding"
CREATE INDEX IF NOT EXISTS idx_rule_matches_finding_id 
    ON public.rule_matches(finding_id);

-- 5. Activity Log Feeds
-- Needed for: "Show activity timeline"
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_created 
    ON public.activity_logs(user_id, created_at DESC);

-- 6. Notifications
-- Needed for: "Get unread notifications"
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
    ON public.notifications(user_id, is_read) 
    WHERE is_read = FALSE;

-- 7. Audit Logs
-- Needed for: "Security audit history"
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created 
    ON public.audit_logs(user_id, created_at DESC);

-- 8. API Keys Lookup
-- Needed for: "Validate API Key hash"
CREATE INDEX IF NOT EXISTS idx_api_keys_hash 
    ON public.api_keys(key_hash);
