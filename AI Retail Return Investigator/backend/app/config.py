import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    LLM_PROVIDER: str = "mock"  # Can be "gemini" or "mock"
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash"
    DATABASE_URL: str = "sqlite:///./retail_investigator.db"
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
