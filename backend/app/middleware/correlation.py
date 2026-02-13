import uuid
from flask import request, g
import structlog
from opentelemetry import trace, context

logger = structlog.get_logger()

def register_correlation_middleware(app):
    @app.before_request
    def set_correlation_id():
        # 1. Extract or Generate Correlation ID
        correlation_id = request.headers.get('X-Correlation-ID') or str(uuid.uuid4())
        g.correlation_id = correlation_id
        
        # 2. Extract Request ID (often from load balancers)
        request_id = request.headers.get('X-Request-ID') or str(uuid.uuid4())
        g.request_id = request_id

        # 3. Bind to Structlog Context
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(
            correlation_id=correlation_id,
            request_id=request_id,
            path=request.path,
            method=request.method,
            peer_ip=request.remote_addr,
            user_agent=str(request.user_agent)
        )

        # 4. Add TraceID if available from OTel
        span = trace.get_current_span()
        if span:
            span_context = span.get_span_context()
            if span_context.is_valid:
                structlog.contextvars.bind_contextvars(
                    trace_id=format(span_context.trace_id, "032x"),
                    span_id=format(span_context.span_id, "016x")
                )

    @app.after_request
    def inject_correlation_header(response):
        if hasattr(g, 'correlation_id'):
            response.headers['X-Correlation-ID'] = g.correlation_id
        if hasattr(g, 'request_id'):
            response.headers['X-Request-ID'] = g.request_id
        return response
