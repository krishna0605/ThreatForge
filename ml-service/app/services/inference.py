import pefile
import math
import os
import joblib
import numpy as np
import pandas as pd
import time
import structlog
from typing import Dict, Any, List

from app.core.metrics import INFERENCE_LATENCY, INFERENCE_TOTAL, MODEL_LOAD_TOTAL
from app.services.model_registry import ModelRegistry

# Fix import to work with both test and run modes
try:
    from app.features.image_features import ImageFeatureExtractor
    from app.features.network_features import NetworkFeatureExtractor
except ImportError:
    try:
        from features.image_features import ImageFeatureExtractor
        from features.network_features import NetworkFeatureExtractor
    except ImportError:
         import sys
         sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))
         from app.features.image_features import ImageFeatureExtractor
         from app.features.network_features import NetworkFeatureExtractor

logger = structlog.get_logger(__name__)


class InferenceService:
    _models = {}

    @classmethod
    def load_model(cls, model_name: str):
        if model_name not in cls._models:
            model_path = ModelRegistry.get_model_path(model_name)

            # Fallback for different running contexts
            if not os.path.exists(model_path):
                 model_path = os.path.join(os.getcwd(), 'app', 'ml', 'models', f'{model_name}.joblib')

            try:
                if os.path.exists(model_path):
                    cls._models[model_name] = joblib.load(model_path)
                    MODEL_LOAD_TOTAL.labels(model=model_name, status="success").inc()
                    logger.info("model_loaded", model_name=model_name, path=model_path)
                else:
                    MODEL_LOAD_TOTAL.labels(model=model_name, status="not_found").inc()
                    logger.warning("model_not_found", model_name=model_name, path=model_path)
                    return None
            except Exception as e:
                MODEL_LOAD_TOTAL.labels(model=model_name, status="error").inc()
                logger.error("model_load_failed", model_name=model_name, error=str(e))
                return None
        return cls._models.get(model_name)
    
    @staticmethod
    def calculate_entropy(data: bytes) -> float:
        if not data:
            return 0.0
        entropy = 0
        for x in range(256):
            p_x = float(data.count(x)) / len(data)
            if p_x > 0:
                entropy += - p_x * math.log(p_x, 2)
        return entropy

    @staticmethod
    def analyze_malware(temp_filename: str, original_filename: str) -> Dict[str, Any]:
        start_time = time.time()

        with open(temp_filename, "rb") as f:
            content = f.read()
            
        entropy = InferenceService.calculate_entropy(content)
        file_size = os.path.getsize(temp_filename)
        
        has_suspicious_sections = 0
        pe_sections = []
        suspicious_imports = []
        import_count = 0
        suspicious_import_count = 0
        
        try:
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
                    has_suspicious_sections = 1
            
            dangerous_apis = {
                'VirtualAlloc', 'VirtualProtect', 'WriteProcessMemory',
                'CreateRemoteThread', 'NtUnmapViewOfSection', 'URLDownloadToFile',
                'WinExec', 'ShellExecute', 'IsDebuggerPresent',
            }
            if hasattr(pe, 'DIRECTORY_ENTRY_IMPORT'):
                for entry in pe.DIRECTORY_ENTRY_IMPORT:
                    for imp in entry.imports:
                        import_count += 1
                        if imp.name:
                            name = imp.name.decode('utf-8', errors='replace')
                            if name in dangerous_apis:
                                suspicious_imports.append(name)
                                suspicious_import_count += 1
            
            pe.close()
        except pefile.PEFormatError:
            pass
            
        # ML Prediction
        model = InferenceService.load_model('malware_rf_v1')
        ml_score = 0
        ml_verdict = "unknown"
        model_info = ModelRegistry.get_model_info('malware_rf_v1')
        
        if model:
            # Features: [entropy, size, suspicious_sections, import_count, suspicious_imports]
            features = np.array([[entropy, file_size, has_suspicious_sections, import_count, suspicious_import_count]])
            try:
                prediction = model.predict(features)[0]
                proba = model.predict_proba(features)[0][1] # Probability of class 1 (malware)
                ml_score = round(proba * 100, 2)
                ml_verdict = "malicious" if prediction == 1 else "safe"
            except Exception as e:
                logger.error("inference_error", model="malware", error=str(e))

        # Heuristic Fallback / Augmentation
        heuristic_score = 0
        reasons = []
        
        if entropy > 7.0:
            heuristic_score += 50
            reasons.append(f'High entropy ({entropy:.2f})')
            
        if has_suspicious_sections:
            heuristic_score += 30
            reasons.append('Packed/encrypted PE sections')
        
        if suspicious_imports:
            heuristic_score += min(len(suspicious_imports) * 5, 20)
            reasons.append(f'Suspicious imports: {", ".join(suspicious_imports[:5])}')
            
        if original_filename.lower().endswith(('.exe', '.dll', '.scr')):
            if heuristic_score > 0:
                heuristic_score += 10
        
        # Hybrid Score (Weighted)
        if model:
            final_score = (ml_score * 0.7) + (heuristic_score * 0.3)
        else:
            final_score = heuristic_score

        final_score = min(max(final_score, 0), 100)
        
        label = "safe"
        if final_score > 80:
            label = "malicious"
        elif final_score > 50:
            label = "suspicious"

        # Record metrics
        duration = time.time() - start_time
        INFERENCE_LATENCY.labels(model="malware", status="ok").observe(duration)
        INFERENCE_TOTAL.labels(model="malware", result=label).inc()
        logger.info("malware_analysis_complete",
                     filename=original_filename, score=round(final_score, 1),
                     label=label, duration_ms=round(duration * 1000, 1))
            
        return {
            "filename": original_filename,
            "score": round(final_score, 1),
            "label": label,
            "reasons": reasons,
            "ml_verdict": ml_verdict,
            "ml_confidence": ml_score if model else 0,
            "model_version": model_info.get("version", "heuristic-only"),
            "features": {
                "entropy": round(entropy, 4),
                "size": file_size,
                "suspicious_sections": bool(has_suspicious_sections),
                "pe_sections": pe_sections,
                "suspicious_imports": suspicious_imports,
            }
        }

    @staticmethod
    def analyze_steganography(temp_filename: str, original_filename: str) -> Dict[str, Any]:
        start_time = time.time()
        features = ImageFeatureExtractor.extract(temp_filename)
        
        if features.get('error'):
            return {"error": features['error']}
        
        # ML Prediction
        model = InferenceService.load_model('stego_lr_v1')
        ml_score = 0
        model_info = ModelRegistry.get_model_info('stego_lr_v1')
        
        if model:
            lsb_var = features.get('lsb_variance', 0)
            chi_sq = features.get('chi_square', 0)
            ones_dev = abs(features.get('lsb_ones_ratio', 0.5) - 0.5)
            suspicion = features.get('lsb_suspicion_score', 0)
            
            input_feats = np.array([[lsb_var, chi_sq, ones_dev, suspicion]])
            try:
                proba = model.predict_proba(input_feats)[0][1]
                ml_score = proba
            except Exception as e:
                logger.error("inference_error", model="stego", error=str(e))

        # Heuristics
        confidence = 0.0
        method = "none"
        indicators = []
        
        lsb_suspicion = features.get('lsb_suspicion_score', 0)
        chi_square = features.get('chi_square', 0)
        lsb_variance = features.get('lsb_variance', 0)
        ones_ratio = features.get('lsb_ones_ratio', 0.5)
        
        if abs(ones_ratio - 0.5) < 0.005:
            confidence += 0.3
            indicators.append(f'LSB ratio near 0.5 ({ones_ratio:.4f})')
            method = "LSB"
        
        if chi_square > 100:
            confidence += 0.3
            indicators.append(f'High chi-square statistic ({chi_square:.2f})')
            if method == "none":
                method = "statistical-anomaly"
        
        if lsb_variance < 0.20:
            confidence += 0.2
            indicators.append(f'Low LSB variance ({lsb_variance:.4f})')
        
        channels = features.get('channels', {})
        for name, ch in channels.items():
            lsb_ratio = ch.get('lsb_ratio', 0.5)
            if abs(lsb_ratio - 0.5) < 0.003:
                confidence += 0.05
                indicators.append(f'{name} channel LSB ratio: {lsb_ratio:.4f}')
        
        confidence = min(confidence, 1.0)
        has_hidden_data = confidence > 0.4

        # Record metrics
        duration = time.time() - start_time
        result_label = "positive" if has_hidden_data else "negative"
        INFERENCE_LATENCY.labels(model="stego", status="ok").observe(duration)
        INFERENCE_TOTAL.labels(model="stego", result=result_label).inc()
        logger.info("stego_analysis_complete",
                     filename=original_filename, has_hidden_data=has_hidden_data,
                     confidence=round(confidence, 3), duration_ms=round(duration * 1000, 1))
        
        return {
            "filename": original_filename,
            "has_hidden_data": has_hidden_data,
            "confidence": round(confidence, 3),
            "method": method,
            "indicators": indicators,
            "model_version": model_info.get("version", "heuristic-only"),
            "features": features,
        }

    @staticmethod
    def analyze_network(temp_filename: str, original_filename: str) -> Dict[str, Any]:
        start_time = time.time()
        result = NetworkFeatureExtractor.extract(temp_filename)
        
        if result.get('error') and result.get('packet_count', 0) == 0:
            return {"error": result['error']}
            
        # ML Prediction (Isolation Forest)
        model = InferenceService.load_model('network_if_v1')
        is_anomaly_ml = False
        model_info = ModelRegistry.get_model_info('network_if_v1')
        
        if model:
            avg_size = result.get('avg_packet_size', 0)
            ports = result.get('unique_ports', 0)
            flows = result.get('unique_flows', 0)
            heur_score = result.get('anomaly_score', 0)
            
            input_feats = np.array([[avg_size, ports, flows, heur_score]])
            try:
                pred = model.predict(input_feats)[0]
                is_anomaly_ml = (pred == -1)
            except Exception as e:
                logger.error("inference_error", model="network", error=str(e))
        
        heur_is_anom = result.get('is_anomalous', False)
        
        # Final verdict: Flag if EITHER ML or Heuristic flags it (Conservative security)
        final_is_anom = is_anomaly_ml or heur_is_anom

        # Record metrics
        duration = time.time() - start_time
        result_label = "anomalous" if final_is_anom else "normal"
        INFERENCE_LATENCY.labels(model="network", status="ok").observe(duration)
        INFERENCE_TOTAL.labels(model="network", result=result_label).inc()
        logger.info("network_analysis_complete",
                     filename=original_filename, is_anomalous=final_is_anom,
                     duration_ms=round(duration * 1000, 1))
        
        return {
            "filename": original_filename,
            "is_anomalous": bool(final_is_anom),
            "ml_anomaly_detected": bool(is_anomaly_ml),
            "heuristic_anomaly_detected": bool(heur_is_anom),
            "model_version": model_info.get("version", "heuristic-only"),
            **result,
        }
