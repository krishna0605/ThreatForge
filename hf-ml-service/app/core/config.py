import os


class Settings:
    API_KEY_NAME = "X-API-Key"
    ML_API_KEY = os.environ.get("ML_API_KEY")
    Rate_Limit = "100/minute"
    PORT = int(os.environ.get("PORT", 7860))
    MAX_FILE_SIZE_MB = int(os.environ.get("MAX_FILE_SIZE_MB", 50))
    MODEL_ARTIFACT_BASE_URL = os.environ.get(
        "MODEL_ARTIFACT_BASE_URL",
        "https://raw.githubusercontent.com/krishna0605/ThreatForge/main/hf-ml-service/app/ml/models"
    )


settings = Settings()
