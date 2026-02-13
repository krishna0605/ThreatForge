import os
from supabase import create_client, Client

url: str = os.environ.get("SUPABASE_URL", "")
key: str = os.environ.get("SUPABASE_SERVICE_KEY", "")

# Initialize the Supabase client
# Uses SERVICE_KEY to bypass RLS for admin tasks (if needed) but primarily
# we should rely on RLS and potentially pass user tokens if we were using
# Supabase Auth on frontend fully. For now, backend acts as trusted admin.
supabase: Client = create_client(url, key)
