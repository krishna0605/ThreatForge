rule known_packer_upx
{
    meta:
        author = "CyberThreatAI"
        description = "Detects UPX packed executables"
        severity = "medium"
        category = "packer"

    strings:
        $upx0 = "UPX0" ascii
        $upx1 = "UPX1" ascii
        $upx2 = "UPX!" ascii

    condition:
        uint16(0) == 0x5A4D and 2 of them
}
