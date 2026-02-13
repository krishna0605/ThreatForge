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
                # Force=True to parse JSON even if Content-Type is missing/wrong (common client issue)
                # Silent=True to return None instead of error if parsing fails
                json_data = request.get_json(force=True, silent=True)
                
                if json_data is None:
                    return jsonify({'error': 'Request body must be JSON'}), 400
                
                # Validate
                validated_data = schema_model(**json_data)
                
                # Pass validated data to the function as 'body' kwarg 
                # OR attach to request context.
                # Let's attach to kwargs if the function accepts it, or just use request.validated_data context
                # Standard Flask pattern: arguments are usually from URL.
                # We can inject 'body' into kwargs if the signature matches, but that requires inspection.
                # A safer bet is to attach to `request` object.
                request.validated_data = validated_data
                
                return f(*args, **kwargs)
                
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
        return wrapper
    return decorator
