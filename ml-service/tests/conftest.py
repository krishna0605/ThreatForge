import pytest
import os
import tempfile
from fastapi.testclient import TestClient

# Set ML_API_KEY before importing the app (required since no fallback)
os.environ.setdefault("ML_API_KEY", "test-api-key-for-testing")

from app.main import app
from app.core.config import settings


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

@pytest.fixture(scope="module")
def authorized_client(client):
    """Client with API Key injected."""
    key = settings.ML_API_KEY
    client.headers = {settings.API_KEY_NAME: key}
    return client

@pytest.fixture
def sample_exe():
    """Create a dummy EXE file."""
    with tempfile.NamedTemporaryFile(suffix=".exe", delete=False) as tmp:
        tmp.write(b"MZ" + os.urandom(1024)) # PE header + random data
        tmp_name = tmp.name
    yield tmp_name
    if os.path.exists(tmp_name):
        os.remove(tmp_name)

@pytest.fixture
def sample_pcap():
    """Create a valid dummy PCAP file."""
    import struct
    import time
    
    with tempfile.NamedTemporaryFile(suffix=".pcap", delete=False) as tmp:
        # Global Header
        # magic(4), major(2), minor(2), zone(4), sig(4), snap(4), net(4)
        global_header = struct.pack('<IHHIIII', 0xa1b2c3d4, 2, 4, 0, 0, 65535, 1)

        # Packet Header
        ts = time.time()
        ts_sec = int(ts)
        ts_usec = int((ts - ts_sec) * 1e6)
        
        # Simple Ethernet + IP + TCP packet
        # Eth: dst(6) src(6) type(2) = 14
        eth_header = b'\x00\x00\x00\x00\x00\x00' + b'\x00\x00\x00\x00\x00\x00' + b'\x08\x00'
        # IP Header: ver+ihl(1) tos(1) len(2) id(2) flags+off(2) ttl(1) proto(1) sum(2) src(4) dst(4) = 20
        ip_header = b'\x45\x00\x00\x2c' + b'\x00\x00\x00\x00' + b'\x40\x06\x00\x00' + b'\x7f\x00\x00\x01' + b'\x7f\x00\x00\x01'
        # TCP Header: src(2) dst(2) seq(4) ack(4) off+flags(2) win(2) sum(2) urp(2) = 20
        tcp_header = b'\x12\x34\x00\x50' + b'\x00\x00\x00\x00' + b'\x00\x00\x00\x00' + b'\x50\x02\x20\x00' + b'\x00\x00\x00\x00'
        
        payload = b'TEST'
        packet_data = eth_header + ip_header + tcp_header + payload
        length = len(packet_data)
        
        packet_header = struct.pack('<IIII', ts_sec, ts_usec, length, length)
        
        tmp.write(global_header + packet_header + packet_data)
        tmp_name = tmp.name
        
    yield tmp_name
    if os.path.exists(tmp_name):
        os.remove(tmp_name)

@pytest.fixture
def sample_png():
    """Create a valid 1x1 PNG file."""
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
        # 1x1 Red Pixel PNG
        png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\xcf\xc0\x00\x00\x03\x01\x01\x00\x18\xdd\x8e\x00\x00\x00\x00IEND\xaeB`\x82'
        tmp.write(png_data)
        tmp_name = tmp.name
    yield tmp_name
    if os.path.exists(tmp_name):
        os.remove(tmp_name)

@pytest.fixture
def sample_text():
    """Create a dummy text file."""
    with tempfile.NamedTemporaryFile(suffix=".txt", delete=False, mode='w+t') as tmp:
        tmp.write("This is a simple text file for testing.")
        tmp_name = tmp.name
    yield tmp_name
    if os.path.exists(tmp_name):
        os.remove(tmp_name)

@pytest.fixture
def oversized_file(tmp_path):
    """Create a file exceeding MAX_FILE_SIZE_MB for testing size limits."""
    max_mb = settings.MAX_FILE_SIZE_MB
    f = tmp_path / "oversized.bin"
    # Write just over the limit (limit + 1 MB)
    f.write_bytes(os.urandom((max_mb + 1) * 1024 * 1024))
    return str(f)
