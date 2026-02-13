"""Image Feature Extraction for Steganography Detection"""
import math
import io
import numpy as np
from typing import Dict, Any, List


class ImageFeatureExtractor:
    """Extract statistical features from images for steganography detection."""

    @staticmethod
    def extract(image_input: Any) -> Dict[str, Any]:
        """
        Extract features from image input (bytes, file path, or file-like object).

        Features include:
        - LSB (Least Significant Bit) variance
        - Chi-square statistic
        - Pixel distribution statistics
        - Color channel statistics
        """
        try:
            from PIL import Image
            
            if isinstance(image_input, bytes):
                img = Image.open(io.BytesIO(image_input))
            else:
                # PIL.Image.open handles file paths and file-like objects
                img = Image.open(image_input)
            
            # Convert to RGB if needed
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            pixels = np.array(img)
            
            # Flatten all channels
            flat = pixels.flatten().astype(np.float64)
            
            # 1. LSB variance (across all channels)
            lsb_plane = pixels.astype(np.uint8) & 1
            lsb_variance = float(np.var(lsb_plane))
            
            # 2. Chi-square test on pixel pairs
            # For each color channel, compare adjacent pixel value pair frequencies
            chi_square = ImageFeatureExtractor._chi_square_test(pixels)
            
            # 3. Pixel statistics
            mean_pixel = float(np.mean(flat))
            std_pixel = float(np.std(flat))
            
            # 4. Shannon entropy of pixel values
            hist, _ = np.histogram(flat, bins=256, range=(0, 255))
            hist = hist / hist.sum()
            entropy = float(-sum(p * np.log2(p + 1e-10) for p in hist if p > 0))
            
            # 5. Per-channel analysis
            channels = {}
            for i, name in enumerate(['red', 'green', 'blue']):
                ch = pixels[:, :, i].flatten().astype(np.float64)
                ch_lsb = (pixels[:, :, i].astype(np.uint8) & 1).flatten()
                channels[name] = {
                    'mean': float(np.mean(ch)),
                    'std': float(np.std(ch)),
                    'lsb_ratio': float(np.mean(ch_lsb)),  # Should be ~0.5 for clean images
                }
            
            # 6. LSB histogram uniformity (stego tends to flatten the LSB distribution)
            lsb_flat = lsb_plane.flatten()
            ones_ratio = float(np.mean(lsb_flat))
            # Perfect 0.5 ratio is suspicious in images (natural images are biased)
            lsb_suspicion = 1.0 - abs(ones_ratio - 0.5) * 2  # Higher = more suspicious
            
            return {
                'lsb_variance': round(lsb_variance, 6),
                'chi_square': round(chi_square, 4),
                'mean_pixel': round(mean_pixel, 2),
                'std_pixel': round(std_pixel, 2),
                'entropy': round(entropy, 4),
                'channels': channels,
                'lsb_ones_ratio': round(ones_ratio, 4),
                'lsb_suspicion_score': round(lsb_suspicion, 4),
                'dimensions': {'width': img.width, 'height': img.height},
            }
        except ImportError:
            return {'error': 'Pillow not installed'}
        except Exception as e:
            return {'error': str(e)}

    @staticmethod
    def _chi_square_test(pixels: np.ndarray) -> float:
        """Perform chi-square test on pixel value pairs (RS analysis simplified)."""
        # Chi-square test: compare histogram of pairs of values (2i, 2i+1)
        flat = pixels.flatten().astype(int)
        n = len(flat) - (len(flat) % 2)
        if n < 2:
            return 0.0
        
        pairs = flat[:n].reshape(-1, 2)
        # Count how many pairs have LSB flipped vs not
        same_lsb = np.sum(pairs[:, 0] & 1 == pairs[:, 1] & 1)
        diff_lsb = n // 2 - same_lsb
        
        expected = n / 4
        if expected == 0:
            return 0.0
        
        chi2 = ((same_lsb - expected) ** 2 + (diff_lsb - expected) ** 2) / expected
        return float(chi2)

    @staticmethod
    def lsb_analysis(pixel_data: np.ndarray) -> float:
        """Analyze LSB plane for anomalies."""
        lsb_plane = pixel_data & 1
        return float(np.var(lsb_plane))

    @staticmethod
    def chi_square_test(pixel_data: np.ndarray) -> float:
        """Perform chi-square statistical test on pixel values."""
        return ImageFeatureExtractor._chi_square_test(pixel_data)
