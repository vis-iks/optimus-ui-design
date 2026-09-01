"""Thin wrappers around the GitHub OAuth web flow.

Kept in one module so tests can monkeypatch `exchange_code` / `fetch_user`
without any real network calls.
"""

from urllib.parse import urlencode

import httpx

from .config import get_settings

settings = get_settings()

AUTHORIZE_URL = "https://github.com/login/oauth/authorize"
TOKEN_URL = "https://github.com/login/oauth/access_token"
USER_URL = "https://api.github.com/user"


def build_authorize_url(state: str) -> str:
    query = urlencode(
        {
            "client_id": settings.github_client_id,
            "redirect_uri": settings.oauth_callback_url,
            "scope": "read:user",
            "state": state,
            "allow_signup": "true",
        }
    )
    return f"{AUTHORIZE_URL}?{query}"


async def exchange_code(code: str) -> str:
    """Trade an OAuth `code` for a GitHub access token."""
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(
            TOKEN_URL,
            headers={"Accept": "application/json"},
            data={
                "client_id": settings.github_client_id,
                "client_secret": settings.github_client_secret,
                "code": code,
                "redirect_uri": settings.oauth_callback_url,
            },
        )
    resp.raise_for_status()
    payload = resp.json()
    token = payload.get("access_token")
    if not token:
        raise ValueError(payload.get("error_description") or "GitHub token exchange failed")
    return token


async def fetch_user(access_token: str) -> dict:
    """Return `{id, login, avatar_url}` for the authenticated GitHub user."""
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(
            USER_URL,
            headers={
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/vnd.github+json",
            },
        )
    resp.raise_for_status()
    data = resp.json()
    return {
        "id": int(data["id"]),
        "login": str(data["login"]),
        "avatar_url": str(data.get("avatar_url") or ""),
    }
