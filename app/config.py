"""
Centralized Configuration Management for Tabble Backend
Uses Pydantic for validation and type safety
"""

import os
from typing import List, Optional
from pathlib import Path
from pydantic.v1 import BaseSettings
import secrets


class Settings(BaseSettings):
    """Application settings with validation and type safety"""

    # Core application settings
    secret_key: str = "dev-secret-key-change-in-production"
    environment: str = "development"
    debug: bool = True
    log_level: str = "INFO"

    # Server configuration
    host: str = "0.0.0.0"
    port: int = 8000
    reload: bool = True

    # Database configuration
    database_name: str = "Tabble.db"
    database_url: str = "sqlite:///./Tabble.db"

    # Firebase configuration
    firebase_credentials_path: Optional[str] = (
        "app/tabble-v1-firebase-adminsdk-fbsvc-8024adcbdf.json"
    )

    # File upload configuration
    upload_dir: str = "app/static/images"
    max_file_size: int = 5242880  # 5MB default

    # Security configuration
    cors_origins: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    cors_allow_credentials: bool = True

    # Session configuration
    session_timeout_minutes: int = 30
    max_sessions_per_user: int = 5

    # Deployment configuration
    render: bool = False
    python_version: str = "3.11.9"

    # Production URLs
    production_api_url: Optional[str] = None
    production_frontend_url: Optional[str] = None

    # Development configuration
    enable_hot_reload: bool = True
    enable_debug_toolbar: bool = False
    enable_profiling: bool = False

    # Testing configuration
    test_database_url: str = "sqlite:///./test.db"
    enable_test_coverage: bool = True

    # Optional configuration (future use)
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = 587
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    stripe_publishable_key: Optional[str] = None
    stripe_secret_key: Optional[str] = None
    google_analytics_id: Optional[str] = None
    mixpanel_token: Optional[str] = None
    sentry_dsn: Optional[str] = None
    logtail_token: Optional[str] = None

    class Config:
        """Pydantic configuration"""

        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

    # Properties
    @property
    def is_development(self) -> bool:
        """Check if running in development mode"""
        return self.environment == "development"

    @property
    def is_production(self) -> bool:
        """Check if running in production mode"""
        return self.environment == "production"

    @property
    def is_testing(self) -> bool:
        """Check if running in test mode"""
        return self.environment == "test"

    @property
    def database_path(self) -> Path:
        """Get database file path"""
        if self.database_url.startswith("sqlite:///"):
            return Path(self.database_url.replace("sqlite:///", ""))
        return Path(self.database_name)

    @property
    def upload_path(self) -> Path:
        """Get upload directory path"""
        return Path(self.upload_dir)

    @property
    def firebase_credentials_exist(self) -> bool:
        """Check if Firebase credentials file exists"""
        if not self.firebase_credentials_path:
            return False
        return Path(self.firebase_credentials_path).exists()

    # Methods
    def get_cors_origins(self) -> List[str]:
        """Get CORS origins, with production URL if available"""
        origins = self.cors_origins.copy()
        if self.is_production and self.production_frontend_url:
            if self.production_frontend_url not in origins:
                origins.append(self.production_frontend_url)
        return origins

    def get_database_url(self, test: bool = False) -> str:
        """Get database URL, with test override if needed"""
        if test:
            return self.test_database_url
        return self.database_url

    def ensure_upload_dirs_exist(self):
        """Ensure upload directories exist"""
        self.upload_path.mkdir(parents=True, exist_ok=True)
        for subdir in ["dishes", "logos", "temp"]:
            (self.upload_path / subdir).mkdir(exist_ok=True)


# Create global settings instance
settings = Settings()


# Validate configuration on import
def validate_configuration():
    """Validate configuration and fail fast if critical settings are missing"""
    errors = []

    # Check critical settings
    if not settings.secret_key:
        errors.append("SECRET_KEY is required")

    if settings.is_production:
        if not settings.production_api_url:
            errors.append("PRODUCTION_API_URL is required in production")

    # Check file paths
    if not settings.upload_path.exists():
        try:
            settings.ensure_upload_dirs_exist()
        except Exception as e:
            errors.append(f"Cannot create upload directory: {e}")

    # Check Firebase credentials if path is specified
    if settings.firebase_credentials_path and not settings.firebase_credentials_exist:
        errors.append(
            f"Firebase credentials file not found: {settings.firebase_credentials_path}"
        )

    if errors:
        error_msg = "Configuration validation failed:\n" + "\n".join(
            f"- {error}" for error in errors
        )
        raise ValueError(error_msg)

    print("✅ Configuration validation passed")


# Validate on import
if __name__ != "__main__":
    validate_configuration()
