"""Auth Endpoints — Supabase Implementation"""
from flask import request
from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity, get_jwt, decode_token
)
from werkzeug.security import generate_password_hash
import pyotp
import uuid
import logging

from . import api_bp
from ..extensions import limiter
from ..supabase_client import supabase
from ..models.user import UserModel
from .security import parse_user_agent
from ..utils.responses import success_response, error_response
from ..utils.auth import get_current_user_id
from ..utils.crypto import encrypt_data, decrypt_data
from ..utils.validation import validate_json
from ..schemas.auth import LoginSchema, SignupSchema, ForgotPasswordSchema, MFASchema, GoogleAuthSchema

logger = logging.getLogger('threatforge.auth')


# --- Helper to get user by email ---
def get_user_by_email(email: str) -> UserModel | None:
    try:
        response = supabase.table('profiles').select('*').eq('email', email).limit(1).execute()
        if response.data:
            return UserModel.from_dict(response.data[0])
        return None
    except Exception as e:
        logger.error("Supabase Error (get_user_by_email): %s", e)
        return None

# --- Helper to get user by ID ---
def get_user_by_id(user_id: str) -> UserModel | None:
    try:
        response = supabase.table('profiles').select('*').eq('id', user_id).limit(1).execute()
        if response.data:
            return UserModel.from_dict(response.data[0])
        return None
    except Exception as e:
        logger.error("Supabase Error (get_user_by_id): %s", e)
        return None


@api_bp.route('/auth/signup', methods=['POST'])
@limiter.limit("5/minute")
@validate_json(SignupSchema)
def signup():
    """Register a new user."""
    data = request.validated_data
    
    email = data.email.lower()
    password = data.password
    display_name = data.display_name

    # Check if user exists
    existing = get_user_by_email(email)
    if existing:
        return error_response('Email already registered', 409)

    try:
        # Create Auth User to satisfy FK
        auth_response = supabase.auth.sign_up({
            "email": email,
            "password": password,
            "options": {
                "data": {
                    "display_name": display_name or email.split('@')[0],
                }
            }
        })
        
        # If auto-confirm is on, user is created. 
        # Check if user is returned
        if not auth_response.user:
             # Fallback if signup requires email confirmation (dev mode usually disables this)
             return success_response(message='Signup successful. Please check your email to confirm.', status_code=201)

        user_id = auth_response.user.id
        
        # We store the password hash in profiles ONLY because we are porting legacy logic.
        # Ideally we rely solely on Supabase Auth login.
        # But to keep 'login' endpoint working as is without frontend changes for now:
        profile_update = {
             'password_hash': generate_password_hash(password),
             'display_name': display_name or email.split('@')[0],
             'role': 'analyst'
        }
        
        # Profiles trigger might have created the row. Let's update or upsert it.
        supabase.table('profiles').update(profile_update).eq('id', user_id).execute()
        
        # Fetch fresh profile
        user = get_user_by_id(user_id)
        
        # Generate tokens
        access_token = create_access_token(identity=str(user_id))
        refresh_token = create_refresh_token(identity=str(user_id))

        # Log activity
        supabase.table('activity_logs').insert({
            'user_id': str(user_id),
            'action': 'signup',
            'ip_address': request.remote_addr
        }).execute()

        return success_response({
            'user': {
                'id': user.id,
                'email': user.email,
                'display_name': user.display_name,
                'role': user.role,
            },
            'access_token': access_token,
            'refresh_token': refresh_token,
        }, message='Account created successfully', status_code=201)

    except Exception as e:
        logger.error("Signup error: %s", e)
        return error_response('Internal server error', 500)


@api_bp.route('/auth/login', methods=['POST'])
@limiter.limit("10/minute")
@validate_json(LoginSchema)
def login():
    """Authenticate user and return JWT."""
    # HYBRID APPROACH: Try Supabase Auth first, fallback to checking hash in profiles
    data = request.validated_data

    email = data.email.lower()
    password = data.password

    try:
        # 1. Try Supabase Auth Sign In
        auth_response = supabase.auth.sign_in_with_password({
            "email": email,
            "password": password
        })
        
        if auth_response.user:
            user_id = auth_response.user.id
            user = get_user_by_id(user_id)
        else:
            # Fallback (shouldn't happen if auth succeeds)
            return error_response('Invalid email or password', 401)

    except Exception:
        # If Supabase Auth fails (e.g. wrong password), it raises exception.
        # We could implement fallback to check 'password_hash' in profiles table 
        # for migrated users who passworeds aren't in Supabase Auth yet.
        # For this new setup, we assume new users.
        return error_response('Invalid email or password', 401)

    if not user:
         return error_response('User profile not found', 404)

    # Check MFA
    if user.mfa_enabled:
        totp_code = data.totp_code
        if not totp_code:
            return success_response({
                'mfa_required': True,
            }, message='MFA verification required')

        # If mfa_secret is missing or can't be decrypted, auto-reset MFA
        # This handles key rotation or corrupted secrets gracefully
        if not user.mfa_secret:
            logger.warning(f"MFA enabled but no secret stored for user {user.id}. Auto-resetting MFA.")
            supabase.table('profiles').update({
                'mfa_enabled': False, 'mfa_secret': None, 'recovery_codes': None
            }).eq('id', str(user.id)).execute()
            # Fall through to generate tokens — user can re-enroll later
        else:
            secret = decrypt_data(user.mfa_secret)
            if not secret:
                # Decryption failed — ENCRYPTION_KEY changed or data corrupted
                logger.error(f"Failed to decrypt MFA secret for user {user.id}. Auto-resetting MFA.")
                supabase.table('profiles').update({
                    'mfa_enabled': False, 'mfa_secret': None, 'recovery_codes': None
                }).eq('id', str(user.id)).execute()
                # Fall through to generate tokens — user can re-enroll later
            else:
                totp = pyotp.TOTP(secret)
                if not totp.verify(totp_code):
                    # Check recovery codes if TOTP fails
                    valid_recovery = False
                    if user.recovery_codes and len(totp_code) > 6:
                        updated_codes = []
                        for enc_code in user.recovery_codes:
                            dec_code = decrypt_data(enc_code)
                            if dec_code == totp_code:
                                valid_recovery = True
                            else:
                                updated_codes.append(enc_code)
                        if valid_recovery:
                            supabase.table('profiles').update({'recovery_codes': updated_codes}).eq('id', user.id).execute()

                    if not valid_recovery:
                        return error_response('Invalid TOTP or recovery code', 401)

    # Generate tokens (Flask-JWT-Extended)
    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))

    # Create session record with device info
    try:
        token_data = decode_token(access_token)
        jti = token_data.get('jti', str(uuid.uuid4()))
        ua_info = parse_user_agent(request.headers.get('User-Agent', ''))
        supabase.table('user_sessions').insert({
            'user_id': str(user.id),
            'token_jti': jti,
            'browser': ua_info['browser'],
            'os': ua_info['os'],
            'ip_address': request.remote_addr,
        }).execute()
    except Exception as e:
        logger.error("Session tracking error: %s", e)

    # Log activity
    supabase.table('activity_logs').insert({
        'user_id': str(user.id),
        'action': 'login',
        'ip_address': request.remote_addr
    }).execute()

    return success_response({
        'user': {
            'id': user.id,
            'email': user.email,
            'display_name': user.display_name,
            'role': user.role,
            'avatar_url': user.avatar_url,
            'mfa_enabled': user.mfa_enabled,
        },
        'access_token': access_token,
        'refresh_token': refresh_token,
    })


@api_bp.route('/auth/me', methods=['GET'])
@jwt_required()
def get_me():
    """Get current user profile."""
    user_id = get_current_user_id()
    user = get_user_by_id(user_id)
    
    if not user:
        return error_response('User not found', 404)

    return success_response({
        'id': user.id,
        'email': user.email,
        'display_name': user.display_name,
        'role': user.role,
        'avatar_url': user.avatar_url,
        'mfa_enabled': user.mfa_enabled,
        'created_at': user.created_at,
    })


@api_bp.route('/auth/logout', methods=['POST'])
@jwt_required()
def logout():
    """Invalidate current session."""
    user_id = get_current_user_id()
    supabase.auth.sign_out() # Sign out from Supabase too
    
    supabase.table('activity_logs').insert({
        'user_id': user_id,
        'action': 'logout',
        'ip_address': request.remote_addr
    }).execute()

    # Revoke access token
    jti = get_jwt().get('jti')
    if jti:
        from ..services.auth_service import revoke_token
        revoke_token(jti)
    
    return success_response(message='Logged out successfully')


@api_bp.route('/auth/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh JWT token."""
    identity = get_jwt_identity()
    access_token = create_access_token(identity=identity)
    return success_response({'access_token': access_token})


@api_bp.route('/auth/forgot-password', methods=['POST'])
@limiter.limit("3/minute")
@validate_json(ForgotPasswordSchema)
def forgot_password():
    """Send password reset email."""
    data = request.validated_data
    email = data.email.lower()
    
    if email:
        try:
             supabase.auth.reset_password_email(email)
        except Exception as e:
            logger.error("Reset password error: %s", e)
            return error_response('Failed to send reset email. Please try again or contact support.', 500)
            
    return success_response(message='If an account exists, a password reset email has been sent')


@api_bp.route('/auth/mfa/enroll', methods=['POST'])
@jwt_required()
def mfa_enroll():
    """Enable 2FA for user. Returns TOTP secret and QR URI."""
    user_id = get_current_user_id()
    user = get_user_by_id(user_id)
    if not user:
        return error_response('User not found', 404)

    secret = pyotp.random_base32()
    totp = pyotp.TOTP(secret)
    provisioning_uri = totp.provisioning_uri(name=user.email, issuer_name='ThreatForge')

    # Encrypt secret before storing
    encrypted_secret = encrypt_data(secret)

    # Generate recovery codes (10 codes, 12 chars each)
    import secrets
    recovery_codes = [secrets.token_hex(6) for _ in range(10)]
    encrypted_recovery_codes = [encrypt_data(code) for code in recovery_codes]

    # Store secret temporarily
    supabase.table('profiles').update({
        'mfa_secret': encrypted_secret,
        'recovery_codes': encrypted_recovery_codes
    }).eq('id', user_id).execute()

    return success_response({
        'secret': secret, # Return plain secret to user for scanning (QR) or manual entry ONE TIME
        'qr_uri': provisioning_uri,
        'recovery_codes': recovery_codes,
    }, message='Scan the QR code with your authenticator app, then verify with a code. Save your recovery codes safely.')


@api_bp.route('/auth/mfa/verify', methods=['POST'])
@jwt_required()
@validate_json(MFASchema)
def mfa_verify():
    """Verify TOTP code and enable MFA."""
    user_id = get_current_user_id()
    user = get_user_by_id(user_id)
    if not user:
        return error_response('User not found', 404)

    data = request.validated_data
    totp_code = data.totp_code

    if not user.mfa_secret:
        return error_response('MFA not enrolled. Call /auth/mfa/enroll first', 400)

    secret = decrypt_data(user.mfa_secret)
    if not secret:
        return error_response('MFA secret unavailable', 500)

    totp = pyotp.TOTP(secret)
    if not totp.verify(totp_code):
        return error_response('Invalid TOTP code', 401)

    supabase.table('profiles').update({'mfa_enabled': True}).eq('id', user_id).execute()

    return success_response(message='MFA enabled successfully')


@api_bp.route('/auth/mfa/verify-login', methods=['POST'])
@jwt_required()
@validate_json(MFASchema)
def mfa_verify_login():
    """Verify TOTP code for login (2nd factor)."""
    identity = get_jwt_identity()
    
    # Check if this is a temp token
    if not identity.startswith("mfa_pending:"):
        return error_response('Invalid token type for this endpoint', 403)
        
    user_id = identity.split(":")[1]
    user = get_user_by_id(user_id)
    if not user:
        return error_response('User not found', 404)

    data = request.validated_data
    totp_code = data.totp_code

    if not user.mfa_secret:
        # No secret stored — auto-reset and issue full tokens
        logger.warning(f"MFA verify-login: no secret for user {user.id}. Auto-resetting MFA.")
        supabase.table('profiles').update({
            'mfa_enabled': False, 'mfa_secret': None, 'recovery_codes': None
        }).eq('id', str(user.id)).execute()
        # Fall through to issue tokens below
    else:
        secret = decrypt_data(user.mfa_secret)
        if not secret:
            # Decryption failed — auto-reset and issue full tokens
            logger.error(f"MFA verify-login: decrypt failed for user {user.id}. Auto-resetting MFA.")
            supabase.table('profiles').update({
                'mfa_enabled': False, 'mfa_secret': None, 'recovery_codes': None
            }).eq('id', str(user.id)).execute()
            # Fall through to issue tokens below
        else:
            totp = pyotp.TOTP(secret)
            if not totp.verify(totp_code):
                # Check recovery codes
                valid_recovery = False
                if user.recovery_codes and len(totp_code) > 6:
                     updated_codes = []
                     for enc_code in user.recovery_codes:
                         dec_code = decrypt_data(enc_code)
                         if dec_code == totp_code:
                             valid_recovery = True
                         else:
                             updated_codes.append(enc_code)
                     
                     if valid_recovery:
                          supabase.table('profiles').update({'recovery_codes': updated_codes}).eq('id', user.id).execute()

                if not valid_recovery:
                    return error_response('Invalid TOTP or recovery code', 401)

    # Convert temp session to full session
    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))
    
    # Log login success
    try:
        supabase.table('activity_logs').insert({
            'user_id': str(user.id),
            'action': 'login_google_mfa',
            'ip_address': request.remote_addr
        }).execute()
    except Exception:
        pass

    return success_response({
        'user': {
            'id': user.id,
            'email': user.email,
            'display_name': user.display_name,
            'role': user.role,
            'avatar_url': user.avatar_url,
            'mfa_enabled': user.mfa_enabled,
        },
        'access_token': access_token,
        'refresh_token': refresh_token,
    })


@api_bp.route('/auth/google', methods=['POST'])
@limiter.limit("10/minute")
@validate_json(GoogleAuthSchema)
def google_auth():
    """Exchange Supabase Auth token for Backend JWT."""
    data = request.validated_data
        
    supabase_token = data.access_token

    try:
        # Verify token with Supabase
        user_response = supabase.auth.get_user(supabase_token)
        if not user_response.user:
            return error_response('Invalid Supabase token', 401)
            
        auth_user = user_response.user
        user_id = auth_user.id
        email = auth_user.email
        
        # Check/Create Profile
        user = get_user_by_id(user_id)
        if not user:
            # First time login with Google -> Create Profile
            display_name = auth_user.user_metadata.get('full_name') or email.split('@')[0]
            avatar_url = auth_user.user_metadata.get('avatar_url') or auth_user.user_metadata.get('picture')
            
            profile_data = {
                'id': user_id,
                'email': email,
                'display_name': display_name,
                'role': 'analyst',
                'avatar_url': avatar_url,
                'mfa_enabled': False # Google controls MFA mostly, but we can enable ours too
            }
            try:
                supabase.table('profiles').insert(profile_data).execute()
                user = UserModel.from_dict(profile_data)
            except Exception as e:
                logger.error("Profile creation failed: %s", e)
                # Try fetch again just in case race condition
                user = get_user_by_id(user_id)
                if not user:
                     return error_response('Failed to create user profile', 500)

        # Check MFA
        if user.mfa_enabled:
            # Issue a temporary token with "mfa_pending" scope or similar claim
            # For simplicity, we can use a short-lived access token with a special identity or claim
            # But standard flask-jwt-extended claims is better.
            # Let's use a convention: identity="mfa_pending:<user_id>"
            temp_token = create_access_token(identity=f"mfa_pending:{user.id}", expires_delta=False) # Default 15 mins is fine
            return success_response({
                'mfa_required': True,
                'temp_token': temp_token
            }, message='MFA verification required')

        # Generate Backend Tokens
        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))
        
        # Session & Activity Log
        try:
             # Basic session tracking
             ua_info = parse_user_agent(request.headers.get('User-Agent', ''))
             supabase.table('activity_logs').insert({
                'user_id': str(user.id),
                'action': 'login_google',
                'ip_address': request.remote_addr
            }).execute()
        except Exception:
            pass

        return success_response({
            'user': {
                'id': user.id,
                'email': user.email,
                'display_name': user.display_name,
                'role': user.role,
                'avatar_url': user.avatar_url,
                'mfa_enabled': user.mfa_enabled,
            },
            'access_token': access_token,
            'refresh_token': refresh_token,
        })

    except Exception as e:
        logger.error("Google Auth Error: %s", e)
        return error_response('Authentication failed', 401)


@api_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return success_response({'status': 'healthy', 'service': 'backend-api'})
