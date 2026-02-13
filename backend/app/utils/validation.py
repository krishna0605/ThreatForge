from functools import wraps
from flask import request, jsonify
from pydantic import ValidationError, BaseModel
import logging

logger = logging.getLogger('threatforge.validation')

def validate_json(schema_model: type[BaseModel]):
    """
    Decorator to validate JSON request body against a Pydantic model.
    """
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            try:
                # Force=True to parse JSON even if Content-Type is missing/wrong
                # Silent=True to return None instead of error if parsing fails
                json_data = request.get_json(force=True, silent=True)
                
                if json_data is None:
                    return jsonify({'error': 'Request body must be JSON'}), 400
                
                # Validate
                validated_data = schema_model(**json_data)
                
                # Attach to request context
                request.validated_data = validated_data
                
            except ValidationError as e:
                # Format Pydantic errors nicely
                errors = []
                for err in e.errors():
                    loc = ".".join([str(x) for x in err['loc']])
                    msg = err['msg']
                    errors.append(f"{loc}: {msg}")
                logger.warning(f"Validation failed: {errors}")
                return jsonify({'error': 'Validation error', 'details': errors}), 400
            except Exception as e:
                logger.error(f"Validation unexpected error: {e}")
                return jsonify({'error': 'Invalid request format'}), 400

            # Call the actual endpoint function OUTSIDE the validation try/except
            # so endpoint errors propagate correctly instead of being masked
            return f(*args, **kwargs)
        return wrapper
    return decorator
