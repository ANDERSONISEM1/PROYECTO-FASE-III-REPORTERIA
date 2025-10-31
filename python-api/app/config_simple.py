from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    # MySQL Database configuration (primary for now)
    mysql_host: str = "localhost"
    mysql_port: int = 3306
    mysql_database: str = "mb_report"
    mysql_username: str = "root"
    mysql_password: str = os.getenv("MYSQL_ROOT_PASSWORD", "")
    
    # JWT Configuration
    jwt_secret_key: str = os.getenv("JWT_KEY", "your-secret-key")
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 480
    
    # API Configuration
    api_title: str = "Marcador Basketball - Python API"
    api_version: str = "1.0.0"
    api_port: int = 5082
    
    # Environment
    environment: str = os.getenv("ENVIRONMENT", "development")
    debug: bool = environment == "development"
    
    class Config:
        env_file = ".env"
        case_sensitive = False

    @property
    def database_url(self) -> str:
        return f"mysql+pymysql://{self.mysql_username}:{self.mysql_password}@{self.mysql_host}:{self.mysql_port}/{self.mysql_database}"

settings = Settings()
