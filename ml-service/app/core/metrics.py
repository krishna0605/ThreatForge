"""Custom Prometheus metrics for ML inference tracking."""
from prometheus_client import Histogram, Counter

INFERENCE_LATENCY = Histogram(
    "ml_inference_duration_seconds",
    "Time spent on ML inference",
    labelnames=["model", "status"],
    buckets=[0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0]
)

INFERENCE_TOTAL = Counter(
    "ml_inference_total",
    "Total ML inference requests",
    labelnames=["model", "result"]
)

MODEL_LOAD_TOTAL = Counter(
    "ml_model_loads_total",
    "Total model load attempts",
    labelnames=["model", "status"]
)
