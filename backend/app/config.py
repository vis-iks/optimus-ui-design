from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = "sqlite:///./themes.db"

    github_client_id: str = ""
    github_client_secret: str = ""
    oauth_callback_url: str = "http://localhost:8000/api/auth/github/callback"
    dev_login_enabled: bool = False

    frontend_url: str = "http://localhost:4200"
    frontend_origins: str = "http://localhost:4200"

    session_secret: str = "dev-only-insecure-change-me"

    # When set (and the directory exists), the API also serves the compiled
    # Angular SPA from this path with a history-API fallback. Used by the
    # single-image Docker build; empty in local dev where `ng serve` handles it.
    static_dir: str = ""

    admin_github_logins: str = ""
    max_preset_bytes: int = 262_144
    user_theme_quota: int = 50
    auto_hide_report_threshold: int = 3

    session_ttl_days: int = 30
    oauth_state_ttl_minutes: int = 15

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.frontend_origins.split(",") if o.strip()]

    @property
    def admin_logins(self) -> set[str]:
        return {o.strip().lower() for o in self.admin_github_logins.split(",") if o.strip()}


@lru_cache
def get_settings() -> Settings:
    return Settings()
