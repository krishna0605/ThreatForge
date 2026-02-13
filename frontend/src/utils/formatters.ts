// Utility formatters for the frontend

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

/**
 * Format date to locale string
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format threat score to colored label
 */
export function getThreatLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'Critical', color: '#dc3545' };
  if (score >= 60) return { label: 'High', color: '#fd7e14' };
  if (score >= 40) return { label: 'Medium', color: '#ffc107' };
  if (score >= 20) return { label: 'Low', color: '#28a745' };
  return { label: 'Clean', color: '#17a2b8' };
}

/**
 * Truncate hash for display
 */
export function truncateHash(hash: string, length = 12): string {
  if (hash.length <= length) return hash;
  return hash.substring(0, length) + '...';
}
