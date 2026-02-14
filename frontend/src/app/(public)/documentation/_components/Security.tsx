"use client";

import { DocSection } from "@/components/layout/DocSection";
import { DataTable } from "@/components/documentation/DataTable";
import { InfoCallout } from "@/components/documentation/InfoCallout";
import { FormulaBlock } from "@/components/documentation/FormulaBlock";
import { DiagramFrame } from "@/components/documentation/DiagramFrame";
import { CodeBlock } from "@/components/documentation/CodeBlock";
import Mermaid from "@/components/ui/Mermaid";

export const Security = () => {
  return (
    <DocSection id="security-architecture">
      <h2 className="font-display font-bold text-3xl text-text-main dark:text-white mb-2 flex items-center gap-3">
        <span className="material-icons text-red-500 text-3xl">security</span>
        Security Architecture
      </h2>
      <div className="h-1 w-20 bg-gradient-to-r from-red-500 to-orange-500 rounded-full mb-8" />

      {/* 6.1 Zero Trust */}
      <h3 className="font-display font-bold text-xl text-text-main dark:text-white mb-4 pl-4 border-l-4 border-red-500">
        Zero Trust Architecture (NIST 800-207)
      </h3>
      <InfoCallout type="danger" title="Fundamental Principle">
        <p><strong>&quot;Never trust, always verify.&quot;</strong> Every request is authenticated and authorized, regardless of network origin. No implicit trust based on network location or previous authentication.</p>
      </InfoCallout>

      <DataTable
        caption="Zero Trust Principles Applied"
        headers={["ZT Principle", "Implementation", "Verification Method"]}
        rows={[
          ["Verify Explicitly", "JWT on every request, re-validated", "HMAC-SHA256 signature check"],
          ["Least Privilege", "RBAC + Column-level RLS", "25+ PostgreSQL policies"],
          ["Assume Breach", "Rate limiting, audit logs, session mgmt", "SlowAPI + structlog + UUID sessions"],
          ["Micro-segmentation", "Service isolation via Docker networks", "Internal bridge, no exposed ports"],
          ["Continuous Validation", "Token expiry (15min), refresh rotation", "Sliding window + jti blacklist"],
        ]}
      />

      {/* 6.2 Argon2id */}
      <h3 className="font-display font-bold text-xl text-text-main dark:text-white mb-4 mt-10 pl-4 border-l-4 border-red-500">
        Argon2id — Password Hashing
      </h3>
      <div className="prose prose-lg dark:prose-invert text-text-muted dark:text-gray-300 mb-4">
        <p>
          <strong>Argon2id</strong> (RFC 9106, PHC winner, 2015) provides optimal defense against both GPU-based attacks (Argon2i&apos;s
          data-independent approach) and side-channel attacks (Argon2d&apos;s data-dependent approach) in a hybrid construction.
        </p>
      </div>

      <FormulaBlock
        label="Argon2id Parameterization"
        formula="Tag = Argon2id(P, S, t=3, m=65536, p=4, tag_len=32)"
        description="Where t = time cost (3 iterations), m = 64 MB memory, p = 4 parallel lanes. Designed so that each hash attempt requires 64MB of RAM."
      />

      <DataTable
        caption="Argon2id Parameters"
        headers={["Parameter", "Value", "Purpose", "Security Rationale"]}
        rows={[
          ["time_cost (t)", "3", "Iterations", "Higher → slower brute-force"],
          ["memory_cost (m)", "65536 KB", "Memory usage", "64MB per attempt defeats GPU"],
          ["parallelism (p)", "4", "CPU threads", "Utilizes multi-core"],
          ["hash_len", "32 bytes", "Output length", "256-bit hash"],
          ["type", "Argon2id", "Hybrid mode", "Combines i (side-channel safe) + d (GPU resistant)"],
        ]}
        highlightColumn={1}
      />

      <InfoCallout type="info" title="GPU Attack Resistance — Memory Hardness">
        <p>A GPU with 8GB VRAM can only run <strong>~125 parallel Argon2id</strong> hashes (8GB / 64MB). Compare to bcrypt at ~4KB per hash = ~2 million parallel attempts. This <strong>4 orders of magnitude</strong> difference is why Argon2id is the modern standard.</p>
      </InfoCallout>

      {/* 6.3 JWT */}
      <h3 className="font-display font-bold text-xl text-text-main dark:text-white mb-4 mt-10 pl-4 border-l-4 border-red-500">
        JWT Authentication — HMAC-SHA256
      </h3>
      <FormulaBlock
        label="HMAC Construction (RFC 2104)"
        formula="HMAC(K, m) = H((K' ⊕ opad) ‖ H((K' ⊕ ipad) ‖ m))"
        description="Two-pass hash: inner hash = H(K⊕ipad ‖ message), outer hash = H(K⊕opad ‖ inner_hash). This construction is proven to be a PRF (Pseudorandom Function) under standard assumptions."
      />

      <DataTable
        caption="JWT Token Configuration"
        headers={["Parameter", "Value", "Rationale"]}
        rows={[
          ["Algorithm", "HS256 (HMAC-SHA256)", "Symmetric, suitable for single-issuer"],
          ["Access Token Expiry", "15 minutes", "Limits window of stolen token use"],
          ["Refresh Token Expiry", "30 days", "Long-lived, stored in httpOnly cookie"],
          ["Claims", "sub, iat, exp, jti, type", "Standard claims + unique token ID"],
          ["Secret Key", "256-bit random (os.urandom)", "Cryptographically secure PRNG"],
        ]}
      />

      {/* 6.4 TOTP MFA */}
      <h3 className="font-display font-bold text-xl text-text-main dark:text-white mb-4 mt-10 pl-4 border-l-4 border-red-500">
        TOTP Multi-Factor Authentication
      </h3>
      <FormulaBlock
        label="TOTP Algorithm (RFC 6238)"
        formula="TOTP(K, T) = Truncate(HMAC-SHA1(K, ⌊T/X⌋)) mod 10^d"
        description="Where K = 20-byte secret, T = Unix timestamp, X = 30s period, d = 6 digits. valid_window = 1 accepts the previous and next code for clock skew tolerance."
      />

      <CodeBlock
        language="python"
        title="TOTP Verification"
        code={`import pyotp
# Verify TOTP code (valid_window=1 → ±30s tolerance)
totp = pyotp.TOTP(user.mfa_secret)
is_valid = totp.verify(code, valid_window=1)
# valid_window=1 means codes from time step T-1, T, or T+1 are accepted`}
      />

      {/* 6.5 Full Auth Flow Diagram */}
      <DiagramFrame title="Complete Authentication Flow">
        <Mermaid chart={`
sequenceDiagram
    participant Client
    participant API
    participant DB
    participant TOTP
    Client->>API: POST /login {email, password}
    API->>DB: SELECT * FROM profiles WHERE email=?
    API->>API: Argon2id.verify(stored_hash, password)
    alt Password Invalid
        API-->>Client: 401 Unauthorized
    else Password Valid + MFA Disabled
        API->>API: Sign JWT (HS256, exp=15min)
        API->>DB: INSERT INTO user_sessions {jti, browser, ip}
        API-->>Client: {access_token, refresh_token}
    else Password Valid + MFA Enabled
        API->>API: Generate temp_token (5min TTL)
        API-->>Client: {mfa_required: true, temp_token}
        Client->>Client: User enters 6-digit TOTP code
        Client->>API: POST /auth/mfa/verify-login {temp_token, totp_code}
        API->>API: Decode temp_token, extract user_id
        API->>DB: SELECT mfa_secret FROM profiles WHERE id=?
        API->>TOTP: pyotp.TOTP(secret).verify(code, valid_window=1)
        alt TOTP Valid
            API->>API: Sign JWT (HS256, exp=15min)
            API->>DB: INSERT INTO user_sessions
            API-->>Client: {access_token, refresh_token}
        else TOTP Invalid
            API-->>Client: 401 Invalid TOTP Code
        end
    end
        `} />
      </DiagramFrame>

      {/* 6.6 Security Headers */}
      <h3 className="font-display font-bold text-xl text-text-main dark:text-white mb-4 mt-10 pl-4 border-l-4 border-red-500">
        Defense-in-Depth Headers
      </h3>
      <DataTable
        caption="HTTP Security Headers (Flask-Talisman)"
        headers={["Header", "Value", "Protection Against"]}
        rows={[
          ["Strict-Transport-Security", "max-age=63072000; includeSubDomains", "Protocol downgrade attacks"],
          ["Content-Security-Policy", "default-src 'self'", "XSS, injection attacks"],
          ["X-Content-Type-Options", "nosniff", "MIME type sniffing"],
          ["X-Frame-Options", "DENY", "Clickjacking"],
          ["Referrer-Policy", "strict-origin-when-cross-origin", "Information leakage"],
        ]}
      />
    </DocSection>
  );
};
