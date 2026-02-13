from fastapi import FastAPI, Request
from app.core.config import settings
from app.api.endpoints import router
import uvicorn
import os
import uuid
import time

from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.core.limiter import limiter

from opentelemetry import trace
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from prometheus_fastapi_instrumentator import Instrumentator
import structlog
import logging
import sys
import os
from structlog.stdlib import LoggerFactory

# Configure Structlog and Stdlib Logging
structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.StackInfoRenderer(),
        structlog.dev.set_exc_info,
        structlog.processors.TimeStamper(fmt="iso", utc=True),
        structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
    ],
    logger_factory=LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

# Configure Standard Logging to output JSON to stdout
handler = logging.StreamHandler(sys.stdout)
formatter = structlog.stdlib.ProcessorFormatter(
    processor=structlog.processors.JSONRenderer(),
    foreign_pre_chain=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.TimeStamper(fmt="iso", utc=True),
        structlog.processors.add_log_level,
        structlog.processors.StackInfoRenderer(),
        structlog.dev.set_exc_info,
    ]
)
handler.setFormatter(formatter)
root_logger = logging.getLogger()
root_logger.handlers = [handler]
root_logger.setLevel(logging.INFO)

# Silence noisy libraries
logging.getLogger("uvicorn.access").handlers = [] # Let structlog handle access logs if middleware does it, or keep it.
# Actually, uvicorn might add its own handlers. We might need to override.
# For now, let's just set the root logger.

app = FastAPI(title="ThreatForge ML Service", version="2.0")

# Middleware for Correlation ID and Request ID
@app.middleware("http")
async def correlation_id_middleware(request: Request, call_next):
    # 1. Extract or Generate IDs
    correlation_id = request.headers.get("X-Correlation-ID") or str(uuid.uuid4())
    request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    
    # 2. Bind to structlog
    structlog.contextvars.clear_contextvars()
    structlog.contextvars.bind_contextvars(
        correlation_id=correlation_id,
        request_id=request_id,
        path=request.url.path,
        method=request.method,
        peer_ip=request.client.host if request.client else None
    )
    
    # 3. Add TraceID if available
    span = trace.get_current_span()
    if span:
        span_context = span.get_span_context()
        if span_context.is_valid:
             structlog.contextvars.bind_contextvars(
                trace_id=format(span_context.trace_id, "032x"),
                span_id=format(span_context.span_id, "016x")
            )

    response = await call_next(request)
    
    # 4. Inject into headers
    response.headers["X-Correlation-ID"] = correlation_id
    response.headers["X-Request-ID"] = request_id
    
    return response

# Initialize OpenTelemetry
otel_endpoint = os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://otel-collector:4318/v1/traces")
resource = Resource.create({"service.name": "ml-service"})
trace.set_tracer_provider(TracerProvider(resource=resource))

# Only add span processor if endpoint is reachable or we want to try. 
# For locally running tests without collector, this might fail unless we catch it.
# But standard practice is to configure it. 
# We'll stick to env var configuration. If env var is set (or default), we try.
trace.get_tracer_provider().add_span_processor(
    BatchSpanProcessor(OTLPSpanExporter(endpoint=otel_endpoint))
)
FastAPIInstrumentor.instrument_app(app)

# Initialize Prometheus Metrics
Instrumentator().instrument(app).expose(app)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.include_router(router)

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=False)
