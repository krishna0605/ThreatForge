"""Flask Application Factory"""
import os
from flask import Flask
from flask_cors import CORS


from .config import Config
from .extensions import jwt, limiter, socketio, revoked_tokens

from opentelemetry import trace
from opentelemetry.instrumentation.flask import FlaskInstrumentor
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from prometheus_flask_exporter import PrometheusMetrics
import structlog
import logging

# Configure Structlog
# Moved to logging_config.py

def create_app(config_class=Config):
    """Create and configure the Flask application."""
    app = Flask(__name__)
    app.config.from_object(config_class)

    # 0. Configure Logging (Must be first to capture startup logs)
    from .logging_config import setup_logging
    setup_logging(app)
    
    # 1. Register Middleware (Early)
    from .middleware.correlation import register_correlation_middleware
    register_correlation_middleware(app)

    # Initialize OpenTelemetry
    resource = Resource.create({"service.name": "backend"})
    trace.set_tracer_provider(TracerProvider(resource=resource))
    tmp_provider = trace.get_tracer_provider()
    if tmp_provider:
        tmp_provider.add_span_processor(
            BatchSpanProcessor(OTLPSpanExporter(endpoint="http://otel-collector:4318/v1/traces"))
        )
    FlaskInstrumentor().instrument_app(app)

    # Initialize Prometheus Metrics
    metrics = PrometheusMetrics(app)
    metrics.info('app_info', 'Application info', version='1.0.0')


    # Initialize extensions
    jwt.init_app(app)
    limiter.init_app(app)
    CORS(app, origins=app.config.get('CORS_ORIGINS', '*'))
    socketio.init_app(app, cors_allowed_origins=app.config.get('CORS_ORIGINS', '*'), async_mode='threading')

    # JWT blocklist check for revoked sessions
    @jwt.token_in_blocklist_loader
    def check_if_token_revoked(jwt_header, jwt_payload):
        jti = jwt_payload.get('jti', '')
        if jti in revoked_tokens:
            return True
        # Also check DB for sessions revoked before server restart
        try:
            from .supabase_client import supabase
            response = supabase.table('user_sessions') \
                .select('is_revoked') \
                .eq('token_jti', jti) \
                .limit(1) \
                .execute()
            if response.data and response.data[0].get('is_revoked'):
                revoked_tokens.add(jti)  # Cache it
                return True
        except Exception:
            pass
        return False

    # Register blueprints
    from .api import api_bp
    app.register_blueprint(api_bp, url_prefix='/api')
    
    from .api.shared import shared_bp
    app.register_blueprint(shared_bp, url_prefix='/api')

    from .api.security import security_bp
    app.register_blueprint(security_bp, url_prefix='/api')

    from .api.notifications_api import notifications_bp
    app.register_blueprint(notifications_bp, url_prefix='/api')

    # Register error handlers
    from .middleware.error_handler import register_error_handlers
    register_error_handlers(app)

    # Register CLI commands
    from .commands import seed_db_command
    app.cli.add_command(seed_db_command)

    return app
