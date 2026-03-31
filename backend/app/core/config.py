from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    EVOLUTION_API_URL: str
    EVOLUTION_API_KEY: str
    EVOLUTION_INSTANCE: str = "carwash"
    NOTIFICATION_SERVICE_URL: str
    APP_ENV: str = "development"
    APP_BASE_URL: str = "http://localhost:3000"

    class Config:
        env_file = ".env"


settings = Settings()
