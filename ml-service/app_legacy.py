from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Security
from fastapi.security.api_key import APIKeyHeader
import uvicorn
import math
import pefile
import io
import os
import time
import shutil
import tempfile
from starlette.status import HTTP_403_FORBIDDEN

app = FastAPI(title="ThreatForge ML Service", version="2.0")

# Security
API_KEY_NAME = "X-API-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)
ML_API_KEY = os.environ.get("ML_API_KEY", "default-insecure-key-change-me")

async def get_api_key(api_key_header: str = Security(api_key_header)):
    if api_key_header == ML_API_KEY:
        return api_key_header
    raise HTTPException(
        status_code=HTTP_403_FORBIDDEN, detail="Could not validate credentials"
    )

# Track startup
_start_time = time.time()

def calculate_entropy(data: bytes) -> float:
    if not data:
        return 0.0
    entropy = 0
    for x in range(256):
        p_x = float(data.count(x)) / len(data)
        if p_x > 0:
            entropy += - p_x * math.log(p_x, 2)
    return entropy

@app.get("/")
def read_root():
    return {"status": "online", "service": "ThreatForge ML Model", "version": "2.0"}

@app.get("/health")
def health_check():
    """Health check endpoint for backend connectivity."""
    return {
        "status": "healthy",
        "uptime_seconds": round(time.time() - _start_time, 1),
        "models": {
            "malware": "heuristic-v1",
            "steganography": "statistical-v1",
            "network": "heuristic-v1",
        }
    }

@app.post("/predict")
async def predict_file(file: UploadFile = File(...), api_key: str = Depends(get_api_key)):
    """Malware detection using heuristic + PE analysis."""
    temp_filename = None
    try:
        # Use temp file to avoid loading large files into RAM
        suffix = os.path.splitext(file.filename)[1] if file.filename else ""
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            shutil.copyfileobj(file.file, tmp)
            temp_filename = tmp.name
        
        # 1. Extract Features from file on disk
        # Read small chunks for entropy to avoid RAM spike? 
        # For now, read binary for entropy (it's fast enough for <100MB)
        with open(temp_filename, "rb") as f:
            content = f.read()
            
        entropy = calculate_entropy(content)
        file_size = os.path.getsize(temp_filename)
        
        # PE Analysis (if applicable)
        has_suspicious_sections = False
        pe_sections = []
        suspicious_imports = []
        
        try:
            # pefile can parse from file path efficiently
            pe = pefile.PE(name=temp_filename)
            for section in pe.sections:
                sec_name = section.Name.decode('utf-8', errors='replace').strip('\x00')
                sec_entropy = section.get_entropy()
                pe_sections.append({
                    'name': sec_name,
                    'entropy': round(sec_entropy, 4),
                    'size': section.SizeOfRawData,
                })
                if sec_entropy > 7.5:
                    has_suspicious_sections = True
            
            # Check imports for suspicious APIs
            dangerous_apis = {
                'VirtualAlloc', 'VirtualProtect', 'WriteProcessMemory',
                'CreateRemoteThread', 'NtUnmapViewOfSection', 'URLDownloadToFile',
                'WinExec', 'ShellExecute', 'IsDebuggerPresent',
            }
            if hasattr(pe, 'DIRECTORY_ENTRY_IMPORT'):
                for entry in pe.DIRECTORY_ENTRY_IMPORT:
                    for imp in entry.imports:
                        if imp.name:
                            name = imp.name.decode('utf-8', errors='replace')
                            if name in dangerous_apis:
                                suspicious_imports.append(name)
            
            pe.close() # Important to close handle
            
        except pefile.PEFormatError:
            pass
            
        # 2. Heuristic Scoring
        score = 0
        reasons = []
        
        if entropy > 7.0:
            score += 50
            reasons.append(f'High entropy ({entropy:.2f})')
        elif entropy > 6.0:
            score += 20
            reasons.append(f'Elevated entropy ({entropy:.2f})')
            
        if has_suspicious_sections:
            score += 30
            reasons.append('Packed/encrypted PE sections')
        
        if suspicious_imports:
            score += min(len(suspicious_imports) * 5, 20)
            reasons.append(f'Suspicious imports: {", ".join(suspicious_imports[:5])}')
            
        filename = file.filename.lower() if file.filename else ""
        if filename.endswith(('.exe', '.dll', '.scr')):
            if score > 0:
                score += 10
                reasons.append('Executable file type with other indicators')
        
        score = min(max(score, 0), 100)
        
        # 3. Classification
        label = "safe"
        if score > 80:
            label = "malicious"
        elif score > 50:
            label = "suspicious"
            
        return {
            "filename": file.filename,
            "score": score,
            "label": label,
            "reasons": reasons,
            "features": {
                "entropy": round(entropy, 4),
                "size": file_size,
                "suspicious_sections": has_suspicious_sections,
                "pe_sections": pe_sections,
                "suspicious_imports": suspicious_imports,
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Cleanup temp file
        if temp_filename and os.path.exists(temp_filename):
            try:
                os.remove(temp_filename)
            except:
                pass


@app.post("/analyze/stego")
async def analyze_steganography(file: UploadFile = File(...), api_key: str = Depends(get_api_key)):
    """Detect hidden data in images using statistical analysis."""
    temp_filename = None
    try:
        # verifying it's an image
        filename = file.filename.lower() if file.filename else ""
        image_exts = ('.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff', '.webp')
        if not filename.endswith(image_exts):
            raise HTTPException(
                status_code=400,
                detail=f"Not an image file. Supported: {', '.join(image_exts)}"
            )

        suffix = os.path.splitext(file.filename)[1] if file.filename else ""
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            shutil.copyfileobj(file.file, tmp)
            temp_filename = tmp.name
        
        from features.image_features import ImageFeatureExtractor
        # Pass file path directly to avoid RAM load
        features = ImageFeatureExtractor.extract(temp_filename)
        
        if features.get('error'):
            raise HTTPException(status_code=500, detail=features['error'])
        
        # Determine if steganography is likely
        # Heuristic thresholds based on statistical analysis
        has_hidden_data = False
        confidence = 0.0
        method = "none"
        indicators = []
        
        lsb_suspicion = features.get('lsb_suspicion_score', 0)
        chi_square = features.get('chi_square', 0)
        lsb_variance = features.get('lsb_variance', 0)
        
        # LSB embedding detection
        # Natural images have LSB ones_ratio slightly biased, not exactly 0.5
        ones_ratio = features.get('lsb_ones_ratio', 0.5)
        if abs(ones_ratio - 0.5) < 0.005:  # Very close to 0.5 = suspicious
            confidence += 0.3
            indicators.append(f'LSB ratio near 0.5 ({ones_ratio:.4f})')
            method = "LSB"
        
        # Chi-square test
        if chi_square > 100:
            confidence += 0.3
            indicators.append(f'High chi-square statistic ({chi_square:.2f})')
            if method == "none":
                method = "statistical-anomaly"
        
        # LSB variance analysis
        if lsb_variance < 0.20:  # Low LSB variance = too uniform = suspicious
            confidence += 0.2
            indicators.append(f'Low LSB variance ({lsb_variance:.4f})')
        
        # Channel analysis
        channels = features.get('channels', {})
        for name, ch in channels.items():
            lsb_ratio = ch.get('lsb_ratio', 0.5)
            if abs(lsb_ratio - 0.5) < 0.003:  # Very uniform LSB per channel
                confidence += 0.05
                indicators.append(f'{name} channel LSB ratio: {lsb_ratio:.4f}')
        
        confidence = min(confidence, 1.0)
        has_hidden_data = confidence > 0.4
        
        return {
            "filename": file.filename,
            "has_hidden_data": has_hidden_data,
            "confidence": round(confidence, 3),
            "method": method,
            "indicators": indicators,
            "features": features,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if temp_filename and os.path.exists(temp_filename):
            try:
                os.remove(temp_filename)
            except:
                pass


@app.post("/analyze/network")
async def analyze_network(file: UploadFile = File(...), api_key: str = Depends(get_api_key)):
    """Analyze PCAP file for network anomalies and IOCs."""
    temp_filename = None
    try:
        filename = file.filename.lower() if file.filename else ""
        pcap_exts = ('.pcap', '.pcapng', '.cap')
        if not filename.endswith(pcap_exts):
            raise HTTPException(
                status_code=400,
                detail=f"Not a PCAP file. Supported: {', '.join(pcap_exts)}"
            )
        
        suffix = os.path.splitext(file.filename)[1] if file.filename else ""
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            shutil.copyfileobj(file.file, tmp)
            temp_filename = tmp.name
        
        from features.network_features import NetworkFeatureExtractor
        # Pass file path to support mmap
        result = NetworkFeatureExtractor.extract(temp_filename)
        
        if result.get('error') and result.get('packet_count', 0) == 0:
            raise HTTPException(status_code=500, detail=result['error'])
        
        return {
            "filename": file.filename,
            **result,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if temp_filename and os.path.exists(temp_filename):
            try:
                os.remove(temp_filename)
            except:
                pass


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 7860))
    # Reload disabled for production
    uvicorn.run(app, host="0.0.0.0", port=port)
