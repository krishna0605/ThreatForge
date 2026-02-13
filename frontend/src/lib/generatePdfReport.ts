import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ── Types ──────────────────────────────────────────────
interface Finding {
  id: string; finding_type: string; severity: string; title: string;
  description: string; confidence: number; remediation: string;
  details?: Record<string, any>;
  rule_matches?: { rule_name: string; matched_strings: any[] }[];
}

interface ScanDetail {
  id: string; status: string; scan_type: string; total_files: number;
  threats_found: number; duration_seconds: number;
  created_at: string; completed_at: string;
  options?: Record<string, any>;
  files: { filename: string; file_hash_sha256: string; mime_type: string; file_size: number; entropy: number }[];
  findings: Finding[];
}

// ── Colors ─────────────────────────────────────────────
const COLORS = {
  primary: [34, 197, 94] as [number, number, number],       // #22c55e
  darkBg: [26, 26, 46] as [number, number, number],         // #1a1a2e
  headerBg: [15, 23, 42] as [number, number, number],       // #0f172a
  accent: [52, 211, 153] as [number, number, number],       // #34d399
  red: [239, 68, 68] as [number, number, number],
  yellow: [245, 158, 11] as [number, number, number],
  blue: [59, 130, 246] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  lightGray: [241, 245, 249] as [number, number, number],
  textDark: [30, 41, 59] as [number, number, number],
  textMuted: [100, 116, 139] as [number, number, number],
  border: [226, 232, 240] as [number, number, number],
};

function getThreatInfo(score: number) {
  if (score >= 67) return { label: 'HIGH', levelText: 'MALICIOUS', color: COLORS.red };
  if (score >= 34) return { label: 'MEDIUM', levelText: 'SUSPICIOUS', color: COLORS.yellow };
  return { label: 'LOW', levelText: 'CLEAN', color: COLORS.primary };
}

function severityColor(s: string): [number, number, number] {
  switch (s) {
    case 'critical': case 'high': return COLORS.red;
    case 'medium': return COLORS.yellow;
    case 'low': return COLORS.primary;
    default: return COLORS.blue;
  }
}

// ── Watermark ──────────────────────────────────────────
function addWatermark(doc: jsPDF) {
  doc.saveGraphicsState();
  doc.setTextColor(220, 220, 220);
  doc.setFontSize(50);
  doc.setFont('helvetica', 'bold');
  // @ts-ignore
  doc.setGState(new doc.GState({ opacity: 0.06 }));
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  doc.text('THREATFORGE', pageW / 2, pageH / 2, {
    align: 'center',
    angle: 35,
  });
  doc.restoreGraphicsState();
}

// ── Footer ─────────────────────────────────────────────
function addFooter(doc: jsPDF, pageNum: number, totalPages: number, dateStr: string) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  // Footer line
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  doc.line(20, pageH - 18, pageW - 20, pageH - 18);
  // Footer text
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.textMuted);
  doc.text('ThreatForge | AI-Powered Threat Detection', 20, pageH - 13);
  doc.text('CONFIDENTIAL', pageW / 2, pageH - 13, { align: 'center' });
  doc.text(`Page ${pageNum} of ${totalPages} | Generated: ${dateStr}`, pageW - 20, pageH - 13, { align: 'right' });
}

// ── Section Header ─────────────────────────────────────
function sectionHeader(doc: jsPDF, y: number, title: string): number {
  const pageW = doc.internal.pageSize.getWidth();
  // Green accent bar
  doc.setFillColor(...COLORS.primary);
  doc.rect(20, y, 3, 10, 'F');
  // Background
  doc.setFillColor(...COLORS.headerBg);
  doc.rect(23, y, pageW - 43, 10, 'F');
  // Text
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`  >> ${title.toUpperCase()}`, 25, y + 7);
  doc.setTextColor(...COLORS.textDark);
  return y + 15;
}

// ── Check page break ──────────────────────────────────
function checkPageBreak(doc: jsPDF, y: number, needed: number): number {
  const pageH = doc.internal.pageSize.getHeight();
  if (y + needed > pageH - 30) {
    doc.addPage();
    return 30;
  }
  return y;
}

// ══════════════════════════════════════════════════════
//  MAIN EXPORT FUNCTION
// ══════════════════════════════════════════════════════
export function generatePdfReport(scan: ScanDetail) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const file = scan.files?.[0];
  const opts = scan.options || {};
  const dateStr = new Date(scan.created_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  const shortDate = new Date(scan.created_at).toLocaleDateString('en-US');

  // Compute threat score
  const severityWeights: Record<string, number> = { critical: 30, high: 20, medium: 10, low: 5, info: 1 };
  const threatScore = Math.min(100, scan.findings.reduce((sum, f) => sum + (severityWeights[f.severity] || 5), 0));
  const threat = getThreatInfo(threatScore);

  // Categorize findings
  const mlFindings = scan.findings.filter(f => f.finding_type === 'malware');
  const yaraFindings = scan.findings.filter(f => f.finding_type === 'yara');
  const entropyFindings = scan.findings.filter(f => f.finding_type === 'entropy' && !f.details?.strings);
  const peFindings = scan.findings.filter(f => f.finding_type === 'pe_header');
  const stegoFindings = scan.findings.filter(f => f.finding_type === 'steganography');
  const networkFindings = scan.findings.filter(f => f.finding_type === 'network');
  const strFinding = scan.findings.find(f => f.details?.strings);

  // ┌─────────────────────────────────────────────────
  // │ PAGE 1 — COVER PAGE
  // └─────────────────────────────────────────────────
  // Dark background
  doc.setFillColor(...COLORS.darkBg);
  doc.rect(0, 0, pageW, pageH, 'F');

  // Top accent stripe
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageW, 4, 'F');

  // Logo area — draw a shield shape instead of emoji
  doc.setFillColor(...COLORS.primary);
  doc.triangle(30, 33, 38, 33, 34, 44, 'F');
  doc.triangle(30, 33, 34, 44, 34, 33, 'F');
  doc.rect(30, 33, 8, 6, 'F');
  doc.setTextColor(...COLORS.primary);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('THREATFORGE', 44, 40);
  doc.setTextColor(150, 160, 180);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('AI-Powered Threat Detection Platform', 44, 48);

  // Divider
  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.8);
  doc.line(30, 60, pageW - 30, 60);

  // Title
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('THREAT ANALYSIS', 30, 85);
  doc.text('REPORT', 30, 98);

  // Threat classification badge
  const badgeY = 115;
  doc.setFillColor(...threat.color);
  doc.roundedRect(30, badgeY, 60, 12, 2, 2, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`${threat.label} — ${threat.levelText}`, 60, badgeY + 8, { align: 'center' });

  // Score
  doc.setTextColor(150, 160, 180);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Threat Score: ${threatScore}/100`, 95, badgeY + 8);

  // File info block
  const infoY = 145;
  doc.setFillColor(30, 35, 55);
  doc.roundedRect(30, infoY, pageW - 60, 70, 3, 3, 'F');

  const infoItems = [
    { label: 'File Name', value: file?.filename || 'Unknown' },
    { label: 'File Size', value: file ? `${(file.file_size / (1024 * 1024)).toFixed(2)} MB` : 'N/A' },
    { label: 'File Type', value: file?.mime_type || 'Unknown' },
    { label: 'Scan ID', value: scan.id.slice(0, 16).toUpperCase() },
    { label: 'Date', value: dateStr },
    { label: 'Status', value: `${scan.status.toUpperCase()} in ${scan.duration_seconds}s` },
  ];

  infoItems.forEach((item, i) => {
    const row = Math.floor(i / 2);
    const col = i % 2;
    const x = 40 + col * 75;
    const y = infoY + 12 + row * 18;
    doc.setTextColor(120, 130, 150);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(item.label.toUpperCase(), x, y);
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(item.value, x, y + 7);
  });

  // SHA-256
  if (file?.file_hash_sha256) {
    doc.setTextColor(120, 130, 150);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(`SHA-256: ${file.file_hash_sha256}`, 30, infoY + 80);
  }

  // Bottom "CONFIDENTIAL"
  doc.setTextColor(80, 90, 110);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('CONFIDENTIAL - FOR AUTHORIZED PERSONNEL ONLY', pageW / 2, pageH - 30, { align: 'center' });

  // Bottom accent stripe
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, pageH - 4, pageW, 4, 'F');

  // ┌─────────────────────────────────────────────────
  // │ PAGE 2 — EXECUTIVE SUMMARY
  // └─────────────────────────────────────────────────
  doc.addPage();
  let y = 25;

  y = sectionHeader(doc, y, 'Executive Summary');

  // Threat Score bar
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.textDark);
  doc.text(`Threat Score: ${threatScore}/100 - ${threat.levelText}`, 25, y + 5);

  // Score bar background
  doc.setFillColor(...COLORS.lightGray);
  doc.roundedRect(25, y + 8, pageW - 50, 6, 1, 1, 'F');
  // Score bar fill
  doc.setFillColor(...threat.color);
  const barWidth = Math.max(2, ((pageW - 50) * threatScore) / 100);
  doc.roundedRect(25, y + 8, barWidth, 6, 1, 1, 'F');
  y += 22;

  // Scan Configuration table
  y = sectionHeader(doc, y, 'Scan Configuration');
  autoTable(doc, {
    startY: y,
    margin: { left: 25, right: 25 },
    head: [['Module', 'Status']],
    body: [
      ['ML Detection', opts.enable_ml !== false ? '[ON] ENABLED' : '[OFF] DISABLED'],
      ['YARA Matching', opts.enable_yara !== false ? '[ON] ENABLED' : '[OFF] DISABLED'],
      ['Entropy Analysis', opts.enable_entropy !== false ? '[ON] ENABLED' : '[OFF] DISABLED'],
      ['PE Inspection', opts.enable_pe !== false ? '[ON] ENABLED' : '[OFF] DISABLED'],
      ['Steganography', opts.enable_stego ? '[ON] ENABLED' : '[OFF] DISABLED'],
      ['Network/PCAP', opts.enable_pcap ? '[ON] ENABLED' : '[OFF] DISABLED'],
    ],
    theme: 'grid',
    headStyles: { fillColor: COLORS.headerBg, textColor: COLORS.white, fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8, textColor: COLORS.textDark },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 0: { cellWidth: 60 } },
  });
  y = (doc as any).lastAutoTable.finalY + 10;

  // Findings Summary table
  y = checkPageBreak(doc, y, 60);
  y = sectionHeader(doc, y, 'Findings Summary');
  autoTable(doc, {
    startY: y,
    margin: { left: 25, right: 25 },
    head: [['Category', 'Count', 'Status']],
    body: [
      ['ML Predictions', String(mlFindings.length), mlFindings.length > 0 ? '[!] DETECTED' : '[OK] CLEAN'],
      ['YARA Matches', String(yaraFindings.length), yaraFindings.length > 0 ? '[!] MATCHED' : '[OK] CLEAN'],
      ['Entropy Anomalies', String(entropyFindings.length), entropyFindings.length > 0 ? '[!] FLAGGED' : '[OK] NORMAL'],
      ['PE Header Issues', String(peFindings.length), peFindings.length > 0 ? '[!] DETECTED' : '[OK] CLEAN'],
      ['Steganography', String(stegoFindings.length), stegoFindings.length > 0 ? '[!] DETECTED' : '[OK] CLEAN'],
      ['Network Anomalies', String(networkFindings.length), networkFindings.length > 0 ? '[!] DETECTED' : '[OK] CLEAN'],
    ],
    theme: 'grid',
    headStyles: { fillColor: COLORS.headerBg, textColor: COLORS.white, fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8, textColor: COLORS.textDark },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    didParseCell: (data: any) => {
      if (data.column.index === 2 && data.section === 'body') {
        const text = data.cell.raw as string;
        if (text.startsWith('[!]')) {
          data.cell.styles.textColor = COLORS.red;
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [22, 163, 74];
        }
      }
    },
  });
  y = (doc as any).lastAutoTable.finalY + 10;

  // Remediation
  const highFindings = scan.findings.filter(f => f.severity === 'critical' || f.severity === 'high');
  if (highFindings.length > 0) {
    y = checkPageBreak(doc, y, 40);
    y = sectionHeader(doc, y, 'Remediation Required');
    doc.setFillColor(254, 242, 242);
    doc.roundedRect(25, y, pageW - 50, 35, 2, 2, 'F');
    doc.setDrawColor(...COLORS.red);
    doc.setLineWidth(0.5);
    doc.roundedRect(25, y, pageW - 50, 35, 2, 2, 'S');
    doc.setTextColor(...COLORS.red);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('This file is highly suspicious. Recommended actions:', 30, y + 8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(127, 29, 29);
    const actions = [
      '1. Do NOT execute this file on any production system.',
      '2. Quarantine immediately to prevent lateral movement.',
      '3. Submit hash to VirusTotal for secondary confirmation.',
      '4. Check system logs for related indicators of compromise (IOCs).',
    ];
    actions.forEach((a, i) => doc.text(a, 33, y + 15 + i * 5));
    y += 42;
  }

  // ┌─────────────────────────────────────────────────
  // │ PAGE 3 — FILE ANALYSIS
  // └─────────────────────────────────────────────────
  doc.addPage();
  y = 25;
  y = sectionHeader(doc, y, 'File Analysis');

  if (file) {
    // File Metadata
    autoTable(doc, {
      startY: y,
      margin: { left: 25, right: 25 },
      head: [['Property', 'Value']],
      body: [
        ['File Name', file.filename],
        ['File Size', `${(file.file_size / (1024 * 1024)).toFixed(2)} MB (${file.file_size.toLocaleString()} bytes)`],
        ['MIME Type', file.mime_type || 'Unknown'],
        ['SHA-256', file.file_hash_sha256 || 'N/A'],
        ['Entropy', `${file.entropy?.toFixed(4) || 'N/A'} / 8.0`],
        ['Entropy Status', (file.entropy || 0) > 7 ? '[!] HIGH - Likely packed/encrypted' : (file.entropy || 0) > 6 ? 'MODERATE' : 'NORMAL'],
      ],
      theme: 'grid',
      headStyles: { fillColor: COLORS.headerBg, textColor: COLORS.white, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8, textColor: COLORS.textDark },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: { 0: { cellWidth: 35, fontStyle: 'bold' } },
      didParseCell: (data: any) => {
        if (data.column.index === 1 && data.row.index === 5 && data.section === 'body') {
          const text = data.cell.raw as string;
          if (text.startsWith('[!]')) {
            data.cell.styles.textColor = COLORS.red;
            data.cell.styles.fontStyle = 'bold';
          }
        }
      },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // Entropy findings
  if (entropyFindings.length > 0) {
    y = checkPageBreak(doc, y, 30);
    y = sectionHeader(doc, y, 'Entropy Findings');
    autoTable(doc, {
      startY: y,
      margin: { left: 25, right: 25 },
      head: [['Severity', 'Finding', 'Description']],
      body: entropyFindings.map(f => [f.severity.toUpperCase(), f.title, f.description || '']),
      theme: 'grid',
      headStyles: { fillColor: COLORS.headerBg, textColor: COLORS.white, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7, textColor: COLORS.textDark },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: { 0: { cellWidth: 20 }, 1: { cellWidth: 50 } },
      didParseCell: (data: any) => {
        if (data.column.index === 0 && data.section === 'body') {
          const sev = (data.cell.raw as string).toLowerCase();
          data.cell.styles.textColor = severityColor(sev);
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // PE Header findings
  if (peFindings.length > 0) {
    y = checkPageBreak(doc, y, 30);
    y = sectionHeader(doc, y, 'PE Header Findings');
    autoTable(doc, {
      startY: y,
      margin: { left: 25, right: 25 },
      head: [['Severity', 'Finding', 'Description']],
      body: peFindings.map(f => {
        let desc = f.description || '';
        if (f.details?.suspicious_apis) {
          desc += `\nAPIs: ${(f.details.suspicious_apis as string[]).join(', ')}`;
        }
        return [f.severity.toUpperCase(), f.title, desc];
      }),
      theme: 'grid',
      headStyles: { fillColor: COLORS.headerBg, textColor: COLORS.white, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7, textColor: COLORS.textDark },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: { 0: { cellWidth: 20 }, 1: { cellWidth: 50 } },
      didParseCell: (data: any) => {
        if (data.column.index === 0 && data.section === 'body') {
          const sev = (data.cell.raw as string).toLowerCase();
          data.cell.styles.textColor = severityColor(sev);
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // ┌─────────────────────────────────────────────────
  // │ PAGE 4 — DETECTION RESULTS
  // └─────────────────────────────────────────────────
  doc.addPage();
  y = 25;
  y = sectionHeader(doc, y, 'Detection Results');

  // ML Predictions
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.textDark);
  doc.text('ML Predictions', 25, y + 5);
  y += 8;
  if (mlFindings.length > 0) {
    autoTable(doc, {
      startY: y,
      margin: { left: 25, right: 25 },
      head: [['Severity', 'Finding', 'Confidence', 'Description']],
      body: mlFindings.map(f => [
        f.severity.toUpperCase(),
        f.title,
        f.confidence != null ? `${(f.confidence * 100).toFixed(1)}%` : 'N/A',
        f.description || '',
      ]),
      theme: 'grid',
      headStyles: { fillColor: COLORS.headerBg, textColor: COLORS.white, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7, textColor: COLORS.textDark },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: { 0: { cellWidth: 20 }, 2: { cellWidth: 22 } },
      didParseCell: (data: any) => {
        if (data.column.index === 0 && data.section === 'body') {
          data.cell.styles.textColor = severityColor((data.cell.raw as string).toLowerCase());
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  } else {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(22, 163, 74);
    doc.text('[OK] No ML-based threats detected', 30, y + 3);
    y += 12;
  }

  // YARA Matches
  y = checkPageBreak(doc, y, 30);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.textDark);
  doc.text(`YARA Matches (${yaraFindings.length})`, 25, y + 5);
  y += 8;
  if (yaraFindings.length > 0) {
    autoTable(doc, {
      startY: y,
      margin: { left: 25, right: 25 },
      head: [['Severity', 'Rule', 'Description']],
      body: yaraFindings.map(f => [f.severity.toUpperCase(), f.title, f.description || '']),
      theme: 'grid',
      headStyles: { fillColor: COLORS.headerBg, textColor: COLORS.white, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7, textColor: COLORS.textDark },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: { 0: { cellWidth: 20 } },
      didParseCell: (data: any) => {
        if (data.column.index === 0 && data.section === 'body') {
          data.cell.styles.textColor = severityColor((data.cell.raw as string).toLowerCase());
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  } else {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(22, 163, 74);
    doc.text('[OK] No YARA rule matches found', 30, y + 3);
    y += 12;
  }

  // Steganography
  y = checkPageBreak(doc, y, 30);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.textDark);
  doc.text('Steganography Analysis', 25, y + 5);
  y += 8;
  if (stegoFindings.length > 0) {
    autoTable(doc, {
      startY: y,
      margin: { left: 25, right: 25 },
      head: [['Severity', 'Finding', 'Description']],
      body: stegoFindings.map(f => [f.severity.toUpperCase(), f.title, f.description || '']),
      theme: 'grid',
      headStyles: { fillColor: COLORS.headerBg, textColor: COLORS.white, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7, textColor: COLORS.textDark },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: { 0: { cellWidth: 20 } },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  } else {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(22, 163, 74);
    doc.text(file?.mime_type?.startsWith('image') ? '[OK] No hidden data detected' : '[OK] Steganography analysis skipped (non-image file)', 30, y + 3);
    y += 12;
  }

  // Network
  y = checkPageBreak(doc, y, 30);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.textDark);
  doc.text('Network Traffic Analysis', 25, y + 5);
  y += 8;
  if (networkFindings.length > 0) {
    autoTable(doc, {
      startY: y,
      margin: { left: 25, right: 25 },
      head: [['Severity', 'Finding', 'Description']],
      body: networkFindings.map(f => {
        let desc = f.description || '';
        if (f.details?.suspicious_dns) desc += `\nDNS: ${(f.details.suspicious_dns as string[]).join(', ')}`;
        if (f.details?.iocs_found) desc += `\nIOCs: ${(f.details.iocs_found as string[]).join(', ')}`;
        return [f.severity.toUpperCase(), f.title, desc];
      }),
      theme: 'grid',
      headStyles: { fillColor: COLORS.headerBg, textColor: COLORS.white, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7, textColor: COLORS.textDark },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: { 0: { cellWidth: 20 } },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  } else {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(22, 163, 74);
    doc.text(file?.filename?.match(/\.(pcap|pcapng|cap)$/i) ? '[OK] No network anomalies detected' : '[OK] Network analysis skipped (non-PCAP file)', 30, y + 3);
    y += 12;
  }

  // ┌─────────────────────────────────────────────────
  // │ PAGE 5 — STRING ANALYSIS
  // └─────────────────────────────────────────────────
  if (strFinding?.details?.strings) {
    doc.addPage();
    y = 25;
    y = sectionHeader(doc, y, 'String Analysis');

    const strData = strFinding.details.strings;

    // Stats row
    const stats = [
      { label: 'Total Strings', value: String(strData.total_strings || 0) },
      { label: 'Suspicious', value: String((strData.suspicious_strings || []).length) },
      { label: 'URLs', value: String((strData.urls || []).length) },
      { label: 'IPs', value: String((strData.ips || []).length) },
      { label: 'Emails', value: String((strData.emails || []).length) },
      { label: 'Registry Keys', value: String((strData.registry_keys || []).length) },
    ];
    autoTable(doc, {
      startY: y,
      margin: { left: 25, right: 25 },
      head: [stats.map(s => s.label)],
      body: [stats.map(s => s.value)],
      theme: 'grid',
      headStyles: { fillColor: COLORS.headerBg, textColor: COLORS.white, fontSize: 7, fontStyle: 'bold', halign: 'center' },
      bodyStyles: { fontSize: 9, textColor: COLORS.textDark, fontStyle: 'bold', halign: 'center' },
    });
    y = (doc as any).lastAutoTable.finalY + 10;

    // URLs
    if ((strData.urls || []).length > 0) {
      y = checkPageBreak(doc, y, 20);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.textDark);
      doc.text('URLs Found:', 25, y + 3);
      y += 6;
      autoTable(doc, {
        startY: y,
        margin: { left: 25, right: 25 },
        head: [['#', 'URL']],
        body: strData.urls.slice(0, 30).map((u: string, i: number) => [String(i + 1), u]),
        theme: 'grid',
        headStyles: { fillColor: COLORS.headerBg, textColor: COLORS.white, fontSize: 7, fontStyle: 'bold' },
        bodyStyles: { fontSize: 6, textColor: COLORS.textDark },
        columnStyles: { 0: { cellWidth: 10, halign: 'center' } },
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    }

    // IPs
    if ((strData.ips || []).length > 0) {
      y = checkPageBreak(doc, y, 20);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.textDark);
      doc.text('IP Addresses:', 25, y + 3);
      y += 6;
      autoTable(doc, {
        startY: y,
        margin: { left: 25, right: 25 },
        head: [['#', 'IP Address']],
        body: strData.ips.slice(0, 30).map((ip: string, i: number) => [String(i + 1), ip]),
        theme: 'grid',
        headStyles: { fillColor: COLORS.headerBg, textColor: COLORS.white, fontSize: 7, fontStyle: 'bold' },
        bodyStyles: { fontSize: 7, textColor: COLORS.textDark },
        columnStyles: { 0: { cellWidth: 10, halign: 'center' } },
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    }

    // Suspicious Strings (top 50)
    if ((strData.suspicious_strings || []).length > 0) {
      y = checkPageBreak(doc, y, 20);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.textDark);
      doc.text('Suspicious Strings:', 25, y + 3);
      y += 6;
      autoTable(doc, {
        startY: y,
        margin: { left: 25, right: 25 },
        head: [['#', 'String']],
        body: strData.suspicious_strings.slice(0, 50).map((s: string, i: number) => [String(i + 1), s.slice(0, 120)]),
        theme: 'grid',
        headStyles: { fillColor: COLORS.headerBg, textColor: COLORS.white, fontSize: 7, fontStyle: 'bold' },
        bodyStyles: { fontSize: 5.5, textColor: COLORS.textDark, font: 'courier' },
        columnStyles: { 0: { cellWidth: 10, halign: 'center', font: 'helvetica' } },
      });
    }
  }

  // ┌─────────────────────────────────────────────────
  // │ POST-PROCESSING — Watermarks + Footers
  // └─────────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let i = 2; i <= totalPages; i++) {
    doc.setPage(i);
    addWatermark(doc);
    addFooter(doc, i - 1, totalPages - 1, shortDate);
  }

  // ── Save ─────────────────────────────────────────
  const filename = `ThreatForge_Report_${file?.filename || 'scan'}_${scan.id.slice(0, 8)}.pdf`;
  doc.save(filename);
}
