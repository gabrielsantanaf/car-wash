from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    EVOLUTION_API_URL: str = "http://evolution:8080"
    EVOLUTION_API_KEY: str = "dev-api-key"
    EVOLUTION_INSTANCE: str = "carwash"

    class Config:
        env_file = ".env"


settings = Settings()
