import os
from flask_talisman import Talisman

def configure_security_headers(app):
    """
    Configure Flask-Talisman for security headers.
    
    Includes:
    - Content Security Policy (CSP)
    - HTTP Strict Transport Security (HSTS)
    - X-Content-Type-Options
    - X-Frame-Options
    - Referrer-Policy
    """
    
    # CSP Policy
    # Adjust as needed for external scripts/styles (e.g. Google Fonts, Analytics)
    csp = {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'"], # unsafe-inline often needed for some UI frameworks, ideally remove
        'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        'font-src': ["'self'", "https://fonts.gstatic.com"],
        'img-src': ["'self'", "data:", "https://*"], # Allow images from anywhere for now (avatars etc)
        'object-src': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
        'frame-ancestors': ["'none'"], 
        'upgrade-insecure-requests': [] 
    }

    # API might be consumed by a separate frontend (e.g. Next.js on localhost:3000)
    # If so, strict CSP on the API response itself might be less critical if it returns JSON,
    # but still good practice. 
    # However, Talisman forces HTTPS by default, which breaks localhost dev unless disabled.
    
    is_production = os.getenv('FLASK_ENV') == 'production' or os.getenv('ENVIRONMENT') == 'production'

    Talisman(
        app,
        content_security_policy=csp,
        content_security_policy_nonce_in=['script-src'],
        force_https=is_production, 
        strict_transport_security=is_production,
        session_cookie_secure=is_production,
        session_cookie_http_only=True,
        frame_options='DENY'
    )
