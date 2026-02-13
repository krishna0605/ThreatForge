from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
import shutil
import tempfile
import os
import time
import structlog
from app.core.security import get_api_key
from app.core.config import settings
from app.services.inference import InferenceService
from app.services.model_registry import ModelRegistry
from app.core.limiter import limiter

logger = structlog.get_logger(__name__)
router = APIRouter()
_start_time = time.time()


@router.get("/")
def read_root():
    return {"status": "online", "service": "ThreatForge ML Model", "version": "2.0"}


@router.get("/health")
def health_check():
    models = ModelRegistry.get_active_models()
    return {
        "status": "healthy",
        "uptime_seconds": round(time.time() - _start_time, 1),
        "models": {
            name: {
                "version": info.get("version"),
                "algorithm": info.get("algorithm"),
            }
            for name, info in models.items()
        }
    }


async def process_upload(file: UploadFile, analysis_func, valid_exts=None):
    temp_filename = None
    try:
        filename = file.filename.lower() if file.filename else ""
        if valid_exts and not filename.endswith(valid_exts):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type. Supported: {', '.join(valid_exts)}"
            )

        # Enforce file size limit
        max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
        contents = await file.read()
        if len(contents) > max_bytes:
            logger.warning("file_too_large",
                           filename=file.filename,
                           size_mb=round(len(contents) / (1024 * 1024), 2),
                           max_mb=settings.MAX_FILE_SIZE_MB)
            raise HTTPException(
                status_code=413,
                detail=f"File too large. Maximum size: {settings.MAX_FILE_SIZE_MB}MB"
            )
        await file.seek(0)  # Reset for shutil.copyfileobj
        
        suffix = os.path.splitext(file.filename)[1] if file.filename else ""
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            shutil.copyfileobj(file.file, tmp)
            temp_filename = tmp.name
            
        result = analysis_func(temp_filename, file.filename)
        
        if "error" in result:
             raise HTTPException(status_code=500, detail=result["error"])
             
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("upload_processing_error", filename=file.filename, error=str(e))
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if temp_filename and os.path.exists(temp_filename):
            try:
                os.remove(temp_filename)
            except:
                pass


@router.post("/predict")
@limiter.limit(settings.Rate_Limit)
async def predict_file(request: Request, file: UploadFile = File(...), api_key: str = Depends(get_api_key)):
    return await process_upload(file, InferenceService.analyze_malware)

@router.post("/analyze/stego")
@limiter.limit(settings.Rate_Limit)
async def analyze_steganography(request: Request, file: UploadFile = File(...), api_key: str = Depends(get_api_key)):
    image_exts = ('.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff', '.webp')
    return await process_upload(file, InferenceService.analyze_steganography, image_exts)

@router.post("/analyze/network")
@limiter.limit(settings.Rate_Limit)
async def analyze_network(request: Request, file: UploadFile = File(...), api_key: str = Depends(get_api_key)):
    pcap_exts = ('.pcap', '.pcapng', '.cap')
    return await process_upload(file, InferenceService.analyze_network, pcap_exts)
