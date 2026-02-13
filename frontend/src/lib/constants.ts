// Application constants and configuration
export const APP_NAME = 'Cybersecurity Threat AI';
export const APP_DESCRIPTION = 'AI-Powered Threat Detection Platform';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/proxy';
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
export const ACCEPTED_FILE_TYPES = {
  'application/x-executable': ['.exe', '.dll'],
  'application/pdf': ['.pdf'],
  'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp'],
  'application/zip': ['.zip'],
  'application/vnd.tcpdump.pcap': ['.pcap'],
  'text/plain': ['.txt', '.py', '.js', '.ps1', '.bat', '.sh'],
};

export const THREAT_SEVERITY = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  INFO: 'info',
} as const;

export const SCAN_STATUS = {
  QUEUED: 'queued',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;
