import logging
import traceback
from flask import jsonify
from werkzeug.exceptions import HTTPException

logger = logging.getLogger('threatforge.error_handler')

def register_error_handlers(app):
    """Register error handlers for the Flask app."""

    @app.errorhandler(HTTPException)
    def handle_http_exception(e):
        """Handle standard HTTP exceptions."""
        response = e.get_response()
        # replace the body with JSON
        response.data = jsonify({
            "status": "error",
            "message": e.description,
            "code": e.code,
            "name": e.name,
        }).data
        response.content_type = "application/json"
        return response

    @app.errorhandler(Exception)
    def handle_generic_exception(e):
        """Handle unexpected exceptions."""
        # Pass through HTTP exceptions
        if isinstance(e, HTTPException):
            return e

        # Log the full traceback
        logger.error(f"Unhandled exception: {e}\n{traceback.format_exc()}")
        
        # Return generic 500
        return jsonify({
            "status": "error",
            "message": "An unexpected error occurred. Please try again later.",
            "code": 500
        }), 500

