import os


class Settings:
    API_KEY_NAME = "X-API-Key"
    ML_API_KEY = os.environ.get("ML_API_KEY")  # No fallback — must be set via env
    Rate_Limit = "100/minute"
    PORT = int(os.environ.get("PORT", 7860))
    MAX_FILE_SIZE_MB = int(os.environ.get("MAX_FILE_SIZE_MB", 50))


settings = Settings()
