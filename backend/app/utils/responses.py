"""Standard API Response Helpers"""
from flask import jsonify

def success_response(data=None, message="Success", status_code=200):
    """
    Return a standardized success response.
    Format:
    {
        "status": "success",
        "message": "Operation successful",
        "data": { ... }
    }
    """
    response = {
        'status': 'success',
        'message': message
    }
    if data is not None:
        response['data'] = data
             
    return jsonify(response), status_code


def error_response(message, status_code=400, details=None):
    """
    Return a standardized error response.
    Format:
    {
        "status": "error",
        "message": "Error description",
        "details": { ... }  # Optional
    }
    """
    response = {
        'status': 'error',
        'message': message
    }
    if details:
        response['details'] = details
        
    return jsonify(response), status_code
