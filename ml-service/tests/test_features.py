import pytest
import os
import tempfile
import numpy as np
from PIL import Image
import io
from app.features.image_features import ImageFeatureExtractor
from app.features.network_features import NetworkFeatureExtractor

class TestImageFeatures:
    def test_extract_from_bytes(self):
        # Create a dummy image
        img = Image.new('RGB', (100, 100), color = 'red')
        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format='PNG')
        img_bytes = img_byte_arr.getvalue()
        
        features = ImageFeatureExtractor.extract(img_bytes)
        assert 'error' not in features
        assert 'entropy' in features
        assert features['dimensions']['width'] == 100

    def test_extract_from_file_path(self):
        # Create a temp file
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp:
            img = Image.new('RGB', (50, 50), color = 'blue')
            img.save(tmp, format='PNG')
            tmp_path = tmp.name
            
        try:
            features = ImageFeatureExtractor.extract(tmp_path)
            assert 'error' not in features
            assert 'lsb_variance' in features
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

    def test_invalid_image(self):
        features = ImageFeatureExtractor.extract(b'not an image')
        assert 'error' in features

class TestNetworkFeatures:
    # Creating a valid PCAP for testing is complex without scapy
    # We will test the error handling for invalid input for now
    
    def test_invalid_pcap(self):
        features = NetworkFeatureExtractor.extract(b'not a pcap')
        # Depending on implementation, might return error or empty stats
        # The current extractor returns error if no packets parsed
        assert 'error' in features or features.get('packet_count') == 0
