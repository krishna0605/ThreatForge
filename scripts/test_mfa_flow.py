import requests
import pyotp
import uuid
import time
import os

BASE_URL = "http://localhost:5000/api"

def run_mfa_test():
    print("--- Starting MFA Flow Test ---")
    
    # Check if server is up
    try:
        requests.get(f"{BASE_URL.replace('/api', '')}/health")
    except requests.exceptions.ConnectionError:
        print("Error: Backend server is not running at http://localhost:5000")
        return

    # 1. Register
    email = f"test_mfa_{uuid.uuid4().hex[:8]}@example.com"
    password = "StrongPassword123!"
    display_name = "MFA Test User"
    print(f"1. Registering user: {email}")
    
    res = requests.post(f"{BASE_URL}/auth/signup", json={
        "email": email,
        "password": password,
        "display_name": display_name
    })
    
    if res.status_code != 201:
        print(f"Registration failed ({res.status_code}): {res.text}")
        # Try login if potential duplicate (though uuid should prevent)
        if res.status_code == 400:
             print("   User might exist, trying login...")
    else:
        print("   Registration successful.")

    # 2. Login (initially no MFA)
    print("2. Logging in (Password)")
    res = requests.post(f"{BASE_URL}/auth/login", json={
        "email": email,
        "password": password
    })
    
    if res.status_code != 200:
        print(f"Login failed ({res.status_code}): {res.text}")
        return
        
    login_data = res.json()
    if 'data' in login_data: login_data = login_data['data'] # Handle standardized response if wrapped
    
    access_token = login_data.get('access_token')
    if not access_token:
        print(f"No access token in response: {login_data}")
        return
        
    headers = {"Authorization": f"Bearer {access_token}"}
    print("   Login successful. Got token.")

    # 3. Enroll MFA
    print("3. Enrolling in MFA")
    res = requests.post(f"{BASE_URL}/auth/mfa/enroll", headers=headers)
    if res.status_code != 200:
        print(f"Enroll failed ({res.status_code}): {res.text}")
        return
    
    data = res.json()
    if 'data' in data: data = data['data']

    secret = data.get('secret')
    recovery_codes = data.get('recovery_codes')
    
    if not secret:
         print(f"   Missing secret in response: {data}")
         return

    print(f"   Enroll successful.") 
    print(f"   Secret: {secret}")
    print(f"   Recovery Codes: {len(recovery_codes)} codes received.")

    # 4. Verify MFA (Enable it)
    print("4. Verifying MFA (Enabling)")
    totp = pyotp.TOTP(secret)
    code = totp.now()
    
    res = requests.post(f"{BASE_URL}/auth/mfa/verify", headers=headers, json={"totp_code": code})
    if res.status_code != 200:
        print(f"Verify failed ({res.status_code}): {res.text}")
        return
    print("   MFA Enabled successfully.")

    # 5. Login again (Should require MFA)
    print("5. Logging in again (Should require MFA)")
    res = requests.post(f"{BASE_URL}/auth/login", json={
        "email": email,
        "password": password
    })
    
    data = res.json()
    # auth.py: success_response({'mfa_required': True...) -> {'status': 'success', 'data': {'mfa_required': True}}
    # OR direct dict depending on implementation. Let's check both.
    mfa_required = False
    temp_token = None
    
    if data.get('status') == 'success' and data.get('data', {}).get('mfa_required'):
         mfa_required = True
         temp_token = data['data'].get('access_token') # If your flow returns a temp token here
    elif data.get('mfa_required'):
         mfa_required = True
         temp_token = data.get('access_token')
    
    # Wait, looking at auth.py:
    # return success_response({'mfa_required': True}, message='MFA verification required')
    # But wait, does login return a temp token in the first step? 
    # Usually the login endpoint would return { mfa_required: true, mfa_token: ... } or just unauthorized?
    # Checking auth.py code:
    # if user.mfa_enabled: ... return success_response({'mfa_required': True}, message='MFA verification required')
    # Use the /auth/login returns 200 with mfa_required=True. 
    # BUT how do we identity the user in next step? 
    # The /verify-login endpoint needs `get_jwt_identity()`. 
    # Does `auth.py` login return a temp token?
    # Let's check `auth.py`... 
    # It returns `success_response({'mfa_required': True})`. It does NOT seem to return a token in the body based on snippet.
    # Ah, the `mfa_verify_login` uses `@jwt_required()`. 
    # Checking `auth.py` again... 
    # `login` does: `access_token = create_access_token(identity=f"mfa_pending:{user.id}", expires_delta=...)` 
    # then `return success_response({'mfa_required': True, 'access_token': access_token})`.
    # OK, so we should expect 'access_token'.
    
    if mfa_required:
        if not temp_token:
             # Try to find it in data
             temp_token = data.get('data', {}).get('access_token') or data.get('access_token')
        
        print(f"   Login required MFA as expected. Got temp token: {temp_token[:10]}...")
    else:
        print(f"   Unexpected login response: {res.status_code} {data}")
        return

    if not temp_token:
        print("   Failed to get temp token for MFA.")
        return

    # 6. Verify Login with TOTP
    print("6. Verifying Login with TOTP")
    time.sleep(31) # Wait for next window to be safe against reuse if pyotp replay protection is strict
    print("   (Waited for TOTP window rotation)")
    
    code = totp.now()
    temp_headers = {"Authorization": f"Bearer {temp_token}"}
    
    # Schema validation requires dict with `totp_code`
    res = requests.post(f"{BASE_URL}/auth/mfa/verify-login", headers=temp_headers, json={"totp_code": code})
    
    if res.status_code != 200:
        print(f"   MFA Login Verify failed ({res.status_code}): {res.text}")
        return
    
    verify_data = res.json()
    if 'data' in verify_data: verify_data = verify_data['data']
    
    final_token = verify_data.get('access_token')
    if final_token:
        print("   MFA Login verified successfully. Got full token.")
    else:
        print(f"   Verified but no token? {verify_data}")

    # 7. Test Recovery Code Login
    print("7. Testing Login with Recovery Code")
    # Login again to get NEW temp token
    res = requests.post(f"{BASE_URL}/auth/login", json={
        "email": email,
        "password": password
    })
    
    login_data_2 = res.json()
    if 'data' in login_data_2: login_data_2 = login_data_2['data']
    temp_token_2 = login_data_2.get('access_token')
    
    if not temp_token_2:
        print("   Failed to get temp token (2).")
        return
        
    temp_headers_2 = {"Authorization": f"Bearer {temp_token_2}"}
    
    recovery_code = recovery_codes[0]
    print(f"   Using recovery code: {recovery_code}")
    
    res = requests.post(f"{BASE_URL}/auth/mfa/verify-login", headers=temp_headers_2, json={"totp_code": recovery_code})
    if res.status_code != 200:
        print(f"   Recovery Code Login failed ({res.status_code}): {res.text}")
        return
    
    print("   Recovery Code Login Verification successful.")
    
    print("--- Test Complete: SUCCESS ---")

if __name__ == "__main__":
    try:
        run_mfa_test()
    except Exception as e:
        print(f"Test crashed: {e}")
