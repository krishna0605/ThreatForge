"""Centralized logging configuration for ThreatForge using Structlog."""
import logging
import sys
import structlog
from structlog.stdlib import LoggerFactory


def setup_logging(app):
    """Configure structured logging for the application."""

    # 1. Configure Structlog
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.StackInfoRenderer(),
            structlog.dev.set_exc_info,
            structlog.processors.TimeStamper(fmt="iso", utc=True),
            # Don't render to JSON here, let ProcessorFormatter do it
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
        ],
        logger_factory=LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

    # 2. Configure Standard Logging to redirect to Structlog
    # Remove existing handlers
    root_logger = logging.getLogger()
    for handler in root_logger.handlers:
        root_logger.removeHandler(handler)

    # Add Structlog Processor as a handler for Standard Logging is tricky.
    # The clean way is to use structlog.stdlib.ProcessorFormatter.

    # However, for simplicity and effectiveness in Flask:
    # We set the level and let structlog handle the output via its print/stream adapters if we used them directly,
    # but since we used LoggerFactory(), structlog wraps standard logger.
    # To make standard logging output JSON, we need to configure the formatter of the standard handler.

    handler = logging.StreamHandler(sys.stdout)

    # Use structlog's ProcessorFormatter to format standard logs as JSON
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

    root_logger.addHandler(handler)
    root_logger.setLevel(logging.INFO)

    # Silence noisy libraries
    logging.getLogger("werkzeug").setLevel(logging.WARN)
    logging.getLogger("urllib3").setLevel(logging.WARN)

    # Attach structlog to app
    app.logger = structlog.get_logger()

    return app.logger
