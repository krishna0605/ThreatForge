rule suspicious_entropy
{
    meta:
        author = "CyberThreatAI"
        description = "Detects files with suspicious entropy patterns"
        severity = "medium"
        category = "suspicious"

    condition:
        math.entropy(0, filesize) > 7.5
}

rule suspicious_double_extension
{
    meta:
        author = "CyberThreatAI"
        description = "Detects files with suspicious double extensions"
        severity = "low"
        category = "suspicious"

    strings:
        $ext1 = ".pdf.exe" ascii nocase
        $ext2 = ".doc.exe" ascii nocase
        $ext3 = ".jpg.exe" ascii nocase
        $ext4 = ".txt.scr" ascii nocase

    condition:
        any of them
}
