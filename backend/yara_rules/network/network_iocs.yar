rule network_c2_beacon
{
    meta:
        author = "ThreatForge"
        description = "Detects patterns commonly used in C2 beacon communication"
        severity = "critical"
        category = "network"

    strings:
        $s1 = "/beacon" ascii nocase
        $s2 = "/command" ascii nocase
        $s3 = "POST /gate.php" ascii nocase
        $s4 = "POST /panel" ascii nocase
        $s5 = "Mozilla/4.0 (compatible; MSIE 7.0;" ascii
        $s6 = "User-Agent: Mozilla/5.0" ascii
        $s7 = "/upload.php" ascii nocase
        $s8 = "X-Forwarded-For:" ascii

    condition:
        3 of them
}

rule network_suspicious_urls
{
    meta:
        author = "ThreatForge"
        description = "Detects suspicious URL patterns associated with malware"
        severity = "high"
        category = "network"

    strings:
        $url1 = "pastebin.com/raw" ascii nocase
        $url2 = "bit.ly/" ascii nocase
        $url3 = ".onion" ascii nocase
        $url4 = "raw.githubusercontent.com" ascii nocase
        $url5 = ".tk/" ascii nocase
        $url6 = ".xyz/" ascii nocase
        $base64_ip = /\b(?:[A-Za-z0-9+\/]{4}){2,}(?:={1,2})?\b/ ascii

    condition:
        2 of ($url*) or ($base64_ip and 1 of ($url*))
}

rule network_data_exfiltration
{
    meta:
        author = "ThreatForge"
        description = "Detects indicators of data exfiltration via DNS or HTTP"
        severity = "critical"
        category = "network"

    strings:
        $dns_tunnel = /[a-zA-Z0-9]{32,}\.(com|net|org|info)/ ascii
        $large_post = "Content-Length: " ascii
        $base64_data = /[A-Za-z0-9+\/]{100,}={0,2}/ ascii
        $ftp_upload = "STOR " ascii nocase
        $smtp_attach = "Content-Disposition: attachment" ascii

    condition:
        $dns_tunnel or ($large_post and $base64_data) or $ftp_upload or ($smtp_attach and $base64_data)
}
